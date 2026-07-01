import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTrackBoard, getCustomerUpdates } from "@/lib/track/queries";
import { MeetingCard } from "../meeting-card";
import { ExportLinks } from "../export-links";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import type { TrackUpdate } from "@/lib/track/types";

// Today as YYYY-MM-DD (local). New updates default to the day they are entered.
function todayIso(): string {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}

export default async function MeetingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [rows, profileResult] = await Promise.all([
    getTrackBoard(),
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
  ]);
  const canEdit = ["editor", "admin"].includes(profileResult.data?.role ?? "");

  const updatesByCustomer = new Map<string, TrackUpdate[]>();
  await Promise.all(
    rows.map(async (r) => {
      updatesByCustomer.set(r.customerId, await getCustomerUpdates(r.customerId));
    }),
  );

  const today = todayIso();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Toplantı modu"
        subtitle={`Alfabetik sırayla ${rows.length} müşteri`}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <ExportLinks label="Tümünü dışa aktar" />
          <Link
            href="/takip"
            className={buttonVariants({ variant: "outline", size: "lg" }) + " press h-10 gap-2"}
          >
            <ChevronLeft className="size-4" />
            Panoya dön
          </Link>
        </div>
      </PageHeader>
      <div className="space-y-4">
        {rows.map((row) => (
          <MeetingCard
            key={row.customerId}
            row={row}
            updates={updatesByCustomer.get(row.customerId) ?? []}
            defaultWeek={today}
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  );
}
