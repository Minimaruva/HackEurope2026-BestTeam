import type {
  Product,
  Recipe,
  Contract,
  AgentResult,
  CostSummary,
  InvoiceResult,
} from "@/types/contractops";

export const mockProducts: Product[] = [
  { id: "prod-1", name: "Cold-Rolled Steel Coil", type: "raw", stripe_id: "prod_steel" },
  { id: "prod-2", name: "Polymer Resin Pellets", type: "raw", stripe_id: "prod_resin" },
  { id: "prod-3", name: "Industrial Copper Wire", type: "raw", stripe_id: "prod_copper" },
  { id: "prod-4", name: "SaaS Platform License", type: "finished", stripe_id: "prod_saas" },
];

export const mockRecipes: Recipe[] = [
  {
    id: "recipe-1",
    name: "EU Country Priority",
    description: "Prioritise orders from suppliers based in EU member states.",
    prompt: "IF supplier.country IN eu_members THEN score += 15",
    isActive: true,
    estimatedCostPerRunUSD: 0.08,
  },
  {
    id: "recipe-2",
    name: "Volume Discount Formula",
    description: "Apply tiered volume discount when quantity exceeds thresholds.",
    prompt: "IF qty > 5000 THEN effective_price = unit_price * 0.95; IF qty > 10000 THEN effective_price = unit_price * 0.90",
    isActive: true,
    estimatedCostPerRunUSD: 0.06,
  },
  {
    id: "recipe-3",
    name: "Credibility Floor",
    description: "Exclude suppliers with credibility below a minimum threshold.",
    prompt: "IF supplier.credibility < 70 THEN EXCLUDE",
    isActive: false,
    estimatedCostPerRunUSD: 0.04,
  },
  {
    id: "recipe-4",
    name: "Payment Terms Weighting",
    description: "Boost score for offers with favorable payment terms (Net 30+).",
    prompt: "IF payment_terms >= 30 THEN score += 10; IF payment_terms >= 60 THEN score += 20",
    isActive: true,
    estimatedCostPerRunUSD: 0.05,
  },
];

// Keep backward compat alias
export const mockAgents = mockRecipes;

export const mockContracts: Contract[] = [
  {
    id: "ctr-1",
    product_id: "prod-1",
    product_name: "Cold-Rolled Steel Coil",
    direction: "IN",
    quantity: 10000,
    currency: "USD",
    status: "open",
    created_at: "2026-02-18T10:30:00Z",
  },
  {
    id: "ctr-2",
    product_id: "prod-2",
    product_name: "Polymer Resin Pellets",
    direction: "IN",
    quantity: 5000,
    currency: "USD",
    status: "in_progress",
    created_at: "2026-02-17T14:00:00Z",
  },
  {
    id: "ctr-3",
    product_id: "prod-3",
    product_name: "Industrial Copper Wire",
    direction: "OUT",
    quantity: 2000,
    currency: "USD",
    status: "open",
    created_at: "2026-02-19T09:15:00Z",
  },
  {
    id: "ctr-4",
    product_id: "prod-1",
    product_name: "Cold-Rolled Steel Coil",
    direction: "OUT",
    quantity: 3000,
    currency: "USD",
    status: "closed",
    created_at: "2026-02-10T08:00:00Z",
  },
];

