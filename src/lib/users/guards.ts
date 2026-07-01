import type { Role } from "@/lib/auth/roles";

export type ManagedUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  created_at: string;
};

type UserLite = Pick<ManagedUser, "id" | "role">;
export type GuardResult = { ok: true } | { ok: false; error: string };

export function countAdmins(users: UserLite[]): number {
  return users.filter((u) => u.role === "admin").length;
}

/**
 * Prevent the two ways an admin can lock everyone out of administration:
 * deleting yourself, or deleting the only remaining admin.
 */
export function checkDeleteUser(
  users: UserLite[],
  currentUserId: string,
  targetId: string,
): GuardResult {
  if (targetId === currentUserId) {
    return { ok: false, error: "Kendinizi silemezsiniz." };
  }
  const target = users.find((u) => u.id === targetId);
  if (!target) return { ok: false, error: "Kullanıcı bulunamadı." };
  if (target.role === "admin" && countAdmins(users) <= 1) {
    return { ok: false, error: "Son yönetici silinemez." };
  }
  return { ok: true };
}

/**
 * Same lockout protection for role changes: you cannot drop your own admin
 * rights, and the last admin cannot be demoted.
 */
export function checkRoleChange(
  users: UserLite[],
  currentUserId: string,
  targetId: string,
  newRole: Role,
): GuardResult {
  const target = users.find((u) => u.id === targetId);
  if (!target) return { ok: false, error: "Kullanıcı bulunamadı." };
  if (target.role === newRole) return { ok: true };

  const isDemotingAdmin = target.role === "admin" && newRole !== "admin";
  if (isDemotingAdmin) {
    if (targetId === currentUserId) {
      return { ok: false, error: "Kendi yönetici yetkinizi düşüremezsiniz." };
    }
    if (countAdmins(users) <= 1) {
      return { ok: false, error: "Son yöneticinin rolü düşürülemez." };
    }
  }
  return { ok: true };
}
