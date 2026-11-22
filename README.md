# 🔐 Real-Time E2EE Chat Application

A real-time messaging application built with **Java 17, Spring Boot, React, and WebSockets**, featuring client-side end-to-end encryption, secure authentication, friend management, group conversations, and real-time notifications.

The application is designed with a privacy-first architecture where messages are encrypted on the client side before reaching the server.

---

## 🚀 Overview

This project explores the development of a secure, full-stack messaging platform combining modern backend architecture, real-time communication, and browser-based cryptography.

Unlike traditional messaging architectures where servers may process plaintext messages, this application implements client-side encryption so that the backend primarily handles encrypted message payloads, storage, and delivery.

### Key Highlights

- End-to-end encrypted messaging architecture
- Real-time communication using WebSockets and STOMP
- RSA-based key exchange and digital signatures
- AES-256-GCM message encryption
- JWT-based authentication with refresh token rotation
- Friend requests, blocking, and relationship management
- Group chats with role-based permissions
- Real-time notifications and presence updates
- Persistent storage using PostgreSQL
- Browser-based cryptography using the Web Crypto API

---

## ✨ Features

### 🔑 Authentication & Security

- User registration and email verification
- Secure login using BCrypt password hashing
- JWT access and refresh tokens
- Refresh token rotation and reuse detection
- Forgot password and password reset
- Account lockout after repeated failed login attempts
- OTP-based account unlocking
- Role-based access control
- Audit logging for sensitive operations

### 👥 Friend Management

- Search users by name or email
- Send, accept, and reject friend requests
- View friends list
- Block and unblock users

### 💬 Messaging

- Real-time messaging
- One-to-one conversations
- Paginated message history
- Client-side message encryption and decryption
- Digital signatures for message verification
- Message editing and deletion
- Read receipts
- Typing indicators

### 👨‍👩‍👧‍👦 Group Conversations

- Create group chats
- Add and remove members
- Assign group roles
- Owner, Admin, and Member permissions
- Leave groups

### ⚡ Real-Time Communication

- STOMP over WebSocket with SockJS
- JWT-authenticated WebSocket connections
- Live message delivery
- Typing status updates
- Online/offline presence
- Real-time notification delivery

### 🔔 Notifications

- Persistent notifications
- New message notifications
- Friend request notifications
- Group-related notifications
- Mark notifications as read

### 📁 Media Handling

- File upload endpoint
- MIME type validation
- File size restrictions
- Image thumbnail generation
- Pluggable media storage architecture

### 🛡️ Administration

- User ban and unban operations
- Administrative message deletion
- Audit log access
- Role-restricted administrative endpoints

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Backend | Java 17, Spring Boot 3.3 |
| Frontend | React, Vite, JavaScript |
| API | REST APIs |
| Real-Time | WebSocket, STOMP, SockJS |
| Database | PostgreSQL, Supabase |
| ORM | Spring Data JPA, Hibernate |
| Database Migrations | Flyway |
| Authentication | JWT, BCrypt |
| Encryption | Web Crypto API, RSA-OAEP, AES-GCM |
| Digital Signatures | RSA, RSASSA-PKCS1-v1_5 |
| Testing | JUnit 5, Spring Boot Test, H2 |
| Build Tool | Maven |
| Frontend Storage | IndexedDB |
| Deployment Configuration | Environment-based configuration |

---

## 🏗️ Architecture

The application follows a client-server architecture with a separation between the frontend, backend API, real-time communication layer, and database.

```text
                 ┌──────────────────────────┐
                 │      React Client       │
                 │                          │
                 │  UI + Web Crypto API     │
                 │  Encryption / Signing   │
                 └────────────┬─────────────┘
                              │
                    HTTPS / REST API
                              │
                 ┌────────────▼─────────────┐
                 │     Spring Boot API      │
                 │                          │
                 │ Auth · Users · Friends   │
                 │ Chats · Groups · Admin  │
                 └────────────┬─────────────┘
                              │
                  ┌───────────┴────────────┐
                  │                        │
            PostgreSQL              WebSocket / STOMP
            (Supabase)              (Real-Time Events)
                  │                        │
            Persistent Data          Message Delivery
```

### Backend Structure

