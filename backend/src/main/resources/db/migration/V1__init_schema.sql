-- =========================================================================
-- V1__init_schema.sql
-- Initial schema for the E2EE chat application.
-- Target: PostgreSQL (Supabase). Uses pgcrypto for gen_random_uuid().
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================================
-- USERS
-- =========================================================================
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    display_name        VARCHAR(100) NOT NULL,
    bio                 VARCHAR(500),
    profile_picture_url TEXT,
    role                VARCHAR(20)  NOT NULL DEFAULT 'USER'
                         CHECK (role IN ('USER', 'ADMIN', 'MODERATOR')),
    status              VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                         CHECK (status IN ('ACTIVE', 'BANNED', 'DEACTIVATED')),
    is_email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    is_online            BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen_at         TIMESTAMPTZ,
    failed_login_attempts SMALLINT NOT NULL DEFAULT 0,
    account_locked       BOOLEAN NOT NULL DEFAULT FALSE,
    account_locked_at    TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_status ON users (status);

-- =========================================================================
-- PUBLIC_KEYS  (RSA public key per user for E2EE key exchange)
-- =========================================================================
CREATE TABLE public_keys (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    public_key    TEXT NOT NULL,          -- PEM-encoded RSA public key (SPKI)
    key_algorithm VARCHAR(20) NOT NULL DEFAULT 'RSA-OAEP-2048',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_public_keys_user_id ON public_keys (user_id);
-- Only one active key per user at a time
CREATE UNIQUE INDEX uq_public_keys_active_user
    ON public_keys (user_id) WHERE is_active = TRUE;

-- =========================================================================
-- REFRESH_TOKENS
-- =========================================================================
CREATE TABLE refresh_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash   VARCHAR(255) NOT NULL UNIQUE,  -- store SHA-256 hash, never raw token
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked      BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at   TIMESTAMPTZ,
    replaced_by_token_hash VARCHAR(255),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by_ip VARCHAR(64)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

-- =========================================================================
-- Supporting auth tables: email verification / password reset / account OTP
-- =========================================================================
CREATE TABLE email_verification_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_evt_user_id ON email_verification_tokens (user_id);

CREATE TABLE password_reset_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_prt_user_id ON password_reset_tokens (user_id);

CREATE TABLE account_unlock_otps (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    otp_hash   VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_unlock_otp_user_id ON account_unlock_otps (user_id);

-- =========================================================================
-- FRIEND_REQUESTS
-- =========================================================================
CREATE TABLE friend_requests (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    receiver_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                 CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at TIMESTAMPTZ,
    CONSTRAINT chk_no_self_request CHECK (sender_id <> receiver_id),
    CONSTRAINT uq_friend_request_pair UNIQUE (sender_id, receiver_id)
);

CREATE INDEX idx_friend_requests_receiver ON friend_requests (receiver_id, status);
CREATE INDEX idx_friend_requests_sender ON friend_requests (sender_id, status);

-- Friendship / block relationship, derived from accepted requests but kept
-- as its own table for O(1) lookups and to store block state independently.
CREATE TABLE user_relationships (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    other_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    relationship  VARCHAR(20) NOT NULL CHECK (relationship IN ('FRIEND', 'BLOCKED')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_no_self_relationship CHECK (user_id <> other_user_id),
    CONSTRAINT uq_relationship_pair UNIQUE (user_id, other_user_id, relationship)
);

CREATE INDEX idx_user_relationships_user_id ON user_relationships (user_id, relationship);

-- =========================================================================
-- GROUPS / GROUP_MEMBERS
-- =========================================================================
CREATE TABLE groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    avatar_url  TEXT,
    created_by  UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE group_members (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id   UUID NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role       VARCHAR(20) NOT NULL DEFAULT 'MEMBER'
               CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_group_member UNIQUE (group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON group_members (group_id);
CREATE INDEX idx_group_members_user_id ON group_members (user_id);

-- =========================================================================
-- CHATS  (a "chat" is either a 1:1 conversation or wraps a group)
-- =========================================================================
CREATE TABLE chats (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type       VARCHAR(10) NOT NULL CHECK (type IN ('DIRECT', 'GROUP')),
    group_id   UUID REFERENCES groups (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at TIMESTAMPTZ,
    CONSTRAINT chk_group_id_presence CHECK (
        (type = 'GROUP' AND group_id IS NOT NULL) OR
        (type = 'DIRECT' AND group_id IS NULL)
    )
);

CREATE INDEX idx_chats_group_id ON chats (group_id);
CREATE INDEX idx_chats_last_message_at ON chats (last_message_at DESC);

-- Participants of a DIRECT chat (also usable to list group chat's members
-- redundantly for fast unread/last-seen tracking without joining group_members)
CREATE TABLE chat_participants (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id        UUID NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
    user_id        UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    joined_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_read_at   TIMESTAMPTZ,
    is_archived    BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_chat_participant UNIQUE (chat_id, user_id)
);

CREATE INDEX idx_chat_participants_chat_id ON chat_participants (chat_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants (user_id);

-- =========================================================================
-- MESSAGES
-- Content is ciphertext (E2EE): the server never sees plaintext.
-- =========================================================================
CREATE TABLE messages (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id           UUID NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
    sender_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    message_type      VARCHAR(20) NOT NULL DEFAULT 'TEXT'
                      CHECK (message_type IN ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'SYSTEM')),

    -- E2EE payload: AES-256-GCM ciphertext of the message content, base64.
    ciphertext        TEXT NOT NULL,
    -- Initialization vector / nonce used for the AES-GCM encryption, base64.
    iv                VARCHAR(64) NOT NULL,
    -- Digital signature (sender's RSA private key over the ciphertext), base64.
    signature         TEXT NOT NULL,

    media_url         TEXT,
    media_mime_type   VARCHAR(100),
    media_size_bytes  BIGINT,
    thumbnail_url     TEXT,

    is_edited         BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at         TIMESTAMPTZ,
    is_deleted_for_everyone BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at        TIMESTAMPTZ,

    reply_to_message_id UUID REFERENCES messages (id) ON DELETE SET NULL,

    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_chat_id_created_at ON messages (chat_id, created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages (sender_id);

-- Per-recipient AES session key, RSA-encrypted for that recipient (E2EE fan-out).
-- One row per (message, recipient) since AES key is wrapped separately for each
-- participant's RSA public key.
CREATE TABLE message_keys (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id          UUID NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
    recipient_id        UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    encrypted_aes_key    TEXT NOT NULL,  -- RSA-OAEP encrypted AES key, base64
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_message_key_recipient UNIQUE (message_id, recipient_id)
);

CREATE INDEX idx_message_keys_message_id ON message_keys (message_id);
CREATE INDEX idx_message_keys_recipient_id ON message_keys (recipient_id);

-- Per-user "deleted for me" — soft delete scoped to one participant.
CREATE TABLE message_deletions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_message_deletion UNIQUE (message_id, user_id)
);

CREATE INDEX idx_message_deletions_user_id ON message_deletions (user_id);

-- Read receipts: per message, per user (needed for groups; for direct chats
-- there's just the one counterpart row).
CREATE TABLE message_read_receipts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    delivered_at TIMESTAMPTZ,
    seen_at      TIMESTAMPTZ,
    CONSTRAINT uq_read_receipt UNIQUE (message_id, user_id)
);

CREATE INDEX idx_read_receipts_message_id ON message_read_receipts (message_id);
CREATE INDEX idx_read_receipts_user_id ON message_read_receipts (user_id);

-- =========================================================================
-- NOTIFICATIONS
-- =========================================================================
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type        VARCHAR(30) NOT NULL
                CHECK (type IN ('NEW_MESSAGE', 'FRIEND_REQUEST', 'FRIEND_REQUEST_ACCEPTED',
                                 'GROUP_INVITE', 'SYSTEM')),
    payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id_created_at ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_id_is_read ON notifications (user_id, is_read);

-- =========================================================================
-- AUDIT_LOGS
-- =========================================================================
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID REFERENCES users (id) ON DELETE SET NULL,
    action      VARCHAR(50) NOT NULL,
    -- e.g. LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, PASSWORD_CHANGE, DELETE_CHAT,
    --      BLOCK_USER, ADMIN_BAN_USER, ADMIN_DELETE_MESSAGE
    target_type VARCHAR(50),
    target_id   UUID,
    ip_address  VARCHAR(64),
    user_agent  VARCHAR(255),
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
