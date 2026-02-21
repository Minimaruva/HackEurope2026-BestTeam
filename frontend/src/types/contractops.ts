// ContractOps Data Model

export interface Company {
  id: string;
  name: string;
  stripe_id?: string;
  credibility?: number;
}

export interface Product {
  id: string;
  name: string;
  type: "raw" | "finished";
  stripe_id?: string;
}

// Recipes are strategies/tools the single agent uses for scoring
export interface Recipe {
  id: string;
  name: string;
  description: string;
  prompt: string;
  isActive: boolean;
  estimatedCostPerRunUSD?: number;
}

// Keep Agent alias for backward compat
export type Agent = Recipe;

// A contract that needs closing (uploaded by backend)
export interface Contract {
  id: string;
  product_id: string;
  product_name: string;
  direction: "IN" | "OUT";
  quantity: number;
  currency: string;
  status: "open" | "in_progress" | "closed";
  created_at: string;
}

export interface ContractOffer {
  id: string;
  direction: "IN" | "OUT";
  product_id: string;
  company_id: string;
  market_source: string;
  unit_price: number;
  quantity: number;
  currency: string;
  payment_due_date?: string;
  delivery_due_date?: string;
  delivery_price?: number;
}

export interface ContractWithExtras extends ContractOffer {
  company_name: string;
  product_name: string;
  score: number;
  rationale_bullets: string[];
  allocated_qty?: number; // how much of the order this fill covers
}

export interface AgentResultMetrics {
  offers_scanned: number;
  avg_score: number;
  top_score: number;
  time_ms: number;
}

export interface FlavourPlan {
  flavour_id: string;
  flavour_name: string;
  selected_contracts: ContractWithExtras[];
  explanation: string[];
  total_cost: number;
  avg_delivery_days: number;
}

export interface AgentResult {
  run_id: string;
  agent_id: string;
  product_id: string;
  direction: "IN" | "OUT";
  total_qty_needed: number;
  flavour_plans: FlavourPlan[];
  metrics: AgentResultMetrics;
  // Legacy fields kept for compat
  selected_contracts: ContractWithExtras[];
  alternatives: ContractWithExtras[];
  explanation: string[];
}

export interface CostByAgent {
  agent_id: string;
  agent_name: string;
  runs: number;
  tokens: number;
  cost_usd: number;
  avg_cost_usd: number;
}

export interface CostSummary {
  total_cost_usd: number;
  by_agent: CostByAgent[];
  savings_estimate?: {
    manual_cost_usd: number;
    ai_cost_usd: number;
    saved_usd: number;
  };
}

export interface InvoiceResult {
  stripe_invoice_id: string;
  status: string;
  hosted_invoice_url?: string;
}
