"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteFieldDefinition } from "./actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FieldDefinition } from "@/lib/fields/types";

const TYPE_LABEL: Record<string, string> = {
  text: "Metin",
  textarea: "Uzun metin",
  number: "Sayı",
  date: "Tarih",
  boolean: "Evet/Hayır",
  select: "Seçmeli",
  multiselect: "Çoklu seçmeli",
};

export function FieldList({ defs }: { defs: FieldDefinition[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function remove(id: string, label: string) {
    if (!window.confirm(`"${label}" alanı silinsin mi?`)) return;
    startTransition(async () => {
      await deleteFieldDefinition(id);
      router.refresh();
    });
  }

  return (
    <div className="bento overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent [&_th]:h-11 [&_th]:px-4 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:uppercase">
            <TableHead>Alan</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead>Zorunlu</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody className="[&_td]:px-4 [&_td]:py-3">
          {defs.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-14 text-center text-muted-foreground"
              >
                Henüz alan yok.
              </TableCell>
            </TableRow>
          ) : (
            defs.map((d) => (
              <TableRow key={d.id} className="hover:bg-accent/60">
                <TableCell className="font-medium">{d.label}</TableCell>
                <TableCell>
                  <span className="rounded-md bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                    {TYPE_LABEL[d.type] ?? d.type}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {d.required ? "Evet" : "Hayır"}
                </TableCell>
                <TableCell className="text-right">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => remove(d.id, d.label)}
                    aria-label="Alanı sil"
                    className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
