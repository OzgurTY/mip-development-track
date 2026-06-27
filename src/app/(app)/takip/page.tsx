import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { getTrackBoard } from "@/lib/track/queries";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Geliştirme Takibi</h1>
          <p className="text-sm text-muted-foreground">{rows.length} müşteri</p>
        </div>
        <Link href="/takip/toplanti" className={buttonVariants({ variant: "outline" })}>
          Toplantı modu
        </Link>
      </div>
      <TrackBoard rows={rows} defs={defs} canEdit={canEdit} />
    </div>
  );
}
