import os
import uuid
import json
from typing import TypedDict, List
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END, START
from langchain_google_genai import ChatGoogleGenerativeAI

# Local imports
from prompts import FLAVOUR_PROMPTS
from paid.tracing import paid_autoinstrument, initialize_tracing, paid_tracing, signal

load_dotenv()
initialize_tracing()
paid_autoinstrument(libraries=["gemini", "langchain"])

class SupplyChainState(TypedDict):
    old_contracts: List[dict]
    market_contracts: List[dict]
    active_toggles: dict
    selected_flavours: List[str] 
    target_volume: float
    processed_contracts: List[dict]
    final_plans: dict
    llm_explanations: dict
    run_id: str
    user_id: str

def step_1_toggles_and_baselines_node(state: SupplyChainState):
    print("-> [DATA] Extracting target volume and applying UI toggles...")
    target_vol = sum(c.get('quantity', 0) for c in state['old_contracts'])
    print(f"-> [MATH] Target Volume calculated at: {target_vol}")
    
    contracts = state["market_contracts"]
    toggles = state.get("active_toggles", {})
    processed = []
    
    eu_members = {"FR", "DE", "IT", "ES", "NL", "BE", "SE"} 

    for c in contracts:
        c['score'] = c.get('credibility', 50) # Base score tied to credibility
        c['effective_price'] = c['unit_price']
        
        if toggles.get("credibility_floor") and c.get('credibility', 100) < 70:
            continue
            
        if toggles.get("eu_priority"):
            country = c.get('market_source', '').split(',')[-1].strip()
            if country in eu_members:
                c['score'] += 15
                
        if toggles.get("volume_discount"):
            if c['quantity'] > 10000:
                c['effective_price'] *= 0.90
            elif c['quantity'] > 5000:
                c['effective_price'] *= 0.95
                
        if toggles.get("payment_terms"):
            terms = c.get('payment_days', 0)
            if terms >= 60:
                c['score'] += 20
            elif terms >= 30:
                c['score'] += 10
                
        processed.append(c)
        
    return {"target_volume": target_vol, "processed_contracts": processed}

def step_2_allocate_node(state: SupplyChainState):
    print("-> [ALLOCATION] Running deterministic greedy algorithms for selected flavours...")
    contracts = state["processed_contracts"]
    target_vol = state["target_volume"]
    selected = state["selected_flavours"]
    
    def allocate(sort_key, reverse=False):
        sorted_c = sorted(contracts, key=sort_key, reverse=reverse)
        plan = []
        fulfilled = 0
        total_cost = 0
        total_days = 0
        
        for c in sorted_c:
            if fulfilled >= target_vol: break
            take = min(c['quantity'], target_vol - fulfilled)
            plan.append({
                "supplier": c['company_name'], 
                "price": c['effective_price'], 
                "allocated_qty": take,
                "score": c['score'],
                "delivery_days": c.get('delivery_days', 0)
            })
            total_cost += (take * c['effective_price'])
            total_days += (c.get('delivery_days', 0) * take)
            fulfilled += take
            
        return {
            "fulfilled_volume": fulfilled,
            "total_cost": total_cost,
            "avg_delivery_days": round(total_days / fulfilled) if fulfilled > 0 else 0,
            "allocations": plan
        }

    plans = {}
    if "cheapest" in selected:
        plans["cheapest"] = allocate(lambda x: x['effective_price'], reverse=False)
    if "low_risk" in selected:
        plans["low_risk"] = allocate(lambda x: x['score'], reverse=True)
    if "fastest" in selected:
        plans["fastest"] = allocate(lambda x: x.get('delivery_days', 999), reverse=False)

    return {"final_plans": plans}

