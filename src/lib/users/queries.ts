import { createClient } from "@/lib/supabase/server";
import { parsePageAccess } from "@/lib/auth/pages";
import type { ManagedUser } from "./guards";

export async function listUsers(): Promise<ManagedUser[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_superadmin, page_access, created_at")
    .order("created_at", { ascending: true });
  return (data ?? []).map((row) => ({
    ...row,
    page_access: parsePageAccess(row.page_access),
  })) as ManagedUser[];
}
