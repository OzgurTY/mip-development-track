import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { getTrackBoard } from "@/lib/track/queries";
import { PageHeader } from "@/components/page-header";
import { TrackBoard } from "./track-board";
import { buttonVariants } from "@/components/ui/button";

export default async function TrackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [rows, profileResult, defs] = await Promise.all([
    getTrackBoard(),
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
    getFieldDefinitions("track"),
  ]);
  const canEdit = ["editor", "admin"].includes(profileResult.data?.role ?? "");

  return (
    <div className="space-y-6">
      <PageHeader title="Geliştirme Takibi" subtitle={`${rows.length} müşteri`}>
        <Link
          href="/takip/toplanti"
          className={buttonVariants({ variant: "outline", size: "lg" }) + " press h-10 gap-2"}
        >
          <CalendarCheck className="size-4" />
          Toplantı modu
        </Link>
      </PageHeader>
      <TrackBoard rows={rows} defs={defs} canEdit={canEdit} />
    </div>
  );
}
