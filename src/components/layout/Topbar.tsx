import { useState } from "react";
import { MenuIcon, SearchIcon, BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle";
import { ProfileMenu } from "./ProfileMenu";
import { RoleSwitcher } from "./RoleSwitcher";
import { Sidebar } from "./Sidebar";
import { Logo } from "@/components/common/Logo";
import { useAdminStore } from "@/store/useAdminStore";
import { ROLE_LABELS } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = useAdminStore((s) => s.role);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur supports-backdrop-filter:bg-background/65 lg:px-6">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open menu">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        <div className="lg:hidden">
          <Logo />
        </div>

        <div className="ml-1 hidden flex-1 max-w-md md:block">
          <button
            type="button"
            className="flex h-9 w-full items-center gap-2.5 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <SearchIcon className="size-4" />
            <span>Search merchants, transactions, users…</span>
            <kbd className="ml-auto rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <RoleSwitcher />
          <ThemeToggle />
          <Button variant="ghost" size="icon-sm" aria-label="Notifications">
            <BellIcon />
          </Button>
          <div className="mx-1 hidden h-6 w-px bg-border md:block" />
          <ProfileMenu />
        </div>
      </header>

      {role !== "super_admin" && (
        <div
          className={cn(
            "sticky top-16 z-20 flex h-8 items-center justify-center gap-2 text-xs font-medium",
            "bg-warning/15 text-warning-foreground border-b border-warning/20",
          )}
        >
          <span>Viewing as:</span>
          <span className="font-semibold">{ROLE_LABELS[role]}</span>
          <span className="text-warning-foreground/60">— some features are hidden or read-only</span>
        </div>
      )}
    </>
  );
}
