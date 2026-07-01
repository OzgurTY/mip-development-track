"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteCustomer } from "../actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";

type Props = {
  id: string;
  name: string;
};

export function DeleteCustomerAction({ id, name }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const confirm = useConfirm();

  async function handleDelete() {
    const ok = await confirm({
      title: "Müşteriyi sil",
      description: (
        <>
          <strong>{name}</strong> ve bağlı tüm kayıtları (takip, sürüm, altyapı)
          kalıcı olarak silinecek. Bu işlem geri alınamaz.
        </>
      ),
      confirmLabel: "Sil",
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteCustomer(id);
      // The customer no longer exists, so leave the detail page rather than
      // refreshing into a 404.
      router.push("/musteriler");
    });
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      className="press gap-1.5"
      onClick={handleDelete}
      disabled={pending}
    >
      <Trash2 className="size-3.5" />
      Sil
    </Button>
  );
}
