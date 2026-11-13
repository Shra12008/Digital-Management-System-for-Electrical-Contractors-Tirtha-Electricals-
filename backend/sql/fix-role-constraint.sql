-- Fixes app_user_role_check to match the CURRENT Role enum:
--   ADMIN, PROJECT_MANAGER, LABOUR_MANAGER, LABOUR, ACCOUNTANT, CLIENT
--
-- Background: Hibernate never alters an existing CHECK constraint when the
-- Java enum changes (ddl-auto=update only adds new tables/columns), so
-- every enum rename needs a manual migration like this one, run once
-- against the real database.
--
-- This is the SECOND such migration in this project's history:
--   1st (already applied, per your own account): WORKER -> LABOUR
--   2nd (THIS script): TEAM_MANAGER -> LABOUR_MANAGER
-- If your database's constraint currently allows TEAM_MANAGER (which it
-- does if you applied the version of this script from that first pass),
-- this script fixes it to LABOUR_MANAGER, matching entity/Role.java.
--
-- Safe to run on a database with existing rows: any row still using the
-- old TEAM_MANAGER value is remapped BEFORE the new constraint is added,
-- so nothing is dropped or invalidated.
--
--   psql -h localhost -p 5432 -U postgres -d MainDatabase -f sql/fix-role-constraint.sql
--
-- (adjust host/port/user/db to match your application.properties datasource)

BEGIN;

-- 1. Drop the current constraint first so the UPDATE below isn't itself
--    rejected by it.
ALTER TABLE app_user DROP CONSTRAINT IF EXISTS app_user_role_check;

-- 2. Remap any existing rows still using the old TEAM_MANAGER value.
--    (No-op if you have no rows using it.)
UPDATE app_user SET role = 'LABOUR_MANAGER' WHERE role = 'TEAM_MANAGER';

-- 3. Re-add the constraint with the current, correct role set.
ALTER TABLE app_user ADD CONSTRAINT app_user_role_check
    CHECK (role IN ('ADMIN', 'PROJECT_MANAGER', 'LABOUR_MANAGER', 'LABOUR', 'ACCOUNTANT', 'CLIENT'));

COMMIT;

-- Verify afterwards - this is the exact query the request asked for:
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'app_user_role_check';
--   SELECT id, email, role FROM app_user;
