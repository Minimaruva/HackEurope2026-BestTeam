import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const contractText = `MASTER SOFTWARE LICENSING AGREEMENT

This Master Software Licensing Agreement ("Agreement") is entered into as of January 15, 2025, by and between Acme Corp ("Licensor") and Beta Industries ("Licensee").

1. DEFINITIONS
"Licensed Software" refers to the proprietary SaaS platform known as Acme Suite, including all modules, updates, and documentation.

2. GRANT OF LICENSE
Subject to the terms of this Agreement, Licensor grants Licensee a non-exclusive, non-transferable license to use the Licensed Software for internal business purposes only.

3. PAYMENT TERMS
Net 30 payment terms. All invoices shall be payable within thirty (30) calendar days of the date of invoice. Late payments shall accrue interest at a rate of 1.5% per month.

4. CONFIDENTIALITY
Both parties agree to maintain the confidentiality of all proprietary information shared during the course of this Agreement. This obligation shall survive the termination of this Agreement for a period of three (3) years.

5. LIABILITY
The Licensor's total aggregate liability under this Agreement shall not exceed the total fees paid by the Licensee in the twelve (12) months preceding the claim. Licensor shall not be liable for indirect, incidental, or consequential damages.

6. TERMINATION
Either party may terminate this Agreement with sixty (60) days written notice. Upon termination, Licensee shall cease all use of the Licensed Software and return or destroy all copies.

7. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to conflict of law principles.`;

const proposedChanges = [
  {
    change_id: "1",
    original_text: "Net 30 payment terms.",
    proposed_text: "Net 60 payment terms.",
    rationale: "Company standard policy dictates Net 60 for software vendors to optimize cash flow.",
    estimated_value_saved: "$500",
    approved: null as boolean | null,
  },
  {
    change_id: "2",
    original_text: "Licensor shall not be liable for indirect, incidental, or consequential damages.",
    proposed_text: "Licensor's liability for indirect damages shall be capped at 50% of total fees paid.",
    rationale: "Full liability exclusion exposes Licensee to unmitigated risk; a partial cap is standard practice.",
    estimated_value_saved: "$2,000",
    approved: null as boolean | null,
  },
  {
    change_id: "3",
    original_text: "Either party may terminate this Agreement with sixty (60) days written notice.",
    proposed_text: "Either party may terminate this Agreement with thirty (30) days written notice.",
    rationale: "A 30-day notice period provides adequate time while offering greater operational flexibility.",
    estimated_value_saved: "$150",
    approved: null as boolean | null,
  },
];

function highlightClauses(text: string, originals: string[]) {
  let parts: { text: string; highlighted: boolean }[] = [{ text, highlighted: false }];

  originals.forEach((clause) => {
    const newParts: typeof parts = [];
    parts.forEach((part) => {
      if (part.highlighted) {
        newParts.push(part);
        return;
      }
      const idx = part.text.indexOf(clause);
      if (idx === -1) {
        newParts.push(part);
        return;
      }
      if (idx > 0) newParts.push({ text: part.text.slice(0, idx), highlighted: false });
      newParts.push({ text: clause, highlighted: true });
      const rest = part.text.slice(idx + clause.length);
      if (rest) newParts.push({ text: rest, highlighted: false });
    });
    parts = newParts;
  });

  return parts;
}

const HITLReview = () => {
  const [changes, setChanges] = useState(proposedChanges);

  const toggleApproval = (id: string, val: boolean) => {
    setChanges((prev) =>
      prev.map((c) => (c.change_id === id ? { ...c, approved: c.approved === val ? null : val } : c)),
    );
  };

  const approvedCount = changes.filter((c) => c.approved === true).length;
  const originals = proposedChanges.map((c) => c.original_text);
  const highlighted = highlightClauses(contractText, originals);
  const missingClauses = originals.filter((o) => !contractText.includes(o));

  const executeApprovedChanges = async () => {
    const approvedItems = changes.filter((c) => c.approved === true);

    if (approvedItems.length === 0) {
      toast.error("No changes approved yet.");
      return;
    }

    toast.info(`Executing ${approvedItems.length} approved change(s)…`);

    try {
      const response = await fetch("https://pfw1xxfn-8000.uks1.devtunnels.ms/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: "demo_thread_1",
          approved_changes: approvedItems,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Workflow complete:", result.final_state);
      toast.success("Execution complete! Check your Python terminal for the final state.");
    } catch (error) {
      console.error("Resume error:", error);
      toast.error("Failed to connect to backend. Is the tunnel active and the warning page bypassed?");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Contract Review — contract_abc123</h1>
            <p className="text-xs text-muted-foreground">
              Status: Pending Human Review · {changes.length} proposed changes
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Contract */}
        <div className="lg:w-[60%] overflow-auto p-6 border-r border-border">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Original Contract
          </h2>
          {missingClauses.length > 0 && (
            <div className="mb-4 p-3 rounded-md bg-warning/10 border border-warning/30 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div className="text-xs text-foreground">{missingClauses.length} clause(s) not found in text</div>
            </div>
          )}
          <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {highlighted.map((part, i) =>
              part.highlighted ? (
                <mark key={i} className="bg-highlight-bg border-l-2 border-highlight-border pl-2 py-0.5 rounded-sm">
                  {part.text}
                </mark>
              ) : (
                <span key={i}>{part.text}</span>
              ),
            )}
          </div>
        </div>

        {/* Right: Change Cards */}
        <div className="lg:w-[40%] overflow-auto p-6 bg-muted/30">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Proposed Changes
          </h2>
          <div className="space-y-4">
            {changes.map((change) => (
              <Card key={change.change_id} className="shadow-sm">
                <CardContent className="p-4 space-y-3">
                  {/* Original */}
                  <div>
                    <span className="text-xs font-semibold text-diff-remove-text uppercase tracking-wider">
                      Original Clause
                    </span>
                    <p className="mt-1 text-sm p-2 rounded bg-diff-remove-bg text-diff-remove-text">
                      {change.original_text}
                    </p>
                  </div>

                  {/* Proposed */}
                  <div>
                    <span className="text-xs font-semibold text-diff-add-text uppercase tracking-wider">
                      Proposed Agent Clause
                    </span>
                    <p className="mt-1 text-sm p-2 rounded bg-diff-add-bg text-diff-add-text">{change.proposed_text}</p>
                  </div>

                  {/* Rationale */}
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">Rationale: </span>
                    {change.rationale}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {change.approved === true ? "Approved" : change.approved === false ? "Rejected" : "Pending"}
                      </span>
                      <Switch
                        checked={change.approved === true}
                        onCheckedChange={(val) => toggleApproval(change.change_id, val)}
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

      {/* Sticky Bottom */}
      <div className="sticky bottom-0 border-t border-border bg-card px-6 py-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {approvedCount} of {changes.length} changes approved
        </span>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => toast.success("Justification report exported.")}>
            <Download className="mr-2 h-4 w-4" />
            Export Justification Report
          </Button>
          <Button onClick={executeApprovedChanges}>Execute Approved Changes</Button>
        </div>
      </div>
    </div>
  );
};

export default HITLReview;
