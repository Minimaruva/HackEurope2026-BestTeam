from typing import TypedDict, Literal, List
from langgraph.graph import StateGraph, END, START
import os
import uuid
from dotenv import load_dotenv
from langchain_community.tools import DuckDuckGoSearchRun 
from langchain_google_genai import ChatGoogleGenerativeAI 
from cost_estimator import ERPCostEstimator

# 1. Import tracing instead of manual SDK clients
from paid.tracing import paid_autoinstrument, initialize_tracing, paid_tracing, signal

load_dotenv()

# 2. Initialize tracing strictly for installed libraries to prevent DependencyConflicts
initialize_tracing()
paid_autoinstrument(libraries=["gemini", "langchain"])

class SupplyChainState(TypedDict):
    contracts: List[dict]
    desired_volume: float
    target_location: str
    recipe_type: Literal["cheapest", "fastest", "low_risk"]
    market_context: str
    risk_level: str
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
    print("-> [LLM] Analyzing market context with Gemini-2.5-Flash...")
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=os.environ.get("GEMINI_API_KEY"))
    prompt = f"Context: {state['market_context']}\nTask: Is risk for {state['target_location']} 'high' or 'low'? Respond with exactly one word."
    
    try:
        response = llm.invoke(prompt)
        risk = response.content.strip().lower()
        print(f"-> [LLM] Risk assessed as: {risk.upper()}")
    except Exception as e:
        print(f"-> [LLM ERROR]: {e}")
        risk = "low"
        
    return {"risk_level": risk}

def recipe_execution_node(state: SupplyChainState):
    print(f"-> [RECIPE] Applying '{state['recipe_type']}' heuristic...")
    contracts = state["contracts"]
    recipe = state["recipe_type"]
    vol = state["desired_volume"]
    
    estimator = ERPCostEstimator()
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
        "run_id": str(uuid.uuid4()),
        # Must perfectly match the external ID of Customer-Sandbox
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