# prompts.py
# Individual flavours for the recipe execution node, 
# which applies heuristics to optimize supplier selection based on different criteria (cost, risk, speed, balance).

FLAVOUR_PROMPTS = {
    "cheapest": """
    PRIMARY GOAL: Minimize Total Cost.
    Ignore delivery speed and moderate risk. 
    Formula to prioritize: $Total Cost = (Price \\times Volume) + Logistics Fees$.
    Reject any supplier where 'internal_score' is not the absolute minimum.
    """,
    
    "low_risk": """
    PRIMARY GOAL: Reliability and Stability.
    Prioritize suppliers with high credibility and favorable payment terms.
    If 'risk_level' is 'high', exclude the supplier regardless of price.
    Formula: Favor (Score = 0.7 \\times Reliability + 0.3 \\times Price).
    """,
    
    "fastest": """
    PRIMARY GOAL: Lead Time Minimization.
    Prioritize suppliers in the 'target_location'. 
    Accept higher prices if it means avoiding international shipping or customs.
    Formula: (Location Match == True) is the primary sort key.
    """,
    
    "balanced": """
    PRIMARY GOAL: Equilibrium.
    Weight Price (33%), Risk (33%), and Speed (33%) equally.
    Avoid extremes (e.g., don't pick the cheapest if the risk is high).
    """
}