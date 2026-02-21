import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Shield, Truck, Scale, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Flavour {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
}

const FLAVOURS: Flavour[] = [
  {
    id: "cheapest",
    name: "Cheapest Price",
    description: "Optimizes for the lowest total cost across all sources.",
    icon: DollarSign,
    colorClass: "text-emerald-600 bg-emerald-500/10",
  },
  {
    id: "lowest-risk",
    name: "Lowest Risk",
    description: "Prioritizes supplier credibility, payment terms, and reliability.",
    icon: Shield,
    colorClass: "text-blue-600 bg-blue-500/10",
  },
  {
    id: "fastest",
    name: "Fastest Delivery",
    description: "Selects offers with the earliest possible delivery dates.",
    icon: Truck,
    colorClass: "text-amber-600 bg-amber-500/10",
  },
  {
    id: "balanced",
    name: "Balanced",
    description: "Weighs price, risk, and delivery equally for an optimal mix.",
    icon: Scale,
    colorClass: "text-violet-600 bg-violet-500/10",
  },
];

const MAX_SELECTED = 3;

const FlavoursPage = () => {
  const [selected, setSelected] = useState<Set<string>>(new Set(["cheapest", "lowest-risk", "fastest"]));

  const handleToggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast({ title: `${FLAVOURS.find((f) => f.id === id)?.name} removed` });
      } else {
        if (next.size >= MAX_SELECTED) {
          toast({ title: `Max ${MAX_SELECTED} flavours allowed`, variant: "destructive" });
          return prev;
        }
        next.add(id);
        toast({ title: `${FLAVOURS.find((f) => f.id === id)?.name} added` });
      }
      return next;
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Pick up to <span className="font-medium text-foreground">{MAX_SELECTED} flavours</span> the agent will generate fulfillment plans for.
          {" "}<span className="font-medium text-foreground">{selected.size} selected</span>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {FLAVOURS.map((f) => {
          const isSelected = selected.has(f.id);
          const [textColor, bgColor] = f.colorClass.split(" ");
          const Icon = f.icon;

          return (
            <Card
              key={f.id}
              onClick={() => handleToggle(f.id)}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "border-primary/30 shadow-sm ring-1 ring-primary/20"
                  : "opacity-50 hover:opacity-75"
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-10 w-10 rounded-lg ${bgColor} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${textColor}`} />
                  </div>
                  {isSelected && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <Check className="h-3 w-3 mr-1" /> Active
                    </Badge>
                  )}
                </div>
                <p className="font-semibold text-foreground text-sm mb-1">{f.name}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FlavoursPage;
