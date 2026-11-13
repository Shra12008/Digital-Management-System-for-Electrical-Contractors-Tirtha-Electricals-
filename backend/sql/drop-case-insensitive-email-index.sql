-- Reverses enforce-case-insensitive-email.sql from the previous round.
--
-- The email policy has changed (by explicit product decision) from
-- case-insensitive to EXACT-CASE matching - "lewisTEMp@gmail.com" and
-- "lewistemp@gmail.com" are now meant to be two different accounts. The
-- functional index added last time (UNIQUE on LOWER(email)) enforces the
-- OLD policy - left in place, it would now incorrectly block a legitimate
-- new signup that only differs in case from an existing account, even
-- though the application-level check (which now compares exact case) would
-- say it's fine. This must be run if you already applied the previous
-- migration, or you'll see confusing "duplicate key" database errors on
-- signups that the application itself considers valid.
--
-- Safe to run whether or not you ever actually applied the previous
-- migration - IF EXISTS makes this a no-op if the index isn't there.
--
--   psql -h localhost -p 5432 -U postgres -d MainDatabase -f backend/sql/drop-case-insensitive-email-index.sql

DROP INDEX IF EXISTS idx_app_user_email_lower;

-- The plain UNIQUE constraint from @Column(unique = true) on User.java
-- (created automatically by Hibernate when the table was first made) is
-- NOT touched by this script and remains in place - it already gives
-- correct exact-case uniqueness on its own, which is exactly what the
-- current policy needs.

-- Verify afterwards (should no longer list idx_app_user_email_lower):
--   SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'app_user';
