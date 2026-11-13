# Tirtha Electrical & Services ERP

A full-stack ERP for an electrical contracting business: projects, labour, daily
work, inventory, **invoicing**, **accounts & finance**, role-based access and
real-time notifications.

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, React Router, STOMP over WebSocket |
| Backend | Java 25, Spring Boot 4, Spring Security (JWT), Spring Data JPA, WebSocket |
| Database | **PostgreSQL 14+** (tables are created automatically) |

## Features

- **Roles:** Admin, Project Manager, Labour Manager, Labour, Accountant, Client - each sees only their modules
- **Projects, Labour, Daily Work, Inventory** with stock movements
- **Billing & Invoicing:** invoices with line items and GST, rendered as a branded A4 image, PNG/PDF download and print
- **Accounts & Finance:** money in comes only from paid invoices, money out is entered by hand; KPIs, charts, budgets, receivables aging, CSV export
- **Notifications:** real-time (WebSocket) and optional email
- **Settings:** profile and photo, change password, company/billing details, light/dark theme

---

## Quick start

You need: **JDK 25**, **Node.js 18+**, and **PostgreSQL** (installed, or via Docker below).

### 1. Get the code

```bash
git clone <your-repo-url>
cd <repo-folder>
```

### 2. Set up your database

**Every person who clones this project uses their own local database.** The
repository contains the code and the schema rules, never anyone's data or
passwords. Pick **one** of these:

**Option A - Docker (easiest, nothing to install except Docker)**

```bash
cd backend
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
# open backend/.env and set DB_PASSWORD to any password you like
docker compose up -d          # starts PostgreSQL on localhost:5432
```

**Option B - PostgreSQL installed on your machine**

1. Install PostgreSQL and remember the password you set for the `postgres` user.
2. Create an empty database (the name is case-sensitive):

   ```bash
   psql -U postgres -c 'CREATE DATABASE "MainDatabase";'
   ```

   (or create `MainDatabase` in pgAdmin / DBeaver).
3. In `backend`, copy `.env.example` to `.env` and set `DB_PASSWORD` to your Postgres password.

