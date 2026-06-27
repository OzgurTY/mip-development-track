import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { getInfraEntries } from "@/lib/infra/queries";
import { EntryForm } from "./entry-form";
import { EntryCard } from "./entry-card";

export default async function InfraPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();
  const role = profile?.role ?? "viewer";
  if (!["editor", "admin"].includes(role)) redirect("/");

  const { m } = await searchParams;
  const [customersResult, defs] = await Promise.all([
    supabase.from("customers").select("id, name").order("name"),
    getFieldDefinitions("infra"),
  ]);
  const customers = customersResult.data ?? [];
  const selected = customers.find((c) => c.id === m) ?? customers[0];
  const entries = selected ? await getInfraEntries(selected.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Altyapı & Erişim</h1>
        <p className="text-sm text-muted-foreground">
          Hassas alanlar şifreli saklanır, maskeli gösterilir
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/altyapi?m=${c.id}`}
            className={
              selected?.id === c.id
                ? "rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground"
                : "rounded-full bg-muted px-3 py-1 text-sm hover:bg-muted/70"
            }
          >
            {c.name}
          </Link>
        ))}
      </div>
      {selected && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">{selected.name}</h2>
            <EntryForm customerId={selected.id} defs={defs} />
          </div>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Bu müşteri için kayıt yok.
            </p>
          ) : (
            entries.map((e) => (
              <EntryCard key={e.id} entry={e} canDelete={role === "admin"} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
