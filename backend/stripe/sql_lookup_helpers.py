import os
from typing import Any, Optional

import psycopg
import psycopg.rows

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://hack:hackpass@localhost:5432/hackathon"
)


def get_product_stripe_id(
    conn: psycopg.Connection[Any], product_id: str
) -> Optional[str]:
    """Return the stripe_id for a product given its UUID, or None."""
    sql = """
      SELECT stripe_id
      FROM product
      WHERE id = %(product_id)s
    """
    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(sql, {"product_id": product_id})
        row = cur.fetchone()
        return row["stripe_id"] if row else None


def get_company_stripe_id(
    conn: psycopg.Connection[Any], company_id: str
) -> Optional[str]:
    """Return the stripe_id for a company (customer) given its UUID, or None."""
    sql = """
      SELECT stripe_id
      FROM company
      WHERE id = %(company_id)s
    """
    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(sql, {"company_id": company_id})
        row = cur.fetchone()
        return row["stripe_id"] if row else None


def fetch_product_stripe_id(product_id: str) -> Optional[str]:
    """Convenience wrapper that opens its own connection."""
    with psycopg.connect(DATABASE_URL) as conn:
        return get_product_stripe_id(conn, product_id)


def fetch_company_stripe_id(company_id: str) -> Optional[str]:
    """Convenience wrapper that opens its own DB connection."""
    with psycopg.connect(DATABASE_URL) as conn:
        return get_company_stripe_id(conn, company_id)


def fetch_all_products() -> list[dict[str, Any]]:
    """Return all products as a list of dicts (id, name, type, stripe_id)."""
    sql = "SELECT id, name, type, stripe_id FROM product ORDER BY name ASC;"
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
            cur.execute(sql)
            return [
                {
                    "id": str(r["id"]),
                    "name": r["name"],
                    "type": r.get("type"),
                    "stripe_id": r.get("stripe_id"),
                }
                for r in cur.fetchall()
            ]


def get_name_for_product_id(product_id: str) -> str:
    """Return the product name given its UUID."""
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT name FROM product WHERE id = %(id)s", {"id": product_id})
            row = cur.fetchone()
            if not row:
                raise ValueError(f"Product id not found: {product_id}")
            return row[0]


def get_name_and_email_for_company_id(company_id: str) -> tuple[str, str]:
    """Return (name, email) for a company given its UUID."""
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT name, email FROM company WHERE id = %(id)s", {"id": company_id})
            row = cur.fetchone()
            if not row:
                raise ValueError(f"Company id not found: {company_id}")
            return row[0], row[1]


def main() -> None:
    """Simple CLI to test lookup helpers.

    Usage examples:
      python backend/stripe/sql_lookup_helpers.py --product <product_uuid>
      python backend/stripe/sql_lookup_helpers.py --company <company_uuid>
    """
    import argparse

    parser = argparse.ArgumentParser(description="Lookup Stripe IDs for product/company UUIDs")
    parser.add_argument("--product", help="Product UUID to lookup")
    parser.add_argument("--company", help="Company UUID to lookup")
    args = parser.parse_args()

    if not args.product and not args.company:
        parser.error("Provide --product or --company (or both)")

    if args.product:
        sid = fetch_product_stripe_id(args.product)
        print(f"Product {args.product} -> stripe_id: {sid}")

    if args.company:
        sid = fetch_company_stripe_id(args.company)
        print(f"Company {args.company} -> stripe_id: {sid}")


if __name__ == "__main__":
    main()
