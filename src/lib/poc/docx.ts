import {
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TabStopPosition,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { criteriaScore, formatDay, formatRange, orEmpty } from "./format";
import { POC_SECTIONS, type PocRecord } from "./types";

/** A4 (11906 x 16838 DXA) ve 2.5 cm kenar bosluklarindan kalan icerik genisligi. */
const CW = 9072;
const ACCENT = "1F3864";
const HEAD_FILL = "E8EAED";
const BORDER_COLOR = "B4B4B4";

const border = { style: BorderStyle.SINGLE, size: 2, color: BORDER_COLOR };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(
  text: string,
  width: number,
  options: { bold?: boolean; fill?: string } = {},
): TableCell {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 110, right: 110 },
    shading: options.fill
      ? { fill: options.fill, type: ShadingType.CLEAR }
      : undefined,
    children: text.split("\n").map(
      (linePart) =>
        new Paragraph({
          spacing: { before: 20, after: 20 },
          children: [new TextRun({ text: linePart, bold: options.bold, size: 18 })],
        }),
    ),
  });
}

function table(
  head: string[],
  rows: string[][],
  widths: number[],
): Table {
  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: head.map((h, i) => cell(h, widths[i], { bold: true, fill: HEAD_FILL })),
      }),
      ...rows.map(
        (row) =>
          new TableRow({
            children: row.map((value, i) => cell(value, widths[i])),
          }),
      ),
    ],
  });
}

function fieldTable(pairs: [string, string][], labelWidth = 2600): Table {
  const widths = [labelWidth, CW - labelWidth];
  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: widths,
    rows: pairs.map(
      ([label, value]) =>
        new TableRow({
          children: [
            cell(label, widths[0], { bold: true, fill: "F4F5F7" }),
            cell(value, widths[1]),
          ],
        }),
    ),
  });
}

const heading = (text: string) =>
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });

const body = (text: string, size = 21) =>
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size })],
  });

const spacer = () => new Paragraph({ children: [new TextRun("")] });

/** Surec basligi: TOC'a girmeyen ara baslik. */
const subHeading = (text: string) =>
  new Paragraph({
    spacing: { before: 260, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22 })],
  });

/** Tablo ustu kucuk etiket. */
const smallLabel = (text: string) =>
  new Paragraph({
    spacing: { before: 120, after: 60 },
    children: [new TextRun({ text, bold: true, size: 19 })],
  });

/** No / metin / durum / not duzeni tum kriter ve is tablolarinda ayni. */
const CRITERIA_WIDTHS = [700, 5172, 1700, 1500];

/** Bos tabloyu da kabul et: en az bir satir goster ki dokuman bosluk gibi durmasin. */
function atLeastOneRow(rows: string[][], columns: number): string[][] {
  return rows.length > 0 ? rows : [Array(columns).fill("-")];
}

export async function buildPocDocx(
  record: PocRecord,
  customerName: string,
): Promise<Buffer> {
  const score = criteriaScore(record);

  const doc = new Document({
    creator: "MDP Group",
    title: `${customerName} - PoC Sonuç Raporu`,
    styles: {
      default: { document: { run: { font: "Arial", size: 21, color: "000000" } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 24, bold: true, font: "Arial", color: "000000" },
          paragraph: { spacing: { before: 300, after: 120 }, outlineLevel: 0 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1300, right: 1417, bottom: 1300, left: 1417 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
                children: [
                  new TextRun({ text: "Gizli - Taraflara Özel", size: 16, color: "595959" }),
                  new TextRun({ text: "\tSayfa ", size: 16, color: "595959" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "595959" }),
                  new TextRun({ text: " / ", size: 16, color: "595959" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "595959" }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: "MDP INTEGRATION PLATFORM",
                bold: true,
                size: 20,
                color: ACCENT,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 3 },
            },
            children: [
              new TextRun({ text: "PoC Sonuç Raporu", bold: true, size: 36 }),
            ],
          }),

          fieldTable(
            [
              ["Müşteri", customerName],
              ["PoC Konusu", orEmpty(record.title)],
              ["Tarih", formatRange(record.start_date, record.end_date)],
              ["Kurulum", orEmpty(record.deployment)],
              [
                "Ekip",
                `MDP: ${orEmpty(record.team_mdp)}   |   Müşteri: ${orEmpty(record.team_customer)}`,
              ],
              ["Durum", orEmpty(record.status)],
              ["Genel Sonuç", orEmpty(record.result)],
            ],
            2200,
          ),
          spacer(),

          heading(POC_SECTIONS.scope),
          body(orEmpty(record.purpose)),
          body(`Kapsam dışı: ${orEmpty(record.out_of_scope)}`, 19),

          heading(POC_SECTIONS.install),
          fieldTable(
            [
              ["Sunucu", orEmpty(record.server_info)],
              ["İşletim Sistemi ve Kaynak", orEmpty(record.os_info)],
              ["MIP Sürümü", orEmpty(record.mip_version)],
              ["Kurulum Tarihi", formatDay(record.install_date)],
              ["Sistem Erişimleri", orEmpty(record.access_note)],
              ["Kurulum Sonucu", orEmpty(record.install_result)],
            ],
            3000,
          ),

          heading(POC_SECTIONS.works),
          table(
            ["No", "İş", "Durum", "Tarih"],
            atLeastOneRow(
              record.works.map((w, i) => [
                String(i + 1),
                orEmpty(w.name),
                orEmpty(w.status),
                formatDay(w.date),
              ]),
              4,
            ),
            CRITERIA_WIDTHS,
          ),

          heading(POC_SECTIONS.processes),
          ...(record.processes.length === 0
            ? [body("Süreç eklenmedi.", 19)]
            : record.processes.flatMap((process, index) => [
                subHeading(
                  `4.${index + 1} ${process.name.trim() || `Süreç ${index + 1}`}`,
                ),
                table(
                  [
                    "Kaynak",
                    "Hedef",
                    "Yöntem",
                    "Gönderilen",
                    "Başarılı",
                    "Hatalı",
                    "Sonuç",
                  ],
                  [
                    [
                      orEmpty(process.source),
                      orEmpty(process.target),
                      orEmpty(process.method),
                      orEmpty(process.sent),
                      orEmpty(process.ok),
                      orEmpty(process.failed),
                      orEmpty(process.result),
                    ],
                  ],
                  [1600, 1600, 1300, 1250, 1150, 1050, 1122],
                ),
                smallLabel("Kabul kriterleri"),
                table(
                  ["No", "Kriter", "Durum", "Not"],
                  atLeastOneRow(
                    process.criteria.map((c, i) => [
                      String(i + 1),
                      orEmpty(c.text),
                      orEmpty(c.status),
                      orEmpty(c.note),
                    ]),
                    4,
                  ),
                  CRITERIA_WIDTHS,
                ),
              ])),

          heading(POC_SECTIONS.criteria),
          table(
            ["No", "Kriter", "Durum", "Not"],
            atLeastOneRow(
              record.criteria.map((c, i) => [
                String(i + 1),
                orEmpty(c.text),
                orEmpty(c.status),
                orEmpty(c.note),
              ]),
              4,
            ),
            CRITERIA_WIDTHS,
          ),
          body(
            `Özet: süreç kriterleri dahil toplam ${score.total} kriterin ${score.met} tanesi karşılandı.`,
            18,
          ),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
