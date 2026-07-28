"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createPoc } from "@/lib/poc/actions";
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

type Props = {
  customers: { id: string; name: string }[];
};

/**
 * Yeni PoC yalnizca musteri ve baslik ile acilir; geri kalan alanlar
 * dokuman editorunde doldurulur. Kayit acilir acilmaz editore gidilir.
 */
export function PocCreate({ customers }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createPoc(formData);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      if (result && "ok" in result) {
        setOpen(false);
        router.push(`/poc/${result.id}`);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="lg" className="press h-10 gap-2">
            <Plus className="size-4" />
            Yeni PoC
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni PoC</DialogTitle>
        </DialogHeader>
        {open ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="customerName">Müşteri / firma</Label>
              <Input
                id="customerName"
                name="customerName"
                list="poc-customer-options"
                required
                autoComplete="off"
                maxLength={200}
                placeholder="Firma adını yazın"
                className="h-10 rounded-xl px-3"
              />
              <datalist id="poc-customer-options">
                {customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Sistemde kayıtlı değilse doğrudan yazın. Kayıtlı bir müşteriyle
                aynı adı yazarsanız o müşteriye bağlanır.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">PoC konusu</Label>
              <Input
                id="title"
                name="title"
                required
                maxLength={200}
                placeholder="Örn. Sipariş ve fatura entegrasyonu"
                className="h-10 rounded-xl px-3"
              />
              <p className="text-xs text-muted-foreground">
                Standart iş adımları ve kabul kriterleri hazır gelir.
              </p>
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
              {pending ? "Oluşturuluyor..." : "Oluştur ve düzenle"}
            </Button>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
