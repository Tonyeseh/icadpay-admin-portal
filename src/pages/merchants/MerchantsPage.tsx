import { useState } from "react";
import { Link } from "react-router-dom";
import {
  SearchIcon,
  FilterIcon,
  MoreHorizontalIcon,
  BanIcon,
  EyeIcon,
  CheckCircleIcon,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNaira, formatDate } from "@/lib/format";
import { MOCK_MERCHANTS } from "@/mock/merchants";
import { canDo } from "@/lib/rbac";
import { useAdminStore } from "@/store/useAdminStore";
import { toast } from "sonner";
import type { Merchant } from "@/types";

export function MerchantsPage() {
  const role = useAdminStore((s) => s.role);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [kycFilter, setKycFilter] = useState<string>("all");
  const [merchants, setMerchants] = useState(MOCK_MERCHANTS);
  const [suspending, setSuspending] = useState<Merchant | null>(null);
  const [activating, setActivating] = useState<Merchant | null>(null);

  const filtered = merchants.filter((m) => {
    const matchQ =
      !query ||
      m.businessName.toLowerCase().includes(query.toLowerCase()) ||
      m.ownerEmail.toLowerCase().includes(query.toLowerCase()) ||
      m.ownerName.toLowerCase().includes(query.toLowerCase());
    const matchStatus = statusFilter === "all" || m.status === statusFilter;
    const matchKyc = kycFilter === "all" || m.kycStatus === kycFilter;
    return matchQ && matchStatus && matchKyc;
  });

  return (
    <div>
      <PageHeader
        title="Merchants"
        description={`${merchants.filter((m) => m.status === "active").length} active · ${merchants.filter((m) => m.kycStatus === "in_review" || m.kycStatus === "pending").length} pending KYC`}
        actions={
          <Link to="/merchants/kyc-queue">
            <Button variant="outline" size="sm">KYC Queue</Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by business, name, or email…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending_kyc">Pending KYC</SelectItem>
          </SelectContent>
        </Select>
        <Select value={kycFilter} onValueChange={setKycFilter}>
          <SelectTrigger className="w-40 h-9">
            <FilterIcon className="size-3.5 mr-1" />
            <SelectValue placeholder="KYC" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All KYC</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="in_review">In review</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card size="sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Merchant</th>
                  <th className="px-4 py-3 text-left font-medium">Industry</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">KYC</th>
                  <th className="px-4 py-3 text-right font-medium">Total volume</th>
                  <th className="px-4 py-3 text-left font-medium">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link to={`/merchants/${m.id}`} className="hover:underline">
                        <p className="font-medium">{m.businessName}</p>
                        <p className="text-xs text-muted-foreground">{m.ownerEmail}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.industry}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.kycStatus} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatNaira(m.totalVolume, { compact: true })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/merchants/${m.id}`}>
                              <EyeIcon /> View details
                            </Link>
                          </DropdownMenuItem>
                          {canDo(role, "merchants:suspend") && m.status === "active" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onClick={() => setSuspending(m)}>
                                <BanIcon /> Suspend merchant
                              </DropdownMenuItem>
                            </>
                          )}
                          {canDo(role, "merchants:suspend") && m.status === "suspended" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setActivating(m)}>
                                <CheckCircleIcon /> Reactivate merchant
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No merchants match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Showing count */}
      <p className="mt-2 text-xs text-muted-foreground">
        Showing {filtered.length} of {merchants.length} merchants
      </p>

      <ConfirmDialog
        open={!!suspending}
        onOpenChange={(v) => !v && setSuspending(null)}
        title={`Suspend ${suspending?.businessName}?`}
        description="All transactions will be declined until the merchant is reactivated. They will receive an email notification."
        confirmLabel="Suspend merchant"
        variant="destructive"
        onConfirm={() => {
          setMerchants((prev) =>
            prev.map((m) => m.id === suspending!.id ? { ...m, status: "suspended" as const } : m)
          );
          toast.error(`${suspending!.businessName} suspended`);
          setSuspending(null);
        }}
      />

      <ConfirmDialog
        open={!!activating}
        onOpenChange={(v) => !v && setActivating(null)}
        title={`Reactivate ${activating?.businessName}?`}
        description="The merchant will be able to accept payments again immediately."
        confirmLabel="Reactivate"
        onConfirm={() => {
          setMerchants((prev) =>
            prev.map((m) => m.id === activating!.id ? { ...m, status: "active" as const } : m)
          );
          toast.success(`${activating!.businessName} reactivated`);
          setActivating(null);
        }}
      />
    </div>
  );
}