> You do **not** run any SQL to create tables. The backend creates every table the
> first time it starts. See [Database](#database) for details.

### 3. Configure the backend

Edit `backend/.env` (it is git-ignored, so it never leaves your machine):

| Variable | Required | Meaning |
|---|---|---|
| `DB_PASSWORD` | **yes** | Password of your PostgreSQL user |
| `DB_HOST` / `DB_PORT` | no | Default `localhost` / `5432` |
| `DB_NAME` | no | Default `MainDatabase` |
| `DB_USERNAME` | no | Default `postgres` |
| `JWT_SECRET` | recommended | Long random string used to sign login tokens |
| `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` | first run | Creates the first Admin account (see below) |
| `SMTP_*`, `MAIL_FROM` | no | Email notifications; leave `SMTP_HOST` blank to disable |

### 4. Run the backend

```bash
cd backend
./mvnw spring-boot:run          # Windows PowerShell: .\mvnw.cmd spring-boot:run
```

It starts on `http://localhost:8081` (API base path `/api`). On first start
you will see Hibernate creating the tables.

### 5. Run the frontend

```bash
cd frontend
npm ci
npm run dev
```

Open the URL Vite prints (normally `http://localhost:5173`). Vite forwards every
`/api` call to the backend on port 8081, so no extra setup is needed.
On Windows PowerShell, use `npm.cmd` if script execution is blocked.

### 6. Create your first Admin

New sign-ups get the lowest role (Labour). To get an Admin, set these in
`backend/.env` **before the first start** (or restart the backend after adding them):

```
ADMIN_SEED_EMAIL=admin@yourcompany.com
ADMIN_SEED_PASSWORD=pick-a-strong-password
```

The seeder only runs when no Admin exists yet and a password is set. Log in with
that account, then change other users' roles under **User Management**. Remove
`ADMIN_SEED_PASSWORD` from `.env` afterwards if you like.

### 7. (Optional) Load demo data

To see the invoice and finance charts filled in, run this once **after the backend
has started at least once**:

```bash
psql -U postgres -d MainDatabase -f backend/sql/invoice-finance-sample-data.sql
```

It adds sample invoices, expenses, budgets and company details with dates relative
to today. Running it twice is safe. With Docker:

```bash
docker exec -i tirth-postgres psql -U postgres -d MainDatabase < backend/sql/invoice-finance-sample-data.sql
```

---

## Database

- **Engine:** PostgreSQL. The connection comes from `DB_HOST`, `DB_PORT`, `DB_NAME`,
  `DB_USERNAME`, `DB_PASSWORD` (see `backend/src/main/resources/application.properties`).
- **Schema:** created and extended automatically by Hibernate
  (`spring.jpa.hibernate.ddl-auto=update`). Nothing to run for a fresh database.
- **Data is local.** Your invoices, users and ledger live only in *your* PostgreSQL
  (or your Docker volume). Teammates start with an empty database and see their own data.
  To share demo data, use the SQL script above, never a database dump.

### Tables

| Table | Used for |
|---|---|
| `app_user`, `user_profile` | Accounts (name, email, role) and profile extras (photo, designation) |
| `role_upgrade_request` | Requests to move to a higher role, with ID proof |
| `projects`, `labours`, `daily_work` | Projects, site workers and daily work logs |
| `inventory`, `inventory_transactions` | Stock items and stock in/out movements |
| `invoice`, `invoice_item` | Invoices and their line items (money in) |
| `finance_transaction`, `finance_budget` | Manual money-out entries and monthly category budgets |
| `company_settings` | Company details printed on invoices, defaults, opening cash balance |
| `notification` | In-app / real-time notifications |

### SQL scripts

`backend/sql/` holds optional demo data and one-off migrations for databases
created by older versions. See [`backend/sql/README.md`](backend/sql/README.md).
A brand-new database needs none of the migration scripts.

### Reset your local database

```bash
# Docker: wipes the volume and starts clean
cd backend && docker compose down -v && docker compose up -d
# Local Postgres:
psql -U postgres -c 'DROP DATABASE "MainDatabase";' -c 'CREATE DATABASE "MainDatabase";'
```

Then start the backend again; it recreates the tables.

---

## Project structure

```
backend/                Spring Boot API
  src/main/java/...     controller / service / repository / entity / dtos / config
  src/main/resources/   application.properties (reads everything from env vars)
  sql/                  optional demo data and migrations
  docker-compose.yml    optional local PostgreSQL
  .env.example          template for your private backend/.env
frontend/               React app (Vite)
  src/pages/            one file per screen
  src/components/       shared UI (sidebar, profile menu, charts, modals)
  src/services/api.js   every call to the backend
  src/utils/            invoice renderer, finance calculations
```

## Security notes for contributors

- **Never commit** `backend/.env`, real passwords, JWT secrets or SMTP passwords.
  `.gitignore` blocks `.env`; `.env.example` is the only committed template.
- The default `JWT_SECRET` in `application.properties` is for local development
  only. Set a long random value anywhere the app is shared or deployed.
- Invoices and finance data are readable by role only (a Client can read all
  invoices; there is no per-client ownership yet).

## Troubleshooting

| Problem | Fix |
|---|---|
| `Could not resolve placeholder 'DB_PASSWORD'` | `backend/.env` is missing or has no `DB_PASSWORD`. Copy `.env.example` to `.env` and set it. Run the backend from the `backend` folder. |
| `password authentication failed for user "postgres"` | `DB_PASSWORD` does not match your PostgreSQL password. |
| `database "MainDatabase" does not exist` | Create it (step 2, Option B) - the name is case-sensitive. |
| `Connection refused` on 5432 | PostgreSQL is not running (start the service, or `docker compose up -d`). |
| Port 5432 already in use (Docker) | Set `DB_PORT=5433` in `backend/.env` and restart both. |
| Port 8081 already in use | Stop the other app, or change `server.port` and the proxy target in `frontend/vite.config.js`. |
| `check constraint ... violated` after pulling new code | Your database predates a new enum value. Run the matching `backend/sql/fix-*.sql` script once (see the SQL README), or reset your local database. |
| Login works but pages show errors | Make sure the backend is running on 8081 before opening the frontend. |

## Contributing

1. Create a branch: `git checkout -b feature/short-name`
2. Commit small, clear changes; pull the latest `main` before opening a pull request.
3. Do not commit `.env`, `node_modules`, `target`, IDE folders or database dumps (already ignored).
