// Attendance reports that couldn't be sent (no signal) wait on the phone and are sent later.
import { supabase } from "@/lib/supabase";

export type SessionInput = {
  session_date: string; category: string; location: string; notes: string;
  circle_id: string | null; uc_id: string | null; topic_id: string | null; attendance_month: string | null;
};
export type RecordInput = { participant_id: string; status: string };
export type PendingReport = { id: string; label: string; savedAt: string; session: SessionInput; records: RecordInput[] };

const KEY = "dq-pending-reports";

export function pendingReports(): PendingReport[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
function savePending(list: PendingReport[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage full or blocked */ }
}

/** True when the failure was the connection, not the data (so retrying later can work). */
export function isNetworkError(e: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  const msg = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e);
  return e instanceof TypeError || /failed to fetch|load failed|network|fetch/i.test(msg);
}

/** Saves the session and its attendance; never leaves a session without its attendance. */
export async function sendReport(session: SessionInput, records: RecordInput[]): Promise<string> {
  const { data, error } = await supabase.from("sessions").insert(session).select("id").single();
  if (error) throw error;
  if (records.length) {
    const { error: attError } = await supabase.from("attendance").insert(records.map((r) => ({ ...r, session_id: data.id })));
    if (attError) {
      await supabase.from("sessions").delete().eq("id", data.id);
      throw attError;
    }
  }
  return data.id;
}

export function queueReport(label: string, session: SessionInput, records: RecordInput[]) {
  const item: PendingReport = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label, savedAt: new Date().toISOString(), session, records };
  savePending([...pendingReports(), item]);
}

let flushing: Promise<{ sent: number; left: number }> | null = null;

/** Sends waiting reports in order; stops at the first network failure. */
export function flushPending(): Promise<{ sent: number; left: number }> {
  flushing ??= (async () => {
    let list = pendingReports();
    let sent = 0;
    for (const item of [...list]) {
      try {
        await sendReport(item.session, item.records);
        sent++;
        list = list.filter((x) => x.id !== item.id);
        savePending(list);
      } catch (e) {
        if (isNetworkError(e)) break;
        // A data error won't fix itself by retrying; keep the report so it isn't lost silently.
        break;
      }
    }
    return { sent, left: list.length };
  })().finally(() => { flushing = null; });
  return flushing;
}
