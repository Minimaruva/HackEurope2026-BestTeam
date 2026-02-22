import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Rocket, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

const templates = [
  "Supply Chain Optimization",
  "Subscription Churn Prevention",
  "Contract Compliance Review",
  "Invoice Reconciliation",
];

const dataSources = ["Q3 Stripe Churn Export", "Vendor Contracts (2024)", "ERP Database"];
const finalActions = ["Trigger Stripe Payment", "Send Slack Report", "Email Higher-ups"];

interface Step {
  id: string;
  type: "analysis" | "logic" | "action";
  label: string;
  value: string;
  enabled: boolean;
}

const RecipeBuilder = () => {
  const [template, setTemplate] = useState("");
  const [hitlEnabled, setHitlEnabled] = useState(true);
  const [steps, setSteps] = useState<Step[]>([
    { id: "s1", type: "analysis", label: "Data Analysis", value: "", enabled: true },
    { id: "s2", type: "logic", label: "Custom Formula / Logic", value: "", enabled: true },
    { id: "s3", type: "action", label: "Final Action", value: "", enabled: true },
  ]);

  const toggleStep = (id: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    );
  };

  const updateStepValue = (id: string, value: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, value } : s)),
    );
  };

  const addStep = () => {
    const id = `s-${Date.now()}`;
    setSteps((prev) => [
      ...prev.slice(0, -1),
      { id, type: "logic", label: `Custom Step ${prev.length}`, value: "", enabled: true },
      prev[prev.length - 1],
    ]);
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const [agentResult, setAgentResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runAgent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/run_agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: "0c3358f0-b788-4ee1-aeff-45aee4bedf70", // Replace with selected product ID
          user_id: "test-user-1",
          toggles: {
            eu_priority: true,
            volume_discount: true
          },
          flavours: ["cheapest", "balanced"]
        }),
      });

      if (!response.ok) throw new Error("Agent run failed");

      const data = await response.json();
      setAgentResult(data);
      toast.success("Agent finished successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to run agent.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Recipe Builder</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define the agent's step-by-step execution chain.
        </p>
      </div>

      <div className="space-y-6">
        {/* Template */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Base Template</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a base template…" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Dynamic Steps */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Execution Steps</CardTitle>
            <Button variant="outline" size="sm" onClick={addStep}>
              <Plus className="mr-1 h-3 w-3" />
              Add Step
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  step.enabled ? "bg-card border-border" : "bg-muted/50 border-border opacity-60"
                }`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground mt-2.5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        Step {idx + 1}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">{step.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={step.enabled}
                        onCheckedChange={() => toggleStep(step.id)}
                      />
                      {step.type === "logic" && step.id !== "s2" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeStep(step.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {step.enabled && step.type === "analysis" && (
                    <Select value={step.value} onValueChange={(v) => updateStepValue(step.id, v)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select data source…" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataSources.map((ds) => (
                          <SelectItem key={ds} value={ds}>{ds}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {step.enabled && step.type === "logic" && (
                    <Input
                      value={step.value}
                      onChange={(e) => updateStepValue(step.id, e.target.value)}
                      placeholder="Define a specific business rule (e.g., 'Flag contracts with liability > $10k')…"
                      className="h-9"
                    />
                  )}

                  {step.enabled && step.type === "action" && (
                    <Select value={step.value} onValueChange={(v) => updateStepValue(step.id, v)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select final action…" />
                      </SelectTrigger>
                      <SelectContent>
                        {finalActions.map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* HITL Toggle */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Require HITL Approval before Final Action</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  A human must approve the final action before execution.
                </p>
              </div>
              <Switch checked={hitlEnabled} onCheckedChange={setHitlEnabled} />
            </div>
          </CardContent>
        </Card>

        {/* Deploy */}
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            if (!template) {
              toast.error("Select a base template first.");
              return;
            }
            toast.success("Recipe saved and ready for deployment.");
          }}
        >
          <Rocket className="mr-2 h-4 w-4" />
          Save & Deploy Recipe
        </Button>

        <Button
          size="lg"
          className="w-full mt-4"
          onClick={runAgent}
          disabled={isLoading}
        >
          {isLoading ? "Agent Running..." : "Run Live Agent"}
        </Button>

        {agentResult && (
          <Card className="mt-8">
            <CardHeader><CardTitle>Agent Results</CardTitle></CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(agentResult.llm_explanations, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RecipeBuilder;
