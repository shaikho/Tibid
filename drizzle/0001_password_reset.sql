-- Password reset support.
-- Safe to run more than once, and safe to run against a database that already
-- has members in it: everything here is additive.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "password_changed_at" timestamp with time zone;

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"       uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash"    text NOT NULL,
  "expires_at"    timestamp with time zone NOT NULL,
  "used_at"       timestamp with time zone,
  "requested_ip"  text,
  "created_at"    timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_hash_unique"
  ON "password_reset_tokens" ("token_hash");

CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_idx"
  ON "password_reset_tokens" ("user_id");

CREATE INDEX IF NOT EXISTS "password_reset_tokens_created_idx"
  ON "password_reset_tokens" ("created_at");
