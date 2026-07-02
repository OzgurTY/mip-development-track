"use client";

import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Self-service password change: runs entirely on the user's own session, so no
// elevated privileges are needed. The current password is re-verified first.
export function ChangePasswordDialog({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = String(form.get("current") ?? "");
    const next = String(form.get("next") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    setError(null);
    if (next.length < 8) {
      setError("Yeni parola en az 8 karakter olmalı.");
      return;
    }
    if (next !== confirm) {
      setError("Yeni parolalar eşleşmiyor.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (verifyError) {
      setPending(false);
      setError("Mevcut parola yanlış.");
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({
      password: next,
    });
    setPending(false);
    if (updateError) {
      setError("Parola güncellenemedi.");
      return;
    }
    setOpen(false);
    toast.success("Parolanız değiştirildi.");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label="Şifre değiştir"
            className="press grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <KeyRound className="size-4" />
          </button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Şifre değiştir</DialogTitle>
        </DialogHeader>
        {open ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current">Mevcut parola</Label>
              <Input
                id="current"
                name="current"
                type="password"
                required
                autoFocus
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next">Yeni parola</Label>
              <Input
                id="next"
                name="next"
                type="password"
                required
                autoComplete="new-password"
                placeholder="En az 8 karakter"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Yeni parola (tekrar)</Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                required
                autoComplete="new-password"
              />
            </div>
            {error ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              size="lg"
              className="press h-10 w-full"
              disabled={pending}
            >
              {pending ? "Değiştiriliyor..." : "Güncelle"}
            </Button>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
