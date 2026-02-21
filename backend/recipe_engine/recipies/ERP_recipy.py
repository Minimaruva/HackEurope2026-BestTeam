from typing import TypedDict, Literal, List, Optional
from langgraph.graph import StateGraph, END, START
import os
import uuid
from dotenv import load_dotenv
from paid import Paid, Signal #
from langchain_community.tools import DuckDuckGoSearchRun #
from langchain_google_genai import ChatGoogleGenerativeAI #

load_dotenv()

# State Definition 
# This is where specific contracts use case
# + references done

class SupplyChainState(TypedDict):

    contracts: List[dict]
    desired_volume: float
    target_location: str
    
    # Recipe Toggle
    recipe_type: Literal["cheapest", "fastest", "low_risk"]
    
    # Internal Processing
    market_context: str
    risk_level: str
    optimized_results: List[dict]
    
    # Identifiers for PaidAI Correlation
    run_id: str
    user_id: str
    stripe_customer_id: str

# Tool & Client Setup 
paid_client = Paid(token=os.environ.get("PAID_API_KEY")) #
search_tool = DuckDuckGoSearchRun() #

# --- 3. Node Functions ---

def search_market_node(state: SupplyChainState):
    """Enriches data with external risk context."""
    query = f"supply chain disruptions {state['target_location']} 2026"
    results = search_tool.invoke(query)
    return {"market_context": results}

def assess_risk_node(state: SupplyChainState):
    """LLM classifies risk based on search data."""
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=os.environ.get("GEMINI_API_KEY"))
    prompt = f"Context: {state['market_context']}\nTask: Is risk for {state['target_location']} 'high' or 'low'?"
    response = llm.invoke(prompt)
    return {"risk_level": response.content.strip().lower()}

def recipe_execution_node(state: SupplyChainState):
    """
    Applies heuristics
    Formula: cost * volume + extra_costs
    """
    contracts = state["contracts"]
    recipe = state["recipe_type"]
    vol = state["desired_volume"]
    
    processed = []
    for c in contracts:
        # Calculate heuristic: cost * volume + logistics_penalty
        logistics_penalty = 0 if c['location'] == state['target_location'] else 500
        score = (c['price'] * vol) + logistics_penalty
        c['internal_score'] = score
        processed.append(c)

    # Filter/Rank based on toggle
    if recipe == "cheapest":
        results = sorted(processed, key=lambda x: x['internal_score'])
    elif recipe == "fastest":
        # Prioritize same location to avoid delays
        results = sorted(processed, key=lambda x: (x['location'] != state['target_location'], x['internal_score']))
    else: # low_risk
        results = [c for c in processed if state['risk_level'] == 'low'] or processed
        
    return {"optimized_results": results}

def stripe_billing_node(state: SupplyChainState):
    """Simulates Stripe invoice creation from image.webp."""
    best_option = state["optimized_results"][0]
    print(f"-> [STRIPE] Creating Invoice for {best_option['company']}")
    print(f"-> [STRIPE] API Call: Invoice.create(customer={state['stripe_customer_id']}, amount={best_option['internal_score']})")
    
    # Emit PaidAI Signal for cost tracking
    usage_signal = Signal(
        event_name="optimization_run_completed",
        customer={"externalCustomerId": state['user_id']},
        properties={
            "run_id": state['run_id'],
            "recipe": state['recipe_type'],
            "cost_score": best_option['internal_score']
        }
    )
    paid_client.signals.create_signals(signals=[usage_signal])
    return state

# --- 4. Graph Construction ---
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

# --- 5. Execution Example ---
if __name__ == "__main__":
    sample_contracts = [
        {"company": "Supplier A", "price": 10, "location": "Local", "volume": 1000},
        {"company": "Supplier B", "price": 8, "location": "International", "volume": 1000}
    ]

    initial_state = {
        "contracts": sample_contracts,
        "desired_volume": 100,
        "target_location": "Local",
        "recipe_type": "cheapest", # Toggle this to 'fastest' or 'low_risk'
        "run_id": str(uuid.uuid4()),
        "user_id": "user_123",
        "stripe_customer_id": "cus_999"
    }

    final_state = app.invoke(initial_state)
    print(f"\nOptimization Result: {final_state['optimized_results'][0]['company']} selected.")