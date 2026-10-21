import { Link, useLocation } from "react-router-dom";
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
  FileTextIcon,
  FactoryIcon,
  IdCardIcon,
  LandmarkIcon,
  ShieldIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/Logo";
import { useAdminStore } from "@/store/useAdminStore";
import { Button } from "@/components/ui/button";
import { canVisit } from "@/lib/rbac";

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
      { to: "/merchants?onboarding=Submitted", label: "Onboarding review", Icon: ScanFaceIcon },
      { to: "/merchants/settlement-accounts", label: "Settlement accounts", Icon: LandmarkIcon },
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
    heading: "Catalog",
    prefix: "/platform",
    items: [
      { to: "/platform/company-types", label: "Company Types", Icon: IdCardIcon },
      { to: "/platform/industry-types", label: "Industry Types", Icon: FactoryIcon },
      { to: "/platform/document-types", label: "Document Types", Icon: FileTextIcon },
      { to: "/platform/merchant-roles", label: "Merchant Roles", Icon: ShieldIcon },
    ],
  },
  {
    heading: "Compliance",
    prefix: "/compliance",
    items: [
      { to: "/compliance/users", label: "Admin Users", Icon: UserCogIcon },
      { to: "/compliance/admin-roles", label: "Admin Roles", Icon: ShieldIcon },
      { to: "/compliance/audit-log", label: "Audit Log", Icon: ScrollTextIcon },
    ],
  },
  {
    heading: "Analytics",
    prefix: "/analytics",
    items: [{ to: "/analytics", label: "Analytics", Icon: BarChart3Icon }],
  },
];

function navPath(to: string): string {
  const query = to.indexOf("?");
  return query === -1 ? to : to.slice(0, query);
}

function isNavItemActive(to: string, pathname: string, search: string): boolean {
  const onReviewList = pathname === "/merchants" && new URLSearchParams(search).get("onboarding") === "Submitted";
  const onSettlementAccounts =
    pathname === "/merchants/settlement-accounts" ||
    pathname.startsWith("/merchants/settlement-accounts/");

  if (to === "/merchants?onboarding=Submitted") return onReviewList;
  if (to === "/merchants/settlement-accounts") return onSettlementAccounts;

  const path = navPath(to);
  const end = path === "/dashboard" || path === "/analytics";
  const pathActive = end ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
  if (to === "/merchants" && (onReviewList || onSettlementAccounts)) return false;
  return pathActive;
}

function getVisibleSections(permissions: readonly string[]): NavSection[] {
  return ALL_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canVisit(permissions, navPath(item.to))),
    }))
    .filter((section) => section.items.length > 0);
}

export function Sidebar() {
  const collapsed = useAdminStore((s) => s.sidebarCollapsed);
  const toggle = useAdminStore((s) => s.toggleSidebar);
  const permissions = useAdminStore((s) => s.permissions);
  const location = useLocation();
  const sections = getVisibleSections(permissions);

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
              {section.items.map(({ to, label, Icon }) => {
                const active = isNavItemActive(to, location.pathname, location.search);
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
                        collapsed && "justify-center px-2",
                      )}
                    >
                      <Icon className="size-[18px] shrink-0" />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </Link>
                  </li>
                );
              })}
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