def step_3_llm_interpreter_node(state: SupplyChainState):
    print("-> [LLM] Generating human-in-the-loop explanations with Gemma 3 27B...")
    llm = ChatGoogleGenerativeAI(
        model="models/gemma-3-27b-it", 
        google_api_key=os.environ.get("GEMINI_API_KEY")
    )
    
    plans_summary = json.dumps(state['final_plans'], indent=2)
    active_prompts = "\n".join([f"[{f.upper()} Goal]: {FLAVOUR_PROMPTS.get(f, '')}" for f in state["selected_flavours"]])
    
    prompt = f"""
    You are an ERP analyst providing human-in-the-loop (HITL) context.
    The system mathematically allocated contracts to fulfill {state['target_volume']} units based on strict heuristics.
    
    System Goals:
    {active_prompts}
    
    Mathematical Results:
    {plans_summary}
    
    For each flavour, write exactly two sentences explaining WHY these specific suppliers were chosen based on the goals and their data (e.g., credibility, price, speed). Do not recalculate math. Format exactly as:
    
    [CHEAPEST]: ...
    [LOW_RISK]: ...
    [FASTEST]: ...
    """
    
    try:
        explanation = llm.invoke(prompt).content.strip()
    except Exception as e:
        print(f"-> [LLM ERROR] {e}")
        explanation = "Error generating explanation."

    return {"llm_explanations": {"hitl_summary": explanation}}

def stripe_billing_node(state: SupplyChainState):
    print("-> [BILLING] Emitting signal for usage tracking...")
    try:
        first_flavour = state["selected_flavours"][0]
        base_cost = state['final_plans'][first_flavour]['total_cost']
        signal(
            event_name="erp_agent_optimiser",
            enable_cost_tracing=True,
            data={"run_id": state['run_id'], "action": "generated_flavours", "reference_cost": base_cost}
        )
        print(f"-> [PAID] Signal successfully dispatched and linked for {state['user_id']}")
    except Exception as e:
        print(f"-> [PAID ERROR] {e}")
    return state    

workflow = StateGraph(SupplyChainState)
workflow.add_node("step_1_toggles", step_1_toggles_and_baselines_node)
workflow.add_node("step_2_allocate", step_2_allocate_node)
workflow.add_node("step_3_interpret", step_3_llm_interpreter_node)
workflow.add_node("billing", stripe_billing_node)

workflow.add_edge(START, "step_1_toggles")
workflow.add_edge("step_1_toggles", "step_2_allocate")
workflow.add_edge("step_2_allocate", "step_3_interpret")
workflow.add_edge("step_3_interpret", "billing")
workflow.add_edge("billing", END)

app = workflow.compile()

if __name__ == "__main__":
    initial_state = {
        "old_contracts": [{"quantity": 4000}, {"quantity": 6000}],
        "market_contracts": [
            {"company_name": "Shanghai MetalWorks Ltd.", "unit_price": 420.00, "quantity": 6000, "market_source": "CN", "credibility": 75, "payment_days": 15, "delivery_days": 35},
            {"company_name": "Nucor Corp.", "unit_price": 428.00, "quantity": 5000, "market_source": "US", "credibility": 92, "payment_days": 30, "delivery_days": 18},
            {"company_name": "Tata Steel Intl.", "unit_price": 445.00, "quantity": 5000, "market_source": "IN", "credibility": 88, "payment_days": 60, "delivery_days": 22},
            {"company_name": "ArcelorMittal Europe", "unit_price": 435.00, "quantity": 5000, "market_source": "FR", "credibility": 95, "payment_days": 45, "delivery_days": 22},
            {"company_name": "POSCO Trading", "unit_price": 460.00, "quantity": 5000, "market_source": "KR", "credibility": 85, "payment_days": 30, "delivery_days": 16}
        ],
        "active_toggles": {"eu_priority": True, "volume_discount": True, "credibility_floor": True},
        "selected_flavours": ["cheapest", "low_risk", "fastest"],
        "run_id": str(uuid.uuid4()),
        "user_id": "customer-sandbox"
    }

    with paid_tracing(external_customer_id=initial_state["user_id"], external_product_id="supply_chain_report"):
        final_state = app.invoke(initial_state)
        print("\n=== AGENT EXECUTION SUMMARY ===")
        print(final_state['llm_explanations']['hitl_summary'])