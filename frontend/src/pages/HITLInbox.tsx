import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, FileText, CreditCard, Download, ChevronLeft, ChevronRight, Lightbulb, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface AgentFinding {
  finding_id: string;
  label: string;
  value: string;
  confidence: number;
  source: string;
}

interface PendingTask {
  id: string;
  title: string;
  module: string;
  icon: "contract" | "payment";
  context: string;
  changes: {
    change_id: string;
    original_label: string;
    original_text: string;
    proposed_label: string;
    proposed_text: string;
    rationale: string;
    estimated_value_saved: string;
    approved: boolean | null;
    why: string;
    data_signals: string[];
    agent_findings: AgentFinding[];
  }[];
}

const pendingTasks: PendingTask[] = [
  {
    id: "task-1",
    title: "Review Contract Changes",
    module: "Contract Compliance",
    icon: "contract",
    context: `MASTER SOFTWARE LICENSING AGREEMENT\n\nThis Agreement is entered into as of January 15, 2025, by and between Acme Corp ("Licensor") and Beta Industries ("Licensee").\n\n3. PAYMENT TERMS\nNet 30 payment terms. All invoices shall be payable within thirty (30) calendar days.\n\n5. LIABILITY\nLicensor shall not be liable for indirect, incidental, or consequential damages.\n\n6. TERMINATION\nEither party may terminate with sixty (60) days written notice.`,
    changes: [
      {
        change_id: "c1",
        original_label: "Original Clause",
        original_text: "Net 30 payment terms.",
        proposed_label: "Proposed Clause",
        proposed_text: "Net 60 payment terms.",
        rationale: "Company standard policy dictates Net 60 for software vendors.",
        estimated_value_saved: "$500",
        approved: null,
        why: "The agent analyzed 47 historical vendor contracts and found that 89% use Net 60 terms. Net 30 is an outlier that reduces cash flow flexibility by ~$12K/quarter based on average invoice volume.",
        data_signals: ["47 contracts analyzed", "89% use Net 60", "$12K/quarter impact"],
        agent_findings: [
          { finding_id: "f1", label: "Net 60 (Recommended)", value: "Matches 89% of vendor contracts. Optimal cash flow.", confidence: 0.92, source: "Vendor Contract DB" },
          { finding_id: "f2", label: "Net 45 (Alternative)", value: "Used by 8% of vendors. Moderate improvement.", confidence: 0.71, source: "Vendor Contract DB" },
          { finding_id: "f3", label: "2/10 Net 60", value: "2% discount if paid in 10 days, else Net 60. Best if cash reserves allow.", confidence: 0.65, source: "Finance Policy Engine" },
        ],
      },
      {
        change_id: "c2",
        original_label: "Original Clause",
        original_text: "Licensor shall not be liable for indirect, incidental, or consequential damages.",
        proposed_label: "Proposed Clause",
        proposed_text: "Licensor's liability for indirect damages shall be capped at 50% of total fees paid.",
        rationale: "Full exclusion is too risky; a partial cap is industry standard.",
        estimated_value_saved: "$2,000",
        approved: null,
        why: "Agent cross-referenced 3 prior incidents where unlimited liability exclusions led to unrecoverable losses totaling $84K. Industry benchmarks from Gartner suggest a 50% cap as the median position.",
        data_signals: ["3 prior incidents", "$84K total losses", "Gartner benchmark"],
        agent_findings: [
          { finding_id: "f4", label: "50% Cap (Recommended)", value: "Median industry position per Gartner. Balanced risk.", confidence: 0.88, source: "Gartner Benchmark Report" },
          { finding_id: "f5", label: "100% Cap", value: "Full liability match. Stronger protection but harder to negotiate.", confidence: 0.55, source: "Legal Precedent DB" },
        ],
      },
    ],
  },
  {
    id: "task-2",
    title: "Review Stripe Refund",
    module: "Churn Prevention",
    icon: "payment",
    context: `{\n  "customer_id": "cus_P3xK9m2L",\n  "email": "jane@betaindustries.com",\n  "subscription": "pro_monthly",\n  "mrr": "$149.00",\n  "months_active": 14,\n  "churn_risk_score": 0.87,\n  "last_support_ticket": "2025-01-10"\n}`,
    changes: [
      {
        change_id: "p1",
        original_label: "Current State",
        original_text: "Active subscription at $149/mo. No discount applied.",
        proposed_label: "Proposed Action",
        proposed_text: "Apply 30% retention discount for 3 months ($104.30/mo).",
        rationale: "High churn risk (0.87). Customer has 14 months tenure. Retention discount is cheaper than acquisition cost.",
        estimated_value_saved: "$1,490",
        approved: null,
        why: "Agent detected churn risk score of 0.87 (top 5% of at-risk users). Customer LTV is $2,086. Acquisition cost for replacement is ~$340. A 30% discount for 3 months costs $134 but preserves $1,490 in projected revenue.",
        data_signals: ["0.87 churn score", "$2,086 LTV", "$340 CAC", "14mo tenure"],
        agent_findings: [
          { finding_id: "f6", label: "30% for 3mo (Recommended)", value: "Cost: $134. Expected retention probability: 74%.", confidence: 0.87, source: "Churn Prediction Model v3" },
          { finding_id: "f7", label: "20% for 6mo", value: "Cost: $179. Expected retention probability: 68%.", confidence: 0.72, source: "Churn Prediction Model v3" },
          { finding_id: "f8", label: "Free month + call", value: "Cost: $149 + CSM time. Expected retention probability: 81%.", confidence: 0.64, source: "CS Playbook Engine" },
        ],
      },
    ],
  },
  {
    id: "task-3",
    title: "Approve Supply Chain Order",
    module: "Supply Chain",
    icon: "payment",
    context: `{\n  "order_id": "PO-2025-4421",\n  "supplier": "Global Materials Inc.",\n  "items": [\n    {"sku": "RAW-STEEL-A1", "qty": 500, "unit_price": "$12.50"},\n    {"sku": "COPPER-WIRE-B3", "qty": 200, "unit_price": "$8.75"}\n  ],\n  "total": "$8,000.00",\n  "delivery_eta": "2025-02-28"\n}`,
    changes: [
      {
        change_id: "sc1",
        original_label: "Original Quote",
        original_text: "Unit price $12.50 for RAW-STEEL-A1 (500 units).",
        proposed_label: "Negotiated Price",
        proposed_text: "Unit price $11.00 for RAW-STEEL-A1 (500 units) — bulk discount applied.",
        rationale: "Agent negotiated 12% bulk discount based on order history.",
        estimated_value_saved: "$750",
        approved: null,
        why: "Agent compared quotes from 5 suppliers and found Global Materials' price was 8% above market average. Leveraged 18-month order history (12 orders, $96K total) to negotiate a 12% bulk discount.",
        data_signals: ["5 suppliers compared", "8% above market", "18mo history", "$96K spend"],
        agent_findings: [
          { finding_id: "f9", label: "$11.00/unit (Recommended)", value: "12% discount from Global Materials. Same delivery timeline.", confidence: 0.91, source: "Procurement Agent" },
          { finding_id: "f10", label: "$10.75/unit (Alt supplier)", value: "SteelCo Inc. 14% cheaper but 2-week longer lead time.", confidence: 0.67, source: "Supplier Comparison DB" },
        ],
      },
    ],
  },
];

