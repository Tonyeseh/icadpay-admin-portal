import { useState } from "react";
import { PlusIcon, MoreHorizontalIcon, ShieldCheckIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRelative, initials } from "@/lib/format";
import { MOCK_ADMIN_USERS } from "@/mock/compliance";
import { ROLE_LABELS, ALL_ROLES } from "@/lib/rbac";
import { canDo } from "@/lib/rbac";
import { useAdminStore } from "@/store/useAdminStore";
import { toast } from "sonner";
import type { AdminUser } from "@/types";

export function AdminUsersPage() {
  const role = useAdminStore((s) => s.role);
  const [users, setUsers] = useState(MOCK_ADMIN_USERS);
  const [suspending, setSuspending] = useState<AdminUser | null>(null);
  const [inviting, setInviting] = useState(false);
  const canWrite = canDo(role, "compliance:users");

  return (
    <div>
      <PageHeader
        title="Admin Users"
        description="Manage who has access to the admin portal and their roles"
        actions={
          canWrite && (
            <Button size="sm" onClick={() => setInviting(true)}>
              <PlusIcon className="size-4" />
              Invite admin
            </Button>
          )
        }
      />

      <Card size="sm">
        <CardContent className="p-0">
          <div className="divide-y">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9 rounded-none">
                    <AvatarFallback className="rounded-none bg-primary/10 text-primary text-xs font-semibold">
                      {initials(`${u.firstName} ${u.lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{u.firstName} {u.lastName}</span>
                      {u.twoFAEnabled && (
                        <ShieldCheckIcon className="size-3.5 text-success" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{ROLE_LABELS[u.role]}</Badge>
                    <StatusBadge status={u.status} />
                  </div>
                  {u.lastLoginAt && (
                    <span className="hidden md:block text-xs text-muted-foreground">
                      {formatRelative(u.lastLoginAt)}
                    </span>
                  )}
                  {canWrite && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info("Role editor coming soon")}>
                          Change role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {u.status === "active" && (
                          <DropdownMenuItem variant="destructive" onClick={() => setSuspending(u)}>
                            Suspend access
                          </DropdownMenuItem>
                        )}
                        {u.status === "suspended" && (
                          <DropdownMenuItem onClick={() => {
                            setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, status: "active" as const } : x));
                            toast.success(`${u.firstName} reactivated`);
                          }}>
                            Reactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invite dialog */}
      <Dialog open={inviting} onOpenChange={setInviting}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite admin user</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First name</Label>
                <Input placeholder="Chidi" />
              </div>
              <div className="space-y-1.5">
                <Label>Last name</Label>
                <Input placeholder="Okafor" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email address</Label>
              <Input type="email" placeholder="chidi@icadpay.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select defaultValue="ops_support">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviting(false)}>Cancel</Button>
            <Button onClick={() => {
              toast.success("Invitation sent");
              setInviting(false);
            }}>
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!suspending}
        onOpenChange={(v) => !v && setSuspending(null)}
        title={`Suspend ${suspending?.firstName} ${suspending?.lastName}?`}
        description="They will be immediately signed out and unable to log in until reactivated."
        confirmLabel="Suspend access"
        variant="destructive"
        onConfirm={() => {
          setUsers((prev) => prev.map((u) => u.id === suspending!.id ? { ...u, status: "suspended" as const } : u));
          toast.error(`${suspending!.firstName}'s access suspended`);
          setSuspending(null);
        }}
      />
    </div>
  );
}
