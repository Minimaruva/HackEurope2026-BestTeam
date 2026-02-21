import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Plus, Pencil, Bot } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Agent } from "@/types/contractops";
import { getAgents, createAgent, updateAgent } from "@/api/client";

const emptyAgent: Omit<Agent, "id"> = {
  name: "",
  description: "",
  prompt: "",
  isActive: true,
  estimatedCostPerRunUSD: undefined,
};

const AgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Agent, "id">>(emptyAgent);
  const [saving, setSaving] = useState(false);

  const loadAgents = async () => {
    setLoading(true);
    const data = await getAgents();
    setAgents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyAgent);
    setPanelOpen(true);
  };

  const openEdit = (agent: Agent) => {
    setEditingId(agent.id);
    setForm({
      name: agent.name,
      description: agent.description,
      prompt: agent.prompt,
      isActive: agent.isActive,
      estimatedCostPerRunUSD: agent.estimatedCostPerRunUSD,
    });
    setPanelOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateAgent(editingId, form);
        toast({ title: "Agent updated" });
      } else {
        await createAgent(form);
        toast({ title: "Agent created" });
      }
      await loadAgents();
      setPanelOpen(false);
    } catch {
      toast({ title: "Error saving agent", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleToggle = async (agent: Agent) => {
    await updateAgent(agent.id, { isActive: !agent.isActive });
    await loadAgents();
    toast({
      title: `${agent.name} ${agent.isActive ? "deactivated" : "activated"}`,
    });
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Agents are recipes that rank market contract offers for a chosen product.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Create Agent
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-20 text-center">Active</TableHead>
                <TableHead className="w-32 text-right">Est. Cost/Run</TableHead>
                <TableHead className="w-20 text-center">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                    Loading agents…
                  </TableCell>
                </TableRow>
              ) : agents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                    No agents yet. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="font-medium text-foreground text-sm">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">{agent.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={agent.isActive}
                        onCheckedChange={() => handleToggle(agent)}
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {agent.estimatedCostPerRunUSD
                        ? `$${agent.estimatedCostPerRunUSD.toFixed(2)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(agent)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Side panel */}
      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit Agent" : "Create Agent"}</SheetTitle>
            <SheetDescription>
              Define the prompt recipe this agent will use to rank contract offers.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 mt-6">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Cheapest Price"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="One line summary of what this agent does"
              />
            </div>

            <div className="space-y-2">
              <Label>Prompt</Label>
              <Textarea
                value={form.prompt}
                onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                rows={8}
                placeholder={`You are a procurement agent. Given a list of contract offers for [product], rank them by [criteria]. For each offer, provide:\n- Score (0-100)\n- Rationale bullets\n- Risk flags\n\nOutput the top match and alternatives as structured JSON.`}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
            </div>

            <div className="space-y-2">
              <Label>Estimated Cost/Run (USD)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.estimatedCostPerRunUSD ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    estimatedCostPerRunUSD: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                placeholder="0.12"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving…" : editingId ? "Update Agent" : "Create Agent"}
              </Button>
              <Button variant="outline" onClick={() => setPanelOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AgentsPage;
