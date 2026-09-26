# Local development

StockSense uses PostgreSQL for the backend. The root dev command starts FastAPI on port 8000 and Next.js on port 3001.

## Prerequisites

- Node.js 24 or newer and pnpm 11
- Python 3.11 or newer
- PostgreSQL running locally (or a reachable PostgreSQL server)

## First run

1. Create a PostgreSQL database and a login role with access to it. For a new local database, run these as a PostgreSQL administrator:

   ```sql
   CREATE ROLE stocksense LOGIN PASSWORD 'choose-a-local-password';
   CREATE DATABASE stocksense_db OWNER stocksense;
   ```

2. Create `apps/backend/.env` from `apps/backend/.env.example`. Set `DATABASE_URL` to the actual role, password, host, port and database. Set a unique `SECRET_KEY` with at least 32 random characters. This file is ignored by Git. An existing `.env` is preserved by the dev command.

   ```text
   DATABASE_URL=postgresql://stocksense:choose-a-local-password@localhost:5432/stocksense_db
   SECRET_KEY=replace-with-a-long-random-secret
   ```

3. From the repository root, install the workspace and start both apps:

   ```powershell
   pnpm install
   pnpm dev
   ```

The backend task creates `apps/backend/venv` if missing, installs the pinned Python requirements, runs `alembic upgrade head`, then starts Uvicorn. Run `pnpm dev` again after changing Python dependencies.

## Verify

Open `http://localhost:3001` for the web app and `http://127.0.0.1:8000/health` for the API. The API schema is at `http://127.0.0.1:8000/docs`.

From `apps/backend`, the migration checks are:

```powershell
.\venv\Scripts\python.exe -m alembic current
.\venv\Scripts\python.exe -m alembic check
```

For a **new, empty database**, `alembic upgrade head` creates the schema. For a database that already had tables created by the earlier startup hook, first compare the live schema to the models; only stamp the initial revision when they match. This workspace's existing database was compared and stamped at `0001_initial`.

## Connection errors

`password authentication failed` means PostgreSQL was reached, but the username or password in `DATABASE_URL` is wrong for that server. Update `apps/backend/.env` to match the PostgreSQL role or change that role's password as an administrator. `connection refused` means PostgreSQL is not listening at the configured host and port. Passwords containing URL-special characters must be percent-encoded in `DATABASE_URL`.

The API and Alembic read the same `apps/backend/.env`. No SQLite database or automatic table creation is used.
