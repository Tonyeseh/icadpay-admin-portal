import { Navigate, Outlet } from "react-router-dom";
import { useAdminStore } from "@/store/useAdminStore";

export function RequireAuth() {
  const user = useAdminStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
