import type {
  Product,
  Recipe,
  Contract,
  AgentResult,
  CostSummary,
  InvoiceResult,
} from "@/types/contractops";
import { mockProducts, mockRecipes, mockContracts, mockAgentResult, mockCostSummary, mockInvoiceResult } from "./mock-data";
import { hasSupabaseConfig, supabaseRestGet } from "@/lib/supabase";

const USE_MOCK = false;
const API_BASE = "http://127.0.0.1:8000";

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  console.log("Response:", res);
  return res.json();
}

function delay(ms = 600) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Products ---
export async function getProducts(): Promise<Product[]> {
  if (hasSupabaseConfig) {
    const data = await supabaseRestGet<Array<Record<string, unknown>>>(
      "product?select=id,name,type,stripe_id&order=name.asc"
    );

    return data.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      type: normalizeProductType(row.type),
      stripe_id: (row.stripe_id ?? undefined) as string | undefined,
    }));
  }

  if (USE_MOCK) { await delay(); return mockProducts; }
  return fetcher("/api/products");
}

function normalizeProductType(value: unknown): Product["type"] {
  if (typeof value !== "string") return "raw";
  const normalized = value.trim().toLowerCase();
  if (normalized === "finished" || normalized === "our") return "finished";
  if (normalized === "raw" || normalized === "material" || normalized === "raw_material") return "raw";
  return "raw";
}

// --- Contracts ---
let _contracts = [...mockContracts];

export async function getContracts(params?: {
  productId?: string;
  direction?: "IN" | "OUT";
  source?: "owned" | "market";
}): Promise<Contract[]> {
  if (USE_MOCK) { await delay(); return _contracts; }
  const qp = new URLSearchParams();
  qp.set("source", params?.source ?? "owned");
  if (params?.productId) qp.set("product_id", params.productId);
  if (params?.direction) qp.set("direction", params.direction);
  return fetcher(`/api/contracts?${qp.toString()}`);
}

// --- Recipes (strategies) ---
let _recipes = [...mockRecipes];

export async function getRecipes(): Promise<Recipe[]> {
  if (USE_MOCK) { await delay(); return _recipes; }
  return fetcher("/api/recipes");
}

export async function updateRecipe(id: string, data: Partial<Recipe>): Promise<Recipe> {
  if (USE_MOCK) {
    await delay();
    _recipes = _recipes.map((r) => (r.id === id ? { ...r, ...data } : r));
    return _recipes.find((r) => r.id === id)!;
  }
  return fetcher(`/api/recipes/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

// Backward compat aliases
export const getAgents = getRecipes;
export const createAgent = async (agent: Omit<Recipe, "id">): Promise<Recipe> => {
  if (USE_MOCK) {
    await delay();
    const newR: Recipe = { ...agent, id: `recipe-${Date.now()}` };
    _recipes = [..._recipes, newR];
    return newR;
  }
  return fetcher("/api/recipes", { method: "POST", body: JSON.stringify(agent) });
};
export const updateAgent = updateRecipe;

// --- Run ---
export async function runAgent(body: {
  contract_id: string;
  product_id: string;
  recipe_ids: string[];
  market_source?: string;
}): Promise<AgentResult> {
  if (USE_MOCK) {
    await delay(1200);
    return mockAgentResult;
  }
  return fetcher("/api/run", { method: "POST", body: JSON.stringify(body) });
}

// --- Invoice ---
export async function createInvoice(contractId: string): Promise<InvoiceResult> {
  if (USE_MOCK) { await delay(800); return mockInvoiceResult; }
  return fetcher("/api/invoice/from-contract", {
    method: "POST",
    body: JSON.stringify({ contract_id: contractId }),
  });
}

// --- Costs ---
export async function getCosts(): Promise<CostSummary> {
  if (USE_MOCK) { await delay(); return mockCostSummary; }
  return fetcher("/api/costs");
}
