"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, BellRing, CircleDot, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { daysAgo, fetchAll, formatDate, localDate } from "@/lib/data";
import { SessionCounts, Tally, addTally, downloadCsv, loadSessionCounts, rateOf, tallyOf } from "@/lib/queries";
import { findMurabbi, loadRepresentatives, whatsappNumber, type Representative } from "@/lib/representatives";
import { EmptyState, PageHeader, RateBar, SearchField, Segmented, SkeletonRows, toast, useSearchParam } from "@/components/ui";

type Circle = { id: string; name: string; uc_id: string; murabbi_name: string | null };
type Session = { id: string; session_date: string; category: string; circle_id: string | null; topic_id: string | null };
type Topic = { id: string; topic_number: number; start_date: string | null; end_date: string | null };
type Status = "active" | "quiet" | "never";
type Show = "all" | Status | "empty" | "nomurabbi";

const QUIET_AFTER_DAYS = 14;
const STATUS: Record<Status, { label: string; badge: string }> = {
  active: { label: "Active", badge: "badge-green" },
  quiet: { label: "Quiet", badge: "badge-amber" },
  never: { label: "Never reported", badge: "badge-red" },
};
const ZERO: Tally = { present: 0, absent: 0, leave: 0 };

export default function Circles() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [ucs, setUcs] = useState<{ id: string; name: string }[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [members, setMembers] = useState<Map<string, number>>(new Map());
  const [counts, setCounts] = useState<SessionCounts>(new Map());
  const [reps, setReps] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  // Links from the Overview open this page pre-filtered with ?show=…
  const showParam = useSearchParam("show") as Show | null;
  const [chosenShow, setShow] = useState<Show | null>(null);
  const show: Show = chosenShow ?? showParam ?? "all";

  useEffect(() => {
    (async () => {
      try {
        const [c, u, s, t, p, n, r] = await Promise.all([
          supabase.from("quran_circles").select("id, name, uc_id, murabbi_name").order("name"),
          supabase.from("union_councils").select("id, name").order("name"),
          fetchAll<Session>((f, to) => supabase.from("sessions").select("id, session_date, category, circle_id, topic_id").order("id").range(f, to)),
          supabase.from("syllabus_topics").select("id, topic_number, start_date, end_date").order("topic_number"),
          fetchAll<{ circle_id: string }>((f, to) => supabase.from("participants").select("circle_id, id").eq("is_active", true).order("id").range(f, to)),
          loadSessionCounts(),
          loadRepresentatives(),
        ]);
        const m = new Map<string, number>();
        for (const x of p) m.set(x.circle_id, (m.get(x.circle_id) ?? 0) + 1);
        setCircles(c.data ?? []); setUcs(u.data ?? []); setSessions(s); setTopics(t.data ?? []); setMembers(m); setCounts(n); setReps(r.reps);
      } catch (e) {
        toast("Couldn’t load circles: " + (e instanceof Error ? e.message : String(e)), "error");
      }
      setLoading(false);
    })();
  }, []);

  const rows = useMemo(() => {
    const today = localDate();
    const ucName = new Map(ucs.map((u) => [u.id, u.name]));
    const topicById = new Map(topics.map((t) => [t.id, t]));
    // The topic the syllabus expects this week, if dates are set.
    const expected = topics.find((t) => t.start_date && t.end_date && t.start_date <= today && today <= t.end_date);
    return circles.map((c) => {
      const mine = sessions.filter((s) => s.circle_id === c.id && s.session_date <= today).sort((a, b) => b.session_date.localeCompare(a.session_date));
      const lastQc = mine.find((s) => s.category === "quran_circle");
      const last = mine[0]?.session_date ?? null;
      const status: Status = !last ? "never" : daysAgo(lastQc?.session_date ?? last) > QUIET_AFTER_DAYS ? "quiet" : "active";
      const sum = (list: Session[]) => list.reduce((t, s) => addTally(t, tallyOf(counts, s.id)), ZERO);
      const recent = rateOf(sum(mine.filter((s) => daysAgo(s.session_date) <= 30)));
      const before = rateOf(sum(mine.filter((s) => { const d = daysAgo(s.session_date); return d > 30 && d <= 60; })));
      const taught = mine.find((s) => s.topic_id);
      const current = taught ? topicById.get(taught.topic_id!) : undefined;
      const behind = expected && current ? expected.topic_number - current.topic_number : null;
      const rep = findMurabbi(reps, c.murabbi_name);
      return {
        ...c, ucName: ucName.get(c.uc_id) ?? "", members: members.get(c.id) ?? 0, last, status, recent, before,
        current, behind, sessions: mine.length,
        murabbiMissing: !c.murabbi_name?.trim() || /^pending$/i.test(c.murabbi_name.trim()),
        wa: rep ? whatsappNumber(rep.phone, rep.whatsapp) : null,
      };
    });
  }, [circles, ucs, sessions, topics, members, counts, reps]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const order: Record<Status, number> = { never: 0, quiet: 1, active: 2 };
    return rows
      .filter((r) => (show === "all" || (show === "empty" ? r.members === 0 : show === "nomurabbi" ? r.murabbiMissing : r.status === show))
        && (!q || r.name.toLowerCase().includes(q) || r.ucName.toLowerCase().includes(q) || r.murabbi_name?.toLowerCase().includes(q)))
      .sort((a, b) => order[a.status] - order[b.status] || a.ucName.localeCompare(b.ucName) || a.name.localeCompare(b.name));
  }, [rows, show, query]);

  const tally = { active: rows.filter((r) => r.status === "active").length, quiet: rows.filter((r) => r.status === "quiet").length, never: rows.filter((r) => r.status === "never").length };

  function remind(r: (typeof rows)[number]) {
    if (!r.wa) return;
    const link = `${window.location.origin}/attendance`;
    const text = `السلام علیکم ${r.murabbi_name}، براہِ کرم ${r.name} (${r.ucName}) کی حاضری اس لنک پر درج کر دیں: ${link}\nجزاک اللہ خیر`;
    window.open(`https://wa.me/${r.wa}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  function exportCsv() {
    downloadCsv(`circles-${localDate()}.csv`, [
      ["Circle", "Union council", "Murabbi", "Status", "Members", "Last report", "Attendance last 30 days %", "Previous 30 days %", "Current topic"],
      ...shown.map((r) => [r.name, r.ucName, r.murabbi_name ?? "", STATUS[r.status].label, r.members, r.last ?? "", r.recent ?? "", r.before ?? "", r.current?.topic_number ?? ""]),
    ]);
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 pt-6 md:pt-10 max-w-[1100px] mx-auto space-y-5">
      <PageHeader
        eyebrow="Circle health"
        title="Circles"
        subtitle={loading ? "Checking every circle…" : `${tally.active} active · ${tally.quiet} quiet (no class in ${QUIET_AFTER_DAYS}+ days) · ${tally.never} never reported`}
        actions={<button type="button" onClick={exportCsv} className="btn btn-secondary btn-sm"><Download className="h-4 w-4" /> Export</button>}
      />
      <div className="space-y-2.5 animate-rise">
        <SearchField value={query} onChange={setQuery} placeholder="Search circle, council or murabbi" />
        <Segmented
          label="Show"
          value={show}
          onChange={setShow}
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "quiet", label: "Quiet" },
            { value: "never", label: "Never reported" },
            { value: "empty", label: "No members" },
            { value: "nomurabbi", label: "No murabbi" },
          ]}
        />
      </div>

      {loading ? (
        <div className="card"><SkeletonRows rows={8} /></div>
      ) : shown.length === 0 ? (
        <div className="card"><EmptyState icon={CircleDot} title="No circles match" /></div>
      ) : (
        <ul className="card overflow-hidden list-inset">
          {shown.map((r) => (
            <li key={r.id} className="px-4 sm:px-5 py-3.5 grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_11rem] items-center gap-x-5 gap-y-2.5">
              <div className="min-w-0">
                <p className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold">{r.name}</span>
                  <span className="text-[13px] text-label-2">{r.ucName}</span>
                  <span className={`badge ${STATUS[r.status].badge}`}>{STATUS[r.status].label}</span>
                </p>
                <p className="text-[13px] text-label-2 mt-0.5">
                  {r.murabbiMissing ? <span className="text-warning">No murabbi named</span> : `Murabbi: ${r.murabbi_name}`} · {r.members} member{r.members === 1 ? "" : "s"}
                  {r.last ? ` · last report ${formatDate(r.last)}` : ""}
                </p>
                <p className="text-[13px] text-label-2">
                  {r.current ? `Teaching topic ${r.current.topic_number}` : "No topic recorded"}
                  {r.behind !== null && r.behind > 0 && <span className="text-warning"> · {r.behind} topic{r.behind === 1 ? "" : "s"} behind the syllabus</span>}
                  {r.behind !== null && r.behind <= 0 && <span className="text-success"> · on track</span>}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between text-[13px] mb-1.5">
                  <span className="text-label-2">Attendance, last 30 days</span>
                  <span className="font-semibold tabular inline-flex items-center gap-1">
                    {r.recent === null ? "—" : `${r.recent}%`}
                    {r.recent !== null && r.before !== null && r.recent !== r.before && (
                      r.recent > r.before
                        ? <ArrowUpRight className="h-3.5 w-3.5 text-success" aria-label={`up from ${r.before}%`} />
                        : <ArrowDownRight className="h-3.5 w-3.5 text-danger" aria-label={`down from ${r.before}%`} />
                    )}
                  </span>
                </div>
                <RateBar rate={r.recent} />
              </div>
              <div className="flex md:justify-end">
                {r.wa ? (
                  <button type="button" onClick={() => remind(r)} className="btn btn-tinted btn-sm"><BellRing className="h-4 w-4" /> Remind murabbi</button>
                ) : (
                  <span className="text-[12px] text-label-2">{r.murabbiMissing ? "" : "No number for murabbi"}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
