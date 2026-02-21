import os

class PaidPricingEstimator:
    def __init__(self, api_key: str = None):
        # We perform no API initialization since we are using hardcoded values.
        # This matches the user request to abandon the empty API response strategy.
        self.rates = {}

    def fetch_order_pricing(self, order_id: str):
        """
        Simulates fetching pricing. Since the API returns null metadata for this order,
        we manually map the Order ID to its known contractual rates.
        """
        print(f"-> [PAID] Loading contract terms for Order: {order_id}")
        
        if order_id == "ord_5hfxXqwDFHh":
            # Hardcoded rates for "Customer-Sandbox - ERP-Agent Contract Optimiser"
            # Based on standard ERP Agent pricing + Gemini Flash
            self.rates = {
                "input_token_cost": 0.00000015, 
                "output_token_cost": 0.00000060, 
                "transaction_cost": 0.01        # Per-execution fee (Optimization fee)
            }
            print(f"-> [PAID] Loaded HARDCODED rates: {self.rates}")
        else:
            # Fallback for unknown orders
            self.rates = {
                "input_token_cost": 0.00000010,
                "output_token_cost": 0.00000030,
                "transaction_cost": 0.002
            }
            print(f"-> [PAID] Unknown order, using default fallback rates.")

        return self.rates

    def estimate_cost(self, usage_data: dict):
        """
        Calculate cost using currently loaded rates.
        """
        r = self.rates
        
        # Calculate individual components
        input_c = usage_data.get("input_tokens", 0) * r.get("input_token_cost", 0)
        output_c = usage_data.get("output_tokens", 0) * r.get("output_token_cost", 0)
        trans_c = usage_data.get("search_calls", 0) * r.get("transaction_cost", 0)
        
        total = input_c + output_c + trans_c
        return round(total, 6)

if __name__ == "__main__":
    print(">>> STARTING LOCAL ESTIMATION <<<")
    
    estimator = PaidPricingEstimator()
    
    # 1. Load Hardcoded Plan
    ORDER_ID = "ord_5hfxXqwDFHh"
    estimator.fetch_order_pricing(ORDER_ID)
    
    # 2. Define Usage
    usage = {
        "input_tokens": 1000,
        "output_tokens": 200,
        "search_calls": 5
    }
    
    # 3. Estimate
    final_cost = estimator.estimate_cost(usage)
    
    print(f"\n>>> FINAL ESTIMATION for Order {ORDER_ID} <<<")
    print(f"Usage: {usage}")
    print(f"Active Rates: {estimator.rates}")
    print(f"Total Cost: ${final_cost}")