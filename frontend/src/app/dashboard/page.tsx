"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, BookOpen, CalendarCheck, ChevronRight, CircleDot, Loader2, RefreshCw, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORY_LABEL, Period, attendanceRate, daysAgo, fetchAll, formatDate, inPeriod, localDate } from "@/lib/data";

type UC = { id: string; name: string };
type Circle = { id: string; name: string; uc_id: string; murabbi_name: string | null };
type Session = { id: string; session_date: string; category: string; circle_id: string | null; uc_id: string | null; topic_id: string | null };
type Att = { session_id: string; participant_id: string; status: string };
type Participant = { id: string; type: string; circle_id: string; is_active: boolean };
type Topic = { id: string; topic_number: number; title: string };

const QUIET_AFTER_DAYS = 14;
const WEEKS = 12;
const EMERALD = "#047857";

const PERIODS: { value: Period; label: string }[] = [
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
  { value: "3_months", label: "Last 3 months" },
  { value: "complete", label: "All time" },
];

export default function DashboardOverview() {
  const [data, setData] = useState<{ ucs: UC[]; circles: Circle[]; sessions: Session[]; attendance: Att[]; participants: Participant[]; topics: Topic[] } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");
  const [category, setCategory] = useState("all");
  const [memberType, setMemberType] = useState("all");

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

  const periodLabel = PERIODS.find((p) => p.value === period)!.label.toLowerCase();

  return (
    <div className="px-4 md:px-6 xl:px-8 pt-5 md:pt-8 pb-32 md:pb-10 max-w-7xl mx-auto space-y-5 md:space-y-6">
      {/* Header + filters */}
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="section-label">Zone overview</p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">How the circles are doing</h1>
          {view && (
            <p className="text-sm text-slate-600 mt-1">
              {view.totalCircles} circles · {view.arkan + view.public} members ({view.arkan} Arkan, {view.public} Public)
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <select aria-label="Time period" className="form-input select-chevron sm:w-44" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
            {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select aria-label="Session type" className="form-input select-chevron sm:w-52" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All session types</option>
            {Object.entries(CATEGORY_LABEL).filter(([k]) => k !== "other").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select aria-label="Members" className="form-input select-chevron sm:w-40 col-span-2 sm:col-span-1" value={memberType} onChange={(e) => setMemberType(e.target.value)}>
            <option value="all">All members</option>
            <option value="haazir_arkan">Arkan only</option>
            <option value="aam_afraad">Public only</option>
          </select>
        </div>
      </header>

      {loading && !data && (
        <div className="card p-10 flex items-center justify-center gap-3 text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-700" /> Loading every session and attendance record…
        </div>
      )}

      {error && (
        <div role="alert" className="card p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between border-red-200">
          <p className="text-sm text-red-700"><strong>Couldn’t load the dashboard.</strong> {error}</p>
          <button onClick={retry} className="btn btn-secondary"><RefreshCw className="w-4 h-4" /> Try again</button>
        </div>
      )}

      {view && (
        <>
          {/* KPIs */}
          <section aria-label="Key figures" className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Kpi icon={CalendarCheck} label="Sessions held" value={String(view.sessions)} note={periodLabel} />
            <Kpi
              icon={Users}
              label="Attendance"
              value={view.rate === null ? "—" : `${view.rate}%`}
              note={view.marked ? `${view.present} present of ${view.marked} marked` : "nothing marked yet"}
              tone={view.rate === null ? undefined : view.rate >= 60 ? "good" : view.rate >= 35 ? "warn" : "bad"}
            />
            <Kpi icon={CircleDot} label="Circles active" value={`${view.activeCircles} / ${view.totalCircles}`} note={period === "complete" ? "held at least one class" : `held a class, ${periodLabel}`} />
            <Kpi icon={BookOpen} label="Topics taught" value={`${view.topicsTaught} / ${view.totalTopics}`} note="syllabus topics covered" />
          </section>

          {/* Trends */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Sessions per week" subtitle={`Last ${WEEKS} weeks`}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={view.weeks} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#edf0ea" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5f6f66" }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#5f6f66" }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "rgba(4,120,87,0.06)" }} content={<WeekTip kind="sessions" />} />
                  <Bar dataKey="sessions" fill={EMERALD} radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Attendance rate per week" subtitle="Present ÷ marked (leave excluded)">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={view.weeks} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#edf0ea" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5f6f66" }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} width={40} tick={{ fontSize: 11, fill: "#5f6f66" }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ stroke: "#b9c7bd" }} content={<WeekTip kind="rate" />} />
                  <Line dataKey="rate" stroke={EMERALD} strokeWidth={2} dot={{ r: 4, fill: EMERALD, stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            {/* UC table */}
            <div className="card xl:col-span-3 overflow-hidden">
              <div className="p-4 md:p-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Union councils</h2>
                  <p className="text-xs text-slate-600 mt-0.5">Best attendance first · {periodLabel}</p>
                </div>
                <Link href="/dashboard/uc-status" className="btn btn-ghost !min-h-[36px] text-xs">Details <ChevronRight className="w-3.5 h-3.5" /></Link>
              </div>
              <ul className="divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
                {view.ucRows.map((u) => (
                  <li key={u.id} className="px-4 md:px-5 py-3 grid grid-cols-[1fr_auto] sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{u.name}</p>
                      <p className="text-xs text-slate-600">
                        {u.activeCircles}/{u.circles} circles active · {u.sessions} sessions
                        {u.lastHeld && <> · last {relative(u.lastHeld)}</>}
                      </p>
                    </div>
                    <RateBar rate={u.rate} className="col-span-2 sm:col-span-1 row-start-2 sm:row-start-auto" />
                    <p className="text-sm font-bold tabular-nums text-right text-slate-900 col-start-2 row-start-1 sm:col-start-auto sm:row-start-auto w-12">
                      {u.rate === null ? "—" : `${u.rate}%`}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Needs attention */}
            <div className="card xl:col-span-2 overflow-hidden flex flex-col">
              <div className="p-4 md:p-5">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden /> Needs attention
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">Circles with no Quran Circle class in {QUIET_AFTER_DAYS}+ days</p>
              </div>
              {view.quiet.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-emerald-800">Every circle held a class in the last {QUIET_AFTER_DAYS} days.</p>
              ) : (
                <ul className="divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)] max-h-[22rem] overflow-y-auto">
                  {view.quiet.map((c) => (
                    <li key={c.id} className="px-4 md:px-5 py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                        <p className="text-xs text-slate-600 truncate">{c.ucName}{c.murabbi_name ? ` · ${c.murabbi_name}` : ""}</p>
                      </div>
                      <span className={`badge ${c.last ? "badge-amber" : "badge-rose"}`}>{c.last ? `${c.days} days` : "No class yet"}</span>
                    </li>
                  ))}
                </ul>
              )}
              {(view.duplicates > 0 || view.empty > 0) && (
                <div className="mt-auto m-4 p-3 rounded-xl bg-[var(--gold-light)] text-xs text-[#6b4a0e] space-y-1">
                  <p className="font-bold">Data to tidy up</p>
                  {view.duplicates > 0 && <p>{view.duplicates} sessions look like duplicates (same circle, type and date).</p>}
                  {view.empty > 0 && <p>{view.empty} past sessions have no attendance marked.</p>}
                  <Link href={view.duplicates > 0 ? "/dashboard/jaiza?duplicates=1" : "/dashboard/jaiza"} className="inline-flex items-center gap-1 font-bold underline underline-offset-2">Review in Jaiza <ChevronRight className="w-3 h-3" /></Link>
                </div>
              )}
            </div>
          </section>

          {/* Recent sessions */}
          <section className="card overflow-hidden">
            <div className="p-4 md:p-5 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900">Latest reports</h2>
              <Link href="/dashboard/jaiza" className="btn btn-ghost !min-h-[36px] text-xs">All reports <ChevronRight className="w-3.5 h-3.5" /></Link>
            </div>
            {view.recent.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-slate-600">No sessions match these filters yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
                {view.recent.map((s) => (
                  <li key={s.id} className="px-4 md:px-5 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <div className="w-12 text-center leading-tight">
                      <p className="text-lg font-bold text-slate-900 tabular-nums">{s.session_date.slice(8, 10)}</p>
                      <p className="text-[11px] font-semibold text-slate-600 uppercase">{formatDate(s.session_date).split(" ")[1]}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{s.place}</p>
                      <p className="text-xs text-slate-600 truncate">
                        <span className="badge badge-slate mr-1.5">{CATEGORY_LABEL[s.category] ?? s.category}</span>
                        {s.topic ? `Topic ${s.topic.topic_number}: ${s.topic.title}` : s.ucName}
                      </p>
                    </div>
                    <p className="text-right">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">{s.present}</span>
                      <span className="text-xs text-slate-600">/{s.marked}</span>
                      <span className="block text-[11px] text-slate-600">present</span>
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

function Kpi({ icon: Icon, label, value, note, tone }: { icon: typeof Users; label: string; value: string; note: string; tone?: "good" | "warn" | "bad" }) {
  const toneClass = tone === "good" ? "text-emerald-800" : tone === "warn" ? "text-amber-700" : tone === "bad" ? "text-red-700" : "text-slate-900";
  return (
    <div className="card p-4 md:p-5">
      <p className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide">
        <Icon className="w-4 h-4 text-emerald-700" aria-hidden /> {label}
      </p>
      <p className={`mt-2 text-2xl md:text-3xl font-bold tabular-nums ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-600">{note}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="card p-4 md:p-5">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <p className="text-xs text-slate-600 mt-0.5 mb-3">{subtitle}</p>
      {children}
    </div>
  );
}

function RateBar({ rate, className = "" }: { rate: number | null; className?: string }) {
  const color = rate === null ? "#d6dcd3" : rate >= 60 ? EMERALD : rate >= 35 ? "#b7791f" : "#c2410c";
  return (
    <div className={`h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden ${className}`} role="img" aria-label={rate === null ? "No attendance marked" : `${rate}% attendance`}>
      <div className="h-full rounded-full" style={{ width: `${rate ?? 0}%`, background: color }} />
    </div>
  );
}

type WeekPoint = { label: string; sessions: number; rate: number | null; present: number; marked: number };

function WeekTip({ active, payload, kind }: { active?: boolean; payload?: { payload: WeekPoint }[]; kind: "sessions" | "rate" }) {
  if (!active || !payload?.length) return null;
  const w = payload[0].payload;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-bold text-slate-900">Week of {w.label}</p>
      {kind === "sessions" ? (
        <p className="text-slate-700">{w.sessions} session{w.sessions === 1 ? "" : "s"} held</p>
      ) : (
        <p className="text-slate-700">{w.rate === null ? "No attendance marked" : `${w.rate}% · ${w.present} of ${w.marked} present`}</p>
      )}
    </div>
  );
}
