import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  success: "bg-success/10 text-success ring-success/20",
  paid: "bg-success/10 text-success ring-success/20",
  active: "bg-success/10 text-success ring-success/20",
  approved: "bg-success/10 text-success ring-success/20",
  verified: "bg-success/10 text-success ring-success/20",
  submitted: "bg-primary/10 text-primary ring-primary/20",
  resolved: "bg-success/10 text-success ring-success/20",
  won: "bg-success/10 text-success ring-success/20",
  cleared: "bg-success/10 text-success ring-success/20",
  finalised: "bg-success/10 text-success ring-success/20",

  failed: "bg-destructive/10 text-destructive ring-destructive/20",
  rejected: "bg-destructive/10 text-destructive ring-destructive/20",
  suspended: "bg-destructive/10 text-destructive ring-destructive/20",
  lost: "bg-destructive/10 text-destructive ring-destructive/20",
  block: "bg-destructive/10 text-destructive ring-destructive/20",
  escalated: "bg-destructive/10 text-destructive ring-destructive/20",

  pending: "bg-warning/15 text-warning-foreground ring-warning/30",
  processing: "bg-warning/15 text-warning-foreground ring-warning/30",
  in_review: "bg-warning/15 text-warning-foreground ring-warning/30",
  under_review: "bg-warning/15 text-warning-foreground ring-warning/30",
  underreview: "bg-warning/15 text-warning-foreground ring-warning/30",
  investigating: "bg-warning/15 text-warning-foreground ring-warning/30",
  on_hold: "bg-warning/15 text-warning-foreground ring-warning/30",
  pending_kyc: "bg-warning/15 text-warning-foreground ring-warning/30",
  requiresaction: "bg-warning/15 text-warning-foreground ring-warning/30",
  invited: "bg-warning/15 text-warning-foreground ring-warning/30",
  reviewed: "bg-warning/15 text-warning-foreground ring-warning/30",
  draft: "bg-warning/15 text-warning-foreground ring-warning/30",
  uploaded: "bg-warning/15 text-warning-foreground ring-warning/30",

  open: "bg-primary/10 text-primary ring-primary/20",
  flag: "bg-primary/10 text-primary ring-primary/20",

  false_positive: "bg-muted text-muted-foreground ring-border",
  abandoned: "bg-muted text-muted-foreground ring-border",
  inactive: "bg-muted text-muted-foreground ring-border",
  deactivated: "bg-muted text-muted-foreground ring-border",
  test: "bg-muted text-muted-foreground ring-border",
  live: "bg-success/10 text-success ring-success/20",
};

const labels: Record<string, string> = {
  in_review: "In review",
  under_review: "Under review",
  underreview: "Under review",
  false_positive: "False positive",
  pending_kyc: "Pending KYC",
  requiresaction: "Requires action",
  on_hold: "On hold",
  finance_settlements: "Finance",
  ops_support: "Ops & Support",
  risk_compliance: "Risk & Compliance",
  super_admin: "Super Admin",
};

const dotColors: Record<string, string> = {
  success: "bg-success",
  paid: "bg-success",
  active: "bg-success",
  approved: "bg-success",
  verified: "bg-success",
  submitted: "bg-primary",
  resolved: "bg-success",
  won: "bg-success",
  cleared: "bg-success",
  finalised: "bg-success",
  failed: "bg-destructive",
  rejected: "bg-destructive",
  suspended: "bg-destructive",
  lost: "bg-destructive",
  escalated: "bg-destructive",
  pending: "bg-warning",
  processing: "bg-warning",
  in_review: "bg-warning",
  under_review: "bg-warning",
  underreview: "bg-warning",
  investigating: "bg-warning",
  on_hold: "bg-warning",
  pending_kyc: "bg-warning",
  requiresaction: "bg-warning",
  invited: "bg-warning",
  reviewed: "bg-warning",
  draft: "bg-warning",
  uploaded: "bg-warning",
  open: "bg-primary",
  flag: "bg-primary",
  deactivated: "bg-muted-foreground/50",
  test: "bg-muted-foreground/50",
  live: "bg-success",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  const label = labels[key] ?? status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset capitalize",
        styles[key] ?? "bg-muted text-muted-foreground ring-border",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dotColors[key] ?? "bg-muted-foreground/40")} />
      {label}
    </span>
  );
}
