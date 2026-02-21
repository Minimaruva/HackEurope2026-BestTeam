# Local DB Quick Start (Docker + Python)

## 1) Create DB env file

```bash
cp db/.env.example db/.env
```

Edit `db/.env` and set values:

```env
POSTGRES_DB=hackeurope
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
```

## 2) Start Postgres with Docker

From repo root:

```bash
docker compose -f db/docker-compose.yml --env-file db/.env up -d
```

Notes:
- `db/init/001_schema.sql` and `db/init/002_seed.sql` run automatically only on a fresh DB volume.

## 3) Seed an already-running DB (manual)

If DB was already created before seed changes, run:

```bash
docker compose -f db/docker-compose.yml --env-file db/.env exec -T postgres \
  sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/002_seed.sql'
```

## 4) Open psql and run queries

```bash
docker compose -f db/docker-compose.yml --env-file db/.env exec postgres \
  sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Example queries:

```sql
\dt
SELECT COUNT(*) FROM company;
SELECT * FROM product LIMIT 5;
```

Exit with `\q`.

## 5) Connect Python services

Set DB URL in your service `.env` (example from `paid_api/.env.example`):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hackeurope
```

Install driver (pick one):

```bash
pip install psycopg[binary]
# or
pip install sqlalchemy psycopg[binary]
```

Minimal query example (`psycopg`):

```python
import os
import psycopg

conn = psycopg.connect(os.environ["DATABASE_URL"])
with conn, conn.cursor() as cur:
    cur.execute("SELECT id, name, credibility FROM company ORDER BY created_at DESC LIMIT 10")
    rows = cur.fetchall()
    print(rows)
```

## 6) If you need a clean re-init

This removes DB data and re-runs schema + seed from `db/init` on next startup:

```bash
docker compose -f db/docker-compose.yml --env-file db/.env down -v
docker compose -f db/docker-compose.yml --env-file db/.env up -d
```
