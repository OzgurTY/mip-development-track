"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  ListChecks,
  Layers,
  FlaskConical,
  ServerCog,
  Settings2,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import type { Role } from "@/lib/auth/roles";

type Props = {
  role: Role;
  name: string;
  email: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

function navItems(role: Role): NavItem[] {
  return [
    { href: "/", label: "Genel Bakış", icon: LayoutDashboard },
    { href: "/musteriler", label: "Müşteriler", icon: Building2 },
    { href: "/takip", label: "Takip", icon: ListChecks },
    { href: "/surumler", label: "Sürümler", icon: Layers },
    { href: "/poc", label: "PoC", icon: FlaskConical },
    ...(role === "admin" || role === "editor"
      ? [{ href: "/altyapi", label: "Altyapı", icon: ServerCog }]
      : []),
    ...(role === "admin"
      ? [{ href: "/yonetim", label: "Yönetim", icon: Settings2 }]
      : []),
  ];
}

/**
 * Genis ekranda sabit kenar cubugu, telefonda ust bar + kayan cekmece.
 * Cekmece rota degisince ve Escape ile kapanir.
 */
export function AppNav({ role, name, email }: Props) {
  const pathname = usePathname();
  // Cekmecenin acildigi rota da tutulur; rota degisince kendiliginden kapanir.
  const [menu, setMenu] = useState({ open: false, path: pathname });
  const open = menu.open && menu.path === pathname;
  const setOpen = (next: boolean) => setMenu({ open: next, path: pathname });

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenu({ open: false, path: pathname });
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-sidebar-border bg-sidebar/95 px-3 py-2.5 backdrop-blur-sm lg:hidden print:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Menüyü aç"
          className="press grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <Menu className="size-5" />
        </button>
        <Link href="/" className="press flex min-w-0 items-center" aria-label="Genel Bakış">
          <BrandLogo className="h-5 w-auto" />
        </Link>
        <div className="ml-auto flex items-center gap-0.5">
          <ThemeToggle />
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px] animate-in fade-in"
          />
          <div className="absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col bg-sidebar p-3 shadow-2xl animate-in slide-in-from-left duration-200">
            <NavPanel
              role={role}
              name={name}
              email={email}
              pathname={pathname}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <nav className="sticky top-0 hidden h-dvh flex-col gap-1 border-r border-sidebar-border bg-sidebar p-3 lg:flex print:hidden">
        <NavPanel role={role} name={name} email={email} pathname={pathname} />
      </nav>
    </>
  );
}

function NavPanel({
  role,
  name,
  email,
  pathname,
  onClose,
}: Props & { pathname: string; onClose?: () => void }) {
  const router = useRouter();
  const items = navItems(role);
  const initials = name.trim().slice(0, 2).toUpperCase() || "MD";

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.replace("/login");
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-2 px-1 pt-1.5">
        <Link href="/" className="press flex items-center" aria-label="Genel Bakış">
          <BrandLogo className="h-6 w-auto" />
        </Link>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Menüyü kapat"
            className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : (
          <ThemeToggle />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {items.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
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
          <span className="text-xs text-muted-foreground capitalize">{role}</span>
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <ChangePasswordDialog email={email} />
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Çıkış yap"
            className="press grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-destructive"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </>
  );
}
