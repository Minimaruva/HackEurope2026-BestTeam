from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

# Import your agent runner
from backend.recipe_engine.recipies.ERP_recipy import run_erp_agent

app = FastAPI()

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AgentRequest(BaseModel):
    product_id: str
    user_id: str
    toggles: dict
    flavours: list[str]

@app.post("/api/run_agent")
async def run_agent(req: AgentRequest):
    try:
        result = run_erp_agent(
            product_id=req.product_id,
            user_id=req.user_id,
            toggles=req.toggles,
            selected_flavours=req.flavours
        )
        return result
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)