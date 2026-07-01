"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { BrandLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    null,
  );

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(40rem 30rem at 12% -10%, color-mix(in oklch, var(--accent-indigo) 18%, transparent), transparent), radial-gradient(36rem 28rem at 110% 20%, color-mix(in oklch, var(--accent-sky) 16%, transparent), transparent), radial-gradient(34rem 30rem at 50% 120%, color-mix(in oklch, var(--accent-violet) 14%, transparent), transparent)",
        }}
      />

      <div className="bento animate-in fade-in zoom-in-95 relative w-full max-w-sm p-7 duration-500">
        <div className="mb-7 flex flex-col items-center gap-2.5 text-center">
          <BrandLogo className="h-10 w-auto" />
          <p className="text-sm text-muted-foreground">
            Development Track giriş
          </p>
        </div>

        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="ad@mip.local"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Parola</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          {state?.error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            className="press h-10 w-full"
            disabled={pending}
          >
            {pending ? "Giriş yapılıyor..." : "Giriş yap"}
          </Button>
        </form>
      </div>

      <p className="absolute bottom-6 text-xs text-muted-foreground">
        MDP Group · iç araç
      </p>
    </main>
  );
}
