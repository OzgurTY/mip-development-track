import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPocRecord } from "@/lib/poc/queries";
import { PocEditor } from "./poc-editor";
import { requirePage } from "@/lib/auth/access";

export default async function PocDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await requirePage("poc");
  const { id } = await params;
  const detail = await getPocRecord(id);
  if (!detail) notFound();

  const supabase = await createClient();
  const customersResult = await supabase
    .from("customers")
    .select("name")
    .order("name");

  return (
    <PocEditor
      record={detail.record}
      canEdit={access.canEdit}
      customerOptions={(customersResult.data ?? []).map((c) => c.name)}
    />
  );
}