```text
backend/
├── src/main/java/com/chatapp/
│   ├── config/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── enums/
│   ├── exception/
│   ├── repository/
│   ├── security/
│   ├── service/
│   ├── util/
│   └── websocket/
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/
├── src/test/
└── pom.xml
```

### Frontend Structure

```text
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── lib/
│       └── crypto.js
├── public/
├── package.json
└── vite.config.js
```

---

## 🔒 End-to-End Encryption

Message encryption and decryption are designed to take place on the client side using the Web Crypto API.

The backend stores and relays encrypted message payloads without intentionally processing message plaintext.

### Encryption Workflow

#### 1. Key Generation

During registration, the client generates separate RSA key pairs for:

- **Encryption:** RSA-OAEP
- **Digital Signatures:** RSASSA-PKCS1-v1_5

Private keys are stored locally in browser IndexedDB, while corresponding public keys are uploaded to the backend.

#### 2. Message Encryption

When a user sends a message:

1. A random AES-256 key is generated.
2. The message is encrypted using AES-GCM.
3. The AES key is wrapped using the recipient's RSA public key.
4. The ciphertext is digitally signed using the sender's signing private key.

#### 3. Server-Side Storage

The backend receives and stores encrypted message data, including:

- Ciphertext
- Initialization vector (IV)
- Digital signature
- Recipient-specific encrypted AES keys

The server handles persistence and delivery without needing the plaintext message.

#### 4. Message Decryption

On the recipient's device:

1. The recipient retrieves their encrypted AES key.
2. Their private RSA key unwraps the AES key.
3. AES-GCM decrypts the message.
4. The sender's public signing key is used to verify the message signature.

### Cryptographic Technologies

| Purpose | Algorithm |
|---|---|
| Message encryption | AES-256-GCM |
| AES key wrapping | RSA-OAEP |
| RSA key size | 2048 bits |
| Digital signatures | RSASSA-PKCS1-v1_5 |
| Password hashing | BCrypt |
| Token hashing | SHA-256 |

> **Security note:** This project implements an end-to-end encryption design, but it has not undergone an independent security audit. It should not yet be considered a production-hardened messaging platform. Security limitations, key management, identity verification, and protocol-level protections remain important areas for further development.

---

## 🗄️ Database Design

The database schema is managed using **Flyway migrations**. Hibernate is configured to validate the schema rather than automatically create or modify database tables.

### Core Entities

| Entity | Description |
|---|---|
| `users` | User profiles, credentials, roles, account status |
| `public_keys` | Public encryption and signing keys |
| `refresh_tokens` | Hashed, rotatable refresh tokens |
| `email_verification_tokens` | Email verification tokens |
| `password_reset_tokens` | Password recovery tokens |
| `account_unlock_otps` | Account unlock OTPs |
| `friend_requests` | Friend request management |
| `user_relationships` | Friend and block relationships |
| `groups` | Group chat information |
| `group_members` | Group membership and roles |
| `chats` | Direct and group conversations |
| `chat_participants` | Chat membership and participant state |
| `messages` | Encrypted message payloads and metadata |
| `message_keys` | Recipient-specific wrapped encryption keys |
| `message_deletions` | Per-user message deletion records |
| `message_read_receipts` | Message delivery and read status |
| `notifications` | Persistent user notifications |
| `audit_logs` | Security-sensitive activity records |

### Database Migrations

```text
db/migration/
├── V1__init_schema.sql
└── V2__public_keys_per_algorithm.sql
```

- **V1:** Creates the initial database schema.
- **V2:** Updates public key storage to support separate encryption and signing keys.

Flyway automatically applies pending migrations during application startup.

---

## 🔐 Authentication & Security

The authentication system includes several security mechanisms:

| Security Mechanism | Implementation |
|---|---|
| Password storage | BCrypt hashing |
| Access authentication | JWT |
| Access token lifetime | 15 minutes by default |
| Refresh token | Opaque token |
| Refresh token storage | SHA-256 hashed |
| Refresh token rotation | New token issued upon refresh |
| Token reuse detection | Session-chain revocation |
| Account lockout | After repeated failed login attempts |
| Account recovery | Email OTP |
| Email verification | Single-use expiring tokens |
| Password recovery | Single-use expiring reset tokens |
| API authorization | Spring Security |
| Method-level security | `@PreAuthorize` |
| Audit logging | Sensitive authentication and administrative actions |
| CORS | Environment-configured allowed origins |

