import { notFound } from "next/navigation";
import { getPocRecord } from "@/lib/poc/queries";
import { toDraft } from "@/lib/poc/draft";
import { PocPreview } from "../../poc-preview";
import { PrintActions } from "./print-actions";

export default async function PocPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getPocRecord(id);
  if (!detail) notFound();

  return (
    <div className="space-y-5 print:space-y-0">
      <PrintActions backHref={`/poc/${id}`} />
      <div className="rounded-2xl bg-muted/40 p-4 ring-1 ring-foreground/[0.06] print:rounded-none print:bg-transparent print:p-0 print:ring-0">
        <PocPreview draft={toDraft(detail.record)} />
      </div>
    </div>
  );
}
