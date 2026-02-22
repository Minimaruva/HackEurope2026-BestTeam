# Agentic ERP Optimisation for Business
## Brought to you by Hampton Square Coding Club
## Devpost link: https://devpost.com/software/erp-business-optimisation

## What it does

We built Agentic **ERP**, a modular business dashboard that optimises specific operational workflows. Our prototype focuses on a **supply chain optimisation module.**

It takes existing "Owned" contracts and compares them against live "Market" offers to choose better deals, depending on what business needs. 
Unlike a "black box" AI, our system runs specific "recipes" (pipelines) that the user can toggle:
1.  Sorting with active filters and **deterministic** greedy knapsack to make initial sort of available resources to fill the supply demand

2. __"Flavours"__ are another set of greedy sorters that extract the top option for specific business priorities:
  - Best cost value
  - Fastest shipment
  - Lowest risk

3. Human in the loop uses review interface (HITLReview.tsx) to allows users to approve agent actions before execution, compare different "flavours" and compose Stripe invoices immediately with supported modules.
4. Once the choice is finalised, Google Gemini explainability node contructs a detailed report justifying financial decision based on the obhjective data and deterministic calculations.(e.g., "Supplier B selected to avoid port strikes in Region X").


The key to the value of our product is in our integrations:
- **Paid.ai**, which tracks agent cost against value saved, which provides data for estimated future run costs to decrease uncertainty in pricing of agents
- **Stripe**, helps to finalise agentic analysis by automatically generating invoces after HITL approval. This removes repetitive error prone tasks from optimisation workflow.


## How we built it

Our project structure is as follows:
- **Backend**: Python with LangGraph to orchestrate the agent workflows. We implemented a custom graph in ERP_recipy.py that handles data fetching, risk assessment, and heuristic optimisation.

- **AI and Search**: We used Google Gemini (via `langchain_google_genai`) for explainability and DuckDuckGo for real-time market context (fetching news about disruptions).

- **Billing/Usage**: We integrated the Paid.ai SDK directly into our LangGraph nodes. Every time the optimisation runs or an invoice is generated, a signal is emitted to Paid.ai, allowing us to model complex usage-based pricing. This also provides transparency with customers which we provide with estimated cost of running agent based on past reports of this type of workflow module

- **Frontend**: Built with React, Vite, and Tailwind CSS (assisted by Lovable for rapid UI prototyping). The dashboard includes a "Recipe Builder" to configure the agent's priorities.

- **Database**: PostgreSQL for storing contract and product data, with specialised generators for seeding realistic test data.

## Challenges we ran into

- Integrating Billing into Logic: figuring out where to place the billing signal was tricky. We had to decide if we bill for the attempt to optimise or only for a successful optimisation. 
    - We solved this by placing the Paid.ai signal in the final nodes of our LangGraph workflow.

- Agent Determinism: LLMs can be unpredictable and cannot be trusted to make financial decisions that company relies on. We had to mix deterministic "Greedy Knapsack" algorithms for the math parts with LLM reasoning for the "Explainability" and "Risk" parts to ensure the financial numbers were always accurate, even if the qualitative advice was generated.

## Accomplishments that we're proud of

**Paid.ai Integration**: We successfully instrumented a LangGraph workflow where the billing logic is completely decoupled from the core business logic but tracks value perfectly.

**Modular Recipe Architecture**: The backend structure (recipe_engine) allows us to plug in new optimisation strategies (like "Sustainability" or "Vendor Diversity") without rewriting the core engine.

- **Real-time Risk Awareness**: The agent doesn't just look at database rows; it actively searches the web for news (like "semiconductor shortage 2026") and adjusts its buying strategy live.

---
## What's next for Agentic ERP for Business Optimisation

- **More Recipes**: We want to expand beyond Supply Chain to "SaaS Churn Prevention" (analysing employee usage logs vs. invoices), "Invoice Reconciliation" etc. The dashboard is modular and supports many use cases.

- **Direct ERP Integration**: Moving from CSV/seed data to live connections with Xero and SAP.

**Fine-grained Paid.ai Models**: Implementing tiered pricing where "High Risk" deep-scan analysis costs more than simple "Cheapest Price" sorting.