export const mockAgentResult: AgentResult = {
  run_id: "run-001",
  agent_id: "agent-1",
  product_id: "prod-1",
  direction: "IN",
  total_qty_needed: 10000,
  flavour_plans: [
    {
      flavour_id: "recipe-1",
      flavour_name: "Cheapest Price",
      total_cost: 4305000,
      avg_delivery_days: 28,
      selected_contracts: [
        {
          id: "contract-101", direction: "IN", product_id: "prod-1", company_id: "comp-3",
          market_source: "GlobalSteelExchange", unit_price: 420.0, quantity: 5000, currency: "USD",
          payment_due_date: "2026-04-15", delivery_due_date: "2026-03-22", delivery_price: 1200.0,
          company_name: "Shanghai MetalWorks Ltd.", product_name: "Cold-Rolled Steel Coil",
          score: 94, allocated_qty: 6000,
          rationale_bullets: ["Lowest unit price ($420/ton vs avg $487)", "Supplier credibility: 88/100", "Net 30 payment terms"],
        },
        {
          id: "contract-104", direction: "IN", product_id: "prod-1", company_id: "comp-9",
          market_source: "GlobalSteelExchange", unit_price: 428.0, quantity: 5000, currency: "USD",
          payment_due_date: "2026-05-01", delivery_due_date: "2026-03-28", delivery_price: 1100.0,
          company_name: "Nucor Corp.", product_name: "Cold-Rolled Steel Coil",
          score: 88, allocated_qty: 4000,
          rationale_bullets: ["Second cheapest at $428/ton", "US-based — no import tariff risk"],
        },
      ],
      explanation: ["Optimized purely for lowest total cost", "Combined 2 contracts at weighted avg $423/ton"],
    },
    {
      flavour_id: "recipe-2",
      flavour_name: "Lowest Risk",
      total_cost: 4450000,
      avg_delivery_days: 22,
      selected_contracts: [
        {
          id: "contract-103", direction: "IN", product_id: "prod-1", company_id: "comp-7",
          market_source: "MetalRadar", unit_price: 445.0, quantity: 5000, currency: "USD",
          delivery_due_date: "2026-03-15", delivery_price: 950.0,
          company_name: "Tata Steel Intl.", product_name: "Cold-Rolled Steel Coil",
          score: 96, allocated_qty: 5000,
          rationale_bullets: ["Highest supplier credibility (95/100)", "12 prior successful deliveries", "Full insurance coverage"],
        },
        {
          id: "contract-102", direction: "IN", product_id: "prod-1", company_id: "comp-5",
          market_source: "SteelHub", unit_price: 435.0, quantity: 5000, currency: "USD",
          payment_due_date: "2026-04-10", delivery_due_date: "2026-03-18", delivery_price: 800.0,
          company_name: "ArcelorMittal Europe", product_name: "Cold-Rolled Steel Coil",
          score: 93, allocated_qty: 5000,
          rationale_bullets: ["Credibility: 92/100 — top-tier European supplier", "Lower shipping cost ($800)"],
        },
      ],
      explanation: ["Prioritized supplier credibility and delivery reliability", "Both suppliers scored 90+ on risk assessment"],
    },
    {
      flavour_id: "recipe-3",
      flavour_name: "Fastest Delivery",
      total_cost: 4520000,
      avg_delivery_days: 16,
      selected_contracts: [
        {
          id: "contract-103", direction: "IN", product_id: "prod-1", company_id: "comp-7",
          market_source: "MetalRadar", unit_price: 445.0, quantity: 5000, currency: "USD",
          delivery_due_date: "2026-03-05", delivery_price: 950.0,
          company_name: "Tata Steel Intl.", product_name: "Cold-Rolled Steel Coil",
          score: 91, allocated_qty: 5000,
          rationale_bullets: ["Earliest delivery: Mar 5", "Express shipping available"],
        },
        {
          id: "contract-105", direction: "IN", product_id: "prod-1", company_id: "comp-11",
          market_source: "SteelHub", unit_price: 460.0, quantity: 5000, currency: "USD",
          delivery_due_date: "2026-03-08", delivery_price: 600.0,
          company_name: "POSCO Trading", product_name: "Cold-Rolled Steel Coil",
          score: 85, allocated_qty: 5000,
          rationale_bullets: ["Delivery by Mar 8 — 2nd fastest", "Lowest shipping at $600"],
        },
      ],
      explanation: ["Optimized for earliest delivery dates", "All units deliverable within 16 days avg"],
    },
  ],
  // Legacy compat
  selected_contracts: [],
  alternatives: [],
  metrics: {
    offers_scanned: 23,
    avg_score: 71,
    top_score: 96,
    time_ms: 3420,
  },
  explanation: ["Scanned 23 offers from 3 market sources"],
};

export const mockCostSummary: CostSummary = {
  total_cost_usd: 14.82,
  by_agent: [
    { agent_id: "recipe-1", agent_name: "EU Country Priority", runs: 47, tokens: 89200, cost_usd: 5.35, avg_cost_usd: 0.11 },
    { agent_id: "recipe-2", agent_name: "Volume Discount Formula", runs: 31, tokens: 72100, cost_usd: 4.33, avg_cost_usd: 0.14 },
    { agent_id: "recipe-3", agent_name: "Credibility Floor", runs: 28, tokens: 51800, cost_usd: 3.11, avg_cost_usd: 0.11 },
    { agent_id: "recipe-4", agent_name: "Payment Terms Weighting", runs: 12, tokens: 33600, cost_usd: 2.03, avg_cost_usd: 0.17 },
  ],
  savings_estimate: {
    manual_cost_usd: 2840.0,
    ai_cost_usd: 14.82,
    saved_usd: 2825.18,
  },
};

export const mockInvoiceResult: InvoiceResult = {
  stripe_invoice_id: "inv_mock_abc123",
  status: "draft",
  hosted_invoice_url: "https://invoice.stripe.com/i/acct_mock/test_inv",
};
