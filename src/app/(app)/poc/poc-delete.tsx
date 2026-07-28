"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePoc } from "@/lib/poc/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Props = {
  id: string;
  label: string;
  /** Detay sayfasindan silinince listeye don. */
  redirectTo?: string;
};

export function PocDeleteButton({ id, label, redirectTo }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const confirm = useConfirm();

  async function handleDelete() {
    const ok = await confirm({
      title: "PoC kaydını sil",
      description: (
        <>
          <strong>{label}</strong> kaydı ve içindeki tüm doküman içeriği silinir.
          Bu işlem geri alınamaz.
        </>
      ),
      confirmLabel: "Sil",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deletePoc(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("PoC silindi");
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      aria-label={`${label} kaydını sil`}
      className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
