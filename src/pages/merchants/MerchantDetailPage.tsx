import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  ReceiptIcon,
  BuildingIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  GlobeIcon,
  UsersIcon,
  MapPinIcon,
  DownloadIcon,
  EyeIcon,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";
import {
  getAdminMerchantDetail,
  loadAdminMerchantLogo,
  type AdminMerchantDetail,
} from "@/lib/admin-merchants-api";
import { formatAdminApiError, formatAdminOnboardingError, type AdminApiError } from "@/lib/admin-catalog-api";
import {
  downloadAdminDocument,
  loadAdminDocumentFile,
  saveAdminDocumentBlob,
} from "@/lib/admin-merchant-onboarding-api";
import { hasPermission } from "@/lib/rbac";
import { MerchantHistoryCard } from "@/pages/merchants/MerchantHistoryCard";
import { MerchantOnboardingPanel } from "@/pages/merchants/MerchantOnboardingPanel";
import { MerchantSettlementBankCard } from "@/pages/merchants/MerchantSettlementBankCard";
import { useAdminStore } from "@/store/useAdminStore";

export function MerchantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const backTo = "/merchants";
  const backLabel = "Merchants";

  const [merchant, setMerchant] = useState<AdminMerchantDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ documentId: string; fileName: string } | null>(null);
  const [historyRevision, setHistoryRevision] = useState(0);

  const load = useCallback(async () => {
    if (!id?.trim()) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const row = await getAdminMerchantDetail(id);
      if (!row) {
        setMerchant(null);
        setNotFound(true);
      } else {
        setMerchant(row);
      }
    } catch (e) {
      const err = e as AdminApiError;
      setError(formatAdminApiError(err.body));
      setMerchant(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setPreview(null);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleMerchantChanged = useCallback(() => {
    void load();
    setHistoryRevision((revision) => revision + 1);
  }, [load]);

  if (loading && !merchant && !error) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-12 w-2/3 max-w-md" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Skeleton className="h-64" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (notFound && !loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Merchant not found.</p>
        <Link to={backTo} className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to {backLabel.toLowerCase()}
        </Link>
      </div>
    );
  }

  if (error && !merchant) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-destructive">{error}</p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()}>
            Retry
          </Button>
          <Link to={backTo}>
            <Button variant="ghost" size="sm">
              Back to {backLabel.toLowerCase()}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return null;
  }

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground">
          <Link to={backTo}>
            <ArrowLeftIcon className="size-4" />
            {backLabel}
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <MerchantLogo
            merchantId={merchant.id}
            displayName={merchant.displayName}
            logoUrl={merchant.logoUrl}
          />
          <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">{merchant.displayName}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={merchant.onboardingStatus} />
          <StatusBadge status={merchant.status} />
          <StatusBadge status={merchant.accountMode || "—"} />
        </div>
      </div>

      {error && (
        <Card size="sm" className="mb-4 border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="order-2 min-w-0 flex-1 space-y-4 lg:order-1">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Identity and contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <InfoRow icon={<BuildingIcon className="size-4" />} label="Display name" value={merchant.displayName} />
                <InfoRow icon={<BuildingIcon className="size-4" />} label="Trading name" value={merchant.tradingName || "—"} />
                <InfoRow icon={<BuildingIcon className="size-4" />} label="Business type" value={merchant.businessType} />
                <InfoRow icon={<BuildingIcon className="size-4" />} label="Industry" value={merchant.industryType ?? "—"} />
                <InfoRow icon={<BuildingIcon className="size-4" />} label="Company type" value={merchant.companyType ?? "—"} />
                <InfoRow icon={<BuildingIcon className="size-4" />} label="Account mode" value={merchant.accountMode || "—"} />
                <InfoRow icon={<UsersIcon className="size-4" />} label="Staff size" value={merchant.staffSize || "—"} />
                <InfoRow icon={<GlobeIcon className="size-4" />} label="Website" value={merchant.website || "—"} />
                <InfoRow icon={<MailIcon className="size-4" />} label="Email" value={merchant.emailAddress ?? "—"} />
                <InfoRow icon={<MailIcon className="size-4" />} label="Support email" value={merchant.supportEmailAddress || "—"} />
                <InfoRow icon={<PhoneIcon className="size-4" />} label="Phone" value={merchant.phoneNumber ?? "—"} />
                <InfoRow icon={<MapPinIcon className="size-4" />} label="Address" value={merchant.address ?? "—"} />
                <InfoRow icon={<MapPinIcon className="size-4" />} label="Registered address" value={merchant.registeredAddress || "—"} />
                <InfoRow icon={<CalendarIcon className="size-4" />} label="Created" value={formatDateTime(merchant.createdAt)} />
                <InfoRow icon={<CalendarIcon className="size-4" />} label="Updated" value={merchant.updatedAt ? formatDateTime(merchant.updatedAt) : "—"} />
                <InfoRow
                  icon={<ReceiptIcon className="size-4" />}
                  label="Recent transactions (30d)"
                  value={merchant.recentTransactionsCount.toLocaleString()}
                />
              </div>
            </CardContent>
          </Card>

          <MerchantSettlementBankCard
            merchantId={merchant.id}
            settlementBank={merchant.settlementBank}
            onChanged={handleMerchantChanged}
          />

          <Card size="sm">
            <CardHeader>
              <CardTitle>Owners</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Nationality</th>
                      <th className="px-4 py-3 text-left font-medium">ID</th>
                      <th className="px-4 py-3 text-left font-medium">Address</th>
                      <th className="px-4 py-3 text-right font-medium">ID file</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {merchant.owners.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                          No beneficial owners on file.
                        </td>
                      </tr>
                    ) : (
                      merchant.owners.map((o) => (
                        <tr key={o.id}>
                          <td className="px-4 py-3 font-medium">
                            {o.firstName} {o.lastName}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{o.nationality}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {o.idType}: {o.idNumber}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{o.address}</td>
                          <td className="px-4 py-3 text-right">
                            {o.identificationDocumentId.trim() ? (
                              <DocumentFileActions
                                documentId={o.identificationDocumentId}
                                fileName="Identification document"
                                onView={setPreview}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">No ID file on file.</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Business documents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                      <th className="px-4 py-3 text-left font-medium">File</th>
                      <th className="px-4 py-3 text-left font-medium">Type</th>
                      <th className="px-4 py-3 text-left font-medium">Uploaded</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {merchant.businessDocuments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                          No business documents on file.
                        </td>
                      </tr>
                    ) : (
                      merchant.businessDocuments.map((d) => (
                        <tr key={d.id}>
                          <td className="px-4 py-3 font-medium">{d.origingalFileName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{d.documentTypeName}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(d.uploadedAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <DocumentFileActions
                              documentId={d.id}
                              fileName={d.origingalFileName}
                              onView={setPreview}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="order-1 flex w-full shrink-0 flex-col gap-4 lg:order-2 lg:w-80">
          <MerchantOnboardingPanel
            merchantId={merchant.id}
            onboardingStatus={merchant.onboardingStatus}
            onCaseChanged={handleMerchantChanged}
          />
          <MerchantHistoryCard merchantId={merchant.id} revision={historyRevision} />
        </aside>
      </div>

      <DocumentPreviewSheet target={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

function logoInitial(displayName: string): string {
  const first = displayName.trim().charAt(0);
  return first ? first.toUpperCase() : "M";
}

function canRenderLogo(contentType: string): boolean {
  const type = contentType.trim().toLowerCase();
  return type.startsWith("image/") || type === "application/octet-stream" || type === "";
}

function MerchantLogo({
  merchantId,
  displayName,
  logoUrl,
}: {
  merchantId: string;
  displayName: string;
  logoUrl: string | null;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [loadNote, setLoadNote] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const hasLogo = Boolean(logoUrl?.trim());
    if (!hasLogo) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setSrc(null);
      setLoadNote(null);
      return;
    }

    let cancelled = false;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSrc(null);
    setLoadNote(null);

    void loadAdminMerchantLogo(merchantId)
      .then((file) => {
        if (cancelled) return;
        if (!file || !canRenderLogo(file.contentType)) {
          setSrc(null);
          return;
        }
        const objectUrl = URL.createObjectURL(file.blob);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        objectUrlRef.current = objectUrl;
        setSrc(objectUrl);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const err = e as Partial<AdminApiError>;
        setSrc(null);
        if (err.status !== 404) setLoadNote("Logo could not be loaded.");
      });

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [merchantId, logoUrl]);

  return (
    <div className="flex shrink-0 flex-col items-start gap-1">
      {src ? (
        <img
          src={src}
          alt={displayName}
          className="size-10 rounded-md object-cover"
          onError={() => {
            if (objectUrlRef.current) {
              URL.revokeObjectURL(objectUrlRef.current);
              objectUrlRef.current = null;
            }
            setSrc(null);
          }}
        />
      ) : (
        <span
          className="flex size-10 items-center justify-center rounded-md bg-muted text-sm font-medium text-muted-foreground"
          aria-hidden="true"
        >
          {logoInitial(displayName)}
        </span>
      )}
      {loadNote ? <p className="text-xs text-muted-foreground">{loadNote}</p> : null}
    </div>
  );
}

function DocumentFileActions({
  documentId,
  fileName,
  onView,
}: {
  documentId: string;
  fileName: string;
  onView: (target: { documentId: string; fileName: string }) => void;
}) {
  const permissions = useAdminStore((s) => s.permissions);
  const canViewDocuments = hasPermission(permissions, "documents.view");
  const [downloading, setDownloading] = useState(false);

  if (!canViewDocuments) return null;

  async function download() {
    const id = documentId.trim();
    if (!id) return;
    setDownloading(true);
    try {
      await downloadAdminDocument(id, fileName);
    } catch (e) {
      const err = e as AdminApiError;
      toast.error(formatAdminOnboardingError(err.body));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={downloading}
        onClick={() => onView({ documentId: documentId.trim(), fileName })}
      >
        <EyeIcon className="size-4" />
        View
      </Button>
      <Button size="sm" variant="outline" disabled={downloading} onClick={() => void download()}>
        <DownloadIcon className="size-4" />
        Download
      </Button>
    </div>
  );
}

type PreviewState =
  | { kind: "loading" }
  | { kind: "ready"; url: string; contentType: string; blob: Blob; fileName: string }
  | { kind: "error"; message: string };

function previewKind(contentType: string): "image" | "pdf" | "none" {
  const ct = contentType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (ct.startsWith("image/")) return "image";
  if (ct === "application/pdf" || ct === "application/x-pdf") return "pdf";
  return "none";
}

function DocumentPreviewSheet({
  target,
  onClose,
}: {
  target: { documentId: string; fileName: string } | null;
  onClose: () => void;
}) {
  const permissions = useAdminStore((s) => s.permissions);
  const canViewDocuments = hasPermission(permissions, "documents.view");
  const [state, setState] = useState<PreviewState>({ kind: "loading" });

  useEffect(() => {
    if (!target || !canViewDocuments) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    setState({ kind: "loading" });
    void loadAdminDocumentFile(target.documentId, target.fileName)
      .then((file) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(file.blob);
        setState({
          kind: "ready",
          url: objectUrl,
          contentType: file.contentType,
          blob: file.blob,
          fileName: file.fileName,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const err = e as AdminApiError;
        setState({ kind: "error", message: formatAdminOnboardingError(err.body) });
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [target, canViewDocuments]);

  const title = state.kind === "ready" ? state.fileName : (target?.fileName ?? "Document");
  const kind = state.kind === "ready" ? previewKind(state.contentType) : "none";

  return (
    <Sheet open={target !== null && canViewDocuments} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-hidden sm:max-w-3xl!"
      >
        <SheetHeader className="border-b pr-12">
          <SheetTitle className="truncate">{title}</SheetTitle>
          <SheetDescription>
            {state.kind === "ready" && state.contentType ? state.contentType : "Document preview"}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {state.kind === "loading" && <Skeleton className="h-[70vh] w-full" />}
          {state.kind === "error" && <p className="text-sm text-destructive">{state.message}</p>}
          {state.kind === "ready" && kind === "image" && (
            <img src={state.url} alt={state.fileName} className="mx-auto max-h-[70vh] max-w-full object-contain" />
          )}
          {state.kind === "ready" && kind === "pdf" && (
            <iframe title={state.fileName} src={state.url} className="h-[70vh] w-full rounded-md border bg-background" />
          )}
          {state.kind === "ready" && kind === "none" && (
            <p className="text-sm text-muted-foreground">This file type cannot be previewed.</p>
          )}
        </div>
        {canViewDocuments ? (
          <SheetFooter className="border-t">
            <Button
              variant="outline"
              disabled={!target || state.kind === "loading"}
              onClick={() => {
                if (!target || !canViewDocuments) return;
                if (state.kind === "ready") {
                  saveAdminDocumentBlob(state.blob, state.fileName);
                  return;
                }
                void downloadAdminDocument(target.documentId, target.fileName).catch((e: unknown) => {
                  const err = e as AdminApiError;
                  toast.error(formatAdminOnboardingError(err.body));
                });
              }}
            >
              <DownloadIcon className="size-4" />
              Download
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <span className="text-muted-foreground">{label}: </span>
        <span className="font-medium break-words">{value}</span>
      </div>
    </div>
  );
}
