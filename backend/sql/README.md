# SQL scripts

**You do not need to run any of these to get started.** The backend creates all
tables automatically the first time it starts (`spring.jpa.hibernate.ddl-auto=update`).
These files are optional helpers and one-off migrations.

| File | When to use it |
|---|---|
| `invoice-finance-sample-data.sql` | **Optional demo data** (invoices, expenses, budgets, company details). Run it *after* the backend has started once. Dates are relative to today. Safe to run twice. |
| `invoice-finance-schema.sql` | Only if you want to create the invoice/finance tables by hand instead of letting Hibernate do it. Also upgrades an older database (adds `invoice.paid_date`). |
| `remove-manual-income.sql` | One-time cleanup of old hand-typed "money in" rows. Money in now comes from invoices. Review first, then uncomment the DELETE. |
| `fix-role-constraint.sql` | Migration for databases created before the current `Role` enum (adds `CLIENT`, `ACCOUNTANT`, etc. to `app_user_role_check`). Fresh databases don't need it. |
| `fix-notification-type-constraint.sql` | Migration that adds `PROJECT_ASSIGNED` to the notification type check. Fresh databases don't need it. |
| `enforce-case-insensitive-email.sql` | **Superseded - do not run.** Kept for history. |
| `drop-case-insensitive-email-index.sql` | Only if you previously ran the file above. |

Run a script with:

```bash
psql -U postgres -d MainDatabase -f backend/sql/<file>.sql
```
