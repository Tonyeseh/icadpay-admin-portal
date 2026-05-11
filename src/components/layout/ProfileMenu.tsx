import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDownIcon, LogOutIcon, UserIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ROLE_LABELS } from "@/lib/rbac";
import { initials } from "@/lib/format";
import { toast } from "sonner";

export function ProfileMenu() {
  const user = useAdminStore((s) => s.user);
  const role = useAdminStore((s) => s.role);
  const signOut = useAdminStore((s) => s.signOut);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  if (!user) return null;
  const name = `${user.firstName} ${user.lastName}`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 px-1.5">
            <Avatar className="size-7 rounded-none">
              <AvatarFallback className="rounded-none bg-primary text-[11px] font-semibold uppercase text-primary-foreground">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-left leading-tight md:block">
              <span className="block text-xs font-semibold normal-case tracking-normal text-foreground">{name}</span>
              <span className="block text-[10px] font-normal text-muted-foreground normal-case tracking-normal">
                {ROLE_LABELS[role]}
              </span>
            </span>
            <ChevronDownIcon className="hidden md:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs">
            <div>{name}</div>
            <div className="font-normal text-muted-foreground">{user.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/compliance/users")}>
            <UserIcon /> My profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirming(true)}>
            <LogOutIcon /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Sign out of Admin Portal?"
        description="You'll need to sign in again to access the admin portal."
        confirmLabel="Sign out"
        variant="destructive"
        onConfirm={() => {
          signOut();
          toast.success("Signed out");
          navigate("/login");
        }}
      />
    </>
  );
}
