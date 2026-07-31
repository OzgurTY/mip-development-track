import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  canSeePage,
  firstVisibleHref,
  parsePageAccess,
  type PageKey,
} from "./pages";
import type { Role } from "./roles";

export type Access = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  isSuperadmin: boolean;
  /** null = rolunun izin verdigi tum sayfalar. */
  pageAccess: PageKey[] | null;
  canEdit: boolean;
  isAdmin: boolean;
};

/**
 * Oturum + profil tek sorguda okunur. Sayfalar rol ve sayfa erisimini
 * buradan alir; her sayfanin kendi profiles sorgusunu yapmasi gerekmez.
 * cache() ile ayni istek icinde (layout + sayfa) tek sorguya duser.
 */
export const getAccess = cache(async (): Promise<Access> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("full_name, role, is_superadmin, page_access")
    .eq("id", user.id)
    .single();

  const role = (data?.role ?? "viewer") as Role;
  const isSuperadmin = data?.is_superadmin === true;

  return {
    userId: user.id,
    email: user.email ?? "",
    name: data?.full_name ?? user.email ?? "",
    role,
    isSuperadmin,
    pageAccess: parsePageAccess(data?.page_access),
    canEdit: role === "editor" || role === "admin",
    isAdmin: role === "admin",
  };
});

/**
 * Sayfa muhafizi. Yetki yoksa erisilebilen ilk sayfaya, hic sayfa yoksa
 * bilgilendirme ekranina yonlendirir.
 */
export async function requirePage(key: PageKey): Promise<Access> {
  const access = await getAccess();
  if (canSeePage(access, key)) return access;
  redirect(firstVisibleHref(access) ?? "/erisim-yok");
}
