from unittest.mock import MagicMock, patch
import uuid

# Mocking the LLM response to avoid Gemini API costs
mock_llm_response = MagicMock()
mock_llm_response.content = "low"

# Mocking the Search tool
mock_search_results = "No major semiconductor disruptions found in Local area for 2026."

@patch('langchain_google_genai.ChatGoogleGenerativeAI.invoke', return_value=mock_llm_response)
@patch('langchain_community.tools.DuckDuckGoSearchRun.invoke', return_value=mock_search_results)
def test_recipe_logic(mock_search, mock_llm):
    # Setup test data based on your updated contract schema
    test_contracts = [
        {"company": "Mock A", "price": 10, "location": "Local", "due_date": "2026-05-01", "currency": "USD"},
        {"company": "Mock B", "price": 5, "location": "International", "due_date": "2026-04-01", "currency": "USD"}
    ]
    
    # 1. Test 'Cheapest' Recipe
    state_cheapest = app.invoke({
        "contracts": test_contracts,
        "desired_volume": 10,
        "target_location": "Local",
        "recipe_type": "cheapest",
        "run_id": str(uuid.uuid4()),
        "user_id": "test_user",
        "stripe_customer_id": "cus_test"
    })
    
    # Verification: Formula (price * vol) + penalty
    # Mock A: (10*10) + 0 = 100
    # Mock B: (5*10) + 500 = 550
    assert state_cheapest["optimized_results"][0]["company"] == "Mock A"
    print("✅ Cheapest recipe test passed.")

    # 2. Test 'Fastest' Recipe (prioritizes due_date)
    state_fastest = app.invoke({**state_cheapest, "recipe_type": "fastest"})
    assert state_fastest["optimized_results"][0]["company"] == "Mock B" # Earlier due_date
    print("✅ Fastest recipe test passed.")

if __name__ == "__main__":
    test_recipe_logic()