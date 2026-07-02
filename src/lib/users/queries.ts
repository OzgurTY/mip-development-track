import { createClient } from "@/lib/supabase/server";
import type { ManagedUser } from "./guards";

export async function listUsers(): Promise<ManagedUser[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_superadmin, created_at")
    .order("created_at", { ascending: true });
  return (data ?? []) as ManagedUser[];
}
