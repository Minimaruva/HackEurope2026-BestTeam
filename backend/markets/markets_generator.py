import os, uuid, random, datetime as dt
import psycopg

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://hack:hackpass@localhost:5432/hackathon")

BUY_MARKETS  = ["Dubai,AE", "Oslo,NO", "Tokyo,JP"]   # -> direction IN
SELL_MARKETS = ["New York,US", "Warsaw,PL", "Santiago,CL"]  # -> direction OUT

# Country code -> local currency for more realistic market differentiation.
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

def fetch_pairs(conn, table: str):
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, name FROM {table} ORDER BY name;")
        return cur.fetchall()  # [(uuid, name), ...]

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

def refresh_slice(conn, direction: str, market_source: str, product_id: str):
    with conn.cursor() as cur:
        cur.execute(
            """
            DELETE FROM contract
            WHERE source = 'MARKET'
              AND direction = %(direction)s
              AND market_source = %(market_source)s
              AND product_id = %(product_id)s;
            """,
            {"direction": direction, "market_source": market_source, "product_id": product_id},
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

def currency_for_market(market_source: str) -> str:
    # Expected format is "City,CC" where CC is ISO country code.
    parts = market_source.rsplit(",", 1)
    country = parts[1].strip().upper() if len(parts) == 2 else ""
    return COUNTRY_CURRENCY.get(country, "USD")

def generate_market_offers(per_market_product: int = 2):
    today = dt.date.today()

    with psycopg.connect(DATABASE_URL) as conn:
        ensure_contract_source_schema(conn)
        products = fetch_pairs(conn, "product")
        companies = fetch_pairs(conn, "company")

        total_inserted = 0

        market_sets = [
            ("IN",  BUY_MARKETS),
            ("OUT", SELL_MARKETS),
        ]

        for direction, markets in market_sets:
            for product_id, product_name in products:
                for market_source in markets:
                    # 1) Refresh this slice so reruns don't duplicate
                    refresh_slice(conn, direction, market_source, str(product_id))

                    # 2) Deterministic RNG so demo is stable
                    rng = random.Random(f"{direction}|{market_source}|{product_id}")
                    chosen = rng.sample(companies, k=min(per_market_product, len(companies)))

                    rows = []
                    for company_id, company_name in chosen:
                        r = random.Random(f"{direction}|{market_source}|{product_id}|{company_id}")

                        unit_price = round(r.uniform(50, 500), 2)
                        quantity = round(r.uniform(10, 200), 3)
                        delivery_price = round(r.uniform(0, 50), 2)

                        payment_due = today + dt.timedelta(days=r.randint(7, 30))
                        delivery_due = today + dt.timedelta(days=r.randint(10, 45))

                        currency = currency_for_market(market_source)

                        rows.append({
                            "id": str(uuid.uuid4()),
                            "source": "MARKET",
                            "direction": direction,
                            "product_id": str(product_id),
                            "company_id": str(company_id),
                            "market_source": market_source,
                            "unit_price": unit_price,
                            "quantity": quantity,
                            "currency": currency,
                            "payment_due_date": payment_due,
                            "delivery_due_date": delivery_due,
                            "delivery_price": delivery_price,
                        })

                    insert_contracts(conn, rows)
                    total_inserted += len(rows)

        conn.commit()
        print(f"Refreshed & inserted {total_inserted} offers.")

if __name__ == "__main__":
    generate_market_offers(per_market_product=8)
