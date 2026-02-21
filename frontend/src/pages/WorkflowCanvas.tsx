import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Database, FlaskConical, Send, X, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Workflow {
  id: string;
  name: string;
  description: string;
  dataSource: string;
  recipe: string;
  finalAction: string;
  costPerRun: string;
  isActive: boolean;
}

const b2bWorkflow: Workflow = {
  id: "wf-b2b",
  name: "Agentic B2B Contract & Transaction Manager",
  description: "AI agents scan market sources, rank contract offers, and execute transactions via Stripe.",
  dataSource: "Multi-Market APIs",
  recipe: "AI Contract Ranking",
  finalAction: "Stripe Invoice + HITL",
  costPerRun: "$0.12",
  isActive: true,
};

const WorkflowCanvas = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([b2bWorkflow]);
  const navigate = useNavigate();

  const addWorkflow = () => {
    const id = `wf-${Date.now()}`;
    setWorkflows((prev) => [
      ...prev,
      {
        id,
        name: `New Workflow ${prev.length + 1}`,
        description: "Configure this workflow",
        dataSource: "Unconfigured",
        recipe: "Unconfigured",
        finalAction: "Unconfigured",
        costPerRun: "$0.00",
        isActive: false,
      },
    ]);
  };

  const removeWorkflow = (id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Workflow Canvas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your active AI agent pipelines. Click into a workflow to configure it.
        </p>
      </div>

      <div className="space-y-5">
        {workflows.map((wf) => (
          <div key={wf.id} className="relative group">
            {/* Top-right badges */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              {wf.isActive && (
                <Badge className="bg-success/15 text-success border-success/30 text-xs">
                  Active
                </Badge>
              )}
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                Est. Cost/Run: {wf.costPerRun}
              </Badge>
              {wf.id !== "wf-b2b" && (
                <button
                  onClick={() => removeWorkflow(wf.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <Card
              className="border border-border cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => wf.id === "wf-b2b" && navigate("/agents")}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{wf.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{wf.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Data Source */}
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/5 border border-primary/15 min-w-[150px]">
                    <Database className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Data Source
                      </p>
                      <p className="text-sm font-medium text-foreground">{wf.dataSource}</p>
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

                  {/* Recipe */}
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-accent border border-border min-w-[150px]">
                    <FlaskConical className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Recipe Logic
                      </p>
                      <p className="text-sm font-medium text-foreground">{wf.recipe}</p>
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

                  {/* Final Action */}
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-success/5 border border-success/15 min-w-[150px]">
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
