import { ChevronDownIcon, ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminStore } from "@/store/useAdminStore";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/types";

const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: "text-primary",
  ops_support: "text-chart-2",
  risk_compliance: "text-destructive",
  finance_settlements: "text-chart-3",
  auditor: "text-muted-foreground",
};

export function RoleSwitcher() {
  const role = useAdminStore((s) => s.role);
  const setRole = useAdminStore((s) => s.setRole);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium h-8">
          <ShieldCheckIcon className={cn("size-3.5", ROLE_COLORS[role])} />
          <span className="hidden sm:inline">{ROLE_LABELS[role]}</span>
          <ChevronDownIcon className="size-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Demo: switch role
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ALL_ROLES.map((r) => (
          <DropdownMenuItem
            key={r}
            onClick={() => setRole(r)}
            className={cn("text-sm", role === r && "bg-accent")}
          >
            <ShieldCheckIcon className={cn("size-4", ROLE_COLORS[r])} />
            <div>
              <div className="font-medium">{ROLE_LABELS[r]}</div>
            </div>
            {role === r && <span className="ml-auto text-[10px] font-semibold text-primary">active</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
