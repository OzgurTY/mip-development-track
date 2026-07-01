import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { getTrackBoard, getUpdatesForExport } from "@/lib/track/queries";
import {
  UPDATE_HEADERS,
  SUMMARY_HEADERS,
  updatesToMatrix,
  boardToMatrix,
  toCsv,
} from "@/lib/track/export";
import { slugify } from "@/lib/utils/slug";

export const runtime = "nodejs";

function styleSheet(ws: ExcelJS.Worksheet, wrapColumn: number) {
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.getColumn(wrapColumn).alignment = { wrapText: true, vertical: "top" };
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Yetkisiz", { status: 401 });

  const url = new URL(request.url);
  const scope =
    url.searchParams.get("scope") === "customer" ? "customer" : "all";
  const customerId = url.searchParams.get("customerId") ?? undefined;
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx";
  if (scope === "customer" && !customerId) {
    return new Response("customerId gerekli", { status: 400 });
  }

  const updates = await getUpdatesForExport(
    scope === "customer" ? customerId : undefined,
  );
  const updateRows = updatesToMatrix(updates);

  // Filename: takip-<musteri|tumu>-<bugun>.<ext>, ASCII-safe.
  const today = new Date().toISOString().slice(0, 10);
  let namePart = "tumu";
  if (scope === "customer") {
    let name = updates[0]?.customerName;
    if (!name) {
      const { data } = await supabase
        .from("customers")
        .select("name")
        .eq("id", customerId!)
        .single();
      name = data?.name ?? "musteri";
    }
    namePart = slugify(name) || "musteri";
  }
  const baseName = `takip-${namePart}-${today}`;

  if (format === "csv") {
    const csv = toCsv(UPDATE_HEADERS, updateRows);
    // BOM so Excel opens UTF-8 (Turkish characters) correctly.
    return new Response("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.csv"`,
      },
    });
  }

  const workbook = new ExcelJS.Workbook();
  const updatesSheet = workbook.addWorksheet("Güncellemeler");
  updatesSheet.columns = [
    { header: UPDATE_HEADERS[0], width: 28 },
    { header: UPDATE_HEADERS[1], width: 14 },
    { header: UPDATE_HEADERS[2], width: 90 },
  ];
  updateRows.forEach((row) => updatesSheet.addRow(row));
  styleSheet(updatesSheet, 3);

  // General export also carries a board snapshot on a second sheet.
  if (scope === "all") {
    const board = await getTrackBoard();
    const summarySheet = workbook.addWorksheet("Özet");
    summarySheet.columns = SUMMARY_HEADERS.map((header, i) => ({
      header,
      width: i === 0 ? 28 : i >= 4 ? 60 : 20,
    }));
    boardToMatrix(board).forEach((row) => summarySheet.addRow(row));
    styleSheet(summarySheet, 6);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
    },
  });
}
