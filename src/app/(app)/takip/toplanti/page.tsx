import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTrackBoard, getCustomerUpdates } from "@/lib/track/queries";
import { MeetingCard } from "../meeting-card";
import { buttonVariants } from "@/components/ui/button";
import type { TrackUpdate } from "@/lib/track/types";

// Most recent Friday on or before today, as YYYY-MM-DD.
function lastFriday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = (day - 5 + 7) % 7;
  now.setDate(now.getDate() - diff);
  return now.toISOString().slice(0, 10);
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

  const week = lastFriday();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Toplantı modu</h1>
          <p className="text-sm text-muted-foreground">
            Alfabetik sırayla {rows.length} müşteri
          </p>
        </div>
        <Link href="/takip" className={buttonVariants({ variant: "outline" })}>
          Panoya dön
        </Link>
      </div>
      <div className="space-y-4">
        {rows.map((row) => (
          <MeetingCard
            key={row.customerId}
            row={row}
            updates={updatesByCustomer.get(row.customerId) ?? []}
            defaultWeek={week}
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  );
}
