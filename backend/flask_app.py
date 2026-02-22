import datetime as dt
import os
import sys
import uuid
from decimal import Decimal
from pathlib import Path
from typing import Any

import psycopg
from flask import Flask, jsonify, request
from flask_cors import CORS

# Allow running as: python backend/flask_app.py
REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.factory.owned_contracts_api import fetch_owned_contracts_for_product
from backend.markets.markets_api import fetch_market_contracts_for_product, fetch_offers
from backend.stripe.sql_lookup_helpers import fetch_all_products, get_name_for_product_id
from backend.recipe_engine.recipies.ERP_recipy import app as erp_agent
from backend.contract_types import Contract

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://hack:hackpass@localhost:5432/hackathon"
)
PORT = int(os.getenv("PORT", "8000"))

app = Flask(__name__)
CORS(app)


def as_float(value: Any) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def normalize_product_type(value: Any) -> str:
    if not isinstance(value, str):
        return "raw"
    normalized = value.strip().lower()
    if normalized in {"finished", "our"}:
        return "finished"
    if normalized in {"raw", "material", "raw_material", "product"}:
        return "raw"
    return "raw"


def contract_to_agent_dict(c: Contract) -> dict[str, Any]:
    today = dt.date.today()
    delivery_days = (c.delivery_due_date - today).days if c.delivery_due_date else 30
    payment_days = (c.payment_due_date - today).days if c.payment_due_date else 30
    return {
        "id": c.id,
        "company_name": c.company_id,
        "unit_price": as_float(c.unit_price),
        "quantity": as_float(c.quantity),
        "market_source": c.market_source,
        "delivery_days": max(0, delivery_days),
        "payment_days": max(0, payment_days),
        "credibility": 85,
    }


def _contracts_payload(contracts: list[Contract], product_name: str | None = None) -> list[dict[str, Any]]:
    return [
        {
            "id": c.id,
            "product_id": c.product_id,
            "product_name": product_name or c.product_id,
            "direction": c.direction,
            "quantity": as_float(c.quantity),
            "currency": c.currency,
            "status": "open",
            "created_at": c.created_at.isoformat(),
        }
        for c in contracts
    ]


def _market_offer_payload(c: Contract, product_name: str) -> dict[str, Any]:
    return {
        "id": c.id,
        "direction": c.direction,
        "product_id": c.product_id,
        "company_id": c.company_id,
        "market_source": c.market_source,
        "unit_price": as_float(c.unit_price),
        "quantity": as_float(c.quantity),
        "currency": c.currency,
        "payment_due_date": c.payment_due_date.isoformat() if c.payment_due_date else None,
        "delivery_due_date": c.delivery_due_date.isoformat() if c.delivery_due_date else None,
        "delivery_price": as_float(c.delivery_price) if c.delivery_price is not None else None,
        "company_name": c.company_id,
        "product_name": product_name,
        "score": max(1, 100 - int(as_float(c.unit_price) / 10)),
        "allocated_qty": as_float(c.quantity),
        "rationale_bullets": [
            "Compatible with requested product and direction.",
            "Ranked by recipe allocation logic.",
        ],
    }


def _product_name(product_id: str) -> str:
    try:
        return get_name_for_product_id(product_id)
    except ValueError:
        return product_id


@app.get("/health")
def health() -> Any:
    return jsonify({"status": "ok"})


@app.get("/api/products")
def api_products() -> Any:
    rows = fetch_all_products()
    return jsonify(
        [
            {
                "id": r["id"],
                "name": r["name"],
                "type": normalize_product_type(r.get("type")),
                "stripe_id": r.get("stripe_id"),
            }
            for r in rows
        ]
    )


@app.get("/api/contracts/owned")
def api_contracts_owned() -> Any:
    product_id = request.args.get("product_id")
    limit = int(request.args.get("limit", "200"))
    if not product_id:
        return jsonify({"error": "product_id is required"}), 400

    contracts = fetch_owned_contracts_for_product(product_id=product_id, limit=limit)
    return jsonify(_contracts_payload(contracts, product_name=_product_name(product_id)))


