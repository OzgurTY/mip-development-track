"use client";

import { Pencil, Users } from "lucide-react";
import { UserDialog } from "./user-dialog";
import { UserDeleteButton } from "./user-delete";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { userTier, type ManagedUser, type Tier } from "@/lib/users/guards";

type Props = {
  users: ManagedUser[];
  currentUserId: string;
  isSuperadmin: boolean;
};

export function UserTable({ users, currentUserId, isSuperadmin }: Props) {
  return (
    <div className="bento overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent [&_th]:h-11 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:uppercase">
            <TableHead className="pr-4 pl-20">Ad Soyad</TableHead>
            <TableHead className="px-4">E-posta</TableHead>
            <TableHead className="px-4">Rol</TableHead>
            <TableHead className="px-4">Eklenme</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="p-0">
                <EmptyState
                  icon={Users}
                  title="Kullanıcı yok"
                  description="Sağ üstteki butonla ilk kullanıcıyı ekle."
                />
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const isSelf = user.id === currentUserId;
              const canDelete = !isSelf && (isSuperadmin || !user.is_superadmin);
              return (
                <TableRow key={user.id} className="group hover:bg-accent/60">
                  <TableCell className="relative py-3 pr-4 pl-20">
                    <span className="row-rail absolute inset-y-0 left-2 flex items-center gap-1">
                      <UserDialog
                        user={user}
                        isSuperadmin={isSuperadmin}
                        trigger={
                          <button
                            type="button"
                            aria-label={`${user.full_name ?? user.email} düzenle`}
                            className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            <Pencil className="size-4" />
                          </button>
                        }
                      />
                      {canDelete ? (
                        <UserDeleteButton
                          id={user.id}
                          name={user.full_name ?? user.email}
                        />
                      ) : null}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="font-medium">
                        {user.full_name ?? (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </span>
                      {isSelf ? (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                          Siz
                        </span>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <TierBadge tier={userTier(user)} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                    {user.created_at.slice(0, 10)}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

const TIER_LABEL: Record<Tier, string> = {
  viewer: "Görüntüleyici",
  editor: "Editör",
  admin: "Yönetici",
  superadmin: "Süper Yönetici",
};

function TierBadge({ tier }: { tier: Tier }) {
  if (tier === "superadmin") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
        style={{
          background:
            "color-mix(in oklch, var(--accent-amber) 18%, transparent)",
          color: "var(--accent-amber)",
        }}
      >
        <span
          className="size-1.5 rounded-full"
          style={{ background: "var(--accent-amber)" }}
        />
        {TIER_LABEL.superadmin}
      </span>
    );
  }
  if (tier === "admin") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
        <span className="size-1.5 rounded-full bg-primary" />
        {TIER_LABEL.admin}
      </span>
    );
  }
  if (tier === "editor") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
        style={{
          background: "color-mix(in oklch, var(--accent-sky) 15%, transparent)",
          color: "var(--accent-sky)",
        }}
      >
        <span
          className="size-1.5 rounded-full"
          style={{ background: "var(--accent-sky)" }}
        />
        {TIER_LABEL.editor}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground/50" />
      {TIER_LABEL.viewer}
    </span>
  );
}
