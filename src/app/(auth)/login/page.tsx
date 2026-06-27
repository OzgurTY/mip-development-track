"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    null,
  );

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold">Giriş</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          MIP Development Track
        </p>
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
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
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Giriş yapılıyor..." : "Giriş yap"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
