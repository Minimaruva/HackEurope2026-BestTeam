from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from typing import Any


@dataclass(frozen=True)
class Contract:
    id: str
    source: str
    direction: str
    product_id: str
    company_id: str
    market_source: str
    unit_price: Decimal
    quantity: Decimal
    currency: str
    payment_due_date: date | None
    delivery_due_date: date | None
    delivery_price: Decimal | None
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def from_row(row: dict[str, Any]) -> "Contract":
        return Contract(
            id=str(row["id"]),
            source=str(row["source"]),
            direction=str(row["direction"]),
            product_id=str(row["product_id"]),
            company_id=str(row["company_id"]),
            market_source=str(row["market_source"]),
            unit_price=row["unit_price"],
            quantity=row["quantity"],
            currency=str(row["currency"]),
            payment_due_date=row["payment_due_date"],
            delivery_due_date=row["delivery_due_date"],
            delivery_price=row["delivery_price"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
