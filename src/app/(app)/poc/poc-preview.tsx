import type { ReactNode } from "react";
import { criteriaScore, formatDay, formatRange } from "@/lib/poc/format";
import { POC_SECTIONS } from "@/lib/poc/types";
import type { PocDraft } from "@/lib/poc/schema";

type Props = {
  draft: PocDraft;
};

/**
 * Belge onizlemesi. Hook kullanmaz; hem editor (client) hem yazdirma sayfasi
 * (server) ayni bileseni render eder. Kagit her temada beyaz kalir: burada
 * gorunen sey ekran arayuzu degil, ciktinin kendisidir.
 */
export function PocPreview({ draft }: Props) {
  const score = criteriaScore(draft);
  const customerName = draft.customer_name;

  return (
    <article className="poc-paper mx-auto w-full max-w-[794px] bg-white px-[8%] py-[6%] text-[13px] leading-relaxed text-[#111] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_12px_32px_-12px_rgba(0,0,0,0.28)] print:max-w-none print:px-0 print:py-0 print:shadow-none">
      <p className="text-[10px] font-bold tracking-[0.12em] text-[#1F3864]">
        MDP INTEGRATION PLATFORM
      </p>
      <h1 className="mt-1 border-b-[3px] border-[#1F3864] pb-2 text-[26px] font-bold tracking-tight">
        PoC Sonuç Raporu
      </h1>

      <FieldTable
        rows={[
          ["Müşteri", customerName],
          ["PoC Konusu", draft.title],
          ["Tarih", formatRange(draft.start_date, draft.end_date)],
          ["Kurulum", draft.deployment],
          [
            "Ekip",
            [
              draft.team_mdp ? `MDP: ${draft.team_mdp}` : "",
              draft.team_customer ? `Müşteri: ${draft.team_customer}` : "",
            ]
              .filter(Boolean)
              .join("   |   "),
          ],
          ["Durum", draft.status],
          ["Genel Sonuç", draft.result],
        ]}
      />

      <Section title={POC_SECTIONS.scope}>
        <Paragraph value={draft.purpose} />
        <p className="mt-2 text-[12px]">
          <span className="font-semibold">Kapsam dışı: </span>
          <Val value={draft.out_of_scope} />
        </p>
      </Section>

      <Section title={POC_SECTIONS.install}>
        <FieldTable
          rows={[
            ["Sunucu", draft.server_info],
            ["İşletim Sistemi ve Kaynak", draft.os_info],
            ["MIP Sürümü", draft.mip_version],
            ["Kurulum Tarihi", draft.install_date ? formatDay(draft.install_date) : ""],
            ["Sistem Erişimleri", draft.access_note],
            ["Kurulum Sonucu", draft.install_result],
          ]}
        />
      </Section>

      <Section title={POC_SECTIONS.works}>
        <Grid
          head={["No", "İş", "Durum", "Tarih"]}
          widths={["7%", "57%", "18%", "18%"]}
          rows={draft.works.map((w, i) => [
            String(i + 1),
            w.name,
            w.status,
            w.date ? formatDay(w.date) : "",
          ])}
          emptyLabel="İş adımı eklenmedi"
        />
      </Section>

      <Section title={POC_SECTIONS.processes}>
        {draft.processes.length === 0 ? (
          <p className="text-[12px] text-[#aaa]">Süreç eklenmedi</p>
        ) : (
          <div className="space-y-4">
            {draft.processes.map((process, index) => (
              <div key={index} className="break-inside-avoid">
                <h3 className="mb-1.5 text-[13px] font-bold">
                  4.{index + 1} {process.name.trim() || `Süreç ${index + 1}`}
                </h3>
                <Grid
                  head={[
                    "Kaynak",
                    "Hedef",
                    "Yöntem",
                    "Gönderilen",
                    "Başarılı",
                    "Hatalı",
                    "Sonuç",
                  ]}
                  widths={["18%", "18%", "14%", "13%", "12%", "11%", "14%"]}
                  rows={[
                    [
                      process.source,
                      process.target,
                      process.method,
                      process.sent,
                      process.ok,
                      process.failed,
                      process.result,
                    ],
                  ]}
                />
                <p className="mt-2 mb-1 text-[11.5px] font-semibold">
                  Kabul kriterleri
                </p>
                <Grid
                  head={["No", "Kriter", "Durum", "Not"]}
                  widths={["7%", "57%", "18%", "18%"]}
                  rows={process.criteria.map((c, i) => [
                    String(i + 1),
                    c.text,
                    c.status,
                    c.note,
                  ])}
                  emptyLabel="Bu süreç için kriter tanımlanmadı"
                />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={POC_SECTIONS.criteria}>
        <Grid
          head={["No", "Kriter", "Durum", "Not"]}
          widths={["7%", "57%", "18%", "18%"]}
          rows={draft.criteria.map((c, i) => [
            String(i + 1),
            c.text,
            c.status,
            c.note,
          ])}
          emptyLabel="Genel kriter eklenmedi"
        />
        {score.total > 0 ? (
          <p className="mt-2 text-[11px] text-[#555]">
            Özet: süreç kriterleri dahil toplam {score.total} kriterin{" "}
            {score.met} tanesi karşılandı.
          </p>
        ) : null}
      </Section>

      <p className="mt-6 border-t border-[#ddd] pt-2 text-[10px] text-[#777]">
        Gizli - Taraflara Özel
      </p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-[15px] font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Val({ value }: { value: string }) {
  const text = value.trim();
  if (text === "") return <span className="text-[#aaa]">-</span>;
  return <>{text}</>;
}

function Paragraph({ value }: { value: string }) {
  const text = value.trim();
  if (text === "") {
    return <p className="text-[12px] text-[#aaa]">-</p>;
  }
  return (
    <div className="space-y-1.5 text-[12px]">
      {text.split("\n").map((linePart, i) => (
        <p key={i}>{linePart}</p>
      ))}
    </div>
  );
}

function FieldTable({ rows }: { rows: [string, string][] }) {
  return (
    <table className="mt-4 w-full border-collapse text-[12px]">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th className="w-[28%] border border-[#c8c8c8] bg-[#f4f5f7] px-2 py-1.5 text-left align-top font-semibold">
              {label}
            </th>
            <td className="border border-[#c8c8c8] px-2 py-1.5 align-top">
              <Val value={value} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Grid({
  head,
  rows,
  widths,
  emptyLabel,
  className,
}: {
  head: string[];
  rows: string[][];
  widths: string[];
  emptyLabel?: string;
  className?: string;
}) {
  return (
    <table className={`w-full border-collapse text-[11.5px] ${className ?? ""}`}>
      <thead>
        <tr>
          {head.map((h, i) => (
            <th
              key={h}
              style={{ width: widths[i] }}
              className="border border-[#c8c8c8] bg-[#e8eaed] px-2 py-1.5 text-left font-semibold"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={head.length}
              className="border border-[#c8c8c8] px-2 py-2 text-center text-[#aaa]"
            >
              {emptyLabel ?? "-"}
            </td>
          </tr>
        ) : (
          rows.map((row, i) => (
            <tr key={i}>
              {row.map((value, j) => (
                <td
                  key={j}
                  className="border border-[#c8c8c8] px-2 py-1.5 align-top"
                >
                  <Val value={value} />
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
