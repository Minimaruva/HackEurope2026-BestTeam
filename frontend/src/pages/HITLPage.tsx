import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  CheckCircle,
  XCircle,
  CreditCard,
  Sparkles,
  Clock,
  BarChart3,
  ExternalLink,
  Loader2,
  Package,
  DollarSign,
  Shield,
  Truck,
  Scale,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Contract, AgentResult, FlavourPlan, ContractWithExtras } from "@/types/contractops";
import { getContracts, runAgent, createInvoice } from "@/api/client";

const marketSources = ["All Markets", "GlobalSteelExchange", "SteelHub", "MetalRadar", "ChemConnect"];

const flavourIcons: Record<string, React.ElementType> = {
  "Cheapest Price": DollarSign,
  "Lowest Risk": Shield,
  "Fastest Delivery": Truck,
  "Balanced": Scale,
};

const flavourAccents: Record<string, string> = {
  "Cheapest Price": "border-emerald-500/30 bg-emerald-500/[0.03]",
  "Lowest Risk": "border-blue-500/30 bg-blue-500/[0.03]",
  "Fastest Delivery": "border-amber-500/30 bg-amber-500/[0.03]",
  "Balanced": "border-violet-500/30 bg-violet-500/[0.03]",
};

const flavourIconColors: Record<string, string> = {
  "Cheapest Price": "text-emerald-600 bg-emerald-500/10",
  "Lowest Risk": "text-blue-600 bg-blue-500/10",
  "Fastest Delivery": "text-amber-600 bg-amber-500/10",
  "Balanced": "text-violet-600 bg-violet-500/10",
};

interface HITLPageProps {
  productId?: string;
}

