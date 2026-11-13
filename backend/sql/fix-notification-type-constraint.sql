-- Adds PROJECT_ASSIGNED to notification.type's CHECK constraint.
--
-- Same root cause as the app_user_role_check saga (see the project's bug
-- report, BUG-001/BUG-002): this Hibernate version auto-generates a CHECK
-- constraint for @Enumerated(EnumType.STRING) columns from whatever the
-- Java enum contained when the table was first created, and never alters
-- it later when the enum changes (ddl-auto=update only adds new
-- tables/columns). NotificationType just gained a new value
-- (PROJECT_ASSIGNED, for Project lead-assignment notifications) - run this
-- or new project-assignment notifications will fail with the exact same
-- "violates check constraint" error as every previous instance of this bug
-- in this project.
--
-- IMPORTANT: the exact constraint name below (notification_type_check) is
-- Hibernate's default naming convention (<table>_<column>_check), matching
-- every other auto-generated constraint seen so far in this project. If
-- this doesn't match what's actually in your database, run this first to
-- find the real name, then adjust the DROP CONSTRAINT line below:
--
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--   WHERE conrelid = 'notification'::regclass AND contype = 'c';
--
--   psql -h localhost -p 5432 -U postgres -d MainDatabase -f backend/sql/fix-notification-type-constraint.sql

BEGIN;

ALTER TABLE notification DROP CONSTRAINT IF EXISTS notification_type_check;

ALTER TABLE notification ADD CONSTRAINT notification_type_check
    CHECK (type IN ('ROLE_REQUEST_SUBMITTED', 'ROLE_REQUEST_APPROVED', 'ROLE_REQUEST_REJECTED',
                     'PROJECT_ASSIGNED', 'SYSTEM_NOTIFICATION'));

COMMIT;

-- Verify afterwards:
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'notification_type_check';
