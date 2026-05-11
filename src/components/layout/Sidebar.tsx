import { NavLink } from "react-router-dom";
import {
  LayoutDashboardIcon,
  BuildingIcon,
  ReceiptIcon,
  ShieldAlertIcon,
  BanknoteIcon,
  SlidersIcon,
  UsersIcon,
  BarChart3Icon,
  ChevronLeftIcon,
  CircleHelpIcon,
  GanttChartIcon,
  FlameIcon,
  ScanFaceIcon,
  WalletIcon,
  ScaleIcon,
  NetworkIcon,
  DollarSignIcon,
  WebhookIcon,
  ClipboardListIcon,
  UserCogIcon,
  ScrollTextIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/Logo";
import { useAdminStore } from "@/store/useAdminStore";
import { Button } from "@/components/ui/button";
import { canVisit } from "@/lib/rbac";
import type { AdminRole } from "@/types";

type NavItem = { to: string; label: string; Icon: typeof LayoutDashboardIcon };
type NavSection = { heading: string; prefix: string; items: NavItem[] };

const ALL_SECTIONS: NavSection[] = [
  {
    heading: "Overview",
    prefix: "/dashboard",
    items: [{ to: "/dashboard", label: "Dashboard", Icon: LayoutDashboardIcon }],
  },
  {
    heading: "Merchants",
    prefix: "/merchants",
    items: [
      { to: "/merchants", label: "All Merchants", Icon: BuildingIcon },
      { to: "/merchants/kyc-queue", label: "KYC Queue", Icon: ScanFaceIcon },
    ],
  },
  {
    heading: "Transactions",
    prefix: "/transactions",
    items: [
      { to: "/transactions", label: "All Transactions", Icon: ReceiptIcon },
      { to: "/transactions/disputes", label: "Disputes", Icon: ScaleIcon },
    ],
  },
  {
    heading: "Fraud & Risk",
    prefix: "/fraud",
    items: [
      { to: "/fraud/alerts", label: "Alert Queue", Icon: ShieldAlertIcon },
      { to: "/fraud/rules", label: "Rules Engine", Icon: FlameIcon },
      { to: "/fraud/aml", label: "AML Queue", Icon: GanttChartIcon },
    ],
  },
  {
    heading: "Financial Ops",
    prefix: "/financial",
    items: [
      { to: "/financial/ledger", label: "Platform Ledger", Icon: BanknoteIcon },
      { to: "/financial/payouts", label: "Merchant Payouts", Icon: WalletIcon },
      { to: "/financial/reconciliation", label: "Reconciliation", Icon: ScaleIcon },
    ],
  },
  {
    heading: "Platform",
    prefix: "/platform",
    items: [
      { to: "/platform/routing", label: "Routing Rules", Icon: NetworkIcon },
      { to: "/platform/fx-rates", label: "FX Rates", Icon: DollarSignIcon },
      { to: "/platform/webhooks", label: "Webhooks", Icon: WebhookIcon },
      { to: "/platform/change-log", label: "Change Log", Icon: ClipboardListIcon },
    ],
  },
  {
    heading: "Compliance",
    prefix: "/compliance",
    items: [
      { to: "/compliance/users", label: "Admin Users", Icon: UserCogIcon },
      { to: "/compliance/audit-log", label: "Audit Log", Icon: ScrollTextIcon },
    ],
  },
  {
    heading: "Analytics",
    prefix: "/analytics",
    items: [{ to: "/analytics", label: "Analytics", Icon: BarChart3Icon }],
  },
];

function getVisibleSections(role: AdminRole): NavSection[] {
  return ALL_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canVisit(role, item.to)),
    }))
    .filter((section) => section.items.length > 0);
}

export function Sidebar() {
  const collapsed = useAdminStore((s) => s.sidebarCollapsed);
  const toggle = useAdminStore((s) => s.toggleSidebar);
  const role = useAdminStore((s) => s.role);
  const sections = getVisibleSections(role);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        collapsed ? "w-[76px]" : "w-[248px]",
      )}
    >
      <div className={cn("flex h-16 items-center border-b px-5", collapsed && "justify-center px-2")}>
        <Logo showWord={!collapsed} />
      </div>

      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {sections.map((section) => (
          <div key={section.heading} className="mb-5">
            {!collapsed && (
              <div className="mb-1.5 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {section.heading}
              </div>
            )}
            <ul className="space-y-0.5 px-3">
              {section.items.map(({ to, label, Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === "/dashboard" || to === "/analytics"}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
                        collapsed && "justify-center px-2",
                      )
                    }
                  >
                    <Icon className="size-[18px] shrink-0" />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn("border-t p-3", collapsed && "p-2")}>
        {!collapsed && (
          <a
            href="#"
            className="mb-2 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <CircleHelpIcon className="size-[18px]" />
            <span>Help & support</span>
          </a>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon-sm" : "sm"}
          className={cn("w-full", collapsed ? "" : "justify-start")}
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeftIcon className={cn("transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}

export { SlidersIcon, UsersIcon };
