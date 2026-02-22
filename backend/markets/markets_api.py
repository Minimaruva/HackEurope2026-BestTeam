import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

import psycopg

try:
    from backend.types import Contract
except ImportError:
    # Support direct script execution from repo root and subfolders.
    repo_root = Path(__file__).resolve().parents[2]
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))
    from backend.types import Contract

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://hack:hackpass@localhost:5432/hackathon"
)


def get_offers_for_product(
    conn: psycopg.Connection[Any],
    product_id: str,
    direction: str,
    market_source: str | None = None,
    limit: int = 50,
) -> list[Contract]:
    sql = """
      SELECT *
      FROM contract
      WHERE source = 'MARKET'
        AND product_id = %(product_id)s
        AND direction = %(direction)s
    """
    params: dict[str, Any] = {
        "product_id": product_id,
        "direction": direction.upper(),
        "limit": limit,
    }

    if market_source:
        sql += " AND market_source = %(market_source)s"
        params["market_source"] = market_source

    sql += " ORDER BY unit_price ASC LIMIT %(limit)s"

    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(sql, params)
        return [Contract.from_row(row) for row in cur.fetchall()]


def fetch_offers(
    product_id: str, direction: str, market_source: str | None = None, limit: int = 50
) -> list[Contract]:
    with psycopg.connect(DATABASE_URL) as conn:
        return get_offers_for_product(
            conn=conn,
            product_id=product_id,
            direction=direction,
            market_source=market_source,
            limit=limit,
        )


def fetch_market_contracts_for_product(
    product_id: str,
    limit_per_direction: int = 200,
) -> list[Contract]:
    in_offers = fetch_offers(product_id=product_id, direction="IN", limit=limit_per_direction)
    out_offers = fetch_offers(product_id=product_id, direction="OUT", limit=limit_per_direction)
    return in_offers + out_offers


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
    parser = argparse.ArgumentParser(description="Query current market offers.")
    parser.add_argument("--product-id", required=True, help="Product UUID")
    parser.add_argument("--direction", required=True, choices=["IN", "OUT", "in", "out"])
    parser.add_argument("--market-source", default=None, help='Optional market source, e.g. "London,GB"')
    parser.add_argument("--limit", type=int, default=50, help="Max rows to return")
    return parser


def main() -> None:
    args = _build_arg_parser().parse_args()
    rows = fetch_offers(
        product_id=args.product_id,
        direction=args.direction,
        market_source=args.market_source,
        limit=args.limit,
    )
    print(json.dumps([_as_jsonable(item) for item in rows], indent=2))


if __name__ == "__main__":
    main()
