import { useEffect, useMemo, useState } from "react";
import { MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hasAnyPermission } from "@/lib/rbac";
import { useAdminStore } from "@/store/useAdminStore";
import {
  createCompanyType,
  deleteCompanyType,
  formatAdminApiError,
  listCompanyTypes,
  patchCompanyType,
  type BusinessType,
  type CompanyTypeDto,
} from "@/lib/admin-catalog-api";

const BUSINESS_TYPES: BusinessType[] = ["Registered Business", "Non-Registered Business", "Government Agency"];

export function CompanyTypesPage() {
  const permissions = useAdminStore((s) => s.permissions);
  const canWrite = hasAnyPermission(permissions, ["company_types.create", "company_types.update", "company_types.delete"]);

  const [includeInactive, setIncludeInactive] = useState(true);
  const [rows, setRows] = useState<CompanyTypeDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CompanyTypeDto | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<CompanyTypeDto | null>(null);

  const [createId, setCreateId] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [createName, setCreateName] = useState("");
  const [createBusinessType, setCreateBusinessType] = useState<BusinessType>(BUSINESS_TYPES[0]);

  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editBusinessType, setEditBusinessType] = useState<BusinessType>(BUSINESS_TYPES[0]);
  const [editActive, setEditActive] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => a.name.localeCompare(b.name));
    return copy;
  }, [rows]);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listCompanyTypes({ includeInactive });
      setRows(data);
    } catch (err: unknown) {
      const body = err && typeof err === "object" && "body" in err ? (err as { body: unknown }).body : undefined;
      toast.error(formatAdminApiError(body));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  function openEdit(row: CompanyTypeDto) {
    setEditing(row);
    setEditCode(row.code);
    setEditName(row.name);
    setEditBusinessType(row.businessType);
    setEditActive(row.isActive);
  }

  async function submitCreate() {
    try {
      const created = await createCompanyType({
        id: createId.trim(),
        code: createCode.trim(),
        name: createName.trim(),
        businessType: createBusinessType,
      });
      toast.success(`Created ${created.name}`);
      setCreating(false);
      setCreateId("");
      setCreateCode("");
      setCreateName("");
      setCreateBusinessType(BUSINESS_TYPES[0]);
      await refresh();
    } catch (err: unknown) {
      const body = err && typeof err === "object" && "body" in err ? (err as { body: unknown }).body : undefined;
      toast.error(formatAdminApiError(body));
    }
  }

  async function submitEdit() {
    if (!editing) return;
    try {
      const updated = await patchCompanyType(editing.id, {
        code: editCode.trim(),
        name: editName.trim(),
        businessType: editBusinessType,
        isActive: editActive,
      });
      toast.success(`Updated ${updated.name}`);
      setEditing(null);
      await refresh();
    } catch (err: unknown) {
      const body = err && typeof err === "object" && "body" in err ? (err as { body: unknown }).body : undefined;
      toast.error(formatAdminApiError(body));
    }
  }

  async function deactivate(id: string) {
    try {
      await deleteCompanyType(id);
      toast.success("Deactivated company type");
      await refresh();
    } catch (err: unknown) {
      const body = err && typeof err === "object" && "body" in err ? (err as { body: unknown }).body : undefined;
      toast.error(formatAdminApiError(body));
    }
  }

  return (
    <div>
      <PageHeader
        title="Company types"
        description="Manage merchant company type taxonomy."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5">
              <span className="text-xs text-muted-foreground">Include inactive</span>
              <Switch checked={includeInactive} onCheckedChange={setIncludeInactive} size="sm" />
            </div>
            {canWrite && (
              <Button size="sm" onClick={() => setCreating(true)}>
                <PlusIcon className="size-4" />
                New
              </Button>
            )}
          </div>
        }
      />

      <Card size="sm">
        <CardHeader>
          <CardTitle>Company types</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="px-4">Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Business type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10 px-4" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {sorted.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="px-4 font-medium">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.code}</TableCell>
                  <TableCell className="text-muted-foreground">{r.id}</TableCell>
                  <TableCell className="text-muted-foreground">{r.businessType}</TableCell>
                  <TableCell>
                    <Badge variant={r.isActive ? "outline" : "secondary"} className="text-xs">
                      {r.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4">
                    {canWrite ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                            <MoreHorizontalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(r)}>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setConfirmDeactivate(r)}
                            disabled={!r.isActive}
                          >
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}

              {!loading && sorted.length === 0 && (
                <TableRow>
                  <TableCell className="px-4 py-10 text-muted-foreground" colSpan={6}>
                    No company types found.
                  </TableCell>
                </TableRow>
              )}

              {loading && (
                <TableRow>
                  <TableCell className="px-4 py-10 text-muted-foreground" colSpan={6}>
                    Loading…
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New company type</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ct-id">ID</Label>
              <Input id="ct-id" value={createId} onChange={(e) => setCreateId(e.target.value)} placeholder="e.g. limited_liability" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ct-code">Code</Label>
              <Input id="ct-code" value={createCode} onChange={(e) => setCreateCode(e.target.value)} placeholder="e.g. LLC" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ct-name">Name</Label>
              <Input id="ct-name" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="e.g. Limited Liability Company" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ct-business-type">Business type</Label>
              <Select value={createBusinessType} onValueChange={(v) => setCreateBusinessType(v as BusinessType)}>
                <SelectTrigger id="ct-business-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((bt) => (
                    <SelectItem key={bt} value={bt}>
                      {bt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button
              onClick={() => void submitCreate()}
              disabled={!createId.trim() || !createCode.trim() || !createName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit company type</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>ID</Label>
              <Input value={editing?.id ?? ""} disabled />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ct-edit-code">Code</Label>
              <Input id="ct-edit-code" value={editCode} onChange={(e) => setEditCode(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ct-edit-name">Name</Label>
              <Input id="ct-edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ct-edit-business-type">Business type</Label>
              <Select value={editBusinessType} onValueChange={(v) => setEditBusinessType(v as BusinessType)}>
                <SelectTrigger id="ct-edit-business-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((bt) => (
                    <SelectItem key={bt} value={bt}>
                      {bt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <div className="text-sm font-medium">Active</div>
                <div className="text-xs text-muted-foreground">Inactive types may be hidden from selectors.</div>
              </div>
              <Switch checked={editActive} onCheckedChange={setEditActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => void submitEdit()} disabled={!editCode.trim() || !editName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDeactivate}
        onOpenChange={(o) => !o && setConfirmDeactivate(null)}
        title="Deactivate company type?"
        description={confirmDeactivate ? `This will mark “${confirmDeactivate.name}” as inactive.` : undefined}
        confirmLabel="Deactivate"
        variant="destructive"
        onConfirm={() => confirmDeactivate ? deactivate(confirmDeactivate.id) : undefined}
      />
    </div>
  );
}

