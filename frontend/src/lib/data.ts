// Shared data helpers, so every screen counts the same way.

// Supabase returns at most 1,000 rows per request, so tables that can grow past that
// (attendance, sessions, participants) must be read page by page.
const PAGE = 1000;

type PageResult<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

export async function fetchAll<T>(page: (from: number, to: number) => PageResult<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

export type AttendanceStatus = "present" | "absent" | "leave";

/** Present ÷ (present + absent). People on leave are excused, so they don't lower the rate. */
export function attendanceRate(statuses: Iterable<string>): number | null {
  let present = 0;
  let counted = 0;
  for (const s of statuses) {
    if (s === "present") { present++; counted++; }
    else if (s === "absent") counted++;
  }
  return counted ? Math.round((present / counted) * 100) : null;
}

/** Today's date as YYYY-MM-DD in the device's own time zone (toISOString would give UTC). */
export function localDate(d = new Date()): string {
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

/** Whole days from a YYYY-MM-DD date to today; negative for future dates. */
export function daysAgo(isoDate: string): number {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  const then = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - then.getTime()) / 86_400_000);
}

export type Period = "week" | "month" | "3_months" | "complete";

export function inPeriod(isoDate: string | null | undefined, period: Period): boolean {
  if (!isoDate) return period === "complete";
  if (period === "complete") return true;
  const days = daysAgo(isoDate);
  const limit = period === "week" ? 7 : period === "month" ? 30 : 90;
  return days >= 0 && days <= limit;
}

export const CATEGORY_LABEL: Record<string, string> = {
  quran_circle: "Quran Circle",
  dars_e_quran: "Dars-e-Quran",
  ijtima_arkan: "Ijtima Arkan",
  other: "Other",
};

export const MEMBER_LABEL: Record<string, string> = {
  haazir_arkan: "Arkan",
  aam_afraad: "Public",
};

export function formatDate(isoDate: string, locale = "en-GB"): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

/** Titles are stored as "Topic 1: ثنائے رب (…)"; screens add the number themselves, so drop it here. */
export function cleanTitle(title: string | null | undefined): string {
  return (title ?? "").replace(/^\s*topic\s*\d+\s*[:\-–—.]\s*/i, "").trim();
}