Sensitive configuration is provided through environment variables instead of hardcoded credentials.

---

## 📡 API Overview

All REST endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new account |
| POST | `/auth/verify-email` | Verify email address |
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/refresh` | Refresh tokens |
| POST | `/auth/logout` | Logout and revoke refresh token |
| POST | `/auth/forgot-password` | Initiate password reset |
| POST | `/auth/reset-password` | Reset password |
| POST | `/auth/unlock-account` | Unlock account using OTP |

### Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/me` | Retrieve current profile |
| PATCH | `/users/me` | Update current profile |
| GET | `/users/{id}` | Retrieve another user's profile |
| GET | `/users/{id}/public-keys` | Retrieve public encryption and signing keys |

### Friends

| Method | Endpoint | Description |
|---|---|---|
| GET | `/friends/search?query=` | Search users |
| POST | `/friends/requests` | Send friend request |
| PATCH | `/friends/requests/{id}` | Accept or reject request |
| GET | `/friends` | Retrieve friends list |
| GET | `/friends/blocked` | Retrieve blocked users |
| POST | `/friends/block` | Block user |
| DELETE | `/friends/block/{userId}` | Unblock user |

### Chats & Messages

| Method | Endpoint | Description |
|---|---|---|
| POST | `/chats/direct` | Create or retrieve direct chat |
| GET | `/chats` | Retrieve user's conversations |
| POST | `/chats/messages` | Send encrypted message |
| GET | `/chats/{chatId}/messages` | Retrieve paginated history |
| PATCH | `/chats/messages/{id}` | Edit message |
| DELETE | `/chats/messages/{id}` | Delete message |
| POST | `/chats/messages/{id}/seen` | Mark message as read |

### Groups

| Method | Endpoint | Description |
|---|---|---|
| POST | `/groups` | Create group |
| POST | `/groups/{id}/members/{userId}` | Add member |
| DELETE | `/groups/{id}/members/{userId}` | Remove member |
| PATCH | `/groups/{id}/members/{userId}/role` | Update member role |

### Media

| Method | Endpoint | Description |
|---|---|---|
| POST | `/media/upload` | Upload media |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications` | Retrieve notifications |
| PATCH | `/notifications/{id}/read` | Mark notification as read |

### Administration

| Method | Endpoint | Description |
|---|---|---|
| POST | `/admin/users/{id}/ban` | Ban user |
| POST | `/admin/users/{id}/unban` | Unban user |
| DELETE | `/admin/messages/{id}` | Remove abusive message |
| GET | `/admin/audit-logs` | Retrieve audit logs |

> All endpoints require authentication unless explicitly designed as public authentication endpoints. Administrative operations are restricted by role.

---

## 🔄 WebSocket Events

WebSocket communication uses STOMP over SockJS.

### Connection

```text
/ws
```

### Client Destinations

| Destination | Purpose |
|---|---|
| `/app/chats/{chatId}/typing` | Send typing indicator |

### Subscriptions

| Destination | Purpose |
|---|---|
| `/topic/chats/{chatId}` | Chat messages and chat-related events |
| `/user/queue/notifications` | User-specific notifications |
| `/user/queue/presence` | Friend presence updates |

Events include message delivery, edits, deletions, read receipts, typing indicators, notifications, and presence updates.

---

## ⚙️ Getting Started

### Prerequisites

- Java 17
- Maven
- Node.js 19+
- npm
- Supabase account (PostgreSQL database)
- SMTP credentials for email functionality

### 1. Clone the Repository

```bash
git clone https://github.com/Prashansa-Prabhakar-Tiwarkhede/Java-Chat-Application.git

cd Java-Chat-Application
```

### 2. Configure Supabase

1. Create a Supabase project.
2. Navigate to **Project Settings → Database**.
3. Obtain your PostgreSQL connection details.
4. Configure the database credentials in the backend environment.

Flyway automatically manages the schema and migrations.

### 3. Configure the Backend

```bash
cd backend
```

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the required environment variables:

```env
SUPABASE_DB_URL=
SUPABASE_DB_USERNAME=
SUPABASE_DB_PASSWORD=

JWT_SECRET=
JWT_ACCESS_EXPIRATION_MS=
JWT_REFRESH_EXPIRATION_MS=