const FindingsCarousel = ({ findings }: { findings: AgentFinding[] }) => {
  const [idx, setIdx] = useState(0);
  if (findings.length === 0) return null;
  const current = findings[idx];

  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Agent Findings ({idx + 1}/{findings.length})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={idx === 0}
            onClick={() => setIdx((i) => i - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={idx === findings.length - 1}
            onClick={() => setIdx((i) => i + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">{current.label}</span>
          <Badge variant="secondary" className="text-[10px]">
            {Math.round(current.confidence * 100)}% confidence
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{current.value}</p>
        <p className="text-[10px] text-muted-foreground/70">Source: {current.source}</p>
      </div>
      {/* Dot indicators */}
      {findings.length > 1 && (
        <div className="flex items-center justify-center gap-1 mt-2">
          {findings.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-4 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const HITLInbox = () => {
  const [tasks, setTasks] = useState(pendingTasks);
  const [selectedId, setSelectedId] = useState(tasks[0]?.id || "");

  const selectedTask = tasks.find((t) => t.id === selectedId);

  const toggleApproval = (taskId: string, changeId: string, val: boolean) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              changes: t.changes.map((c) =>
                c.change_id === changeId ? { ...c, approved: c.approved === val ? null : val } : c,
              ),
            }
          : t,
      ),
    );
  };

  const approvedCount = selectedTask
    ? selectedTask.changes.filter((c) => c.approved === true).length
    : 0;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Global HITL Inbox</h1>
            <p className="text-xs text-muted-foreground">
              {tasks.length} pending approvals across all modules
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Task List */}
        <div className="lg:w-[280px] border-r border-border overflow-auto bg-muted/20">
          <div className="p-3 space-y-1">
            {tasks.map((task) => {
              const isSelected = task.id === selectedId;
              const pendingCount = task.changes.filter((c) => c.approved === null).length;
              return (
                <button
                  key={task.id}
                  onClick={() => setSelectedId(task.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-accent border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {task.icon === "contract" ? (
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <CreditCard className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <span className="text-sm font-medium text-foreground truncate">
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 ml-6">
                    <span className="text-[10px] text-muted-foreground">{task.module}</span>
                    {pendingCount > 0 && (
                      <Badge className="bg-danger text-danger-foreground text-[10px] h-4 px-1.5">
                        {pendingCount}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Detail */}
        {selectedTask ? (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Context */}
            <div className="lg:w-1/2 overflow-auto p-6 border-r border-border">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Context
              </h2>
              <pre className="text-sm leading-relaxed text-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-lg border border-border font-sans">
                {selectedTask.context}
              </pre>
            </div>

            {/* Changes */}
            <div className="lg:w-1/2 overflow-auto p-6 bg-muted/10">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Proposed Changes
              </h2>
              <div className="space-y-4">
                {selectedTask.changes.map((change) => (
                  <Card key={change.change_id} className="shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-diff-remove-text uppercase tracking-wider">
                          {change.original_label}
                        </span>
                        <p className="mt-1 text-sm p-2 rounded bg-diff-remove-bg text-diff-remove-text">
                          {change.original_text}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-diff-add-text uppercase tracking-wider">
                          {change.proposed_label}
                        </span>
                        <p className="mt-1 text-sm p-2 rounded bg-diff-add-bg text-diff-add-text">
                          {change.proposed_text}
                        </p>
                      </div>

                      {/* Why Section */}
                      <div className="rounded-lg border border-highlight-border bg-highlight-bg/30 p-3">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                              Why this change?
                            </span>
                            <p className="mt-1 text-sm text-foreground/80 leading-relaxed">
                              {change.why}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {change.data_signals.map((signal, i) => (
                                <Badge key={i} variant="outline" className="text-[10px] font-medium">
                                  {signal}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Swipeable Findings */}
                      {change.agent_findings.length > 1 && (
                        <FindingsCarousel findings={change.agent_findings} />
                      )}

                      <p className="text-sm text-foreground">
                        <span className="font-semibold">Rationale: </span>
                        {change.rationale}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {change.approved === true
                              ? "Approved"
                              : change.approved === false
                              ? "Rejected"
                              : "Pending"}
                          </span>
                          <Switch
                            checked={change.approved === true}
                            onCheckedChange={(val) =>
                              toggleApproval(selectedTask.id, change.change_id, val)
                            }
                          />
                        </div>
                        <Badge variant="secondary" className="text-xs font-semibold">
                          Saved: {change.estimated_value_saved}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a task to review
          </div>
        )}
      </div>

      {/* Sticky Bottom */}
      {selectedTask && (
        <div className="sticky bottom-0 border-t border-border bg-card px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {approvedCount} of {selectedTask.changes.length} approved
          </span>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => toast.success("Report exported.")}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button
              variant="destructive"
              onClick={() => toast.info("Action rejected.")}
            >
              Reject
            </Button>
            <Button
              onClick={() => {
                if (approvedCount === 0) {
                  toast.error("Approve at least one change first.");
                  return;
                }
                toast.success(`Executing ${approvedCount} approved action(s).`);
              }}
            >
              Execute Approved Action
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HITLInbox;
