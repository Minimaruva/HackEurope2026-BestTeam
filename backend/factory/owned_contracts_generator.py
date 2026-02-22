import argparse
import datetime as dt
import os
import random
import uuid

import psycopg

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://hack:hackpass@localhost:5432/hackathon")

MARKETS = [
    "Dubai,AE",
    "Oslo,NO",
    "Tokyo,JP",
    "New York,US",
    "Warsaw,PL",
    "Santiago,CL",
    "London,GB",
    "Singapore,SG",
    "Johannesburg,ZA",
    "Casablanca,MA",
]

COUNTRY_CURRENCY = {
    "AE": "AED",
    "CL": "CLP",
    "GB": "GBP",
    "JP": "JPY",
    "MA": "MAD",
    "NO": "NOK",
    "PL": "PLN",
    "SG": "SGD",
    "US": "USD",
    "ZA": "ZAR",
}


def ensure_contract_source_schema(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            DO $$
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_source') THEN
                CREATE TYPE contract_source AS ENUM ('MARKET', 'OWNED');
              END IF;
            END $$;
            """
        )
        cur.execute(
            """
            ALTER TABLE contract
            ADD COLUMN IF NOT EXISTS source contract_source NOT NULL DEFAULT 'MARKET';
            """
        )
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_contract_source_product_direction
            ON contract(source, product_id, direction);
            """
        )


def fetch_pairs(conn, table: str):
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, name FROM {table} ORDER BY name;")
        return cur.fetchall()


def currency_for_market(market_source: str) -> str:
    parts = market_source.rsplit(",", 1)
    country = parts[1].strip().upper() if len(parts) == 2 else ""
    return COUNTRY_CURRENCY.get(country, "USD")


def resolve_owner_company(conn, owner_company_id: str | None) -> tuple[str, str]:
    with conn.cursor() as cur:
        if owner_company_id:
            cur.execute("SELECT id, name FROM company WHERE id = %(id)s", {"id": owner_company_id})
            row = cur.fetchone()
            if not row:
                raise ValueError(f"Company id not found: {owner_company_id}")
            return str(row[0]), row[1]

        cur.execute("SELECT id, name FROM company ORDER BY name LIMIT 1;")
        row = cur.fetchone()
        if not row:
            raise ValueError("No company records found. Seed company data first.")
        return str(row[0]), row[1]


def clear_owned_contracts(conn, owner_company_id: str):
    with conn.cursor() as cur:
        cur.execute(
            """
            DELETE FROM contract
            WHERE source = 'OWNED'
              AND company_id = %(company_id)s;
            """,
            {"company_id": owner_company_id},
        )


def insert_contracts(conn, rows):
    sql = """
    INSERT INTO contract (
      id, source, direction, product_id, company_id, market_source,
      unit_price, quantity, currency,
      payment_due_date, delivery_due_date, delivery_price
    )
    VALUES (
      %(id)s, %(source)s, %(direction)s, %(product_id)s, %(company_id)s, %(market_source)s,
      %(unit_price)s, %(quantity)s, %(currency)s,
      %(payment_due_date)s, %(delivery_due_date)s, %(delivery_price)s
    );
    """
    with conn.cursor() as cur:
        cur.executemany(sql, rows)


def generate_owned_contracts(
    owner_company_id: str | None = None,
    min_per_product: int = 2,
    max_per_product: int = 7,
    seed: int = 2026,
):
    if min_per_product < 1 or max_per_product < 1 or min_per_product > max_per_product:
        raise ValueError("Invalid min/max range for owned contracts per product.")

    today = dt.date.today()

    with psycopg.connect(DATABASE_URL) as conn:
        ensure_contract_source_schema(conn)
        products = fetch_pairs(conn, "product")
        resolved_company_id, resolved_company_name = resolve_owner_company(conn, owner_company_id)

        clear_owned_contracts(conn, resolved_company_id)

        rng = random.Random(seed)
        total_inserted = 0

        for product_id, _product_name in products:
            contracts_count = rng.randint(min_per_product, max_per_product)
            rows = []

            for _ in range(contracts_count):
                market_source = rng.choice(MARKETS)
                currency = currency_for_market(market_source)
                direction = rng.choice(["IN", "OUT"])
                payment_due = today + dt.timedelta(days=rng.randint(7, 45))
                delivery_due = today + dt.timedelta(days=rng.randint(10, 60))

                rows.append(
                    {
                        "id": str(uuid.uuid4()),
                        "source": "OWNED",
                        "direction": direction,
                        "product_id": str(product_id),
                        "company_id": resolved_company_id,
                        "market_source": market_source,
                        "unit_price": round(rng.uniform(60, 520), 2),
                        "quantity": round(rng.uniform(5, 300), 3),
                        "currency": currency,
                        "payment_due_date": payment_due,
                        "delivery_due_date": delivery_due,
                        "delivery_price": round(rng.uniform(0, 70), 2),
                    }
                )

            insert_contracts(conn, rows)
            total_inserted += len(rows)

        conn.commit()
        print(
            f"Inserted {total_inserted} OWNED contracts for company "
            f"{resolved_company_name} ({resolved_company_id})."
        )


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate OWNED contracts per product.")
    parser.add_argument("--owner-company-id", default=None, help="Company UUID. Defaults to first company by name.")
    parser.add_argument("--min-per-product", type=int, default=2, help="Minimum contracts per product.")
    parser.add_argument("--max-per-product", type=int, default=7, help="Maximum contracts per product.")
    parser.add_argument("--seed", type=int, default=2026, help="RNG seed for reproducible output.")
    return parser


def main():
    args = _build_parser().parse_args()
    generate_owned_contracts(
        owner_company_id=args.owner_company_id,
        min_per_product=args.min_per_product,
        max_per_product=args.max_per_product,
        seed=args.seed,
    )


if __name__ == "__main__":
    main()
