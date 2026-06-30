"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteVersionRecord } from "@/lib/versions/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Props = {
  id: string;
  name: string;
};

export function VersionDeleteButton({ id, name }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const confirm = useConfirm();

  async function handleDelete() {
    const ok = await confirm({
      title: "Sürüm kaydını sil",
      description: (
        <>
          <strong>{name}</strong> sürüm kaydı kalıcı olarak silinecek.
        </>
      ),
      confirmLabel: "Sil",
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteVersionRecord(id);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      aria-label={`${name} sürüm kaydını sil`}
      className="press grid size-8 place-items-center rounded-lg bg-card/80 text-muted-foreground ring-1 ring-foreground/[0.06] backdrop-blur transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
