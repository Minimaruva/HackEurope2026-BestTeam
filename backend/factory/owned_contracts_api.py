import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any
from backend.stripe.stripe_helper import create_invoice_for_contract, evaluate_stripe_to_contract

import psycopg

try:
    from ..contract_types import Contract
except ImportError:
    # Support direct script execution: python backend/factory/owned_contracts_api.py
    repo_root = Path(__file__).resolve().parents[2]
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))
    from backend.contract_types import Contract

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://hack:hackpass@localhost:5432/hackathon"
)


def get_owned_contracts_for_product(
    conn: psycopg.Connection[Any], product_id: str, limit: int = 200
) -> list[Contract]:
    sql = """
      SELECT *
      FROM contract
      WHERE source = 'OWNED'
        AND product_id = %(product_id)s
      ORDER BY created_at DESC
      LIMIT %(limit)s
    """
    params = {"product_id": product_id, "limit": limit}

    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(sql, params)
        res = []
        for row in cur.fetchall():
            cur_contract = Contract.from_row(row)
            (stripe_product_id,_, stripe_customer_id) = evaluate_stripe_to_contract(cur_contract)
            res.append(cur_contract)
            add_stripe_product_id_to_db(conn, product_id=cur_contract.product_id, stripe_product_id=stripe_product_id)
            add_stripe_customer_id_to_db(conn, company_id=cur_contract.company_id, stripe_customer_id=stripe_customer_id)
        return res

def add_stripe_customer_id_to_db(conn: psycopg.Connection[Any], company_id: str, stripe_customer_id: str):
    sql = """
    UPDATE company
    SET stripe_id = %(stripe_customer_id)s
    WHERE id = %(company_id)s
    """
    with conn.cursor() as cur:
        cur.execute(sql, {"company_id": company_id, "stripe_customer_id": stripe_customer_id})
        conn.commit()

def add_stripe_product_id_to_db(conn: psycopg.Connection[Any], product_id: str, stripe_product_id: str):
    sql = """
    UPDATE product
    SET stripe_id = %(stripe_product_id)s
    WHERE id = %(product_id)s
    """
    with conn.cursor() as cur:
        cur.execute(sql, {"product_id": product_id, "stripe_product_id": stripe_product_id})
        conn.commit()

def fetch_owned_contracts_for_product(
    product_id: str, limit: int = 200
) -> list[Contract]:
    with psycopg.connect(DATABASE_URL) as conn:
        return get_owned_contracts_for_product(conn=conn, product_id=product_id, limit=limit)

def _as_jsonable(contract: Contract) -> dict[str, Any]:
    return {
        "id": contract.id,
        "source": contract.source,
        "direction": contract.direction,
        "product_id": contract.product_id,
        "company_id": contract.company_id,
        "market_source": contract.market_source,
        "unit_price": str(contract.unit_price),
        "quantity": str(contract.quantity),
        "currency": contract.currency,
        "payment_due_date": str(contract.payment_due_date) if contract.payment_due_date else None,
        "delivery_due_date": str(contract.delivery_due_date) if contract.delivery_due_date else None,
        "delivery_price": str(contract.delivery_price) if contract.delivery_price is not None else None,
        "created_at": contract.created_at.isoformat(),
        "updated_at": contract.updated_at.isoformat(),
    }


def _build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fetch OWNED contracts by product id.")
    parser.add_argument("--product-id", required=True, help="Product UUID")
    parser.add_argument("--limit", type=int, default=200, help="Max rows to return")
    return parser


def main() -> None:
    args = _build_arg_parser().parse_args()
    contracts = fetch_owned_contracts_for_product(
        product_id=args.product_id, limit=args.limit
    )
    print(json.dumps([_as_jsonable(item) for item in contracts], indent=2))


if __name__ == "__main__":
    main()
