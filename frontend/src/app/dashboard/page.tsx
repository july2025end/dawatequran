"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronRight, ClipboardList, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORY_LABEL, Period, cleanTitle, daysAgo, fetchAll, formatDate, inPeriod, localDate } from "@/lib/data";
import { SessionCounts, Tally, addTally, loadMemberSummaries, loadSessionCounts, rateOf, tallyOf } from "@/lib/queries";
import { BiText, EmptyState, PageHeader, RateBar, Segmented, Stat, useChartColors } from "@/components/ui";

type UC = { id: string; name: string };
type Circle = { id: string; name: string; uc_id: string; murabbi_name: string | null };
type Session = { id: string; session_date: string; category: string; circle_id: string | null; uc_id: string | null; topic_id: string | null };
type Participant = { id: string; full_name: string; type: string; circle_id: string; is_active: boolean };
type Topic = { id: string; topic_number: number; title: string; start_date: string | null };

const QUIET_AFTER_DAYS = 14;
const WEEKS = 12;
const PERIODS: { value: Period; label: string; long: string; days: number }[] = [
  { value: "week", label: "7 days", long: "last 7 days", days: 7 },
  { value: "month", label: "30 days", long: "last 30 days", days: 30 },
  { value: "3_months", label: "3 months", long: "last 3 months", days: 90 },
  { value: "complete", label: "All time", long: "all time", days: 0 },
];
const ZERO: Tally = { present: 0, absent: 0, leave: 0 };

