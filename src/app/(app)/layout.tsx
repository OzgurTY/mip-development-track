import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";
import { Toaster } from "@/components/ui/sonner";
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
    <div className="grid min-h-dvh grid-cols-[256px_1fr] bg-background">
      <AppNav role={role} name={name} email={user.email ?? ""} />
      <main className="min-w-0 px-6 py-8 md:px-10 md:py-10">
        <div className="mx-auto w-full max-w-[1400px]">{children}</div>
      </main>
      <Toaster />
    </div>
  );
}
