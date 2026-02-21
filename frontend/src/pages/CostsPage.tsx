import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, TrendingDown, Zap, BarChart3 } from "lucide-react";
import type { CostSummary } from "@/types/contractops";
import { getCosts } from "@/api/client";

const CostsPage = () => {
  const [data, setData] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCosts().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="p-6 lg:p-10 max-w-5xl mx-auto">
        <p className="text-sm text-muted-foreground py-20 text-center">Loading cost data…</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          AI agent usage and cost breakdown. Powered by paid.ai tracking.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total AI Cost</p>
              <p className="text-xl font-bold text-foreground">${data.total_cost_usd.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        {data.savings_estimate && (
          <>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Manual Equivalent</p>
                  <p className="text-xl font-bold text-foreground">
                    ${data.savings_estimate.manual_cost_usd.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Saved</p>
                  <p className="text-xl font-bold text-success">
                    ${data.savings_estimate.saved_usd.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {((1 - data.total_cost_usd / data.savings_estimate.manual_cost_usd) * 100).toFixed(1)}% reduction
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Per-agent table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">Runs</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Avg Cost/Run</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.by_agent.map((row) => (
                <TableRow key={row.agent_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground text-sm">{row.agent_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{row.runs}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{row.tokens.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-sm">${row.cost_usd.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">${row.avg_cost_usd.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {/* Total row */}
              <TableRow className="border-t-2">
                <TableCell className="font-semibold text-foreground">Total</TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {data.by_agent.reduce((s, r) => s + r.runs, 0)}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {data.by_agent.reduce((s, r) => s + r.tokens, 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  ${data.total_cost_usd.toFixed(2)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostsPage;
