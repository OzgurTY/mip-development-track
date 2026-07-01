"use client";

import { useActionState, useEffect, useState } from "react";
import type { ReactElement } from "react";
import { UserPlus } from "lucide-react";
import { createUser, updateUser, type SaveState } from "@/lib/users/actions";
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

const ROLE_OPTIONS = [
  { value: "viewer", label: "Görüntüleyici" },
  { value: "editor", label: "Editör" },
  { value: "admin", label: "Yönetici" },
];

type Props = {
  user?: ManagedUser;
  trigger?: ReactElement;
};

export function UserDialog({ user, trigger }: Props) {
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="role">Rol</Label>
                  <Select
                    id="role"
                    name="role"
                    defaultValue={user?.role ?? "viewer"}
                  >
                    {ROLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </div>
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
                    placeholder={isEdit ? "Boş = değişmez" : "En az 8 karakter"}
                  />
                </div>
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
