import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";

interface KeyField {
  id: string;
  label: string;
  placeholder: string;
  value: string;
}

const SettingsPage = () => {
  const [keys, setKeys] = useState<KeyField[]>([
    { id: "openai", label: "OpenAI API Key", placeholder: "sk-...", value: "" },
    { id: "stripe", label: "Stripe Secret Key", placeholder: "sk_live_...", value: "" },
    { id: "paidai", label: "paid.ai Tracker Key", placeholder: "pai_...", value: "" },
  ]);
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  const updateKey = (id: string, value: string) => {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, value } : k)));
  };

  const toggleVisibility = (id: string) => {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage API keys and integrations for your agent workflows.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {keys.map((key) => (
            <div key={key.id} className="space-y-1.5">
              <Label className="text-sm">{key.label}</Label>
              <div className="flex gap-2">
                <Input
                  type={visible[key.id] ? "text" : "password"}
                  value={key.value}
                  onChange={(e) => updateKey(key.id, e.target.value)}
                  placeholder={key.placeholder}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleVisibility(key.id)}
                  className="shrink-0"
                >
                  {visible[key.id] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}

          <Button
            className="w-full mt-2"
            onClick={() => toast.success("Settings saved.")}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
