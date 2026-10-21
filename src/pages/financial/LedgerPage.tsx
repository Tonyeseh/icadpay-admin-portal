import { PageHeader } from "@/components/common/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadIcon, WalletIcon, TrendingUpIcon } from "lucide-react";
import { formatNaira, formatDateTime } from "@/lib/format";
import { MOCK_LEDGER } from "@/mock/financial";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
  settlement: "Settlement",
  fee: "Platform fee",
  refund: "Refund",
  chargeback: "Chargeback",
  payout: "Merchant payout",
  reversal: "Reversal",
};

const TYPE_SIGN: Record<string, "+" | "-"> = {
  settlement: "+",
  fee: "+",
  refund: "-",
  chargeback: "-",
  payout: "-",
  reversal: "-",
};

export function LedgerPage() {
  const sorted = [...MOCK_LEDGER].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const platformBalance = sorted[0]?.balance ?? 0;
  const totalFees = MOCK_LEDGER.filter((e) => e.type === "fee").reduce((s, e) => s + e.amount, 0);
  const totalPayouts = MOCK_LEDGER.filter((e) => e.type === "payout").reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <PageHeader
        title="Platform Ledger"
        description="Running balance of all platform financial activity"
        actions={
          <Button variant="outline" size="sm" onClick={() => toast.success("Ledger exported")}>
            <DownloadIcon className="size-4" />
            Export
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Platform float balance" value={formatNaira(platformBalance, { compact: true })} icon={<WalletIcon className="size-4" />} />
        <KpiCard label="Total fees collected" value={formatNaira(totalFees, { compact: true })} icon={<TrendingUpIcon className="size-4" />} />
        <KpiCard label="Total payouts issued" value={formatNaira(totalPayouts, { compact: true })} icon={<WalletIcon className="size-4" />} />
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Ledger entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Merchant</th>
                  <th className="px-4 py-3 text-left font-medium">Reference</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sorted.map((entry) => {
                  const sign = TYPE_SIGN[entry.type] ?? "+";
                  return (
                    <tr key={entry.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{TYPE_LABELS[entry.type] ?? entry.type}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{entry.merchantName ?? "Platform"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{entry.reference.slice(0, 20)}…</td>
                      <td className={`px-4 py-3 text-right tabular-nums font-semibold ${sign === "+" ? "text-success" : "text-foreground"}`}>
                        {sign}{formatNaira(entry.amount)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatNaira(entry.balance, { compact: true })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
