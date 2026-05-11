import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminRole, AdminUser } from "@/types";

interface AdminState {
  user: AdminUser | null;
  role: AdminRole;
  sidebarCollapsed: boolean;

  signIn: (user: AdminUser) => void;
  signOut: () => void;
  setRole: (role: AdminRole) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      user: null,
      role: "super_admin",
      sidebarCollapsed: false,
      signIn: (user) => set({ user, role: user.role }),
      signOut: () => set({ user: null }),
      setRole: (role) => set({ role }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
    }),
    {
      name: "icad-pay-admin",
      partialize: (s) => ({ user: s.user, role: s.role, sidebarCollapsed: s.sidebarCollapsed }),
    },
  ),
);
