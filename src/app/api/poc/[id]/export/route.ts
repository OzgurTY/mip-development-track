import { createClient } from "@/lib/supabase/server";
import { getPocRecord } from "@/lib/poc/queries";
import { buildPocDocx } from "@/lib/poc/docx";
import { exportFileName } from "@/lib/poc/format";

export const runtime = "nodejs";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Yetkisiz", { status: 401 });

  const { id } = await params;
  const detail = await getPocRecord(id);
  if (!detail) return new Response("Kayıt bulunamadı", { status: 404 });

  const buffer = await buildPocDocx(detail.record, detail.customerName);
  const fileName = exportFileName(detail.record, detail.customerName);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": DOCX_MIME,
      "Content-Disposition": `attachment; filename="${fileName}.docx"`,
    },
  });
}
