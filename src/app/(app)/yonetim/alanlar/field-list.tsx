"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteFieldDefinition } from "./actions";
import { Button } from "@/components/ui/button";
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
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alan</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead>Zorunlu</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {defs.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-10 text-center text-muted-foreground"
              >
                Henüz alan yok.
              </TableCell>
            </TableRow>
          ) : (
            defs.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.label}</TableCell>
                <TableCell>{TYPE_LABEL[d.type] ?? d.type}</TableCell>
                <TableCell>{d.required ? "Evet" : "Hayır"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => remove(d.id, d.label)}
                    className="text-destructive hover:text-destructive"
                  >
                    Sil
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
