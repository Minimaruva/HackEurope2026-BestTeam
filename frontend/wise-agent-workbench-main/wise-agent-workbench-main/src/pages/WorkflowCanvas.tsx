import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Database, FlaskConical, Send, X } from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  dataSource: string;
  recipe: string;
  finalAction: string;
  costPerRun: string;
}

const sampleWorkflows: Workflow[] = [
  {
    id: "wf-1",
    name: "Contract Compliance",
    dataSource: "Contract PDF Store",
    recipe: "Compliance Review",
    finalAction: "Email Higher-ups",
    costPerRun: "$0.15",
  },
  {
    id: "wf-2",
    name: "Churn Prevention",
    dataSource: "Stripe API",
    recipe: "Subscription Churn",
    finalAction: "Send Slack Report",
    costPerRun: "$0.32",
  },
];

const WorkflowCanvas = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>(sampleWorkflows);

  const addWorkflow = () => {
    const id = `wf-${Date.now()}`;
    setWorkflows((prev) => [
      ...prev,
      {
        id,
        name: `New Workflow ${prev.length + 1}`,
        dataSource: "Unconfigured",
        recipe: "Unconfigured",
        finalAction: "Unconfigured",
        costPerRun: "$0.00",
      },
    ]);
  };

  const removeWorkflow = (id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Workflow Canvas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Orchestrate your AI agent pipelines. Each row is a complete workflow.
        </p>
      </div>

      <div className="space-y-4">
        {workflows.map((wf) => (
          <div key={wf.id} className="relative group">
            {/* Cost badge */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <Badge className="bg-success text-success-foreground text-xs">
                Est. Cost/Run: {wf.costPerRun}
              </Badge>
              <button
                onClick={() => removeWorkflow(wf.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            <Card className="border border-border">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {wf.name}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Data Source */}
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20 min-w-[160px]">
                    <Database className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Data Source
                      </p>
                      <p className="text-sm font-medium text-foreground">{wf.dataSource}</p>
                    </div>
                  </div>

                  <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />

                  {/* Recipe */}
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-accent border border-border min-w-[160px]">
                    <FlaskConical className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Recipe Logic
                      </p>
                      <p className="text-sm font-medium text-foreground">{wf.recipe}</p>
                    </div>
                  </div>

                  <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />

                  {/* Final Action */}
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-success/5 border border-success/20 min-w-[160px]">
                    <Send className="h-4 w-4 text-success shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Final Action
                      </p>
                      <p className="text-sm font-medium text-foreground">{wf.finalAction}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Add New Workflow */}
        <button
          onClick={addWorkflow}
          className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
        >
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
            Add New Workflow
          </span>
        </button>
      </div>
    </div>
  );
};

export default WorkflowCanvas;
