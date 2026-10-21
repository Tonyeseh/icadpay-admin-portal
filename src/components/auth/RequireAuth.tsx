import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAdminStore } from "@/store/useAdminStore";
import { Spinner } from "@/components/ui/spinner";

export function RequireAuth() {
  const user = useAdminStore((s) => s.user);
  const accessToken = useAdminStore((s) => s.accessToken);
  const bootstrapSession = useAdminStore((s) => s.bootstrapSession);

  /** After bootstrap attempt completes (success or failure). False while cookie/session refresh runs. */
  const [bootstrapDone, setBootstrapDone] = useState(() => !!useAdminStore.getState().accessToken);

  useEffect(() => {
    if (accessToken) return;

    let cancelled = false;
    void bootstrapSession().finally(() => {
      if (!cancelled) setBootstrapDone(true);
    });

    return () => {
      cancelled = true;
    };
  }, [accessToken, bootstrapSession]);

  const checking = !accessToken && !bootstrapDone;

  if (checking) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-background">
        <Spinner className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Checking session…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
