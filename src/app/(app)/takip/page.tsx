import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { getFieldDefinitions } from "@/lib/fields/queries";
import { getTrackBoard } from "@/lib/track/queries";
import { PageHeader } from "@/components/page-header";
import { TrackBoard } from "./track-board";
import { ExportControl } from "./export-control";
import { buttonVariants } from "@/components/ui/button";
import { requirePage } from "@/lib/auth/access";

export default async function TrackPage() {
  const access = await requirePage("takip");

  const [rows, defs] = await Promise.all([
    getTrackBoard(),
    getFieldDefinitions("track"),
  ]);
  const canEdit = access.canEdit;

  return (
    <div className="space-y-6">
      <PageHeader title="Geliştirme Takibi" subtitle={`${rows.length} müşteri`}>
        <div className="flex flex-wrap items-center gap-2.5">
          <ExportControl label="Dışa aktar" />
          <Link
            href="/takip/toplanti"
            className={buttonVariants({ variant: "outline", size: "lg" }) + " press h-10 gap-2"}
          >
            <CalendarCheck className="size-4" />
            Toplantı modu
          </Link>
        </div>
      </PageHeader>
      <TrackBoard rows={rows} defs={defs} canEdit={canEdit} />
    </div>
  );
}
