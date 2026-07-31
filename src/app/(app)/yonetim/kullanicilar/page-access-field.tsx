"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { pagesForRole, type PageKey } from "@/lib/auth/pages";
import type { Role } from "@/lib/auth/roles";

type Props = {
  /** Formda secili rol; liste bu role gore daralir. */
  role: Role;
  /** null = rolunun izin verdigi tum sayfalar. */
  initial: PageKey[] | null;
  /** Kendi hesabi veya super yonetici ise degistirilemez. */
  lockedReason?: string;
};

/**
 * Sayfa erisimi alani. Iki mod: rolune gore tumu, ya da secili sayfalar.
 * Deger tek bir hidden input ile gonderilir ("all" veya JSON dizi).
 * Kilitliyse hicbir input gonderilmez, sunucu alani hic degistirmez.
 */
export function PageAccessField({ role, initial, lockedReason }: Props) {
  const available = pagesForRole(role);
  const [restricted, setRestricted] = useState(initial !== null);
  const [selected, setSelected] = useState<PageKey[]>(
    initial ?? available.map((p) => p.key),
  );

  if (lockedReason) {
    return (
      <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        {lockedReason}
      </p>
    );
  }

  // Rol degisince listeden dusen sayfalar gonderilmez (sunucu da temizler).
  const allowed = available.map((p) => p.key);
  const effective = selected.filter((key) => allowed.includes(key));
  const value = restricted ? JSON.stringify(effective) : "all";

  function toggle(key: PageKey) {
    setSelected((current) =>
      current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key],
    );
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="page_access" value={value} />

      <div className="flex flex-wrap gap-1.5">
        <ModeButton active={!restricted} onClick={() => setRestricted(false)}>
          Rolüne göre tümü
        </ModeButton>
        <ModeButton active={restricted} onClick={() => setRestricted(true)}>
          Seçili sayfalar
        </ModeButton>
      </div>

      {restricted ? (
        <>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {available.map((page) => {
              const checked = effective.includes(page.key);
              return (
                <button
                  key={page.key}
                  type="button"
                  onClick={() => toggle(page.key)}
                  aria-pressed={checked}
                  className="press flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                >
                  <span
                    className={
                      checked
                        ? "grid size-4 shrink-0 place-items-center rounded border border-primary bg-primary text-primary-foreground"
                        : "grid size-4 shrink-0 place-items-center rounded border border-input"
                    }
                  >
                    {checked ? <Check className="size-3" /> : null}
                  </span>
                  {page.label}
                </button>
              );
            })}
          </div>
          {effective.length === 0 ? (
            <p className="text-xs text-[var(--accent-amber)]">
              Hiçbir sayfa seçili değil: kullanıcı giriş yapabilir ama hiçbir
              sayfayı göremez.
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Rolünün izin verdiği tüm sayfaları görür. Rol yükseltilirse yeni
          sayfalar kendiliğinden açılır.
        </p>
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "press rounded-lg bg-primary px-2.5 py-1 text-sm font-medium text-primary-foreground"
          : "press rounded-lg bg-card px-2.5 py-1 text-sm text-muted-foreground ring-1 ring-foreground/[0.08] transition-colors hover:text-foreground"
      }
    >
      {children}
    </button>
  );
}
