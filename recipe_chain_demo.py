from typing import TypedDict, Literal
from langgraph.graph import StateGraph, END
import random
import os
from dotenv import load_dotenv
from paid import PaidClient 

# 1. Load the sandbox key from your .env file
load_dotenv()
paid_client = PaidClient(api_key=os.environ.get("PAID_API_KEY"))

os.environ["PAID_API_KEY"] = "your-paid-secret-key"

# 1. Define the State structure
#  This is the data structure that will be passed through the graph. Each node can read and modify this state.
# where our input is the supply chain data and our output is a final report.
class SupplyChainState(TypedDict):
    supplier_data: str
    risk_level: str
    alternative_suppliers: list[str]
    logistics_plan: str
    final_report: str

# 2. Define Node Functions (The Stages)
def extract_data(state: SupplyChainState) -> SupplyChainState:
    print("-> Extracting supply chain data...")
    return {"supplier_data": "Supplier A (Component X)"}

def assess_risk(state: SupplyChainState) -> SupplyChainState:
    print("-> Assessing risk...")
    # Mocking risk assessment logic (high or low)
    risk = random.choice(["high", "low"]) 
    return {"risk_level": risk}

def alternative_sourcing(state: SupplyChainState) -> SupplyChainState:
    print("-> [OPTIONAL] High risk detected. Finding alternative suppliers...")
    return {"alternative_suppliers": ["Supplier B", "Supplier C"]}

def optimize_logistics(state: SupplyChainState) -> SupplyChainState:
    print("-> Optimizing logistics...")
    return {"logistics_plan": "Optimized route via Port Y"}

def generate_report(state: SupplyChainState) -> SupplyChainState:
    print("-> Generating final report...")
    report = f"Data: {state.get('supplier_data')} | Risk: {state.get('risk_level')}"
    if state.get("alternative_suppliers"):
        report += f" | Alts: {state.get('alternative_suppliers')}"
    return {"final_report": report}

# 3. Define Conditional Routing Logic
def route_based_on_risk(state: SupplyChainState) -> Literal["alternative_sourcing", "optimize_logistics"]:
    if state["risk_level"] == "high":
        return "alternative_sourcing"
    return "optimize_logistics"

# 4. Build and Compile the Graph
workflow = StateGraph(SupplyChainState)

# Add nodes
workflow.add_node("extract_data", extract_data)
workflow.add_node("assess_risk", assess_risk)
workflow.add_node("alternative_sourcing", alternative_sourcing) # Optional node
workflow.add_node("optimize_logistics", optimize_logistics)
workflow.add_node("generate_report", generate_report)

# Define edges
workflow.set_entry_point("extract_data")
workflow.add_edge("extract_data", "assess_risk")

# Add conditional edge to trigger optional stage
workflow.add_conditional_edges(
    "assess_risk",
    route_based_on_risk,
)

# Connect remaining nodes
workflow.add_edge("alternative_sourcing", "optimize_logistics")
workflow.add_edge("optimize_logistics", "generate_report")
workflow.add_edge("generate_report", END)

# Compile into a runnable application
app = workflow.compile()

# 5. Execute Demo
if __name__ == "__main__":
    print("Running Supply Chain Analysis:\n")
    initial_state = SupplyChainState(
        supplier_data="", risk_level="", alternative_suppliers=[], logistics_plan="", final_report=""
    )
    result = app.invoke(initial_state)
    print("\nFinal State Output:")
    print(result["final_report"])