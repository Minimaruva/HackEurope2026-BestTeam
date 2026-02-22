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
import { FileText, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { Contract } from "@/types/contractops";
import { getContracts } from "@/api/client";

const statusColor: Record<string, string> = {
  open: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-warning/15 text-warning border-warning/30",
  closed: "bg-muted text-muted-foreground border-border",
};

interface ContractsPageProps {
  productId?: string;
  direction?: "IN" | "OUT";
}

const ContractsPage = ({ productId, direction }: ContractsPageProps) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContracts({ productId, direction, source: "owned" }).then((data) => {
      let filtered = data;
      if (direction) filtered = filtered.filter((c) => c.direction === direction);
      setContracts(filtered);
      setLoading(false);
    });
  }, [productId, direction]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Incoming contracts that need closing. Your agent will scan markets to fulfill them.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="w-24 text-center">Direction</TableHead>
                <TableHead className="w-28 text-right">Quantity</TableHead>
                <TableHead className="w-24 text-center">Currency</TableHead>
                <TableHead className="w-28 text-center">Status</TableHead>
                <TableHead className="w-32 text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Loading contracts…
                  </TableCell>
                </TableRow>
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    No contracts yet.
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <span className="font-medium text-foreground text-sm">{c.product_name}</span>
                          <p className="text-[10px] text-muted-foreground font-mono">{c.product_id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs gap-1">
                        {c.direction === "IN" ? (
                          <><ArrowDownLeft className="h-3 w-3" /> Buy</>
                        ) : (
                          <><ArrowUpRight className="h-3 w-3" /> Sell</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {c.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {c.currency}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-xs ${statusColor[c.status]}`}>
                        {c.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractsPage;
