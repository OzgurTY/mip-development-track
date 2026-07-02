import type { Role } from "@/lib/auth/roles";

export type ManagedUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  is_superadmin: boolean;
  created_at: string;
};

// A superadmin is an admin with the flag, so the effective access tier is:
export type Tier = "viewer" | "editor" | "admin" | "superadmin";

type UserLite = Pick<ManagedUser, "id" | "role" | "is_superadmin">;
export type GuardResult = { ok: true } | { ok: false; error: string };

export function userTier(u: Pick<ManagedUser, "role" | "is_superadmin">): Tier {
  return u.is_superadmin ? "superadmin" : u.role;
}

function isAdminLevel(u: UserLite): boolean {
  return u.is_superadmin || u.role === "admin";
}

export function countSuperadmins(users: UserLite[]): number {
  return users.filter((u) => u.is_superadmin).length;
}

export function countAdminLevel(users: UserLite[]): number {
  return users.filter(isAdminLevel).length;
}

// Split the UI tier back into what the DB stores.
export function tierToStored(tier: Tier): { role: Role; is_superadmin: boolean } {
  if (tier === "superadmin") return { role: "admin", is_superadmin: true };
  return { role: tier, is_superadmin: false };
}

/**
 * Prevent locking everyone out: no self-delete, and never remove the last
 * superadmin or the last admin-level account.
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
  if (target.is_superadmin && countSuperadmins(users) <= 1) {
    return { ok: false, error: "Son süper yönetici silinemez." };
  }
  if (isAdminLevel(target) && countAdminLevel(users) <= 1) {
    return { ok: false, error: "Son yönetici silinemez." };
  }
  return { ok: true };
}

/**
 * Same lockout protection for tier changes: you cannot drop your own admin
 * rights, and the last superadmin / last admin-level cannot be demoted.
 */
export function checkTierChange(
  users: UserLite[],
  currentUserId: string,
  targetId: string,
  newTier: Tier,
): GuardResult {
  const target = users.find((u) => u.id === targetId);
  if (!target) return { ok: false, error: "Kullanıcı bulunamadı." };
  const current = userTier(target);
  if (current === newTier) return { ok: true };

  const losesSuperadmin = target.is_superadmin && newTier !== "superadmin";
  if (losesSuperadmin) {
    if (targetId === currentUserId) {
      return {
        ok: false,
        error: "Kendi süper yönetici yetkinizi düşüremezsiniz.",
      };
    }
    if (countSuperadmins(users) <= 1) {
      return { ok: false, error: "Son süper yöneticinin yetkisi düşürülemez." };
    }
  }

  const stored = tierToStored(newTier);
  const losesAdminLevel =
    isAdminLevel(target) && !(stored.role === "admin" || stored.is_superadmin);
  if (losesAdminLevel) {
    if (targetId === currentUserId) {
      return { ok: false, error: "Kendi yönetici yetkinizi düşüremezsiniz." };
    }
    if (countAdminLevel(users) <= 1) {
      return { ok: false, error: "Son yöneticinin rolü düşürülemez." };
    }
  }
  return { ok: true };
}
