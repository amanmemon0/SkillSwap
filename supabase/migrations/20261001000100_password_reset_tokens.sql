-- Migration: 20261001000100_password_reset_tokens.sql
-- Creates the table that stores hashed password reset tokens.
-- Only the SHA-256 hash of the token is stored — never the plaintext.
-- Tokens are single-use (used=true after consumption) and expire after 1 hour.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by hash (the primary query pattern)
CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);

-- Index for cleanup queries (expired/used tokens)
CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id);

-- Auto-delete expired tokens after 24 hours to keep the table lean
-- (In production, schedule this as a pg_cron job instead)
COMMENT ON TABLE password_reset_tokens IS
  'Stores SHA-256 hashed password-reset tokens. Tokens expire after 1 hour and are single-use.';

-- RLS: disable (backend uses service_role key which bypasses RLS)
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON password_reset_tokens TO service_role;