@app.get("/api/contracts/market")
def api_contracts_market() -> Any:
    product_id = request.args.get("product_id")
    direction = request.args.get("direction")
    market_source = request.args.get("market_source")
    limit = int(request.args.get("limit", "200"))
    if not product_id:
        return jsonify({"error": "product_id is required"}), 400

    product_name = _product_name(product_id)
    if direction:
        contracts = fetch_offers(
            product_id=product_id,
            direction=direction,
            market_source=market_source,
            limit=limit,
        )
    else:
        contracts = fetch_market_contracts_for_product(
            product_id=product_id,
            limit_per_direction=limit,
        )
    return jsonify([_market_offer_payload(c, product_name=product_name) for c in contracts])


@app.get("/api/contracts")
def api_contracts() -> Any:
    # Backward-compatible endpoint for existing FE calls.
    source = (request.args.get("source") or "owned").lower()
    if source == "market":
        return api_contracts_market()
    return api_contracts_owned()


_RECIPES: list[dict[str, Any]] = [
    {
        "id": "recipe-1",
        "name": "Cheapest Price",
        "description": "Optimize for lowest total cost.",
        "prompt": "Sort by effective_price asc",
        "isActive": True,
        "estimatedCostPerRunUSD": 0.08,
    },
    {
        "id": "recipe-2",
        "name": "Lowest Risk",
        "description": "Prefer lower-risk supplier mix.",
        "prompt": "Sort by score desc",
        "isActive": True,
        "estimatedCostPerRunUSD": 0.06,
    },
    {
        "id": "recipe-3",
        "name": "Fastest Delivery",
        "description": "Prefer shortest delivery windows.",
        "prompt": "Sort by delivery_days asc",
        "isActive": True,
        "estimatedCostPerRunUSD": 0.05,
    },
]


@app.get("/api/recipes")
def api_recipes_get() -> Any:
    return jsonify(_RECIPES)


@app.post("/api/recipes")
def api_recipes_create() -> Any:
    body = request.get_json(force=True, silent=True) or {}
    recipe = {
        "id": f"recipe-{int(dt.datetime.utcnow().timestamp())}",
        "name": body.get("name", "Unnamed Recipe"),
        "description": body.get("description", ""),
        "prompt": body.get("prompt", ""),
        "isActive": bool(body.get("isActive", True)),
        "estimatedCostPerRunUSD": body.get("estimatedCostPerRunUSD", 0.05),
    }
    _RECIPES.append(recipe)
    return jsonify(recipe), 201


@app.put("/api/recipes/<recipe_id>")
def api_recipes_update(recipe_id: str) -> Any:
    body = request.get_json(force=True, silent=True) or {}
    for idx, recipe in enumerate(_RECIPES):
        if recipe["id"] == recipe_id:
            updated = {**recipe, **body}
            _RECIPES[idx] = updated
            return jsonify(updated)
    return jsonify({"error": "Recipe not found"}), 404


_RECIPE_TO_FLAVOUR = {
    "recipe-1": "cheapest",
    "recipe-2": "low_risk",
    "recipe-3": "fastest",
    "recipe-4": "balanced",
}
_FLAVOUR_DISPLAY = {
    "cheapest": "Cheapest Price",
    "low_risk": "Lowest Risk",
    "fastest": "Fastest Delivery",
    "balanced": "Balanced",
}


