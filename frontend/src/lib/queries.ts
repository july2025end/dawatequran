// Data loaders shared by the admin pages.
// Attendance totals come from two database views (database/v2_migration.sql) so the dashboard
// downloads a few hundred summary rows instead of every attendance record. Until that SQL has
// been run, each loader falls back to reading the raw rows and summarising them here.
import { supabase } from "@/lib/supabase";
import { fetchAll } from "@/lib/data";

export type Tally = { present: number; absent: number; leave: number };
export type MemberType = "haazir_arkan" | "aam_afraad";
/** Per session, attendance split by member type. */
export type SessionCounts = Map<string, Partial<Record<MemberType, Tally>>>;

export type MemberSummary = {
  present: number;
  marked: number; // present + absent (leave excluded)
  lastPresent: string | null;
  lastMarked: string | null;
  recent: string[]; // last three non-leave statuses, newest first
};

const empty = (): Tally => ({ present: 0, absent: 0, leave: 0 });
const bump = (t: Tally, status: string) => { if (status === "present" || status === "absent" || status === "leave") t[status]++; };

type RawAtt = { session_id: string; participant_id: string; status: string };
let rawCache: Promise<{ att: RawAtt[]; types: Map<string, string> }> | null = null;

function loadRaw() {
  // One download shared by both fallbacks on the same page.
  rawCache ??= (async () => {
    const [att, people] = await Promise.all([
      fetchAll<RawAtt>((f, t) => supabase.from("attendance").select("session_id, participant_id, status").order("session_id").order("participant_id").range(f, t)),
      fetchAll<{ id: string; type: string }>((f, t) => supabase.from("participants").select("id, type").order("id").range(f, t)),
    ]);
    return { att, types: new Map(people.map((p) => [p.id, p.type])) };
  })();
  const p = rawCache;
  p.catch(() => { rawCache = null; });
  setTimeout(() => { if (rawCache === p) rawCache = null; }, 30_000);
  return p;
}

export async function loadSessionCounts(): Promise<SessionCounts> {
  const map: SessionCounts = new Map();
  try {
    const rows = await fetchAll<{ session_id: string; type: MemberType; present: number; absent: number; leave: number }>((f, t) =>
      supabase.from("session_attendance_counts").select("session_id, type, present, absent, leave").order("session_id").order("type").range(f, t));
    for (const r of rows) {
      const entry = map.get(r.session_id) ?? {};
      entry[r.type] = { present: Number(r.present), absent: Number(r.absent), leave: Number(r.leave) };
      map.set(r.session_id, entry);
    }
    return map;
  } catch {
    const { att, types } = await loadRaw();
    for (const a of att) {
      const type = (types.get(a.participant_id) ?? "aam_afraad") as MemberType;
      const entry = map.get(a.session_id) ?? {};
      bump((entry[type] ??= empty()), a.status);
      map.set(a.session_id, entry);
    }
    return map;
  }
}

export async function loadMemberSummaries(sessionDates: Map<string, string>, today: string): Promise<Map<string, MemberSummary>> {
  const out = new Map<string, MemberSummary>();
  try {
    const rows = await fetchAll<{ participant_id: string; present: number; marked: number; last_present: string | null; last_marked: string | null; recent: string[] }>((f, t) =>
      supabase.from("member_attendance_summary").select("participant_id, present, marked, last_present, last_marked, recent").order("participant_id").range(f, t));
    for (const r of rows) out.set(r.participant_id, { present: Number(r.present), marked: Number(r.marked), lastPresent: r.last_present, lastMarked: r.last_marked, recent: r.recent ?? [] });
    return out;
  } catch {
    const { att } = await loadRaw();
    const per = new Map<string, { date: string; status: string }[]>();
    for (const a of att) {
      const date = sessionDates.get(a.session_id);
      if (!date || date > today || a.status === "leave") continue;
      (per.get(a.participant_id) ?? per.set(a.participant_id, []).get(a.participant_id)!).push({ date, status: a.status });
    }
    for (const [id, list] of per) {
      list.sort((x, y) => y.date.localeCompare(x.date));
      const presents = list.filter((x) => x.status === "present");
      out.set(id, {
        present: presents.length,
        marked: list.length,
        lastPresent: presents[0]?.date ?? null,
        lastMarked: list[0]?.date ?? null,
        recent: list.slice(0, 3).map((x) => x.status),
      });
    }
    return out;
  }
}

/** Sum a session's tallies, optionally for one member type. */
export function tallyOf(counts: SessionCounts, sessionId: string, type: "all" | MemberType = "all"): Tally {
  const entry = counts.get(sessionId);
  const t = empty();
  if (!entry) return t;
  for (const k of ["haazir_arkan", "aam_afraad"] as const) {
    if (type !== "all" && k !== type) continue;
    const v = entry[k];
    if (v) { t.present += v.present; t.absent += v.absent; t.leave += v.leave; }
  }
  return t;
}

export function addTally(a: Tally, b: Tally): Tally {
  return { present: a.present + b.present, absent: a.absent + b.absent, leave: a.leave + b.leave };
}

/** Present ÷ (present + absent); leave is excused. */
export const rateOf = (t: Tally) => (t.present + t.absent ? Math.round((t.present / (t.present + t.absent)) * 100) : null);

/** CSV text from rows; values are quoted so names with commas survive Excel. */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return "﻿" + rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

export function downloadCsv(name: string, rows: (string | number | null | undefined)[][]) {
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
