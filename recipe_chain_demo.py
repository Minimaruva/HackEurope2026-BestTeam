from typing import TypedDict, Literal
from langgraph.graph import StateGraph, END, START
import random
import os
from dotenv import load_dotenv
from paid import Paid, Signal
from langchain_community.tools import DuckDuckGoSearchRun

# 1. Environment Setup
load_dotenv()
# Initialize Paid client with your sandbox token from .env
paid_client = Paid(token=os.environ.get("PAID_API_KEY"))
# Initialize free search tool
search_tool = DuckDuckGoSearchRun()

# 2. Define State
class SupplyChainState(TypedDict):
    supplier_data: str
    risk_level: str
    market_context: str # New field for search results
    alternative_suppliers: list[str]
    logistics_plan: str
    final_report: str

# 3. Define Node Functions
def search_market_node(state: SupplyChainState) -> SupplyChainState:
    print("-> [SEARCH] Fetching free market benchmarks via DuckDuckGo...")
    # Search for context to help with risk assessment
    query = "current supply chain disruptions semiconductor 2026"
    results = search_tool.invoke(query)
    return {"market_context": results}

def extract_data(state: SupplyChainState) -> SupplyChainState:
    print("-> Extracting supply chain data...")
    return {"supplier_data": "Supplier A (Component X)"}

def assess_risk(state: SupplyChainState) -> SupplyChainState:
    print("-> Assessing risk based on market context...")
    # Mocking risk assessment logic
    risk = random.choice(["high", "low"]) 
    return {"risk_level": risk}

def alternative_sourcing(state: SupplyChainState) -> SupplyChainState:
    print("-> [OPTIONAL] High risk detected. Finding alternative suppliers...")
    return {"alternative_suppliers": ["Supplier B", "Supplier C"]}

def optimize_logistics(state: SupplyChainState) -> SupplyChainState:
    print("-> Optimizing logistics...")
    return {"logistics_plan": "Optimized route via Port Y"}

def generate_report(state: SupplyChainState) -> SupplyChainState:
    print("-> Generating report & emitting billing signal...")
    
    # Emit a Signal to Paid.ai for the billable report generation
    try:
        usage_signal = Signal(
            event_name="supply_chain_report_generated",
            customer_id="test_customer_sandbox"
        )
        paid_client.signals.create_signals(signals=[usage_signal])
    except Exception as e:
        print(f"Paid.ai Signal Failed: {e}")

    report = f"Data: {state.get('supplier_data')} | Risk: {state.get('risk_level')}"
    if state.get("alternative_suppliers"):
        report += f" | Alts: {state.get('alternative_suppliers')}"
    return {"final_report": report}

# 4. Routing Logic
def route_based_on_risk(state: SupplyChainState) -> Literal["alternative_sourcing", "optimize_logistics"]:
    if state["risk_level"] == "high":
        return "alternative_sourcing"
    return "optimize_logistics"

# 5. Build Graph
workflow = StateGraph(SupplyChainState)

workflow.add_node("search_market", search_market_node)
workflow.add_node("extract_data", extract_data)
workflow.add_node("assess_risk", assess_risk)
workflow.add_node("alternative_sourcing", alternative_sourcing)
workflow.add_node("optimize_logistics", optimize_logistics)
workflow.add_node("generate_report", generate_report)

workflow.add_edge(START, "search_market")
workflow.add_edge("search_market", "extract_data")
workflow.add_edge("extract_data", "assess_risk")

workflow.add_conditional_edges(
    "assess_risk",
    route_based_on_risk,
)

workflow.add_edge("alternative_sourcing", "optimize_logistics")
workflow.add_edge("optimize_logistics", "generate_report")
workflow.add_edge("generate_report", END)

app = workflow.compile()

if __name__ == "__main__":
    result = app.invoke({
        "supplier_data": "", 
        "risk_level": "", 
        "market_context": "",
        "alternative_suppliers": [], 
        "logistics_plan": "", 
        "final_report": ""
    })
    print(f"\nFINAL REPORT:\n{result['final_report']}")