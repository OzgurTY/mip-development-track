"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { can, type Role } from "@/lib/auth/roles";
import { checkDeleteUser, checkRoleChange, type ManagedUser } from "./guards";

export type SaveState = { error: string } | { ok: true } | null;

const ROLES = ["viewer", "editor", "admin"] as const;

// Every action re-verifies the CALLER is an admin server-side; never trust the
// client-side route gate. Returns the caller's id (needed for lockout guards).
async function requireAdmin(): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (profile?.role ?? "viewer") as Role;
  if (!can(role, "user:manage")) return { error: "Bu işlem için yetkiniz yok." };
  return { id: user.id };
}

async function loadUsers(): Promise<Pick<ManagedUser, "id" | "role">[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id, role");
  return (data ?? []) as Pick<ManagedUser, "id" | "role">[];
}

const createSchema = z.object({
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "Parola en az 8 karakter olmalı"),
  full_name: z.string().trim().min(1, "Ad Soyad gerekli").max(120),
  role: z.enum(ROLES),
});

export async function createUser(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = createSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz giriş" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true, // internal accounts: no verification email, active at once
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

  // The handle_new_user trigger already inserted the profile (role=viewer);
  // apply the requested role and ensure the name is set.
  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: parsed.data.role, full_name: parsed.data.full_name })
    .eq("id", data.user.id);
  if (profileError) return { error: "Rol atanamadı." };

  revalidatePath("/yonetim/kullanicilar");
  return { ok: true };
}

const updateSchema = z.object({
  full_name: z.string().trim().min(1, "Ad Soyad gerekli").max(120),
  role: z.enum(ROLES),
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
    role: formData.get("role"),
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz giriş" };
  }

  const users = await loadUsers();
  const guard = checkRoleChange(users, auth.id, userId, parsed.data.role);
  if (!guard.ok) return { error: guard.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role: parsed.data.role, full_name: parsed.data.full_name })
    .eq("id", userId);
  if (error) return { error: "Güncellenemedi." };

  if (parsed.data.password) {
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
  const guard = checkDeleteUser(users, auth.id, userId);
  if (!guard.ok) return { error: guard.error };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: "Silme başarısız." };

  revalidatePath("/yonetim/kullanicilar");
  return {};
}
