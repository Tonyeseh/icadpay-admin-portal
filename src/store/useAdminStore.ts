import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminUser } from "@/types";
import { adminLogout, adminRefresh, type AdminAuthResponse } from "@/lib/admin-auth-api";
import { permissionsFromAccessToken } from "@/lib/jwt";
import { mapAdminDtoToUser } from "@/lib/map-admin-user";

interface AdminState {
  user: AdminUser | null;
  /** In-memory only; refresh cookie backs session persistence across reloads. */
  accessToken: string | null;
  permissions: string[];
  roleId: string | null;
  roleName: string | null;
  sidebarCollapsed: boolean;
  /** Incremented on sign-out so a late refresh cannot restore the session. */
  sessionEpoch: number;

  setSessionFromAuthResponse: (data: AdminAuthResponse, epoch?: number) => void;
  bootstrapSession: () => Promise<boolean>;
  signOut: () => Promise<void>;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
}

const emptySession = {
  user: null,
  accessToken: null,
  permissions: [] as string[],
  roleId: null,
  roleName: null,
};

let bootstrapInFlight: Promise<boolean> | null = null;

function permissionsFromResponse(data: AdminAuthResponse): string[] {
  const body = Array.isArray(data.user.permissions) ? data.user.permissions : [];
  if (body.length > 0) return body;
  return permissionsFromAccessToken(data.accessToken) ?? [];
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      permissions: [],
      roleId: null,
      roleName: null,
      sidebarCollapsed: false,
      sessionEpoch: 0,

      setSessionFromAuthResponse: (data, epoch) => {
        if (epoch !== undefined && epoch !== get().sessionEpoch) return;
        set({
          accessToken: data.accessToken,
          user: mapAdminDtoToUser(data.user),
          permissions: permissionsFromResponse(data),
          roleId: data.user.roleId,
          roleName: data.user.roleName,
        });
      },

      bootstrapSession: async () => {
        if (get().accessToken) return true;
        if (bootstrapInFlight) return bootstrapInFlight;

        const epoch = get().sessionEpoch;
        bootstrapInFlight = (async () => {
          try {
            const data = await adminRefresh();
            get().setSessionFromAuthResponse(data, epoch);
            return get().sessionEpoch === epoch && get().user !== null;
          } catch {
            if (get().sessionEpoch === epoch) set(emptySession);
            return false;
          } finally {
            bootstrapInFlight = null;
          }
        })();

        return bootstrapInFlight;
      },

      signOut: async () => {
        set((state) => ({
          ...emptySession,
          sessionEpoch: state.sessionEpoch + 1,
        }));
        try {
          await adminLogout();
        } catch {
          // Cookie may already be cleared; client session is already dropped.
        }
      },

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
    }),
    {
      name: "icad-pay-admin",
      version: 2,
      partialize: (s) => ({
        user: s.user,
        permissions: s.permissions,
        roleId: s.roleId,
        roleName: s.roleName,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
      migrate: (persisted, version) => {
        const state = persisted as {
          user?: AdminUser | null;
          permissions?: string[];
          roleId?: string | null;
          roleName?: string | null;
          sidebarCollapsed?: boolean;
        };
        if (version < 2) {
          return {
            user: null,
            permissions: [],
            roleId: null,
            roleName: null,
            sidebarCollapsed: state.sidebarCollapsed ?? false,
          };
        }
        return {
          user: state.user ?? null,
          permissions: state.permissions ?? [],
          roleId: state.roleId ?? null,
          roleName: state.roleName ?? null,
          sidebarCollapsed: state.sidebarCollapsed ?? false,
        };
      },
    },
  ),
);
