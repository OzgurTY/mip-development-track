import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";
import type { Role } from "@/lib/auth/roles";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "viewer") as Role;
  const name = profile?.full_name ?? user.email ?? "";

  return (
    <div className="grid min-h-dvh grid-cols-[240px_1fr]">
      <AppNav role={role} name={name} />
      <main className="p-8">{children}</main>
    </div>
  );
}
