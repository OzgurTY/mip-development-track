import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { getInfraEntries } from "@/lib/infra/queries";
import { getInfraTypes } from "@/lib/infra/type-queries";
import { PageHeader } from "@/components/page-header";
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
  const [customersResult, defs, types] = await Promise.all([
    supabase.from("customers").select("id, name").order("name"),
    getFieldDefinitions("infra"),
    getInfraTypes(),
  ]);
  const customers = customersResult.data ?? [];
  const selected = customers.find((c) => c.id === m) ?? customers[0];
  const entries = selected ? await getInfraEntries(selected.id) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Altyapı ve Erişim"
        subtitle="Hassas alanlar şifreli saklanır, maskeli gösterilir"
      />

      <div className="flex items-start gap-2 rounded-2xl bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          Bu modül yalnızca editor ve admin rollerine görünür. Parolalar ve
          anahtarlar veritabanında şifreli tutulur.
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/altyapi?m=${c.id}`}
            className={
              selected?.id === c.id
                ? "press rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground"
                : "press rounded-full bg-card px-3.5 py-1.5 text-sm text-muted-foreground ring-1 ring-foreground/[0.06] transition-colors hover:text-foreground"
            }
          >
            {c.name}
          </Link>
        ))}
      </div>

      {selected && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold tracking-tight">
              {selected.name}
            </h2>
            <EntryForm customerId={selected.id} defs={defs} types={types} />
          </div>
          {entries.length === 0 ? (
            <div className="bento grid place-items-center p-10 text-sm text-muted-foreground">
              Bu müşteri için kayıt yok.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {entries.map((e) => (
                <EntryCard key={e.id} entry={e} canDelete={role === "admin"} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
