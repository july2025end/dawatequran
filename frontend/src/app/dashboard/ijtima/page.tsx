"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchAll, localDate } from "@/lib/data";
import { SessionCounts, Tally, addTally, downloadCsv, loadSessionCounts, rateOf, tallyOf } from "@/lib/queries";
import { EmptyState, PageHeader, SkeletonRows, toast } from "@/components/ui";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
type Session = { id: string; session_date: string; uc_id: string | null; attendance_month: string | null };
const ZERO: Tally = { present: 0, absent: 0, leave: 0 };

/** Ijtima reports carry the month they count for; use it, in the year of the session. */
function monthKey(s: Session) {
  const y = Number(s.session_date.slice(0, 4));
  const m = s.attendance_month ? MONTHS.indexOf(s.attendance_month) : Number(s.session_date.slice(5, 7)) - 1;
  return `${y}-${String((m < 0 ? Number(s.session_date.slice(5, 7)) - 1 : m) + 1).padStart(2, "0")}`;
}
const monthLabel = (k: string) => `${MONTHS[Number(k.slice(5)) - 1].slice(0, 3)} ${k.slice(2, 4)}`;

export default function IjtimaRegister() {
  const [ucs, setUcs] = useState<{ id: string; name: string }[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [counts, setCounts] = useState<SessionCounts>(new Map());
  const [arkan, setArkan] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [u, s, n, c, p] = await Promise.all([
          supabase.from("union_councils").select("id, name").order("name"),
          fetchAll<Session>((f, t) => supabase.from("sessions").select("id, session_date, uc_id, attendance_month").eq("category", "ijtima_arkan").order("id").range(f, t)),
          loadSessionCounts(),
          supabase.from("quran_circles").select("id, uc_id"),
          fetchAll<{ circle_id: string }>((f, t) => supabase.from("participants").select("id, circle_id").eq("type", "haazir_arkan").eq("is_active", true).order("id").range(f, t)),
        ]);
        const ucOfCircle = new Map((c.data ?? []).map((x) => [x.id, x.uc_id]));
        const a = new Map<string, number>();
        for (const x of p) { const uc = ucOfCircle.get(x.circle_id); if (uc) a.set(uc, (a.get(uc) ?? 0) + 1); }
        setUcs(u.data ?? []); setSessions(s.filter((x) => x.session_date <= localDate())); setCounts(n); setArkan(a);
      } catch (e) {
        toast("Couldn’t load the register: " + (e instanceof Error ? e.message : String(e)), "error");
      }
      setLoading(false);
    })();
  }, []);

  const grid = useMemo(() => {
    const months = [...new Set(sessions.map(monthKey))].sort().slice(-6);
    const cell = new Map<string, Tally>();
    for (const s of sessions) {
      if (!s.uc_id) continue;
      const k = `${s.uc_id}|${monthKey(s)}`;
      cell.set(k, addTally(cell.get(k) ?? ZERO, tallyOf(counts, s.id)));
    }
    return { months, cell };
  }, [sessions, counts]);

  function exportCsv() {
    const rows: (string | number)[][] = [["Union council", "Arkan", ...grid.months.flatMap((m) => [`${monthLabel(m)} present`, `${monthLabel(m)} leave`, `${monthLabel(m)} absent`])]];
    for (const u of ucs) rows.push([u.name, arkan.get(u.id) ?? 0, ...grid.months.flatMap((m): (string | number)[] => { const t = grid.cell.get(`${u.id}|${m}`); return t ? [t.present, t.leave, t.absent] : ["", "", ""]; })]);
    downloadCsv(`ijtima-arkan-${localDate()}.csv`, rows);
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 pt-6 md:pt-10 max-w-[1200px] mx-auto space-y-5">
      <PageHeader
        eyebrow="Ijtima Arkan"
        title="Monthly register"
        subtitle="Arkan attendance at each council’s monthly Ijtima, for the last six months. Each cell: present · leave · absent."
        actions={grid.months.length > 0 ? <button type="button" onClick={exportCsv} className="btn btn-secondary btn-sm"><Download className="h-4 w-4" /> Export</button> : undefined}
      />
      {loading ? (
        <div className="card"><SkeletonRows rows={8} /></div>
      ) : grid.months.length === 0 ? (
        <div className="card"><EmptyState icon={Users} title="No Ijtima Arkan reports yet" text="They appear here once murabbis submit Ijtima Arkan attendance." /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left border-collapse">
            <caption className="sr-only">Ijtima Arkan attendance by union council and month</caption>
            <thead>
              <tr className="text-[12px] text-label-2">
                <th scope="col" className="sticky left-0 bg-surface px-4 py-3 font-semibold">Union council</th>
                <th scope="col" className="px-3 py-3 font-semibold text-right">Arkan</th>
                {grid.months.map((m) => <th key={m} scope="col" className="px-3 py-3 font-semibold text-center">{monthLabel(m)}</th>)}
              </tr>
            </thead>
            <tbody>
              {ucs.map((u) => (
                <tr key={u.id} className="border-t border-separator">
                  <th scope="row" className="sticky left-0 bg-surface px-4 py-3 text-[14px] font-semibold whitespace-nowrap">{u.name}</th>
                  <td className="px-3 py-3 text-[14px] text-right tabular text-label-2">{arkan.get(u.id) ?? 0}</td>
                  {grid.months.map((m) => {
                    const t = grid.cell.get(`${u.id}|${m}`);
                    const r = t ? rateOf(t) : null;
                    return (
                      <td key={m} className="px-2 py-2 text-center">
                        {t ? (
                          <span className={`inline-flex flex-col items-center rounded-xl px-2.5 py-1.5 min-w-[78px] ${r === null ? "bg-fill" : r >= 60 ? "bg-success-tint" : r >= 35 ? "bg-warning-tint" : "bg-danger-tint"}`}>
                            <span className="text-[15px] font-semibold tabular">{r === null ? "—" : `${r}%`}</span>
                            <span className="text-[11px] text-label-2 tabular">{t.present} · {t.leave} · {t.absent}</span>
                          </span>
                        ) : (
                          <span className="text-[12px] text-label-3" aria-label="No report">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
