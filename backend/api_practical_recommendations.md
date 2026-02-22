# Recipe Engine API Practical Recommendations

## Current situation

- `backend/main.py` already provides typed inputs:
  - `owned_contracts: list[Contract]`
  - `market_contracts: list[Contract]`
- `backend/recipe_engine/recipies/*.py` are demo-oriented and currently:
  - mix graph execution with side effects (Paid billing, prints),
  - create external clients inline,
  - use a different contract shape (`price`, `location`, `company`) than `Contract`.

## Recommended packaging for clean integration

Create a small service-style API in `backend/recipe_engine`:

```python
def run_supply_chain_recipe(
    *,
    owned_contracts: list[Contract],
    market_contracts: list[Contract],
    recipe_type: str,
    desired_volume: float,
    target_location: str,
    run_id: str,
    user_id: str,
    stripe_customer_id: str | None = None,
) -> OptimizationResult:
    ...
```

## Proposed modules

- `backend/recipe_engine/types.py`
  - `RecipeContext`
  - `RecipeContract` (if needed after mapping)
  - `OptimizationResult`
- `backend/recipe_engine/adapters.py`
  - `to_recipe_contract(contract: Contract) -> RecipeContract`
  - keep all schema translations in one place.
- `backend/recipe_engine/service.py`
  - `run_supply_chain_recipe(...)`
  - orchestrates graph execution and returns structured result.
- `backend/recipe_engine/billing.py`
  - `emit_paid_signal(result, context)` isolated from core optimizer.
- `backend/recipe_engine/clients.py`
  - initialize shared clients once (LLM, search, Paid).

## Result contract (example)

```python
@dataclass
class OptimizationResult:
    status: str  # "ok" | "no_candidates" | "error"
    selected_contract_id: str | None
    selected_company_id: str | None
    recipe_type: str
    risk_level: str | None
    candidate_count: int
    notes: list[str]
```

## How it fits in `backend/main.py`

1. `main.py` fetches owned and market contracts (already done).
2. Build `RecipeContext` from frontend request inputs.
3. Call `run_supply_chain_recipe(...)`.
4. Log `OptimizationResult`.
5. Optionally call billing/signal step if `status == "ok"`.

## Practical guardrails

- Never index result lists without checks (`results[0]`).
- Keep side effects optional and toggleable (`enable_billing=False` in local/dev).
- Do not let raw LLM responses define final status without normalization.
- Keep deterministic fallback path when LLM/search fails.
- Log stage timings and candidate counts for debugging and future analytics.
