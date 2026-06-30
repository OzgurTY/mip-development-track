"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteCustomer } from "./actions";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Props = {
  id: string;
  name: string;
};

export function DeleteCustomerButton({ id, name }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const confirm = useConfirm();

  async function handleDelete() {
    const ok = await confirm({
      title: "Müşteriyi sil",
      description: (
        <>
          <strong>{name}</strong> ve bağlı tüm kayıtları kalıcı olarak
          silinecek. Bu işlem geri alınamaz.
        </>
      ),
      confirmLabel: "Sil",
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteCustomer(id);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      aria-label={`${name} sil`}
      className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
