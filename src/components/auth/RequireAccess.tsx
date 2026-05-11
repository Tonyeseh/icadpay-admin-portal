import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminStore } from "@/store/useAdminStore";
import { canVisit } from "@/lib/rbac";

export function RequireAccess() {
  const role = useAdminStore((s) => s.role);
  const { pathname } = useLocation();

  if (!canVisit(role, pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
