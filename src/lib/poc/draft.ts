import type { PocDraft } from "./schema";
import type { PocRecord } from "./types";

const text = (value: string | null | undefined): string => value ?? "";

/** Veritabani kaydini forma uygun hale getirir: null yerine bos string. */
export function toDraft(record: PocRecord): PocDraft {
  return {
    customer_name: record.customer_name,
    title: record.title,
    status: record.status,
    result: text(record.result),

    start_date: text(record.start_date),
    end_date: text(record.end_date),
    deployment: text(record.deployment),
    team_mdp: text(record.team_mdp),
    team_customer: text(record.team_customer),

    purpose: text(record.purpose),
    out_of_scope: text(record.out_of_scope),

    server_info: text(record.server_info),
    os_info: text(record.os_info),
    mip_version: text(record.mip_version),
    install_date: text(record.install_date),
    access_note: text(record.access_note),
    install_result: text(record.install_result),

    processes: record.processes,
    works: record.works,
    criteria: record.criteria,
  };
}
