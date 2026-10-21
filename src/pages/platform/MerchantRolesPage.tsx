import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { RolePermissionPicker } from "@/components/platform/RolePermissionPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  MERCHANT_ROLE_OWNER_ID,
  createMerchantRole,
  deleteMerchantRole,
  formatRoleApiError,
  getMerchantRole,
  listMerchantRolePermissionCatalog,
  listMerchantRoles,
  patchMerchantRole,
  type MerchantRoleDetail,
  type MerchantRoleListItem,
  type PermissionCatalogItem,
} from "@/lib/admin-catalog-api";
import { formatDate } from "@/lib/format";
import { hasPermission } from "@/lib/rbac";
import { useAdminStore } from "@/store/useAdminStore";

const PAGE_SIZE = 20;

export function MerchantRolesPage() {
  const permissions = useAdminStore((s) => s.permissions);
  const canCreate = hasPermission(permissions, "merchant_roles.create");
  const canUpdate = hasPermission(permissions, "merchant_roles.update");
  const canDelete = hasPermission(permissions, "merchant_roles.delete");
  const showActions = canUpdate || canDelete;
  const colSpan = showActions ? 5 : 4;

  const [pageNumber, setPageNumber] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [rows, setRows] = useState<MerchantRoleListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [listLoaded, setListLoaded] = useState(false);
  const [listFailed, setListFailed] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MerchantRoleDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<MerchantRoleListItem | null>(null);

  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listMerchantRolePermissionCatalog()
      .then((items) => {
        if (!cancelled) setCatalog(items);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(formatRoleApiError(err));
      })
      .finally(() => {
        if (!cancelled) setCatalogLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let redirected = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setListLoading(true);
    listMerchantRoles(pageNumber, PAGE_SIZE)
      .then((page) => {
        if (cancelled) return;
        const lastPage = Math.max(1, Math.ceil(page.totalCount / PAGE_SIZE));
        if (pageNumber > lastPage) {
          redirected = true;
          setPageNumber(lastPage);
          return;
        }
        setRows(page.items);
        setTotalCount(page.totalCount);
        setListLoaded(true);
        setListFailed(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setListFailed(true);
        toast.error(formatRoleApiError(err));
      })
      .finally(() => {
        if (!cancelled && !redirected) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pageNumber, reloadToken]);

  useEffect(() => {
    if (!editingId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetailLoading(true);
    getMerchantRole(editingId)
      .then((role) => {
        if (cancelled) return;
        setDetail(role);
        setName(role.name);
        setSelected(new Set(role.permissions.map((item) => item.id)));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        toast.error(formatRoleApiError(err));
        setEditingId(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editingId]);

  function closeDialog() {
    setCreating(false);
    setEditingId(null);
    setDetail(null);
    setDetailLoading(false);
    setName("");
    setSelected(new Set());
  }

  function openCreate() {
    setCreating(true);
    setEditingId(null);
    setDetail(null);
    setDetailLoading(false);
    setName("");
    setSelected(new Set());
  }

  function openDetail(id: string) {
    if (editingId === id) return;
    setCreating(false);
    setDetail(null);
    setName("");
    setSelected(new Set());
    setDetailLoading(true);
    setEditingId(id);
  }

  const trimmedName = name.trim();
  const merchantLocked = Boolean(detail?.createdByMerchant);
  const canEditName = canUpdate && !merchantLocked;
  const showSubmit = creating ? canCreate : canEditName;
  const nameUnchanged = Boolean(detail) && trimmedName === detail?.name;
  const dialogOpen = creating || editingId !== null;
  const dialogTitle = creating ? "New merchant role" : canEditName ? "Edit merchant role" : "Merchant role";
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const showInitialLoading = listLoading && !listLoaded;
  const showEmpty = listLoaded && !listFailed && rows.length === 0;

  async function submitCreate() {
    if (!trimmedName || submitting) return;
    setSubmitting(true);
    try {
      await createMerchantRole({ name: trimmedName, permission: [...selected] });
      toast.success("Role created");
      closeDialog();
      setReloadToken((n) => n + 1);
    } catch (err: unknown) {
      toast.error(formatRoleApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitEdit() {
    if (!detail || !trimmedName || submitting || trimmedName === detail.name) return;
    setSubmitting(true);
    try {
      await patchMerchantRole(detail.id, { name: trimmedName });
      toast.success("Role updated");
      closeDialog();
      setReloadToken((n) => n + 1);
    } catch (err: unknown) {
      toast.error(formatRoleApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeRole(id: string) {
    try {
      await deleteMerchantRole(id);
      toast.success("Role deleted");
      setReloadToken((n) => n + 1);
    } catch (err: unknown) {
      toast.error(formatRoleApiError(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Merchant roles"
        description="Manage merchant roles. Permissions are chosen when a role is created."
        actions={
          canCreate ? (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon className="size-4" />
              New
            </Button>
          ) : null
        }
      />

      <Card size="sm">
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="px-4">Name</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created by</TableHead>
                <TableHead>Created</TableHead>
                {showActions ? <TableHead className="w-10 px-4" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {rows.map((role) => {
                const canDeleteRow = canDelete && role.id !== MERCHANT_ROLE_OWNER_ID;
                const hasMenu = canUpdate || canDeleteRow;
                return (
                  <TableRow key={role.id}>
                    <TableCell className="px-4">
                      <button
                        type="button"
                        className="text-left font-medium hover:underline"
                        onClick={() => openDetail(role.id)}
                      >
                        {role.name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {role.createdByMerchant ? "Merchant" : "Platform"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{role.createdBy}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(role.createdAt)}</TableCell>
                    {showActions ? (
                      <TableCell className="px-4">
                        {hasMenu ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                                <MoreHorizontalIcon className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canUpdate ? (
                                <DropdownMenuItem onClick={() => openDetail(role.id)}>Edit</DropdownMenuItem>
                              ) : null}
                              {canUpdate && canDeleteRow ? <DropdownMenuSeparator /> : null}
                              {canDeleteRow ? (
                                <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(role)}>
                                  Delete
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}

              {showInitialLoading && (
                <TableRow>
                  <TableCell className="px-4 py-10 text-muted-foreground" colSpan={colSpan}>
                    Loading…
                  </TableCell>
                </TableRow>
              )}

              {showEmpty && (
                <TableRow>
                  <TableCell className="px-4 py-10 text-muted-foreground" colSpan={colSpan}>
                    No roles found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {listLoaded && totalCount > PAGE_SIZE && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Page {pageNumber} of {totalPages} · {totalCount.toLocaleString()} roles
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={listLoading || pageNumber <= 1}
              onClick={() => {
                setListLoading(true);
                setPageNumber((page) => Math.max(1, page - 1));
              }}
              className="gap-1"
            >
              <ChevronLeftIcon className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={listLoading || pageNumber >= totalPages}
              onClick={() => {
                setListLoading(true);
                setPageNumber((page) => page + 1);
              }}
              className="gap-1"
            >
              Next
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (submitting) return;
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>

          {editingId && detailLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Spinner />
              Loading role…
            </div>
          ) : (
            <div className="grid gap-4">
              {!creating && detail && (
                <div className="grid gap-1.5">
                  <Label>ID</Label>
                  <Input value={detail.id} disabled />
                </div>
              )}

              <div className="grid gap-1.5">
                <Label htmlFor="mr-name">Name</Label>
                <Input
                  id="mr-name"
                  value={name}
                  maxLength={128}
                  disabled={submitting || (!creating && !canEditName)}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Compliance Reviewer"
                />
                {merchantLocked ? (
                  <p className="text-xs text-muted-foreground">
                    This role was created by a merchant and cannot be edited.
                  </p>
                ) : null}
              </div>

              <div className="rounded-lg border">
                <div className="border-b px-3 py-2">
                  <div className="text-sm font-medium">Permissions</div>
                  <div className="text-xs text-muted-foreground">
                    {creating
                      ? "Choose the permissions this role starts with."
                      : "Permissions on an existing merchant role cannot be changed."}
                  </div>
                </div>
                {catalogLoaded ? (
                  <RolePermissionPicker
                    catalog={catalog}
                    selected={selected}
                    onChange={setSelected}
                    disabled={!creating || submitting}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                    <Spinner />
                    Loading permissions…
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            {showSubmit && !(editingId && detailLoading) ? (
              <Button
                onClick={() => void (creating ? submitCreate() : submitEdit())}
                disabled={
                  !trimmedName ||
                  submitting ||
                  detailLoading ||
                  (creating && !catalogLoaded) ||
                  (!creating && nameUnchanged)
                }
              >
                {creating ? "Create" : "Save"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        title="Delete role?"
        description={confirmDelete ? `This will permanently delete “${confirmDelete.name}”.` : undefined}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => (confirmDelete ? removeRole(confirmDelete.id) : undefined)}
      />
    </div>
  );
}
