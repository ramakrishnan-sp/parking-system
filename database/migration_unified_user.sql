-- Migration: Unified User Model
-- Run this against your existing parking_db database
-- Safe to run multiple times (uses IF NOT EXISTS / DO blocks)

-- Add is_seeker column (everyone can seek by default)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='is_seeker'
    ) THEN
        ALTER TABLE users ADD COLUMN is_seeker BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;
END $$;

-- Add is_owner column (becomes true when user creates first parking space)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='is_owner'
    ) THEN
        ALTER TABLE users ADD COLUMN is_owner BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Allow user_type to accept 'user' value (new default for non-admin registrations)
-- The existing CHECK constraint allows: 'seeker'|'owner'|'admin'
-- We need to widen it to also allow 'user'
-- Drop old constraint and add new one
DO $$
BEGIN
    -- Drop the old check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'users'
        AND constraint_type = 'CHECK'
        AND constraint_name LIKE '%user_type%'
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE users DROP CONSTRAINT ' || constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'users'
            AND constraint_type = 'CHECK'
            AND constraint_name LIKE '%user_type%'
            LIMIT 1
        );
    END IF;
END $$;

-- Add new wider check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check
    CHECK (user_type IN ('user', 'seeker', 'owner', 'admin'));

-- Backfill existing seekers and owners
UPDATE users SET is_seeker = TRUE WHERE user_type = 'seeker';
UPDATE users SET is_owner = TRUE WHERE user_type = 'owner';

COMMENT ON COLUMN users.is_seeker IS 'True if user can book parking spaces (default true for all users)';
COMMENT ON COLUMN users.is_owner IS 'True if user has listed at least one parking space';
