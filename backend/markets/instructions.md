# Markets Module Quick Start

## 1) Create and activate virtualenv (repo root)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/markets/requirements.txt
```

## 2) Ensure Postgres is running

```bash
docker compose -f db/docker-compose.yml --env-file db/.env up -d
```

## 3) Generate/refresh market offers

```bash
python backend/markets/markets_generator.py
```

This refreshes each `(direction, market_source, product_id)` slice by deleting old rows and inserting deterministic new rows.

## 4) Query offers from CLI

```bash
python backend/markets/markets_api.py --product-id <PRODUCT_UUID> --direction OUT --market-source London,GB --limit 10
```

Backward-compatible script name also works:

```bash
python backend/markets/markets-api.py --product-id <PRODUCT_UUID> --direction OUT
```
