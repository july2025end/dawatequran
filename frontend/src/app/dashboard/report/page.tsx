"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORY_LABEL, cleanTitle, fetchAll, localDate } from "@/lib/data";
import { SessionCounts, Tally, addTally, downloadCsv, loadSessionCounts, rateOf, tallyOf } from "@/lib/queries";
import { PageHeader, RateBar, SkeletonRows, toast } from "@/components/ui";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
type Session = { id: string; session_date: string; category: string; circle_id: string | null; uc_id: string | null; topic_id: string | null; location: string | null };
type Circle = { id: string; name: string; uc_id: string; murabbi_name: string | null };
const ZERO: Tally = { present: 0, absent: 0, leave: 0 };

export default function MonthlyReport() {
  const [month, setMonth] = useState(() => localDate().slice(0, 7));
  const [ucs, setUcs] = useState<{ id: string; name: string }[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [topics, setTopics] = useState<{ id: string; topic_number: number; title: string }[]>([]);
  const [joined, setJoined] = useState<{ created_at: string; type: string }[]>([]);
  const [counts, setCounts] = useState<SessionCounts>(new Map());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [u, c, s, t, p, n] = await Promise.all([
          supabase.from("union_councils").select("id, name").order("name"),
          supabase.from("quran_circles").select("id, name, uc_id, murabbi_name").order("name"),
          fetchAll<Session>((f, to) => supabase.from("sessions").select("id, session_date, category, circle_id, uc_id, topic_id, location").order("id").range(f, to)),
          supabase.from("syllabus_topics").select("id, topic_number, title").order("topic_number"),
          fetchAll<{ created_at: string; type: string }>((f, to) => supabase.from("participants").select("id, created_at, type").order("id").range(f, to)),
          loadSessionCounts(),
        ]);
        setUcs(u.data ?? []); setCircles(c.data ?? []); setSessions(s); setTopics(t.data ?? []); setJoined(p); setCounts(n);
      } catch (e) {
        toast("Couldn’t load the report: " + (e instanceof Error ? e.message : String(e)), "error");
      }
      setLoading(false);
    })();
  }, []);

  const months = useMemo(() => [...new Set([localDate().slice(0, 7), ...sessions.map((s) => s.session_date.slice(0, 7))])].filter((m) => m <= localDate().slice(0, 7)).sort().reverse(), [sessions]);
  const label = `${MONTHS[Number(month.slice(5)) - 1]} ${month.slice(0, 4)}`;

  const r = useMemo(() => {
    const circleById = new Map(circles.map((c) => [c.id, c]));
    const ucOf = (s: Session) => s.uc_id ?? (s.circle_id ? circleById.get(s.circle_id)?.uc_id ?? null : null);
    const inMonth = sessions.filter((s) => s.session_date.slice(0, 7) === month && s.session_date <= localDate());
    const sum = (list: Session[]) => list.reduce((t, s) => addTally(t, tallyOf(counts, s.id)), ZERO);
    const total = sum(inMonth);
    const reportedCircles = new Set(inMonth.map((s) => s.circle_id).filter(Boolean));
    const byCategory = Object.keys(CATEGORY_LABEL).map((k) => ({ k, n: inMonth.filter((s) => s.category === k).length })).filter((x) => x.n);
    const ucRows = ucs.map((u) => {
      const list = inMonth.filter((s) => ucOf(s) === u.id);
      const cs = circles.filter((c) => c.uc_id === u.id);
      return { ...u, sessions: list.length, rate: rateOf(sum(list)), circles: cs.length, reported: cs.filter((c) => reportedCircles.has(c.id)).length, present: sum(list).present };
    });
    const circleRows = circles.map((c) => {
      const list = inMonth.filter((s) => s.circle_id === c.id);
      return { ...c, sessions: list.length, rate: rateOf(sum(list)) };
    });
    const best = circleRows.filter((c) => c.sessions >= 2 && c.rate !== null).sort((a, b) => b.rate! - a.rate!).slice(0, 5);
    const silent = circleRows.filter((c) => c.sessions === 0);
    const topicIds = new Set(inMonth.map((s) => s.topic_id).filter(Boolean));
    const taught = topics.filter((t) => topicIds.has(t.id));
    const newMembers = joined.filter((p) => p.created_at?.slice(0, 7) === month);
    return { inMonth, total, rate: rateOf(total), reportedCircles: reportedCircles.size, byCategory, ucRows, best, silent, taught, newMembers, ucName: new Map(ucs.map((u) => [u.id, u.name])), circleById, ucOf };
  }, [month, sessions, circles, ucs, counts, topics, joined]);

  function exportSessions() {
    downloadCsv(`sessions-${month}.csv`, [
      ["Date", "Type", "Circle", "Union council", "Topic", "Location", "Present", "Leave", "Absent"],
      ...r.inMonth.sort((a, b) => a.session_date.localeCompare(b.session_date)).map((s) => {
        const t = tallyOf(counts, s.id);
        const topic = topics.find((x) => x.id === s.topic_id);
        return [s.session_date, CATEGORY_LABEL[s.category] ?? s.category, s.circle_id ? r.circleById.get(s.circle_id)?.name ?? "" : "", r.ucName.get(r.ucOf(s) ?? "") ?? "", topic ? `${topic.topic_number}: ${cleanTitle(topic.title)}` : "", s.location ?? "", t.present, t.leave, t.absent];
      }),
    ]);
  }

  async function exportMembers() {
    // Member-by-member attendance for this month, read only for the month's sessions.
    setExporting(true);
    try {
      const ids = r.inMonth.map((s) => s.id);
      const rows: { session_id: string; status: string; participants: { full_name: string; type: string; phone: string | null; circle_id: string } | null }[] = [];
      for (let i = 0; i < ids.length; i += 80) {
        const { data, error } = await supabase.from("attendance").select("session_id, status, participants(full_name, type, phone, circle_id)").in("session_id", ids.slice(i, i + 80));
        if (error) throw error;
        rows.push(...((data ?? []) as unknown as typeof rows));
      }
      const per = new Map<string, { name: string; type: string; phone: string; circle: string; uc: string; present: number; leave: number; absent: number }>();
      for (const a of rows) {
        const p = a.participants;
        if (!p) continue;
        const c = r.circleById.get(p.circle_id);
        const k = `${p.full_name}|${p.circle_id}`;
        const e = per.get(k) ?? per.set(k, { name: p.full_name, type: p.type === "haazir_arkan" ? "Arkan" : "Public", phone: p.phone ?? "", circle: c?.name ?? "", uc: r.ucName.get(c?.uc_id ?? "") ?? "", present: 0, leave: 0, absent: 0 }).get(k)!;
        if (a.status === "present" || a.status === "leave" || a.status === "absent") e[a.status]++;
      }
      downloadCsv(`attendance-by-member-${month}.csv`, [
        ["Name", "Type", "Phone", "Circle", "Union council", "Present", "Leave", "Absent", "Attendance %"],
        ...[...per.values()].sort((a, b) => a.uc.localeCompare(b.uc) || a.circle.localeCompare(b.circle) || a.name.localeCompare(b.name))
          .map((e) => [e.name, e.type, e.phone, e.circle, e.uc, e.present, e.leave, e.absent, e.present + e.absent ? Math.round((e.present / (e.present + e.absent)) * 100) : ""]),
      ]);
    } catch (e) {
      toast("Couldn’t export: " + (e instanceof Error ? e.message : String(e)), "error");
    }
    setExporting(false);
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 pt-6 md:pt-10 max-w-[900px] mx-auto space-y-5 print:max-w-none print:p-0">
      <div className="print:hidden">
        <PageHeader
          eyebrow="Monthly report"
          title={label}
          subtitle="A one-page summary for zone meetings. Print it or save it as a PDF, or export the details to Excel."
          actions={
            <>
              <select aria-label="Month" className="form-input !min-h-[36px] !py-1 !text-[14px] !w-auto" value={month} onChange={(e) => setMonth(e.target.value)}>
                {months.map((m) => <option key={m} value={m}>{MONTHS[Number(m.slice(5)) - 1]} {m.slice(0, 4)}</option>)}
              </select>
              <button type="button" onClick={() => window.print()} className="btn btn-primary btn-sm"><Printer className="h-4 w-4" /> Print / PDF</button>
            </>
          }
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={exportSessions} disabled={loading} className="btn btn-secondary btn-sm"><Download className="h-4 w-4" /> Sessions (Excel)</button>
          <button type="button" onClick={exportMembers} disabled={loading || exporting} className="btn btn-secondary btn-sm"><Download className="h-4 w-4" /> {exporting ? "Preparing…" : "Attendance by member (Excel)"}</button>
        </div>
      </div>

      {loading ? (
        <div className="card"><SkeletonRows rows={8} /></div>
      ) : (
        <article className="card p-5 sm:p-8 space-y-7 print:shadow-none print:p-0">
          <header className="flex items-start justify-between gap-4 border-b border-separator pb-4">
            <div>
              <p className="text-[13px] font-semibold text-accent">Dawat-e-Quran · Zone 5, Islamabad</p>
              <h2 className="text-[26px] font-bold tracking-[-0.02em]">Monthly report · {label}</h2>
            </div>
            <p className="text-[12px] text-label-2 text-right">Prepared {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          </header>

          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { k: "Sessions held", v: r.inMonth.length, n: r.byCategory.map((x) => `${x.n} ${CATEGORY_LABEL[x.k]}`).join(" · ") || "none" },
              { k: "Attendance", v: r.rate === null ? "—" : `${r.rate}%`, n: `${r.total.present} present · ${r.total.leave} leave · ${r.total.absent} absent` },
              { k: "Circles reporting", v: `${r.reportedCircles} / ${circles.length}`, n: `${r.silent.length} sent no report` },
              { k: "New members", v: r.newMembers.length, n: `${r.newMembers.filter((p) => p.type === "haazir_arkan").length} Arkan · ${r.newMembers.filter((p) => p.type !== "haazir_arkan").length} Public` },
            ].map((x) => (
              <div key={x.k}>
                <p className="text-[12px] font-medium text-label-2">{x.k}</p>
                <p className="text-[28px] font-bold tabular tracking-[-0.03em]">{x.v}</p>
                <p className="text-[11px] text-label-2">{x.n}</p>
              </div>
            ))}
          </section>

          <section>
            <h3 className="text-[15px] font-semibold mb-2">By union council</h3>
            <table className="w-full text-[13px] border-collapse">
              <thead><tr className="text-label-2 text-left"><th className="py-1.5 font-medium">Council</th><th className="py-1.5 font-medium text-right">Circles reporting</th><th className="py-1.5 font-medium text-right">Sessions</th><th className="py-1.5 font-medium text-right">Present</th><th className="py-1.5 font-medium pl-4 w-[30%]">Attendance</th></tr></thead>
              <tbody>
                {r.ucRows.map((u) => (
                  <tr key={u.id} className="border-t border-separator">
                    <td className="py-2 font-medium">{u.name}</td>
                    <td className="py-2 text-right tabular">{u.reported}/{u.circles}</td>
                    <td className="py-2 text-right tabular">{u.sessions}</td>
                    <td className="py-2 text-right tabular">{u.present}</td>
                    <td className="py-2 pl-4"><span className="flex items-center gap-2"><RateBar rate={u.rate} className="flex-1" /><span className="w-10 text-right tabular font-semibold">{u.rate === null ? "—" : `${u.rate}%`}</span></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-[15px] font-semibold mb-2">Best attended circles</h3>
              {r.best.length === 0 ? <p className="text-[13px] text-label-2">Not enough reports this month.</p> : (
                <ol className="text-[13px] space-y-1">
                  {r.best.map((c, i) => <li key={c.id} className="flex justify-between gap-3"><span>{i + 1}. {c.name} · {r.ucName.get(c.uc_id)}</span><span className="tabular font-semibold">{c.rate}%</span></li>)}
                </ol>
              )}
            </div>
            <div>
              <h3 className="text-[15px] font-semibold mb-2">No report this month ({r.silent.length})</h3>
              <p className="text-[13px] text-label-2 leading-relaxed">{r.silent.length ? r.silent.map((c) => `${c.name} (${r.ucName.get(c.uc_id)})`).join(", ") : "Every circle reported."}</p>
            </div>
          </section>

          <section>
            <h3 className="text-[15px] font-semibold mb-2">Topics taught ({r.taught.length})</h3>
            <p className="text-[13px] text-label-2 leading-relaxed">{r.taught.length ? r.taught.map((t) => `${t.topic_number}. ${cleanTitle(t.title)}`).join(" · ") : "No topics recorded this month."}</p>
          </section>
        </article>
      )}
    </div>
  );
}