@app.post("/api/run")
def api_run() -> Any:
    body = request.get_json(force=True, silent=True) or {}
    contract_id = body.get("contract_id")
    product_id = body.get("product_id")
    recipe_ids = body.get("recipe_ids") or []
    market_source = body.get("market_source")

    if not contract_id:
        return jsonify({"error": "contract_id is required"}), 400
    if not product_id:
        return jsonify({"error": "product_id is required"}), 400

    owned_contracts = fetch_owned_contracts_for_product(product_id=product_id, limit=500)
    owned = next((c for c in owned_contracts if c.id == contract_id), None)
    if not owned:
        return jsonify({"error": "Owned contract not found for product"}), 404

    market_contracts = fetch_offers(
        product_id=product_id,
        direction=owned.direction,
        market_source=market_source,
        limit=300,
    )

    selected_flavours = [
        _RECIPE_TO_FLAVOUR[rid] for rid in recipe_ids if rid in _RECIPE_TO_FLAVOUR
    ] or ["cheapest", "low_risk", "fastest"]

    initial_state = {
        "old_contracts": [contract_to_agent_dict(c) for c in owned_contracts],
        "market_contracts": [contract_to_agent_dict(c) for c in market_contracts],
        "active_toggles": {
            "eu_priority": True,
            "volume_discount": True,
            "credibility_floor": True,
            "payment_terms": True,
        },
        "selected_flavours": selected_flavours,
        "run_id": str(uuid.uuid4()),
        "user_id": "api-user",
    }
    final_state = erp_agent.invoke(initial_state)
    final_plans = final_state.get("final_plans", {})
    product_name = _product_name(product_id)

    flavour_plans: list[dict[str, Any]] = []
    for flavour_key, plan in final_plans.items():
        allocations = plan.get("allocations", [])
        selected_contracts: list[dict[str, Any]] = []
        for item in allocations:
            synthetic_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{flavour_key}:{item.get('supplier')}:{product_id}"))
            selected_contracts.append(
                {
                    "id": synthetic_id,
                    "direction": owned.direction,
                    "product_id": product_id,
                    "company_id": item.get("supplier", "unknown"),
                    "market_source": market_source or "All Markets",
                    "unit_price": as_float(item.get("price", 0)),
                    "quantity": as_float(item.get("allocated_qty", 0)),
                    "currency": owned.currency,
                    "payment_due_date": None,
                    "delivery_due_date": None,
                    "delivery_price": 0,
                    "company_name": item.get("supplier", "Unknown Supplier"),
                    "product_name": product_name,
                    "score": as_float(item.get("score", 0)),
                    "allocated_qty": as_float(item.get("allocated_qty", 0)),
                    "rationale_bullets": [
                        f"Chosen by {flavour_key} optimisation.",
                        "Derived from current market offers for selected product.",
                    ],
                }
            )

        flavour_plans.append(
            {
                "flavour_id": flavour_key,
                "flavour_name": _FLAVOUR_DISPLAY.get(flavour_key, flavour_key),
                "selected_contracts": selected_contracts,
                "explanation": [
                    f"{_FLAVOUR_DISPLAY.get(flavour_key, flavour_key)} strategy generated this allocation."
                ],
                "total_cost": as_float(plan.get("total_cost", 0)),
                "avg_delivery_days": int(plan.get("avg_delivery_days", 0)),
            }
        )

    top_scores = [
        max((as_float(c.get("score", 0)) for c in fp["selected_contracts"]), default=0)
        for fp in flavour_plans
    ]
    response = {
        "run_id": initial_state["run_id"],
        "agent_id": "erp-agent-v1",
        "product_id": product_id,
        "direction": owned.direction,
        "total_qty_needed": as_float(owned.quantity),
        "flavour_plans": flavour_plans,
        "metrics": {
            "offers_scanned": len(market_contracts),
            "avg_score": round(sum(top_scores) / len(top_scores), 2) if top_scores else 0,
            "top_score": max(top_scores, default=0),
            "time_ms": 200,
        },
        "selected_contracts": flavour_plans[0]["selected_contracts"] if flavour_plans else [],
        "alternatives": [],
        "explanation": [
            final_state.get("llm_explanations", {}).get("hitl_summary", "No LLM explanation generated.")
        ],
    }
    return jsonify(response)


@app.post("/api/invoice/from-contract")
def api_invoice() -> Any:
    body = request.get_json(force=True, silent=True) or {}
    contract_id = body.get("contract_id")
    if not contract_id:
        return jsonify({"error": "contract_id is required"}), 400
    return jsonify(
        {
            "stripe_invoice_id": f"inv_{uuid.uuid4().hex[:12]}",
            "status": "draft",
            "hosted_invoice_url": "https://invoice.stripe.com/mock",
        }
    )


@app.get("/api/costs")
def api_costs() -> Any:
    return jsonify(
        {
            "total_cost_usd": 0.0,
            "by_agent": [
                {
                    "agent_id": "erp-agent-v1",
                    "agent_name": "ERP Agent",
                    "runs": 0,
                    "tokens": 0,
                    "cost_usd": 0.0,
                    "avg_cost_usd": 0.0,
                }
            ],
            "savings_estimate": {
                "manual_cost_usd": 0.0,
                "ai_cost_usd": 0.0,
                "saved_usd": 0.0,
            },
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)
