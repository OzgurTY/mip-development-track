"use client";

import { useActionState, useEffect, useState } from "react";
import type { ReactElement } from "react";
import { UserPlus } from "lucide-react";
import { createUser, updateUser, type SaveState } from "@/lib/users/actions";
import { userTier, type Tier } from "@/lib/users/guards";
import { FormSection } from "@/components/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ManagedUser } from "@/lib/users/guards";

const TIER_LABEL: Record<Tier, string> = {
  viewer: "Görüntüleyici",
  editor: "Editör",
  admin: "Yönetici",
  superadmin: "Süper Yönetici",
};

type Props = {
  user?: ManagedUser;
  // Whether the current (acting) user is a superadmin.
  isSuperadmin: boolean;
  trigger?: ReactElement;
};

export function UserDialog({ user, isSuperadmin, trigger }: Props) {
  const isEdit = Boolean(user);
  const [open, setOpen] = useState(false);
  const action = isEdit ? updateUser.bind(null, user!.id) : createUser;
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    action,
    null,
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) setOpen(false);
  }, [state]);

  const currentTier: Tier = user ? userTier(user) : "viewer";
  // Non-superadmins cannot change a superadmin's tier or grant superadmin.
  const tierLocked = !isSuperadmin && user?.is_superadmin === true;
  const tierOptions: Tier[] =
    isSuperadmin || currentTier === "superadmin"
      ? ["viewer", "editor", "admin", "superadmin"]
      : ["viewer", "editor", "admin"];
  // Only a superadmin can set or reset passwords.
  const canSetPassword = isSuperadmin;

  const defaultTrigger = (
    <Button size="lg" className="press h-10 gap-2">
      <UserPlus className="size-4" />
      Yeni kullanıcı
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? `${user!.full_name ?? user!.email} düzenle`
              : "Yeni kullanıcı"}
          </DialogTitle>
        </DialogHeader>
        {open ? (
          <form action={formAction} className="space-y-5">
            <FormSection>
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Ad Soyad</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  required
                  autoFocus
                  defaultValue={user?.full_name ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-posta</Label>
                {isEdit ? (
                  <Input id="email" defaultValue={user!.email} disabled />
                ) : (
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="off"
                    placeholder="ad@mip.local"
                  />
                )}
              </div>
              <div
                className={
                  canSetPassword ? "grid gap-3 sm:grid-cols-2" : "space-y-1.5"
                }
              >
                <div className="space-y-1.5">
                  <Label htmlFor="tier">Rol</Label>
                  {tierLocked ? (
                    <>
                      <Input
                        id="tier"
                        defaultValue={TIER_LABEL[currentTier]}
                        disabled
                      />
                      <input type="hidden" name="tier" value={currentTier} />
                    </>
                  ) : (
                    <Select id="tier" name="tier" defaultValue={currentTier}>
                      {tierOptions.map((t) => (
                        <option key={t} value={t}>
                          {TIER_LABEL[t]}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
                {canSetPassword ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="password">
                      {isEdit ? "Yeni parola" : "Parola"}
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required={!isEdit}
                      placeholder={
                        isEdit ? "Boş = değişmez" : "En az 8 karakter"
                      }
                    />
                  </div>
                ) : null}
              </div>
            </FormSection>

            {state && "error" in state ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="press h-10 w-full"
              disabled={pending}
            >
              {pending
                ? "Kaydediliyor..."
                : isEdit
                  ? "Kaydet"
                  : "Kullanıcı oluştur"}
            </Button>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
