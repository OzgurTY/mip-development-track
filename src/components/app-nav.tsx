"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import type { Role } from "@/lib/auth/roles";

type Props = {
  role: Role;
  name: string;
};

export function AppNav({ role, name }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const items = [
    { href: "/", label: "Genel Bakış" },
    { href: "/musteriler", label: "Müşteriler" },
    { href: "/takip", label: "Takip" },
    { href: "/surumler", label: "Sürümler" },
    ...(role === "admin"
      ? [{ href: "/yonetim/alanlar", label: "Yönetim" }]
      : []),
  ];

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.replace("/login");
  }

  return (
    <nav className="flex flex-col gap-1 border-r border-sidebar-border bg-sidebar p-4">
      <div className="mb-4 px-2">
        <p className="text-sm font-semibold">MIP Development Track</p>
        <p className="text-xs text-muted-foreground">
          {name} · {role}
        </p>
      </div>
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "rounded-md bg-sidebar-primary px-3 py-2 text-sm text-sidebar-primary-foreground"
                : "rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            }
          >
            {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={handleSignOut}
        className="mt-auto rounded-md px-3 py-2 text-left text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
      >
        Çıkış
      </button>
    </nav>
  );
}
