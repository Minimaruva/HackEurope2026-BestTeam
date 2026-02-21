from typing import TypedDict, Literal
from langgraph.graph import StateGraph, END, START
import random
import os
from dotenv import load_dotenv
from paid import Paid, Signal
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_google_genai import ChatGoogleGenerativeAI

# import { PaidClient } from '@paid-ai/paid-node';

# const client = new PaidClient({ token: "e0c6ef5d-3ce7-499a-bacd-b70c12fb67ab" });

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
    print("-> Analyzing market context with Gemini...")
    llm = ChatGoogleGenerativeAI(
        model="models/gemini-2.5-flash", 
        google_api_key=os.environ.get("GEMINI_API_KEY"),
        temperature=0
    )
    
    # Improved prompt to ensure the LLM uses the search data provided
    prompt = (
        f"Context: {state['market_context']}\n\n"
        f"Supplier: {state['supplier_data']}\n"
        "Task: Based on the context, is this supplier high risk or low risk? "
        "Respond with exactly one word: 'high' or 'low'."
    )
    
    try:
        response = llm.invoke(prompt)
        risk = response.content.strip().lower()
        # Clean up any extra punctuation
        risk = "".join(char for char in risk if char.isalnum())
    except Exception as e:
        print(f"!!! LLM Error: {e}")
        risk = "low" # Safe fallback
        
    print(f"   [RESULT] Risk Level: {risk.upper()}")
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
            customer={"externalCustomerId": "test_customer_sandbox"}
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

# Paid test function to verify API key and SDK setup
import traceback

def test_paid_key(client: "Paid") -> None:
    # Use the PAID key for the PAID test logs
    token = os.environ.get("PAID_API_KEY") 
    if not token:
        print("ERROR: PAID_API_KEY not set.")
        return

    masked = token[:4] + "..." + token[-4:] if len(token) > 8 else "REDACTED"
    print(f"PAID_API_KEY loaded (masked): {masked}")
    # ... rest of the code

if __name__ == "__main__":
    # run the quick key test first
    test_paid_key(paid_client)
    
    result = app.invoke({
        "supplier_data": "", 
        "risk_level": "", 
        "market_context": "",
        "alternative_suppliers": [], 
        "logistics_plan": "", 
        "final_report": ""
    })
    print(f"\nFINAL REPORT:\n{result['final_report']}")