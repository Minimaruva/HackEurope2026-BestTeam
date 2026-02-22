import sys
from pathlib import Path

# Allow running as: python backend/main.py
REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.factory.owned_contracts_api import fetch_owned_contracts_for_product
from backend.types import Contract
from backend.markets.markets_api import fetch_market_contracts_for_product

# TODO: replace with frontend-selected product id.
PRODUCT_ID = "0c3358f0-b788-4ee1-aeff-45aee4bedf70"


def main() -> None:
    print(f"[main] Start execution flow for product_id={PRODUCT_ID}")

    owned_contracts: list[Contract] = fetch_owned_contracts_for_product(
        product_id=PRODUCT_ID
    )
    print(f"[main] OWNED contracts loaded: {len(owned_contracts)}")

    market_contracts: list[Contract] = fetch_market_contracts_for_product(
        product_id=PRODUCT_ID
    )
    print(f"[main] MARKET contracts loaded: {len(market_contracts)}")

    print("[main] Data retrieval stage complete.")

    


if __name__ == "__main__":
    main()
