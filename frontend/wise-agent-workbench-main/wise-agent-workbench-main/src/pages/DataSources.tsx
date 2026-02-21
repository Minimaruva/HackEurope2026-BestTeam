import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Database, Server, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DataSourceItem {
  id: string;
  name: string;
  type: "file" | "database";
  contextPrompt: string;
}

const initialSources: DataSourceItem[] = [
  {
    id: "ds-1",
    name: "Q3 Stripe Churn Export",
    type: "database",
    contextPrompt: "This is the Q3 Stripe Churn data, focus on the user_id column.",
  },
  {
    id: "ds-2",
    name: "Vendor Contracts (2024)",
    type: "file",
    contextPrompt: "",
  },
];

const DataSources = () => {
  const [sources, setSources] = useState<DataSourceItem[]>(initialSources);

  const addSource = () => {
    const id = `ds-${Date.now()}`;
    setSources((prev) => [
      ...prev,
      { id, name: `New Source ${prev.length + 1}`, type: "database", contextPrompt: "" },
    ]);
    toast.success("Data source added.");
  };

  const removeSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  const updateContext = (id: string, value: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, contextPrompt: value } : s)),
    );
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Data Sources</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload files or connect databases, then give the agent context about each one.
          </p>
        </div>
        <Button onClick={addSource}>
          <Upload className="mr-2 h-4 w-4" />
          Upload File / Connect DB
        </Button>
      </div>

      <div className="space-y-4">
        {sources.map((source) => (
          <Card key={source.id}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                {source.type === "database" ? (
                  <Server className="h-5 w-5 text-primary" />
                ) : (
                  <Database className="h-5 w-5 text-primary" />
                )}
                <CardTitle className="text-base">{source.name}</CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  {source.type === "database" ? "Database" : "File"}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSource(source.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Agent Context Prompt
              </label>
              <Textarea
                value={source.contextPrompt}
                onChange={(e) => updateContext(source.id, e.target.value)}
                placeholder="Explain to the agent what this data is (e.g., 'This is the Q3 Stripe Churn data, focus on the user_id column')."
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>
        ))}

        {sources.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Database className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No data sources configured yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSources;
