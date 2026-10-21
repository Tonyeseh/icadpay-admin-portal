import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminStore } from "@/store/useAdminStore";
import { canVisit } from "@/lib/rbac";

export function RequireAccess() {
  const permissions = useAdminStore((s) => s.permissions);
  const { pathname } = useLocation();

  if (!canVisit(permissions, pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