const HITLPage = ({ productId }: HITLPageProps) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractId, setContractId] = useState("");
  const [marketSource, setMarketSource] = useState("All Markets");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [selectedFlavour, setSelectedFlavour] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const [invoicing, setInvoicing] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  useEffect(() => {
    getContracts({ productId, source: "owned" }).then((c) => {
      const filtered = productId ? c.filter((x) => x.product_id === productId) : c;
      const open = filtered.filter((x) => x.status !== "closed");
      setContracts(open);
      if (open.length) setContractId(open[0].id);
    });
  }, [productId]);

  const selectedContract = contracts.find((c) => c.id === contractId);

  const handleRun = async () => {
    if (!contractId || !selectedContract) {
      toast({ title: "Select a contract", variant: "destructive" });
      return;
    }
    setRunning(true);
    setResult(null);
    setSelectedFlavour(null);
    setApproved(false);
    setInvoiceUrl(null);
    try {
      const res = await runAgent({
        contract_id: contractId,
        product_id: selectedContract.product_id,
        recipe_ids: [],
        market_source: marketSource === "All Markets" ? undefined : marketSource,
      });
      setResult(res);
      toast({ title: "Agent run completed" });
    } catch {
      toast({ title: "Agent run failed", variant: "destructive" });
    }
    setRunning(false);
  };

  const handleSelectFlavour = (flavourId: string) => {
    setSelectedFlavour(flavourId);
    const plan = result?.flavour_plans.find((f) => f.flavour_id === flavourId);
    toast({ title: `Selected "${plan?.flavour_name}" plan` });
  };

  const handleApprove = () => {
    setApproved(true);
    toast({ title: "Fulfillment plan approved" });
  };

  const handleReject = () => {
    setSelectedFlavour(null);
    setApproved(false);
    toast({ title: "Selection cleared" });
  };

  const handleInvoice = async () => {
    if (!selectedContract) return;
    setInvoicing(true);
    try {
      const inv = await createInvoice(selectedContract.id);
      setInvoiceUrl(inv.hosted_invoice_url || null);
      toast({ title: "Stripe invoice created" });
    } catch {
      toast({ title: "Invoice creation failed", variant: "destructive" });
    }
    setInvoicing(false);
  };

  const chosenPlan = result?.flavour_plans.find((f) => f.flavour_id === selectedFlavour);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Run the agent to generate fulfillment plans per flavour, then pick the one that fits.
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 min-w-[220px]">
              <label className="text-xs font-medium text-muted-foreground">Contract</label>
              <Select value={contractId} onValueChange={setContractId}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {contracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.product_name} · {c.direction === "IN" ? "Buy" : "Sell"} · {c.quantity.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">Market</label>
              <Select value={marketSource} onValueChange={setMarketSource}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {marketSources.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleRun} disabled={running} size="sm" className="h-9">
              {running ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              Run Agent
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Offers Scanned", value: result.metrics.offers_scanned, icon: BarChart3 },
            { label: "Avg Score", value: result.metrics.avg_score, icon: Sparkles },
            { label: "Top Score", value: result.metrics.top_score, icon: Sparkles },
            { label: "Time", value: `${(result.metrics.time_ms / 1000).toFixed(1)}s`, icon: Clock },
          ].map((m) => (
            <Card key={m.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <m.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-lg font-bold text-foreground">{m.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Side-by-side flavour columns */}
      {result && !selectedFlavour && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-4">Choose a Flavour</p>
          <div className={`grid gap-4 ${result.flavour_plans.length <= 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            {result.flavour_plans.map((plan) => (
              <FlavourColumn
                key={plan.flavour_id}
                plan={plan}
                totalQty={result.total_qty_needed}
                onSelect={() => handleSelectFlavour(plan.flavour_id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Selected plan detail */}
      {chosenPlan && !approved && (
        <div className="space-y-4">
          <SelectedPlanDetail plan={chosenPlan} totalQty={result!.total_qty_needed} />
          <div className="flex gap-3">
            <Button onClick={handleApprove} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-1" /> Approve Plan
            </Button>
            <Button variant="outline" onClick={handleReject} className="flex-1">
              <XCircle className="h-4 w-4 mr-1" /> Pick Different Flavour
            </Button>
          </div>
        </div>
      )}

      {/* Approved state */}
      {approved && chosenPlan && (
        <div className="space-y-4">
          <SelectedPlanDetail plan={chosenPlan} totalQty={result!.total_qty_needed} />
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardContent className="p-4 flex items-center gap-3 flex-wrap">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                <CheckCircle className="h-3 w-3 mr-1" /> Plan Approved — {chosenPlan.flavour_name}
              </Badge>
              {selectedContract?.direction === "OUT" && !invoiceUrl && (
                <Button onClick={handleInvoice} disabled={invoicing} size="sm">
                  <CreditCard className="h-4 w-4 mr-1" />
                  {invoicing ? "Creating…" : "Create Stripe Invoice"}
                </Button>
              )}
              {invoiceUrl && (
                <a href={invoiceUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  View Invoice <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty / loading states */}
      {!result && !running && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Play className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Select a contract and click <strong>Run Agent</strong> to generate flavour plans.
          </p>
        </div>
      )}

      {running && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Agent is scanning market offers…</p>
        </div>
      )}
    </div>
  );
};

/* ---- Flavour Column Card ---- */
function FlavourColumn({ plan, totalQty, onSelect }: { plan: FlavourPlan; totalQty: number; onSelect: () => void }) {
  const Icon = flavourIcons[plan.flavour_name] || Scale;
  const accent = flavourAccents[plan.flavour_name] || "border-primary/20";
  const iconColor = flavourIconColors[plan.flavour_name] || "text-primary bg-primary/10";
  const [textColor, bgColor] = iconColor.split(" ");
  const totalAllocated = plan.selected_contracts.reduce((s, c) => s + (c.allocated_qty || c.quantity), 0);

  return (
    <Card className={`${accent} transition-all hover:shadow-md cursor-pointer group`} onClick={onSelect}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`h-9 w-9 rounded-lg ${bgColor} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${textColor}`} />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{plan.flavour_name}</p>
            <p className="text-[11px] text-muted-foreground">{plan.selected_contracts.length} contracts</p>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-2 rounded-md bg-muted/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Cost</p>
            <p className="text-sm font-bold text-foreground">${(plan.total_cost / 1000).toFixed(0)}k</p>
          </div>
          <div className="p-2 rounded-md bg-muted/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Avg Delivery</p>
            <p className="text-sm font-bold text-foreground">{plan.avg_delivery_days}d</p>
          </div>
        </div>

        {/* Contract summary */}
        <div className="space-y-2 mb-4">
          {plan.selected_contracts.map((c, i) => (
            <div key={c.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate mr-2">{c.company_name}</span>
              <span className="font-mono text-foreground shrink-0">
                ${c.unit_price} × {(c.allocated_qty || c.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Qty bar */}
        <div className="mb-3">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (totalAllocated / totalQty) * 100)}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {totalAllocated.toLocaleString()} / {totalQty.toLocaleString()} units
          </p>
        </div>

        <Button variant="outline" size="sm" className="w-full text-xs h-8 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          Select this plan
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---- Selected Plan Detail ---- */
function SelectedPlanDetail({ plan, totalQty }: { plan: FlavourPlan; totalQty: number }) {
  const Icon = flavourIcons[plan.flavour_name] || Scale;
  const iconColor = flavourIconColors[plan.flavour_name] || "text-primary bg-primary/10";
  const [textColor, bgColor] = iconColor.split(" ");
  const totalAllocated = plan.selected_contracts.reduce((s, c) => s + (c.allocated_qty || c.quantity), 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div className={`h-7 w-7 rounded-md ${bgColor} flex items-center justify-center`}>
                <Icon className={`h-3.5 w-3.5 ${textColor}`} />
              </div>
              {plan.flavour_name} — {plan.selected_contracts.length} contracts
            </p>
            <p className="text-sm text-muted-foreground">
              {totalAllocated.toLocaleString()} / {totalQty.toLocaleString()} units
            </p>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (totalAllocated / totalQty) * 100)}%` }} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {plan.selected_contracts.map((c, idx) => (
          <ContractCard key={c.id} contract={c} index={idx} total={totalQty} />
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Agent Reasoning
          </p>
          {plan.explanation.map((e, i) => (
            <p key={i} className="text-xs text-muted-foreground">{i + 1}. {e}</p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---- Contract Card ---- */
function ContractCard({ contract: c, index, total }: { contract: ContractWithExtras; index: number; total: number }) {
  const allocated = c.allocated_qty || c.quantity;
  const pct = ((allocated / total) * 100).toFixed(0);

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px]">#{index + 1}</Badge>
              <p className="font-semibold text-foreground text-sm">{c.company_name}</p>
            </div>
            <p className="text-xs text-muted-foreground">{c.market_source}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">{c.score}<span className="text-xs font-normal text-muted-foreground">/100</span></p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {[
            { label: "Allocated Qty", value: `${allocated.toLocaleString()} (${pct}%)` },
            { label: "Unit Price", value: `$${c.unit_price.toFixed(2)}` },
            { label: "Delivery", value: c.delivery_due_date || "—" },
            { label: "Shipping", value: c.delivery_price ? `$${c.delivery_price.toFixed(2)}` : "—" },
          ].map((f) => (
            <div key={f.label} className="p-2 rounded-md bg-muted/50">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{f.label}</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>
        <ul className="space-y-1">
          {c.rationale_bullets.map((b, i) => (
            <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
              <span className="text-primary">•</span> {b}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default HITLPage;
