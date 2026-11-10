"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ChevronRight, ClipboardList, RefreshCw } from "lucide-react";
import { BiText, EmptyState, PageHeader, RateBar, Segmented, SkeletonRows, Stat, useChartColors } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { CATEGORY_LABEL, Period, attendanceRate, cleanTitle, daysAgo, fetchAll, formatDate, inPeriod, localDate } from "@/lib/data";

type UC = { id: string; name: string };
type Circle = { id: string; name: string; uc_id: string; murabbi_name: string | null };
type Session = { id: string; session_date: string; category: string; circle_id: string | null; uc_id: string | null; topic_id: string | null };
type Att = { session_id: string; participant_id: string; status: string };
type Participant = { id: string; type: string; circle_id: string; is_active: boolean };
type Topic = { id: string; topic_number: number; title: string };

const QUIET_AFTER_DAYS = 14;
const WEEKS = 12;

const PERIODS: { value: Period; label: string; long: string }[] = [
  { value: "week", label: "7 days", long: "last 7 days" },
  { value: "month", label: "30 days", long: "last 30 days" },
  { value: "3_months", label: "3 months", long: "last 3 months" },
  { value: "complete", label: "All time", long: "all time" },
];

export default function DashboardOverview() {
  const [data, setData] = useState<{ ucs: UC[]; circles: Circle[]; sessions: Session[]; attendance: Att[]; participants: Participant[]; topics: Topic[] } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");
  const [category, setCategory] = useState("all");
  const [memberType, setMemberType] = useState("all");
  const chart = useChartColors();

  // No synchronous state updates before the first await, so this is safe to call from an effect.
  const fetchData = useCallback(async () => {
    try {
      const [ucs, circles, topics, sessions, attendance, participants] = await Promise.all([
        supabase.from("union_councils").select("id, name").order("name"),
        supabase.from("quran_circles").select("id, name, uc_id, murabbi_name").order("name"),
        supabase.from("syllabus_topics").select("id, topic_number, title").order("topic_number"),
        fetchAll<Session>((f, t) => supabase.from("sessions").select("id, session_date, category, circle_id, uc_id, topic_id").order("id").range(f, t)),
        fetchAll<Att>((f, t) => supabase.from("attendance").select("session_id, participant_id, status").order("session_id").order("participant_id").range(f, t)),
        fetchAll<Participant>((f, t) => supabase.from("participants").select("id, type, circle_id, is_active").order("id").range(f, t)),
      ]);
      const firstError = [ucs, circles, topics].find((r) => r.error)?.error;
      if (firstError) throw new Error(firstError.message);
      setData({ ucs: ucs.data ?? [], circles: circles.data ?? [], topics: topics.data ?? [], sessions, attendance, participants });
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
    const circleById = new Map(data.circles.map((c) => [c.id, c]));
    const ucOf = (s: Session) => s.uc_id ?? (s.circle_id ? circleById.get(s.circle_id)?.uc_id ?? null : null);
    const typeOf = new Map(data.participants.map((p) => [p.id, p.type]));
    const matchCategory = (s: Session) => category === "all" || s.category === category;
    // Future-dated rows are scheduled classes, not classes held.
    const held = data.sessions.filter((s) => s.session_date <= today);

    const attBySession = new Map<string, Att[]>();
    for (const a of data.attendance) {
      if (memberType !== "all" && typeOf.get(a.participant_id) !== memberType) continue;
      const list = attBySession.get(a.session_id);
      if (list) list.push(a); else attBySession.set(a.session_id, [a]);
    }
    const statusesFor = (sessions: Session[]) => sessions.flatMap((s) => (attBySession.get(s.id) ?? []).map((a) => a.status));

    const periodSessions = held.filter((s) => matchCategory(s) && inPeriod(s.session_date, period));
    const statuses = statusesFor(periodSessions);
    const activeCircleIds = new Set(periodSessions.map((s) => s.circle_id).filter(Boolean));
    const topicsTaught = new Set(periodSessions.map((s) => s.topic_id).filter(Boolean)).size;
    const members = data.participants.filter((p) => p.is_active);

    // Weekly trend for the last 12 weeks (Monday-start), independent of the period filter.
    const monday = new Date();
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const weeks = Array.from({ length: WEEKS }, (_, i) => {
      const start = new Date(monday);
      start.setDate(start.getDate() - (WEEKS - 1 - i) * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const from = localDate(start);
      const to = localDate(end);
      const inWeek = held.filter((s) => matchCategory(s) && s.session_date >= from && s.session_date <= to);
      const st = statusesFor(inWeek);
      return {
        label: start.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        sessions: inWeek.length,
        rate: attendanceRate(st),
        present: st.filter((x) => x === "present").length,
        marked: st.filter((x) => x !== "leave").length,
      };
    });

    // Per-UC summary for the selected period.
    const ucRows = data.ucs.map((uc) => {
      const circles = data.circles.filter((c) => c.uc_id === uc.id);
      const sessions = periodSessions.filter((s) => ucOf(s) === uc.id);
      const lastHeld = held.filter((s) => ucOf(s) === uc.id).reduce<string | null>((m, s) => (!m || s.session_date > m ? s.session_date : m), null);
      return {
        ...uc,
        circles: circles.length,
        activeCircles: circles.filter((c) => activeCircleIds.has(c.id)).length,
        sessions: sessions.length,
        rate: attendanceRate(statusesFor(sessions)),
        lastHeld,
      };
    }).sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1) || a.name.localeCompare(b.name));

    // Circles that have gone quiet: no Quran Circle class in the last two weeks (or ever).
    const lastByCircle = new Map<string, string>();
    for (const s of held) {
      if (s.category !== "quran_circle" || !s.circle_id) continue;
      const prev = lastByCircle.get(s.circle_id);
      if (!prev || s.session_date > prev) lastByCircle.set(s.circle_id, s.session_date);
    }
    const ucName = new Map(data.ucs.map((u) => [u.id, u.name]));
    const quiet = data.circles
      .map((c) => {
        const last = lastByCircle.get(c.id) ?? null;
        return { ...c, ucName: ucName.get(c.uc_id) ?? "", last, days: last ? daysAgo(last) : Infinity };
      })
      .filter((c) => c.days > QUIET_AFTER_DAYS)
      .sort((a, b) => b.days - a.days);

    // Data health: same circle/UC, same type, same day = probably submitted twice.
    const seen = new Map<string, number>();
    for (const s of data.sessions) {
      const k = `${s.category}|${s.circle_id ?? s.uc_id}|${s.session_date}`;
      seen.set(k, (seen.get(k) ?? 0) + 1);
    }
    const duplicates = [...seen.values()].reduce((n, v) => n + (v > 1 ? v - 1 : 0), 0);
    const allAttBySession = new Set(data.attendance.map((a) => a.session_id));
    const empty = held.filter((s) => !allAttBySession.has(s.id)).length;

    const topicById = new Map(data.topics.map((t) => [t.id, t]));
    const recent = [...held]
      .filter(matchCategory)
      .sort((a, b) => b.session_date.localeCompare(a.session_date))
      .slice(0, 8)
      .map((s) => {
        const st = (attBySession.get(s.id) ?? []).map((a) => a.status);
        const circle = s.circle_id ? circleById.get(s.circle_id) : undefined;
        return {
          ...s,
          place: circle?.name ?? ucName.get(ucOf(s) ?? "") ?? "—",
          ucName: ucName.get(ucOf(s) ?? "") ?? "",
          topic: s.topic_id ? topicById.get(s.topic_id) : undefined,
          present: st.filter((x) => x === "present").length,
          marked: st.length,
        };
      });

    return {
      sessions: periodSessions.length,
      rate: attendanceRate(statuses),
      present: statuses.filter((x) => x === "present").length,
      marked: statuses.filter((x) => x !== "leave").length,
      activeCircles: activeCircleIds.size,
      totalCircles: data.circles.length,
      topicsTaught,
      totalTopics: data.topics.length,
      arkan: members.filter((p) => p.type === "haazir_arkan").length,
      public: members.filter((p) => p.type === "aam_afraad").length,
      weeks,
      ucRows,
      quiet,
      duplicates,
      empty,
      recent,
    };
  }, [data, period, category, memberType]);

  const periodLabel = PERIODS.find((p) => p.value === period)!.long;
  const axis = { fontSize: 11, fill: chart.axis };

  return (
    <div className="px-4 sm:px-6 lg:px-10 pt-6 md:pt-10 max-w-[1200px] mx-auto space-y-6">
      <PageHeader
        eyebrow="Zone 5 overview"
        title="How the circles are doing"
        subtitle={view ? `${view.totalCircles} circles · ${view.arkan + view.public} members (${view.arkan} Arkan, ${view.public} Public)` : "Loading the latest reports…"}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 animate-rise">
        <Segmented label="Time period" options={PERIODS.map(({ value, label }) => ({ value, label }))} value={period} onChange={setPeriod} />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select aria-label="Session type" className="form-input !min-h-[36px] !py-1 !text-[14px] sm:w-56" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All session types</option>
            {Object.entries(CATEGORY_LABEL).filter(([k]) => k !== "other").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select aria-label="Members" className="form-input !min-h-[36px] !py-1 !text-[14px] sm:w-40" value={memberType} onChange={(e) => setMemberType(e.target.value)}>
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
            <Stat label="Sessions held" value={view.sessions} note={periodLabel} />
            <Stat
              label="Attendance"
              value={view.rate === null ? "—" : `${view.rate}%`}
              note={view.marked ? `${view.present} of ${view.marked} present` : "nothing marked yet"}
              tone={view.rate === null ? undefined : view.rate >= 60 ? "good" : view.rate >= 35 ? "warn" : "bad"}
            />
            <Stat label="Circles active" value={<>{view.activeCircles}<span className="text-label-3 text-[0.6em] font-semibold"> / {view.totalCircles}</span></>} note={period === "complete" ? "held at least one class" : `held a class, ${periodLabel}`} />
            <Stat label="Topics taught" value={<>{view.topicsTaught}<span className="text-label-3 text-[0.6em] font-semibold"> / {view.totalTopics}</span></>} note="syllabus topics covered" />
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

          <section className="grid grid-cols-1 xl:grid-cols-5 gap-3 sm:gap-4">
            <div className="card xl:col-span-3 overflow-hidden">
              <SectionTitle title="Union councils" subtitle={`Best attendance first · ${periodLabel}`} href="/dashboard/uc-status" link="Details" />
              <ul className="list-inset border-t border-separator">
                {view.ucRows.map((u) => (
                  <li key={u.id} className="px-4 sm:px-5 py-3 grid grid-cols-[1fr_auto] sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_3rem] items-center gap-x-4 gap-y-2">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold truncate">{u.name}</p>
                      <p className="text-[13px] text-label-2">
                        {u.activeCircles}/{u.circles} circles active · {u.sessions} sessions{u.lastHeld && <> · {relative(u.lastHeld)}</>}
                      </p>
                    </div>
                    <RateBar rate={u.rate} className="col-span-2 sm:col-span-1 row-start-2 sm:row-start-auto" />
                    <p className="text-[15px] font-semibold tabular text-right col-start-2 row-start-1 sm:col-start-auto sm:row-start-auto">{u.rate === null ? "—" : `${u.rate}%`}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card xl:col-span-2 overflow-hidden flex flex-col">
              <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
                <h2 className="text-[17px] font-semibold flex items-center gap-2"><AlertTriangle className="h-[18px] w-[18px] text-warning" aria-hidden /> Needs attention</h2>
                <p className="text-[13px] text-label-2 mt-0.5">No Quran Circle class in {QUIET_AFTER_DAYS}+ days</p>
              </div>
              {view.quiet.length === 0 ? (
                <p className="px-5 pb-5 text-[15px] text-success">Every circle held a class in the last {QUIET_AFTER_DAYS} days.</p>
              ) : (
                <ul className="list-inset border-t border-separator max-h-[23rem] overflow-y-auto">
                  {view.quiet.map((c) => (
                    <li key={c.id} className="px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-medium truncate">{c.name}</p>
                        <p className="text-[13px] text-label-2 truncate">{c.ucName}{c.murabbi_name ? ` · ${c.murabbi_name}` : ""}</p>
                      </div>
                      <span className={`badge ${c.last ? "badge-amber" : "badge-red"}`}>{c.last ? `${c.days} days` : "No class yet"}</span>
                    </li>
                  ))}
                </ul>
              )}
              {(view.duplicates > 0 || view.empty > 0) && (
                <div className="mt-auto m-3 sm:m-4 p-3.5 rounded-2xl bg-warning-tint text-[13px] text-warning-ink space-y-1">
                  <p className="font-semibold">Data to tidy up</p>
                  {view.duplicates > 0 && <p>{view.duplicates} sessions look like duplicates (same circle, type and date).</p>}
                  {view.empty > 0 && <p>{view.empty} past sessions have no attendance marked.</p>}
                  <Link href={view.duplicates > 0 ? "/dashboard/jaiza?duplicates=1" : "/dashboard/jaiza"} className="inline-flex items-center gap-0.5 font-semibold text-link">Review reports <ChevronRight className="w-3.5 h-3.5" /></Link>
                </div>
              )}
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
                      <p className="text-[15px] font-semibold truncate">{s.place}</p>
                      <p className="text-[13px] text-label-2 truncate">
                        {CATEGORY_LABEL[s.category] ?? s.category}{s.topic ? <> · Topic {s.topic.topic_number}: <BiText text={cleanTitle(s.topic.title)} /></> : s.ucName ? ` · ${s.ucName}` : ""}
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
      <p className="text-label-2">
        {kind === "sessions" ? `${w.sessions} session${w.sessions === 1 ? "" : "s"} held` : w.rate === null ? "No attendance marked" : `${w.rate}% · ${w.present} of ${w.marked} present`}
      </p>
    </div>
  );
}
