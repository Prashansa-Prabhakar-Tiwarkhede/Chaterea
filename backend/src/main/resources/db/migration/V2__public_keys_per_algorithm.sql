-- =========================================================================
-- V2__public_keys_per_algorithm.sql
-- Web Crypto API RSA-OAEP keys can only encrypt/decrypt; RSA signing needs a
-- SEPARATE key pair (RSASSA-PKCS1-v1_5). V1's constraint only allowed one
-- active public key per user, which can't hold both. Widen it to one active
-- key per (user, algorithm) instead.
-- =========================================================================

DROP INDEX IF EXISTS uq_public_keys_active_user;

CREATE UNIQUE INDEX uq_public_keys_active_user_algo
    ON public_keys (user_id, key_algorithm) WHERE is_active = TRUE;
