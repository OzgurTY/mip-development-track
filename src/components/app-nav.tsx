"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  ListChecks,
  Layers,
  ServerCog,
  Settings2,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand";
import type { Role } from "@/lib/auth/roles";

type Props = {
  role: Role;
  name: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

export function AppNav({ role, name }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const items: NavItem[] = [
    { href: "/", label: "Genel Bakış", icon: LayoutDashboard },
    { href: "/musteriler", label: "Müşteriler", icon: Building2 },
    { href: "/takip", label: "Takip", icon: ListChecks },
    { href: "/surumler", label: "Sürümler", icon: Layers },
    ...(role === "admin" || role === "editor"
      ? [{ href: "/altyapi", label: "Altyapı", icon: ServerCog }]
      : []),
    ...(role === "admin"
      ? [{ href: "/yonetim", label: "Yönetim", icon: Settings2 }]
      : []),
  ];

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.replace("/login");
  }

  const initials = name.trim().slice(0, 2).toUpperCase() || "MD";

  return (
    <nav className="sticky top-0 flex h-dvh flex-col gap-1 border-r border-sidebar-border bg-sidebar p-3">
      <div className="mb-4 flex items-center justify-between gap-2 px-1 pt-1.5">
        <Link href="/" className="press flex items-center" aria-label="Genel Bakış">
          <BrandLogo className="h-6 w-auto" />
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "group relative flex items-center gap-3 rounded-xl bg-sidebar-accent px-3 py-2.5 text-sm font-semibold text-sidebar-accent-foreground"
                  : "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
              }
            >
              {isActive ? (
                <span className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-full bg-primary" />
              ) : null}
              <Icon
                className={
                  isActive
                    ? "size-[1.15rem] text-primary"
                    : "size-[1.15rem] transition-colors group-hover:text-foreground"
                }
                strokeWidth={2}
              />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-3 rounded-2xl bg-card p-2.5 ring-1 ring-foreground/[0.06]">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent-sky to-accent-indigo text-xs font-bold text-white">
          {initials}
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-medium">{name}</span>
          <span className="text-xs text-muted-foreground capitalize">
            {role}
          </span>
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Çıkış yap"
          className="press ml-auto grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-destructive"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </nav>
  );
}
