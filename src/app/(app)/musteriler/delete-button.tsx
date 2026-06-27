"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCustomer } from "./actions";
import { Button } from "@/components/ui/button";

type Props = {
  id: string;
  name: string;
};

export function DeleteCustomerButton({ id, name }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!window.confirm(`"${name}" silinsin mi?`)) return;
    startTransition(async () => {
      await deleteCustomer(id);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={pending}
      className="text-destructive hover:text-destructive"
    >
      Sil
    </Button>
  );
}