export default function DashboardOverview() {
  const [data, setData] = useState<{ ucs: UC[]; circles: Circle[]; sessions: Session[]; participants: Participant[]; topics: Topic[]; counts: SessionCounts; followUp: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");
  const [category, setCategory] = useState("all");
  const [memberType, setMemberType] = useState<"all" | "haazir_arkan" | "aam_afraad">("all");
  const chart = useChartColors();

  // No synchronous state updates before the first await, so this is safe to call from an effect.
  const fetchData = useCallback(async () => {
    try {
      const [ucs, circles, topics, sessions, participants, counts] = await Promise.all([
        supabase.from("union_councils").select("id, name").order("name"),
        supabase.from("quran_circles").select("id, name, uc_id, murabbi_name").order("name"),
        supabase.from("syllabus_topics").select("id, topic_number, title, start_date").order("topic_number"),
        fetchAll<Session>((f, t) => supabase.from("sessions").select("id, session_date, category, circle_id, uc_id, topic_id").order("id").range(f, t)),
        fetchAll<Participant>((f, t) => supabase.from("participants").select("id, full_name, type, circle_id, is_active").order("id").range(f, t)),
        loadSessionCounts(),
      ]);
      const firstError = [ucs, circles, topics].find((r) => r.error)?.error;
      if (firstError) throw new Error(firstError.message);
      const today = localDate();
      const summaries = await loadMemberSummaries(new Map(sessions.map((s) => [s.id, s.session_date])), today);
      const active = new Set(participants.filter((p) => p.is_active).map((p) => p.id));
      const followUp = [...summaries].filter(([id, m]) => active.has(id) && m.recent.length >= 3 && m.recent.every((s) => s === "absent")).length;
      setData({ ucs: ucs.data ?? [], circles: circles.data ?? [], topics: topics.data ?? [], sessions, participants, counts, followUp });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const retry = () => { setLoading(true); setError(""); fetchData(); };

  const view = useMemo(() => {
    if (!data) return null;
    const today = localDate();
    const days = PERIODS.find((p) => p.value === period)!.days;
    const circleById = new Map(data.circles.map((c) => [c.id, c]));
    const ucName = new Map(data.ucs.map((u) => [u.id, u.name]));
    const ucOf = (s: Session) => s.uc_id ?? (s.circle_id ? circleById.get(s.circle_id)?.uc_id ?? null : null);
    const matchCategory = (s: Session) => category === "all" || s.category === category;
    // Future-dated rows are scheduled classes, not classes held.
    const held = data.sessions.filter((s) => s.session_date <= today);
    const sum = (list: Session[]) => list.reduce((t, s) => addTally(t, tallyOf(data.counts, s.id, memberType)), ZERO);

    const figures = (list: Session[]) => {
      const t = sum(list);
      return { sessions: list.length, rate: rateOf(t), tally: t, active: new Set(list.map((s) => s.circle_id).filter(Boolean)).size, topics: new Set(list.map((s) => s.topic_id).filter(Boolean)).size };
    };
    const current = held.filter((s) => matchCategory(s) && inPeriod(s.session_date, period));
    const now = figures(current);
    // The same length of time just before, for the arrows.
    const prev = days ? figures(held.filter((s) => { const d = daysAgo(s.session_date); return matchCategory(s) && d > days && d <= days * 2; })) : null;

    const monday = new Date();
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const weeks = Array.from({ length: WEEKS }, (_, i) => {
      const start = new Date(monday);
      start.setDate(start.getDate() - (WEEKS - 1 - i) * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const inWeek = held.filter((s) => matchCategory(s) && s.session_date >= localDate(start) && s.session_date <= localDate(end));
      const t = sum(inWeek);
      return { label: start.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), sessions: inWeek.length, rate: rateOf(t), present: t.present, marked: t.present + t.absent };
    });

    const activeCircleIds = new Set(current.map((s) => s.circle_id));
    const ucRows = data.ucs.map((uc) => {
      const circles = data.circles.filter((c) => c.uc_id === uc.id);
      const list = current.filter((s) => ucOf(s) === uc.id);
      const lastHeld = held.filter((s) => ucOf(s) === uc.id).reduce<string | null>((m, s) => (!m || s.session_date > m ? s.session_date : m), null);
      return { ...uc, circles: circles.length, activeCircles: circles.filter((c) => activeCircleIds.has(c.id)).length, sessions: list.length, rate: rateOf(sum(list)), lastHeld };
    }).sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1) || a.name.localeCompare(b.name));

    const lastByCircle = new Map<string, string>();
    for (const s of held) if (s.category === "quran_circle" && s.circle_id && s.session_date > (lastByCircle.get(s.circle_id) ?? "")) lastByCircle.set(s.circle_id, s.session_date);
    const quiet = data.circles
      .map((c) => { const last = lastByCircle.get(c.id) ?? null; return { ...c, ucName: ucName.get(c.uc_id) ?? "", last, days: last ? daysAgo(last) : Infinity }; })
      .filter((c) => c.days > QUIET_AFTER_DAYS)
      .sort((a, b) => b.days - a.days);

    // Data quality
    const seen = new Map<string, number>();
    for (const s of data.sessions) { const k = `${s.category}|${s.circle_id ?? s.uc_id}|${s.session_date}`; seen.set(k, (seen.get(k) ?? 0) + 1); }
    const memberCount = new Map<string, number>();
    for (const p of data.participants) if (p.is_active) memberCount.set(p.circle_id, (memberCount.get(p.circle_id) ?? 0) + 1);
    const names = new Map<string, number>();
    for (const p of data.participants) if (p.is_active) { const k = `${p.circle_id}|${p.full_name.trim().toLowerCase()}`; names.set(k, (names.get(k) ?? 0) + 1); }
    const quality = [
      { label: "Possible duplicate reports", count: [...seen.values()].reduce((n, v) => n + (v > 1 ? v - 1 : 0), 0), href: "/dashboard/jaiza?duplicates=1" },
      { label: "Past sessions with no attendance", count: held.filter((s) => !data.counts.has(s.id)).length, href: "/dashboard/jaiza?empty=1" },
      { label: "Quran Circle reports with no topic", count: held.filter((s) => s.category === "quran_circle" && !s.topic_id).length, href: "/dashboard/jaiza?notopic=1" },
      { label: "Circles with no members", count: data.circles.filter((c) => !memberCount.get(c.id)).length, href: "/dashboard/circles?show=empty" },
      { label: "Circles without a murabbi name", count: data.circles.filter((c) => !c.murabbi_name?.trim() || /^pending$/i.test(c.murabbi_name.trim())).length, href: "/dashboard/circles?show=nomurabbi" },
      { label: "Possible duplicate members", count: [...names.values()].reduce((n, v) => n + (v > 1 ? v - 1 : 0), 0), href: "/dashboard/roster?duplicates=1" },
      { label: "Syllabus topics without dates", count: data.topics.filter((t) => !t.start_date).length, href: "/dashboard/syllabus" },
    ];

    const topicById = new Map(data.topics.map((t) => [t.id, t]));
    const recent = [...held].filter(matchCategory).sort((a, b) => b.session_date.localeCompare(a.session_date)).slice(0, 8).map((s) => {
      const t = tallyOf(data.counts, s.id, memberType);
      return { ...s, place: (s.circle_id ? circleById.get(s.circle_id)?.name : undefined) ?? ucName.get(ucOf(s) ?? "") ?? "—", ucName: ucName.get(ucOf(s) ?? "") ?? "", topic: s.topic_id ? topicById.get(s.topic_id) : undefined, present: t.present, marked: t.present + t.absent + t.leave };
    });

    const members = data.participants.filter((p) => p.is_active);
    return {
      now, prev, weeks, ucRows, quiet, quality, recent,
      totalCircles: data.circles.length, totalTopics: data.topics.length,
      arkan: members.filter((p) => p.type === "haazir_arkan").length, public: members.filter((p) => p.type === "aam_afraad").length,
      followUp: data.followUp,
    };
  }, [data, period, category, memberType]);

  const periodInfo = PERIODS.find((p) => p.value === period)!;
  const axis = { fontSize: 11, fill: chart.axis };
  const vs = periodInfo.days ? `vs previous ${periodInfo.label}` : "";

  return (
    <div className="px-4 sm:px-6 lg:px-10 pt-6 md:pt-10 max-w-[1200px] mx-auto space-y-6">
      <PageHeader
        eyebrow="Zone 5 overview"
        title="How the circles are doing"
        subtitle={view ? `${view.totalCircles} circles · ${view.arkan + view.public} members (${view.arkan} Arkan, ${view.public} Public)` : "Loading the latest reports…"}
        actions={<Link href="/dashboard/report" className="btn btn-secondary btn-sm">Monthly report</Link>}
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 animate-rise">
        <Segmented label="Time period" options={PERIODS.map(({ value, label }) => ({ value, label }))} value={period} onChange={setPeriod} />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select aria-label="Session type" className="form-input !min-h-[36px] !py-1 !text-[14px] sm:w-56" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All session types</option>
            {Object.entries(CATEGORY_LABEL).filter(([k]) => k !== "other").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select aria-label="Members" className="form-input !min-h-[36px] !py-1 !text-[14px] sm:w-40" value={memberType} onChange={(e) => setMemberType(e.target.value as typeof memberType)}>
            <option value="all">All members</option>
            <option value="haazir_arkan">Arkan only</option>
            <option value="aam_afraad">Public only</option>
          </select>
        </div>
      </div>

      {loading && !data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton h-[118px] !rounded-[var(--radius-card)]" />)}
        </div>
      )}

      {error && (
        <div role="alert" className="card p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <p className="text-[15px]"><span className="font-semibold text-danger">Couldn’t load the dashboard.</span> <span className="text-label-2">{error}</span></p>
          <button onClick={retry} className="btn btn-secondary"><RefreshCw className="w-4 h-4" /> Try again</button>
        </div>
      )}

      {view && (
        <>
          <section aria-label="Key figures" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
            <Stat label="Sessions held" value={view.now.sessions} note={<Delta now={view.now.sessions} prev={view.prev?.sessions} vs={vs} fallback={periodInfo.long} />} />
            <Stat
              label="Attendance"
              value={view.now.rate === null ? "—" : `${view.now.rate}%`}
              tone={view.now.rate === null ? undefined : view.now.rate >= 60 ? "good" : view.now.rate >= 35 ? "warn" : "bad"}
              note={<Delta now={view.now.rate} prev={view.prev?.rate} unit=" pts" vs={vs} fallback={`${view.now.tally.present} of ${view.now.tally.present + view.now.tally.absent} present`} />}
            />
            <Stat label="Circles active" value={<>{view.now.active}<span className="text-label-3 text-[0.6em] font-semibold"> / {view.totalCircles}</span></>} note={<Delta now={view.now.active} prev={view.prev?.active} vs={vs} fallback="held at least one class" />} />
            <Stat label="Topics taught" value={<>{view.now.topics}<span className="text-label-3 text-[0.6em] font-semibold"> / {view.totalTopics}</span></>} note={<Delta now={view.now.topics} prev={view.prev?.topics} vs={vs} fallback="syllabus topics covered" />} />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <ChartCard title="Sessions per week" subtitle={`Last ${WEEKS} weeks`}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={view.weeks} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={chart.grid} />
                  <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={18} />
                  <YAxis allowDecimals={false} width={28} tick={axis} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: chart.cursor }} content={<WeekTip kind="sessions" />} />
                  <Bar dataKey="sessions" fill={chart.primary} radius={[4, 4, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Attendance rate per week" subtitle="Present ÷ marked · leave excluded">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={view.weeks} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={chart.grid} />
                  <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={18} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} width={40} tick={axis} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ stroke: chart.grid }} content={<WeekTip kind="rate" />} />
                  <Line dataKey="rate" stroke={chart.primary} strokeWidth={2} dot={{ r: 4, fill: chart.primary, stroke: chart.dotRing, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-5 gap-3 sm:gap-4 items-start">
            <div className="card xl:col-span-3 overflow-hidden">
              <SectionTitle title="Union councils" subtitle={`Best attendance first · ${periodInfo.long}`} href="/dashboard/uc-status" link="Details" />
              <ul className="list-inset border-t border-separator">
                {view.ucRows.map((u) => (
                  <li key={u.id} className="px-4 sm:px-5 py-3 grid grid-cols-[1fr_auto] sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_3rem] items-center gap-x-4 gap-y-2">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold truncate">{u.name}</p>
                      <p className="text-[13px] text-label-2">{u.activeCircles}/{u.circles} circles active · {u.sessions} sessions{u.lastHeld && <> · {relative(u.lastHeld)}</>}</p>
                    </div>
                    <RateBar rate={u.rate} className="col-span-2 sm:col-span-1 row-start-2 sm:row-start-auto" />
                    <p className="text-[15px] font-semibold tabular text-right col-start-2 row-start-1 sm:col-start-auto sm:row-start-auto">{u.rate === null ? "—" : `${u.rate}%`}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="xl:col-span-2 space-y-3 sm:space-y-4">
              <div className="card overflow-hidden">
                <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
                  <h2 className="text-[17px] font-semibold flex items-center gap-2"><AlertTriangle className="h-[18px] w-[18px] text-warning" aria-hidden /> Needs attention</h2>
                </div>
                <ul className="list-inset border-t border-separator">
                  <AttentionRow href="/dashboard/follow-up" label="Members absent 3 times in a row" count={view.followUp} />
                  <AttentionRow href="/dashboard/circles?show=quiet" label={`Circles with no class in ${QUIET_AFTER_DAYS}+ days`} count={view.quiet.filter((c) => c.last).length} />
                  <AttentionRow href="/dashboard/circles?show=never" label="Circles that have never reported" count={view.quiet.filter((c) => !c.last).length} />
                </ul>
              </div>

              <div className="card overflow-hidden">
                <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
                  <h2 className="text-[17px] font-semibold flex items-center gap-2"><ShieldCheck className="h-[18px] w-[18px] text-accent" aria-hidden /> Data quality</h2>
                  <p className="text-[13px] text-label-2 mt-0.5">Gaps that make the numbers less reliable</p>
                </div>
                <ul className="list-inset border-t border-separator">
                  {view.quality.map((q) => <AttentionRow key={q.label} href={q.href} label={q.label} count={q.count} quiet />)}
                </ul>
              </div>
            </div>
          </section>

          <section className="card overflow-hidden">
            <SectionTitle title="Latest reports" href="/dashboard/jaiza" link="All reports" />
            {view.recent.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No reports yet" text="Reports appear here as soon as a murabbi submits attendance." />
            ) : (
              <ul className="list-inset border-t border-separator">
                {view.recent.map((s) => (
                  <li key={s.id} className="px-4 sm:px-5 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-fill grid place-items-center leading-none text-center">
                      <span>
                        <span className="block text-[16px] font-bold tabular">{s.session_date.slice(8, 10)}</span>
                        <span className="block text-[10px] font-semibold text-label-2 uppercase mt-0.5">{formatDate(s.session_date).split(" ")[1]}</span>
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold truncate">{s.place}{s.category !== "ijtima_arkan" && s.ucName ? <span className="font-normal text-label-2"> · {s.ucName}</span> : null}</p>
                      <p className="text-[13px] text-label-2 truncate">
                        {CATEGORY_LABEL[s.category] ?? s.category}{s.topic ? <> · Topic {s.topic.topic_number}: <BiText text={cleanTitle(s.topic.title)} /></> : null}
                      </p>
                    </div>
                    <p className="text-right leading-tight">
                      <span className="text-[17px] font-semibold tabular">{s.present}</span>
                      <span className="text-[13px] text-label-2">/{s.marked}</span>
                      <span className="block text-[11px] text-label-2">present</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function relative(iso: string) {
  const d = daysAgo(iso);
  return d === 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
}

/** Change against the previous period of the same length, with an arrow and a word (not colour alone). */
function Delta({ now, prev, unit = "", vs, fallback }: { now: number | null; prev: number | null | undefined; unit?: string; vs: string; fallback: string }) {
  if (prev === undefined || prev === null || now === null) return <>{fallback}</>;
  const diff = now - prev;
  if (diff === 0) return <>No change {vs}</>;
  const up = diff > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 font-medium ${up ? "text-success" : "text-danger"}`}>
      {up ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />}
      {up ? "Up" : "Down"} {Math.abs(diff)}{unit} <span className="text-label-2 font-normal">{vs}</span>
    </span>
  );
}

function AttentionRow({ href, label, count, quiet }: { href: string; label: string; count: number; quiet?: boolean }) {
  return (
    <li>
      <Link href={href} className="px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3 hover:bg-grouped transition-colors">
        <span className={`text-[14px] ${count ? "" : "text-label-2"}`}>{label}</span>
        <span className="flex items-center gap-1.5">
          <span className={`badge ${count === 0 ? "badge-green" : quiet ? "badge-gray" : "badge-amber"} tabular`}>{count === 0 ? "None" : count}</span>
          <ChevronRight className="h-4 w-4 text-label-3" aria-hidden />
        </span>
      </Link>
    </li>
  );
}

function SectionTitle({ title, subtitle, href, link }: { title: string; subtitle?: string; href: string; link: string }) {
  return (
    <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[17px] font-semibold">{title}</h2>
        {subtitle && <p className="text-[13px] text-label-2 mt-0.5">{subtitle}</p>}
      </div>
      <Link href={href} className="text-[14px] font-medium text-link inline-flex items-center hover:underline">{link}<ChevronRight className="w-4 h-4" /></Link>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="card p-4 sm:p-5">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <p className="text-[13px] text-label-2 mt-0.5 mb-3">{subtitle}</p>
      {children}
    </div>
  );
}

type WeekPoint = { label: string; sessions: number; rate: number | null; present: number; marked: number };

function WeekTip({ active, payload, kind }: { active?: boolean; payload?: { payload: WeekPoint }[]; kind: "sessions" | "rate" }) {
  if (!active || !payload?.length) return null;
  const w = payload[0].payload;
  return (
    <div className="pill-container !rounded-xl px-3 py-2 text-[12px]">
      <p className="font-semibold">Week of {w.label}</p>
      <p className="text-label-2">{kind === "sessions" ? `${w.sessions} session${w.sessions === 1 ? "" : "s"} held` : w.rate === null ? "No attendance marked" : `${w.rate}% · ${w.present} of ${w.marked} present`}</p>
    </div>
  );
}
