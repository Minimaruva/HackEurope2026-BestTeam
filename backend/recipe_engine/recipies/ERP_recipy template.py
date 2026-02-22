from typing import TypedDict, Literal, List, Optional # Add Optional
from langgraph.graph import StateGraph, END, START
import os
import uuid
from dotenv import load_dotenv
from langchain_community.tools import DuckDuckGoSearchRun 
from langchain_google_genai import ChatGoogleGenerativeAI 
from ERPCostEstimator import PaidPricingEstimator
from prompts import FLAVOUR_PROMPTS
from scipy.optimize import linprog

# 1. Import tracing instead of manual SDK clients
from paid.tracing import paid_autoinstrument, initialize_tracing, paid_tracing, signal

load_dotenv()

# 2. Initialize tracing strictly for installed libraries to prevent DependencyConflicts
initialize_tracing()
paid_autoinstrument(libraries=["gemini", "langchain"])

class SupplyChainState(TypedDict):
    contracts: List[dict] # contract list tied to product owned by company
    # contract on market
    # return sorted by 3 flavours optimizes contract allocation
    desired_volume: float 
    target_location: str
    recipe_type: Literal["cheapest", "fastest", "low_risk", "balanced"]
    optional_flavour: Optional[str] 
    active_toggles: dict
    market_context: str
    risk_level: str
    lp_baseline: dict
    optimized_results: List[dict]
    run_id: str
    user_id: str
    stripe_customer_id: str

search_tool = DuckDuckGoSearchRun() 

def search_market_node(state: SupplyChainState):
    print(f"-> [SEARCH] Fetching data for {state['target_location']}...")
    query = f"supply chain disruptions {state['target_location']} 2026"
    results = search_tool.invoke(query)
    return {"market_context": results}

def assess_risk_node(state: SupplyChainState):
    print("-> [LLM] Analyzing market context with Gemma-3-Flash...")
    llm = ChatGoogleGenerativeAI(model="models/gemma-3-27b-it", google_api_key=os.environ.get("GEMINI_API_KEY"))
    prompt = f"Context: {state['market_context']}\nTask: Is risk for {state['target_location']} 'high' or 'low'? Respond with exactly one word."
    
    try:
        response = llm.invoke(prompt)
        risk = response.content.strip().lower()
        print(f"-> [LLM] Risk assessed as: {risk.upper()}")
    except Exception as e:
        print(f"-> [LLM ERROR]: {e}")
        risk = "low"
        
    return {"risk_level": risk}


def rules_engine_node(state: SupplyChainState):
    print("-> [RULES] Applying deterministic toggles...")
    contracts = state["contracts"]
    toggles = state.get("active_toggles", {})
    processed = []
    
    eu_members = {"FR", "DE", "IT", "ES", "NL"}
    vol = state["desired_volume"]

    for c in contracts:
        c['heuristic_score'] = 0
        c['effective_price'] = c['price']
        
        if toggles.get("credibility_floor") and c.get('credibility', 100) < 70:
            continue
            
        if toggles.get("eu_priority") and c.get('country') in eu_members:
            c['heuristic_score'] += 15
            
        if toggles.get("volume_discount"):
            if vol > 10000:
                c['effective_price'] *= 0.90
            elif vol > 5000:
                c['effective_price'] *= 0.95
                
        if toggles.get("payment_terms"):
            terms = c.get('payment_terms', 0)
            if terms >= 60:
                c['heuristic_score'] += 20
            elif terms >= 30:
                c['heuristic_score'] += 10
                
        processed.append(c)
        
    return {"contracts": processed}

def lp_optimization_node(state: SupplyChainState):
    print("-> [MATH] Running Linear Programming optimization...")
    contracts = state["contracts"]
    vol = state["desired_volume"]
    
    if not contracts:
        return {"lp_baseline": {}}

    prices = [c['effective_price'] for c in contracts]
    capacities = [(0, c.get('capacity', vol)) for c in contracts] 
    
    A_eq = [[1] * len(contracts)]
    b_eq = [vol]
    
    try:
        res = linprog(prices, A_eq=A_eq, b_eq=b_eq, bounds=capacities, method='highs')
        allocations = {contracts[i]['company']: round(res.x[i], 2) for i in range(len(contracts)) if res.x[i] > 0}
        baseline = {"status": "Optimal", "total_cost": round(res.fun, 2), "allocations": allocations}
    except Exception as e:
        baseline = {"status": "Failed", "error": str(e)}
        
    return {"lp_baseline": baseline}

def recipe_execution_node(state: SupplyChainState): 
    # Read it from state safely
    flavour_key = state.get("optional_flavour") or state["recipe_type"]
    
    print(f"-> [RECIPE] Applying '{flavour_key}' heuristic...")
    if flavour_key:
        print(f"-> [FLAVOUR] Using optional flavour: {flavour_key}")

    contracts = state["contracts"]
    recipe = state["recipe_type"]
    vol = state["desired_volume"]
    
    estimator = PaidPricingEstimator()
    processed = []
    for c in contracts:
        logistics_penalty = 0 if c['location'] == state['target_location'] else 500
        score = (c['price'] * vol) + logistics_penalty
        c['internal_score'] = score
        processed.append(c)

    if recipe == "cheapest":
        results = sorted(processed, key=lambda x: x['internal_score'])
    elif recipe == "fastest":
        results = sorted(processed, key=lambda x: (x['location'] != state['target_location'], x['internal_score']))
    else: 
        results = [c for c in processed if state['risk_level'] == 'low'] or processed
        
    return {"optimized_results": results}

def stripe_billing_node(state: SupplyChainState):
    best_option = state["optimized_results"][0]
    print(f"-> [BILLING] Best option identified: {best_option['company']}")
    
    try:
        # 3. Emit signal to capture costs automatically calculated from the Gemini node
        signal(
            event_name="erp_agent_optimiser",
            enable_cost_tracing=True,
            data={
                "run_id": state['run_id'],
                "recipe": state['recipe_type'],
                "cost_score": best_option['internal_score']
            }
        )
        print(f"-> [PAID] Signal successfully dispatched and linked for {state['user_id']}")
    except Exception as e:
        print(f"-> [PAID ERROR] {e}")
        
    return state    

workflow = StateGraph(SupplyChainState)
workflow.add_node("search", search_market_node)
workflow.add_node("risk_check", assess_risk_node)
workflow.add_node("apply_recipe", recipe_execution_node)
workflow.add_node("billing", stripe_billing_node)

workflow.add_edge(START, "search")
workflow.add_edge("search", "risk_check")
workflow.add_edge("risk_check", "apply_recipe")
workflow.add_edge("apply_recipe", "billing")
workflow.add_edge("billing", END)

app = workflow.compile()

if __name__ == "__main__":
    sample_contracts = [
        {"company": "Supplier A", "price": 10, "location": "Local", "volume": 1000},
        {"company": "Supplier B", "price": 8, "location": "International", "volume": 1000}
    ]

    initial_state = {
        "contracts": sample_contracts,
        "desired_volume": 100,
        "target_location": "Local",
        "recipe_type": "cheapest",
        "optional_flavour": "low_risk", # <--- Pass it here
        "run_id": str(uuid.uuid4()),
        "user_id": "customer-sandbox", 
        "stripe_customer_id": "cus_999"
    }

    # Must perfectly match the external product ID on Order ORD-003
    with paid_tracing(
        external_customer_id=initial_state["user_id"],
        external_product_id="supply_chain_report"
    ):
        final_state = app.invoke(initial_state)
        print(f"\nOptimization Result: {final_state['optimized_results'][0]['company']} selected.")