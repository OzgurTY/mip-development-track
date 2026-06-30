"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteTrackRecord } from "@/lib/track/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Props = {
  customerId: string;
  name: string;
};

export function TrackDeleteButton({ customerId, name }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const confirm = useConfirm();

  async function handleDelete() {
    const ok = await confirm({
      title: "Takip kaydını sil",
      description: (
        <>
          <strong>{name}</strong> için takip kaydı silinecek. Müşteri ve geçmiş
          güncellemeler kalır.
        </>
      ),
      confirmLabel: "Sil",
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteTrackRecord(customerId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      aria-label={`${name} takip kaydını sil`}
      className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
