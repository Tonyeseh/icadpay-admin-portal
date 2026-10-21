import { useState } from "react";
import { EditIcon, RefreshCwIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/format";
import { MOCK_FX_RATES } from "@/mock/platform";
import { canDo } from "@/lib/rbac";
import { useAdminStore } from "@/store/useAdminStore";
import { toast } from "sonner";
import type { FxRate } from "@/types";

const SOURCE_LABELS: Record<FxRate["source"], string> = {
  manual: "Manual",
  cbrate: "CBN rate",
  market: "Market",
};

export function FxRatesPage() {
  const permissions = useAdminStore((s) => s.permissions);
  const [rates, setRates] = useState(MOCK_FX_RATES);
  const [editing, setEditing] = useState<FxRate | null>(null);
  const [editRate, setEditRate] = useState("");
  const [editSpread, setEditSpread] = useState("");
  const canWrite = canDo(permissions, "platform:write");

  return (
    <div>
      <PageHeader
        title="FX Rates"
        description="Exchange rates applied to cross-currency transactions"
        actions={
          canWrite && (
            <Button variant="outline" size="sm" onClick={() => toast.success("Rates refreshed from market")}>
              <RefreshCwIcon className="size-4" />
              Refresh all
            </Button>
          )
        }
      />

      <Card size="sm">
        <CardHeader><CardTitle>Current rates (NGN base)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Currency pair</th>
                <th className="px-4 py-3 text-right font-medium">Rate (NGN)</th>
                <th className="px-4 py-3 text-right font-medium">Spread</th>
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-left font-medium">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {rates.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className="font-semibold">NGN / {r.quoteCurrency}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">
                    {r.rate.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{r.spread}%</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">{SOURCE_LABELS[r.source]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDateTime(r.updatedAt)} · {r.updatedBy}
                  </td>
                  <td className="px-4 py-3">
                    {canWrite && (
                      <Button variant="ghost" size="icon-sm" onClick={() => {
                        setEditing(r);
                        setEditRate(String(r.rate));
                        setEditSpread(String(r.spread));
                      }}>
                        <EditIcon className="size-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit NGN / {editing?.quoteCurrency} rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Rate (NGN per 1 {editing?.quoteCurrency})</Label>
              <Input type="number" value={editRate} onChange={(e) => setEditRate(e.target.value)} step="0.01" />
            </div>
            <div className="space-y-1.5">
              <Label>Spread (%)</Label>
              <Input type="number" value={editSpread} onChange={(e) => setEditSpread(e.target.value)} step="0.25" min="0" max="10" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => {
              setRates((prev) => prev.map((r) => r.id === editing!.id ? { ...r, rate: parseFloat(editRate), spread: parseFloat(editSpread), updatedAt: new Date().toISOString() } : r));
              toast.success(`NGN/${editing!.quoteCurrency} rate updated`);
              setEditing(null);
            }}>
              Save rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
