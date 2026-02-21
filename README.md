# HackEurope2026 Template Repository

This repository is scaffolded with a **Thick Dashboard, Thin Agent** paradigm.

- **Thick Dashboard**: robust frontend views and managerial controls.
- **Thin Agent**: deterministic LangGraph node execution only.
- **Offline Reliability**: mandatory mock datasets for live demo resilience.

## Structure

- `frontend/`
  - `components/` (Cost Ticker, Dual View Interface)
  - `pages/` (Hard ROI, Projected Risk Capital Saved)
- `backend/`
  - `agent/` (parse_invoice, fetch_market_benchmark, audit_dora_compliance, human_review_node)
  - `telemetry/` (global Paid.ai SDK + `record_usage` template)
  - `settlement/` (mock Stripe Agentic Commerce Protocol endpoints)
- `mock_data/`
  - `invoices/` (pre-extracted JSON dictionaries)
  - `market_benchmarks/` (mock external market data)
  - `contracts/` (synthetic MSAs with DORA failures)

> No production logic included yet—this is a template-only baseline.
