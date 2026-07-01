"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SlidersHorizontal, Users } from "lucide-react";

const ITEMS = [
  { href: "/yonetim/alanlar", label: "Alanlar", icon: SlidersHorizontal },
  { href: "/yonetim/kullanicilar", label: "Kullanıcılar", icon: Users },
];

export function AdminSubnav() {
  const pathname = usePathname();

  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-muted/60 p-1 ring-1 ring-foreground/[0.05]">
      {ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "press inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-sm font-medium shadow-sm ring-1 ring-foreground/[0.06]"
                : "press inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