MAIL_HOST=
MAIL_PORT=
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=

CORS_ALLOWED_ORIGINS=
PORT=8080
```

Generate a secure JWT secret rather than using the example value.

Run the tests:

```bash
mvn clean verify
```

Start the backend:

```bash
mvn spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

### 4. Configure the Frontend

Open a new terminal:

```bash
cd frontend
```

Copy the environment configuration:

```bash
cp .env.example .env
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

### 5. Run the Encryption Test

The standalone encryption round-trip test simulates two clients communicating without requiring the backend.

From the project root:

```bash
node crypto-roundtrip-test.mjs
```

The test covers:

- Encryption by Client A
- Digital signing
- AES key wrapping
- Decryption by Client B
- Signature verification
- Tampering detection

Requires Node.js 19+ with Web Crypto API support.

---

## 📂 Project Structure

```text
Java-Chat-Application/
│
├── backend/
│   ├── src/main/java/com/chatapp/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── enums/
│   │   ├── exception/
│   │   ├── repository/
│   │   ├── security/
│   │   ├── service/
│   │   ├── util/
│   │   └── websocket/
│   │
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/
│   │
│   ├── src/test/
│   ├── .env.example
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── lib/
│   │       └── crypto.js
│   ├── public/
│   ├── .env.example
│   └── package.json
│
├── crypto-roundtrip-test.mjs
└── README.md
```

---

## 🧪 Testing

### Backend

The authentication module currently has integration tests using an in-memory H2 database.

```bash
cd backend
mvn clean verify
```

### Encryption

The standalone cryptographic round-trip test validates the client encryption and decryption flow independently of the backend.

```bash
node crypto-roundtrip-test.mjs
```

### Current Testing Scope

- Authentication flow tests have passed.
- The remaining backend modules have not yet undergone complete compilation and integration testing.
- Real-time messaging, group messaging, media handling, and frontend flows still require end-to-end validation.

---

## 🚧 Development Status & Known Limitations

This project is actively being developed.

### Implemented

- [x] Authentication module
- [x] Registration and email verification
- [x] Login and JWT authentication
- [x] Refresh token rotation
- [x] Password recovery
- [x] Account lockout and OTP unlock
- [x] Database schema and migrations
- [x] Client-side cryptography implementation
- [x] Initial friends, chat, group, and notification modules
- [x] WebSocket/STOMP implementation
- [x] Initial React frontend

### In Progress / Pending Validation

- [ ] Full backend compilation and integration testing of non-auth modules
- [ ] End-to-end frontend testing
- [ ] Group message encryption fan-out integration
- [ ] Sender-side message decryption
- [ ] Production-ready media storage
- [ ] Secure media retrieval from the frontend
- [ ] WebSocket authorization and security testing
- [ ] Comprehensive application security testing

### Known Limitations

- Media files are currently stored locally; this is unsuitable for many production deployment environments.
- Group encryption integration in the frontend requires further work.
- Sent messages are not yet decrypted locally for the sender.
- Media retrieval requires an authenticated mechanism compatible with browser image rendering.
- The cryptographic implementation has not undergone an independent security audit.

---

## 🔮 Future Improvements

- Complete end-to-end integration testing
- Production deployment with managed storage
- Encrypted media sharing
- Improved group encryption key management
- Sender-side message decryption
- Better key backup and recovery
- Device-to-device session management
- Improved WebSocket authorization
- Security auditing and penetration testing
- Responsive mobile-first UI improvements
- Docker-based deployment
- CI/CD pipeline for automated builds and tests

---

## 👩‍💻 Author

**Prashansa Prabhakar Tiwarkhede**

B.Tech Computer Science & Engineering | AI/ML | Backend & Full-Stack Development

Interested in building scalable applications, AI-powered systems, secure backend services, and practical software engineering solutions.

- GitHub: [Prashansa-Prabhakar-Tiwarkhede](https://github.com/Prashansa-Prabhakar-Tiwarkhede)
- Portfolio: [prashansapptiwarkhede.netlify.app](https://prashansapptiwarkhede.netlify.app)
- LinkedIn: [Prashansa Tiwarkhede](https://www.linkedin.com/in/prashansa-tiwarkhede-906a15303/)

---

⭐ If you find this project interesting, feel free to explore the repository and follow its development.
