import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPocRecord } from "@/lib/poc/queries";
import { PocEditor } from "./poc-editor";

export default async function PocDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getPocRecord(id);
  if (!detail) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [profileResult, customersResult] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
    supabase.from("customers").select("name").order("name"),
  ]);
  const role = profileResult.data?.role ?? "viewer";

  return (
    <PocEditor
      record={detail.record}
      canEdit={role === "admin" || role === "editor"}
      customerOptions={(customersResult.data ?? []).map((c) => c.name)}
    />
  );
}
