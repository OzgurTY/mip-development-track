"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePageAccess, type PageKey } from "@/lib/auth/pages";
import type { Role } from "@/lib/auth/roles";
import {
  checkDeleteUser,
  checkPageAccessChange,
  checkTierChange,
  tierToStored,
  userTier,
  type ManagedUser,
} from "./guards";

export type SaveState = { error: string } | { ok: true } | null;

const TIERS = ["viewer", "editor", "admin", "superadmin"] as const;

type Caller = { id: string; isSuperadmin: boolean };
type UserLite = Pick<ManagedUser, "id" | "role" | "is_superadmin">;

// Every action re-verifies the caller is at least admin server-side and reports
// whether they are a superadmin (needed for the credential-level gates).
async function requireAdmin(): Promise<Caller | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_superadmin")
    .eq("id", user.id)
    .single();
  const isSuperadmin = profile?.is_superadmin === true;
  const isAdmin = profile?.role === "admin" || isSuperadmin;
  if (!isAdmin) return { error: "Bu işlem için yetkiniz yok." };
  return { id: user.id, isSuperadmin };
}

/**
 * Formdan gelen sayfa erisimi: "all" = kisitlama yok (null), JSON dizi =
 * secili anahtarlar. Alan hic gonderilmediyse undefined doner ve dokunulmaz.
 */
function readPageAccess(
  raw: FormDataEntryValue | null,
  role: Role,
): PageKey[] | null | undefined {
  if (raw === null) return undefined;
  const value = String(raw);
  if (value === "all") return null;
  try {
    return normalizePageAccess(JSON.parse(value), role);
  } catch {
    return undefined;
  }
}

async function loadUsers(): Promise<UserLite[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, role, is_superadmin");
  return (data ?? []) as UserLite[];
}

const createSchema = z.object({
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "Parola en az 8 karakter olmalı"),
  full_name: z.string().trim().min(1, "Ad Soyad gerekli").max(120),
  tier: z.enum(TIERS),
});

export async function createUser(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  // Creating an account issues a password, so it is a superadmin-only action.
  if (!auth.isSuperadmin) {
    return { error: "Kullanıcı oluşturma yalnızca süper yöneticide." };
  }

  const parsed = createSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
    tier: formData.get("tier"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz giriş" };
  }
  const { role, is_superadmin } = tierToStored(parsed.data.tier);

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name },
  });
  if (error || !data.user) {
    const msg = error?.message ?? "";
    return {
      error: /already|registered|exists/i.test(msg)
        ? "Bu e-posta zaten kayıtlı."
        : "Kullanıcı oluşturulamadı.",
    };
  }

  // Super yonetici kisitlanmaz; digerlerinde form degeri uygulanir.
  const pageAccess = is_superadmin
    ? null
    : (readPageAccess(formData.get("page_access"), role) ?? null);

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      role,
      is_superadmin,
      full_name: parsed.data.full_name,
      page_access: pageAccess,
    })
    .eq("id", data.user.id);
  if (profileError) return { error: "Rol atanamadı." };

  revalidatePath("/yonetim/kullanicilar");
  return { ok: true };
}

const updateSchema = z.object({
  full_name: z.string().trim().min(1, "Ad Soyad gerekli").max(120),
  tier: z.enum(TIERS),
  password: z
    .union([z.string().min(8, "Parola en az 8 karakter olmalı"), z.literal("")])
    .optional(),
});

export async function updateUser(
  userId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = updateSchema.safeParse({
    full_name: formData.get("full_name"),
    tier: formData.get("tier"),
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz giriş" };
  }

  const users = await loadUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) return { error: "Kullanıcı bulunamadı." };

  // Only a superadmin can grant/revoke the superadmin tier. A non-superadmin
  // may not touch a superadmin's tier at all, and may not promote to superadmin.
  let role = target.role;
  let is_superadmin = target.is_superadmin;
  if (auth.isSuperadmin) {
    ({ role, is_superadmin } = tierToStored(parsed.data.tier));
  } else if (!target.is_superadmin) {
    if (parsed.data.tier === "superadmin") {
      return { error: "Süper yönetici atama yalnızca süper yöneticide." };
    }
    ({ role, is_superadmin } = tierToStored(parsed.data.tier));
  }

  const guard = checkTierChange(
    users,
    auth.id,
    userId,
    userTier({ role, is_superadmin }),
  );
  if (!guard.ok) return { error: guard.error };

  // Sayfa erisimi yeni role gore temizlenir (rol dusunce fazla sayfa dusmesin).
  const submittedAccess = readPageAccess(formData.get("page_access"), role);
  const patch: Record<string, unknown> = {
    role,
    is_superadmin,
    full_name: parsed.data.full_name,
  };
  if (is_superadmin) {
    patch.page_access = null;
  } else if (submittedAccess !== undefined) {
    const accessGuard = checkPageAccessChange(auth.id, userId, target);
    if (!accessGuard.ok) return { error: accessGuard.error };
    patch.page_access = submittedAccess;
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update(patch).eq("id", userId);
  if (error) return { error: "Güncellenemedi." };

  // Resetting another user's password is a superadmin-only action.
  if (parsed.data.password) {
    if (!auth.isSuperadmin) {
      return { error: "Parola sıfırlama yalnızca süper yöneticide." };
    }
    const { error: pwError } = await admin.auth.admin.updateUserById(userId, {
      password: parsed.data.password,
    });
    if (pwError) return { error: "Parola güncellenemedi." };
  }

  revalidatePath("/yonetim/kullanicilar");
  return { ok: true };
}

export async function deleteUser(
  userId: string,
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const users = await loadUsers();
  const target = users.find((u) => u.id === userId);
  if (target?.is_superadmin && !auth.isSuperadmin) {
    return { error: "Süper yöneticiyi yalnızca süper yönetici silebilir." };
  }
  const guard = checkDeleteUser(users, auth.id, userId);
  if (!guard.ok) return { error: guard.error };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: "Silme başarısız." };

  revalidatePath("/yonetim/kullanicilar");
  return {};
}
