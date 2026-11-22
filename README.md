=======
# Chat App — Real-Time E2EE Messenger

Spring Boot (Java 17) backend + React frontend, Supabase Postgres, STOMP/WebSocket
real-time layer, and client-side end-to-end encryption.

## ⚠️ Current build status (read this first)

**Auth module**: fully built, compiled, and tested green by you (`mvn clean verify` → `BUILD SUCCESS`, `Tests run: 2, Failures: 0, Errors: 0`).

**Everything else in this update — Friends, Chat, Groups, WebSocket real-time layer, Notifications, Media, RBAC/Admin, and the React frontend — is newly written and has NOT been compiled or run yet.** I don't have Maven Central access in this sandbox, so unlike the auth module (which we iteratively fixed together against real `mvn` output), this code has only been reviewed by hand. Treat it the same way we treated auth initially: run `mvn clean verify`, expect a handful of small errors (missing import, a repository method typo, etc.), and send me the output — we'll fix them the same way, one at a time.

**Also new: a schema fix and a migration.** Your `@Lob` schema-validation crash is fixed (see `V1`'s `Message`/`PublicKey`/`MessageKey` entities, now plain `TEXT` columns instead of Postgres `oid`). There's also a new `V2__public_keys_per_algorithm.sql` migration — Web Crypto requires *separate* RSA key pairs for encryption vs. signing, which the original schema didn't allow (only one active key per user); V2 widens that to one active key per (user, algorithm). **Run `mvn spring-boot:run` again to apply it** — Flyway will pick up V2 automatically.

## What's built now

### Backend (Spring Boot)
- **Auth** — register, verify email, login, JWT + refresh rotation, forgot/reset password, account lockout + OTP unlock (all tested)
- **Friends** — search users, send/accept/reject requests, block/unblock, list friends
- **Chat** — 1:1 chat creation/reuse, send message (E2EE ciphertext + per-recipient wrapped AES key), paginated history, edit, delete (for-me / for-everyone), read receipts
- **Groups** — create (with backing chat), add/remove members, role changes (OWNER/ADMIN/MEMBER), leave
- **WebSocket (STOMP/SockJS)** — JWT-authenticated handshake, real-time message delivery, typing indicators, presence (online/offline pushed to friends only), notification push
- **Notifications** — persisted + pushed in real time; mark-as-read
- **Media** — upload with mime/size validation, image thumbnailing; stores to local disk by default (see `MediaStorageService` javadoc for swapping in Supabase Storage for production — local disk is dev-only and not durable on most hosts)
- **RBAC/Admin** — ban/unban user, delete abusive message, view audit logs, enforced via `@PreAuthorize`

### Frontend (React + Vite, in `frontend/`)
- Register/Login pages — registration generates **two** RSA key pairs in-browser (Web Crypto API): one for encryption (RSA-OAEP), one for signing (RSASSA-PKCS1-v1_5) — private keys saved to IndexedDB, never transmitted
- Chat page — chat list, user search, message history with live decryption, send with encryption, typing indicator, WebSocket wiring
- `src/lib/crypto.js` — the actual E2EE implementation (key gen, PEM export/import, AES-GCM encrypt/decrypt, RSA-OAEP key wrapping, RSA signing/verification)

### Encryption round-trip test
`crypto-roundtrip-test.mjs` at the project root — imports the *exact same* `frontend/src/lib/crypto.js` the browser uses, simulates client A encrypting+signing a message and client B decrypting+verifying it, plus a tamper-detection check. No backend or browser needed. Run with:
```bash
node crypto-roundtrip-test.mjs
```
(Requires Node 19+ for global `crypto.subtle`.)


## Architecture

```
chatapp/
├── backend/                  Spring Boot 3.3 (Java 17)
│   ├── src/main/java/com/chatapp/
│   │   ├── config/            JWT/Security/Mail/CORS typed properties, SecurityConfig
│   │   ├── controller/        REST controllers (AuthController done; others pending)
│   │   ├── dto/                Request/response records, per module
│   │   ├── entity/             JPA entities — 18 tables, mirrors the schema below
│   │   ├── enums/               Role, UserStatus, ChatType, MessageType, etc.
│   │   ├── exception/          ApiException hierarchy + GlobalExceptionHandler
│   │   ├── repository/          Spring Data JPA repositories
│   │   ├── security/            JwtService, JwtAuthenticationFilter, UserDetails
│   │   ├── service/              AuthService, RefreshTokenService, MailService, AuditLogService
│   │   ├── util/                 TokenUtil (opaque token + OTP + SHA-256 hashing)
│   │   └── websocket/            (pending) STOMP config, chat/typing/presence handlers
│   ├── src/main/resources/
│   │   ├── application.yml       Config wired to env vars (see .env.example)
│   │   └── db/migration/         Flyway: V1__init_schema.sql (full schema, 18 tables)
│   ├── src/test/                 AuthFlowIntegrationTest (H2 in-memory)
│   ├── .env.example
│   └── pom.xml
└── frontend/                  (pending) React + Vite + Web Crypto API
```

## Database schema

All tables are created by
`backend/src/main/resources/db/migration/V1__init_schema.sql`, applied via
Flyway automatically on app startup against your Supabase Postgres database.
Flyway is configured with `baseline-on-migrate: true` and `ddl-auto: validate`
— **Hibernate never generates or alters schema**; Flyway migrations are the
single source of truth.

| Table | Purpose |
|---|---|
| `users` | Core account: email, BCrypt hash, role, status, online/last-seen, lockout counters |
| `public_keys` | One active RSA public key per user (E2EE key exchange) |
| `refresh_tokens` | Hashed, rotatable, revocable refresh tokens (reuse-detection built in) |
| `email_verification_tokens` / `password_reset_tokens` / `account_unlock_otps` | Single-use, expiring, hashed tokens for each auth flow |
| `friend_requests` / `user_relationships` | Friend requests + derived friend/block relationships |
| `groups` / `group_members` | Group chat membership with OWNER/ADMIN/MEMBER roles |
| `chats` / `chat_participants` | Wraps a 1:1 or group conversation; per-participant read/archive state |
| `messages` | **Ciphertext only** — `ciphertext`, `iv`, `signature` columns; server never sees plaintext |
| `message_keys` | Per-recipient RSA-wrapped AES session key (E2EE fan-out for groups) |
| `message_deletions` | "Delete for me" — per-user soft delete |
| `message_read_receipts` | Per-message, per-user delivered/seen timestamps |
| `notifications` | New message / friend request / group invite, JSONB payload |
| `audit_logs` | Every sensitive action: login, logout, password change, block, admin action, with actor/IP/timestamp |

Indexes are on every frequently-queried FK (`user_id`, `chat_id`,
`created_at`, etc.) — see the migration file for the full list.

## How E2EE works end-to-end

The server is a **relay for ciphertext, never a party to encryption**.

1. **Registration**: the client generates an RSA-OAEP 2048-bit key pair in
   the browser via the Web Crypto API. The **private key never leaves the
   client** (stored in IndexedDB or similar). The public key (PEM, SPKI) is
   sent to the server and stored in `public_keys`.
2. **Sending a message**: the sender generates a fresh random AES-256 key
   for that message, encrypts the message body with AES-256-GCM (producing
   ciphertext + IV), then encrypts *that AES key* separately with the RSA
   public key of each recipient (one row per recipient in `message_keys` —
   this is what makes group E2EE work: each member unwraps the same
   plaintext via their own wrapped copy of the AES key). The sender then
   signs the ciphertext with their own RSA private key to produce a digital
   signature.
3. **What hits the wire / DB**: `ciphertext`, `iv`, `signature`, and one
   RSA-wrapped AES key per recipient. The server stores and relays these
   verbatim — it has no ability to decrypt.
4. **Receiving**: the recipient's client fetches their wrapped AES key from
   `message_keys`, decrypts it with their own RSA private key, uses the
   resulting AES key to decrypt the ciphertext, and verifies the signature
   against the sender's stored public key to confirm authenticity + integrity.

This is implemented **entirely client-side**; the backend's job is schema +
relay + key storage, never crypto operations on message content.

## Security features implemented so far

- **BCrypt** (strength 12) password hashing — see `SecurityConfig.passwordEncoder()`.
- **JWT access tokens** (HS256, 15 min default) validated on every request by
  `JwtAuthenticationFilter`; **refresh tokens** are opaque random strings,
  persisted only as a SHA-256 hash, rotated on every use, with reuse-detection
  that revokes the entire session chain if a stale token is replayed.
- **Account lockout**: 5 failed logins → account locked → 6-digit OTP emailed
  → `/api/auth/unlock-account` to unlock.
- **Email verification** and **forgot/reset password** flows, both using
  single-use, expiring, hashed tokens (never raw tokens in the DB).
- **RBAC** scaffolded via `@EnableMethodSecurity` and role-gated URL patterns
  (`/api/admin/**` requires `ADMIN` or `MODERATOR`); apply `@PreAuthorize`
  on individual service/controller methods as the Chat/Admin modules are built.
- **Audit logging**: `AuditLogService` records actor, action, target,
  IP (respects `X-Forwarded-For` behind Render's proxy), user agent, and
  timestamp for register/login/logout/lock/unlock/password-reset events.
- **CORS** locked down to `CORS_ALLOWED_ORIGINS` (comma-separated env var).
- **HTTPS**: enforced at the platform layer (Render terminates TLS); see
  commented-out `server.ssl` block in `application.yml` if you ever need to
  terminate TLS in the Spring Boot process itself.

## Setup

### 1. Supabase

1. Create a Supabase project → note the Postgres connection string
   (Project Settings → Database → Connection string → URI).
2. Nothing else to do manually — Flyway creates every table on first boot.

### 2. Backend

```bash
cd backend
cp .env.example .env
# fill in .env: SUPABASE_DB_URL, SUPABASE_DB_PASSWORD, JWT_SECRET (openssl rand -base64 64), MAIL_* 
mvn clean verify        # run tests against in-memory H2
mvn spring-boot:run     # boots on :8080, Flyway migrates Supabase on startup
```

Required environment variables (see `.env.example` for the full list and
example values): `SUPABASE_DB_URL`, `SUPABASE_DB_USERNAME`,
`SUPABASE_DB_PASSWORD`, `JWT_SECRET`, `JWT_ACCESS_EXPIRATION_MS`,
`JWT_REFRESH_EXPIRATION_MS`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`,
`MAIL_PASSWORD`, `MAIL_FROM`, `CORS_ALLOWED_ORIGINS`, `PORT`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env    # points at your local backend by default
npm install
npm run dev              # http://localhost:5173
```

### 4. Encryption round-trip test (standalone, no backend needed)

```bash
node crypto-roundtrip-test.mjs
```

## API reference

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| **Auth** | | | |
| POST | `/api/auth/register` | No | Create account, generates + stores RSA encryption + signing public keys, sends verification email |
| POST | `/api/auth/verify-email` | No | Consume verification token |
| POST | `/api/auth/login` | No | Returns access + refresh token, or 423 if locked |
| POST | `/api/auth/refresh` | No | Rotates refresh token, issues new access token |
| POST | `/api/auth/logout` | Yes | Revokes the given refresh token |
| POST | `/api/auth/forgot-password` | No | Always 200; emails reset link if account exists |
| POST | `/api/auth/reset-password` | No | Consumes reset token, revokes all sessions |
| POST | `/api/auth/unlock-account` | No | Consumes emailed OTP to unlock a locked account |
| **Users** | | | |
| GET | `/api/users/me` / `PATCH /api/users/me` | Yes | View/update own profile |
| GET | `/api/users/{id}` | Yes | View another user's profile |
| GET | `/api/users/{id}/public-keys` | Yes | Fetch a user's encryption + signing public keys (needed before messaging them) |
| **Friends** | | | |
| GET | `/api/friends/search?query=` | Yes | Search users by email/display name |
| POST | `/api/friends/requests` | Yes | Send a friend request |
| PATCH | `/api/friends/requests/{id}` | Yes | Accept/reject |
| GET | `/api/friends`, `/api/friends/blocked` | Yes | List friends / blocked users |
| POST | `/api/friends/block`, `DELETE /api/friends/block/{userId}` | Yes | Block / unblock |
| **Chat** | | | |
| POST | `/api/chats/direct` | Yes | Get-or-create a 1:1 chat |
| GET | `/api/chats` | Yes | List my chats |
| POST | `/api/chats/messages` | Yes | Send an (already client-encrypted) message |
| GET | `/api/chats/{chatId}/messages` | Yes | Paginated history |
| PATCH/DELETE | `/api/chats/messages/{id}` | Yes | Edit / delete (for-me or for-everyone) |
| POST | `/api/chats/messages/{id}/seen` | Yes | Mark read |
| **Groups** | | | |
| POST | `/api/groups` | Yes | Create group (creates backing chat) |
| POST/DELETE | `/api/groups/{id}/members/{userId}` | Yes | Add/remove member |
| PATCH | `/api/groups/{id}/members/{userId}/role` | Yes | Change role (owner only) |
| **Media** | | | |
| POST | `/api/media/upload` | Yes | Upload with mime/size validation |
| **Notifications** | | | |
| GET | `/api/notifications`, `PATCH /api/notifications/{id}/read` | Yes | List / mark read |
| **Admin** (ADMIN/MODERATOR only) | | | |
| POST | `/api/admin/users/{id}/ban` | Yes | Ban a user, revokes their sessions |
| DELETE | `/api/admin/messages/{id}` | Yes | Force-delete an abusive message |
| GET | `/api/admin/audit-logs` | Yes | View the audit trail |
| **WebSocket** (`/ws`, STOMP over SockJS) | | | |
| SEND | `/app/chats/{chatId}/typing` | Yes | Send a typing signal |
| SUB | `/topic/chats/{chatId}` | Yes | New messages, edits, deletes, read receipts, typing for that chat |
| SUB | `/user/queue/notifications` | Yes | Per-user notification push |
| SUB | `/user/queue/presence` | Yes | Friends' online/offline updates |

## What's still rough / next steps if you keep building

- **This new code (everything past Auth) hasn't been through `mvn clean verify` yet** — expect to fix small issues the same way we fixed auth's.
- **Media storage is local-disk**, fine for dev, not durable on most hosts — swap in a Supabase Storage implementation of `MediaStorageService` for production.
- **Group message E2EE fan-out works but the UI only wires it for direct chats** — `ChatPage.jsx`'s `handleSend` has a `recipientIds` line that needs extending to loop over all group members for group chats.
- **A sender can't decrypt their own sent messages** in the current frontend (no self-wrapped key stored) — the chat UI shows "(sent by you)" as a placeholder instead of re-decrypting; wrapping a copy of the AES key for the sender too would fix this.
- **GET /api/media/files/{filename} requires auth**, which plain `<img src>` tags can't send — either serve media from a signed/public URL scheme, or fetch-and-blob it in the frontend.

>>>>>>> 49c80b4 (Initial commit: E2EE chat app (Spring Boot + React))

