import type { AdminAuthUserDto } from "@/lib/admin-auth-api";
import type { AdminUser } from "@/types";

export function mapAdminDtoToUser(dto: AdminAuthUserDto): AdminUser {
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    phone: "",
    role: dto.roleName,
    status: dto.isActive ? "active" : "suspended",
    createdAt: new Date().toISOString(),
    twoFAEnabled: false,
  };
}
