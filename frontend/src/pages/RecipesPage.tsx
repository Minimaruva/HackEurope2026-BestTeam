import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Recipe } from "@/types/contractops";
import { getRecipes, updateRecipe } from "@/api/client";

const RecipesPage = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await getRecipes();
    setRecipes(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (r: Recipe) => {
    await updateRecipe(r.id, { isActive: !r.isActive });
    await load();
    toast({ title: `${r.name} ${r.isActive ? "disabled" : "enabled"}` });
  };

  const activeCount = recipes.filter((r) => r.isActive).length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Toggle which scoring strategies the agent uses when evaluating market offers.
          {" "}<span className="font-medium text-foreground">{activeCount} active</span>
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-10">Loading recipes…</p>
      ) : (
        <div className="space-y-3">
          {recipes.map((r) => (
            <Card
              key={r.id}
              className={`transition-colors ${r.isActive ? "border-primary/20 bg-primary/[0.02]" : "opacity-60"}`}
            >
              <CardContent className="p-5 flex items-start gap-4">
                <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className={`h-4 w-4 ${r.isActive ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground text-sm">{r.name}</p>
                    {r.estimatedCostPerRunUSD && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        ~${r.estimatedCostPerRunUSD.toFixed(2)}/run
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 font-mono bg-muted/50 rounded px-2 py-1 leading-relaxed">
                    {r.prompt}
                  </p>
                </div>
                <Switch
                  checked={r.isActive}
                  onCheckedChange={() => handleToggle(r)}
                  className="shrink-0"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipesPage;
