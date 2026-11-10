"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come straight from Supabase / external APIs */

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { attendanceRate, fetchAll, inPeriod, localDate } from "@/lib/data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronRight, Map } from 'lucide-react';
import { EmptyState, PageHeader, RateBar, Segmented, SkeletonRows, useChartColors } from '@/components/ui';

export default function UCStatus() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"complete" | "week" | "month" | "3_months">("complete");
  const [memberType, setMemberType] = useState<"all" | "haazir_arkan" | "aam_afraad">("all");
  const [sessionCategory, setSessionCategory] = useState<"all" | "quran_circle" | "ijtima_arkan" | "dars_e_quran" | "other">("all");

  const [rawUcs, setRawUcs] = useState<any[]>([]);
  const [rawCircles, setRawCircles] = useState<any[]>([]);
  const [rawParticipants, setRawParticipants] = useState<any[]>([]);
  const [rawAttendance, setRawAttendance] = useState<any[]>([]);
  const [rawSessions, setRawSessions] = useState<any[]>([]);
  const [totalTopics, setTotalTopics] = useState(0);
  const [expandedUC, setExpandedUC] = useState<string | null>(null);

  async function fetchUCStats() {
    setLoading(true);
    try {
      const { data: ucs } = await supabase.from('union_councils').select('id, name').order('name');
      const { data: circles } = await supabase.from('quran_circles').select('id, name, uc_id');
      // Read every row: a single request stops at 1,000 and there are thousands of attendance records.
      const participants = await fetchAll<any>((f, t) => supabase.from('participants').select('id, circle_id, type, is_active').eq('is_active', true).order('id').range(f, t));
      const attendance = await fetchAll<any>((f, t) => supabase.from('attendance').select(`status, session_id, participant_id, participants (circle_id, type), sessions!inner (category, session_date)`).order('session_id').order('participant_id').range(f, t));
      const sessions = await fetchAll<any>((f, t) => supabase.from('sessions').select('id, circle_id, uc_id, topic_id, session_date, category').order('id').range(f, t));
      const { count: topicCount } = await supabase.from('syllabus_topics').select('*', { count: 'exact', head: true });

      setRawUcs(ucs || []);
      setRawCircles(circles || []);
      setRawParticipants(participants || []);
      setRawAttendance(attendance || []);
      setRawSessions(sessions || []);
      setTotalTopics(topicCount || 0);
    } catch (e) {
      console.error("Error fetching UC stats:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUCStats(); }, []);

  // Scheduled (future) sessions are not classes held, so every period stops at today.
  const timeRangeFilter = (dateStr: string) => !!dateStr && dateStr.slice(0, 10) <= localDate() && inPeriod(dateStr, timeRange);

  const memberTypeFilter = (type: string) => {
    if (memberType === "all") return true;
    return type === memberType;
  };

  const ucStats = useMemo(() => {
    const sessionDateMap: Record<string, string> = {};
    rawSessions.forEach((s: any) => {
      sessionDateMap[s.id] = s.session_date;
    });

    const filteredSessions = rawSessions.filter(s => {
      const matchTime = timeRangeFilter(s.session_date);
      const matchCategory = sessionCategory === "all" || s.category === sessionCategory;
      return matchTime && matchCategory;
    });

    const filteredAttendance = rawAttendance.filter(a => {
      const session = a.sessions; // Assuming joined data
      const sessionDate = session?.session_date;
      const sessCategory = session?.category;
      const partType = a.participants?.type;
      
      const matchTime = sessionDate ? timeRangeFilter(sessionDate) : true;
      const matchType = memberTypeFilter(partType);
      const matchCategory = sessionCategory === "all" || sessCategory === sessionCategory;
      
      return matchTime && matchType && matchCategory;
    });

    const filteredParticipants = rawParticipants.filter(p => memberTypeFilter(p.type));

    return rawUcs.map((uc: any) => {
      const ucCircles = rawCircles.filter(c => c.uc_id === uc.id) || [];
      const ucCircleIds = ucCircles.map(c => c.id);
      
      const ucParticipants = filteredParticipants.filter(p => ucCircleIds.includes(p.circle_id)) || [];
      const arkanCount = ucParticipants.filter(p => p.type === 'haazir_arkan').length;
      const publicCount = ucParticipants.filter(p => p.type === 'aam_afraad').length;
      
      const ucAttendance = filteredAttendance.filter((a: any) => a.participants && ucCircleIds.includes(a.participants.circle_id)) || [];
      // Leave is excused, so it doesn't count against attendance.
      const avgAtt = attendanceRate(ucAttendance.map((a: any) => a.status)) ?? 0;

      // Ijtima Arkan sessions belong to the UC itself, not to a circle.
      const ucSessions = filteredSessions.filter(s => s.uc_id === uc.id || ucCircleIds.includes(s.circle_id));
      const uniqueTopics = new Set(ucSessions.filter(s => s.topic_id).map(s => s.topic_id)).size;
      const progress = totalTopics ? Math.round((uniqueTopics / totalTopics) * 100) : 0;

      const circleDetails = ucCircles.map(c => {
        const cParticipants = ucParticipants.filter(p => p.circle_id === c.id);
        const cAttendanceList = ucAttendance.filter((a: any) => a.participants?.circle_id === c.id);
        const cAvgAtt = attendanceRate(cAttendanceList.map((a: any) => a.status)) ?? 0;
        const cSessions = filteredSessions.filter((s: any) => s.circle_id === c.id) || [];
        const cUniqueTopics = new Set(cSessions.filter((s: any) => s.topic_id).map((s: any) => s.topic_id)).size;
        const cProgress = totalTopics ? Math.round((cUniqueTopics / totalTopics) * 100) : 0;
        
        return {
          id: c.id,
          name: c.name,
          participants: cParticipants.length,
          arkan: cParticipants.filter(p => p.type === 'haazir_arkan').length,
          public: cParticipants.filter(p => p.type === 'aam_afraad').length,
          avgAttendance: cAvgAtt,
          progress: cProgress
        };
      });

      return {
        id: uc.id,
        name: uc.name,
        circles: ucCircles.length,
        participants: ucParticipants.length,
        arkan: arkanCount,
        public: publicCount,
        avgAttendance: avgAtt,
        progress,
        uniqueTopics,
        circleDetails
      };
    }) || [];
  }, [rawUcs, rawCircles, rawParticipants, rawAttendance, rawSessions, totalTopics, timeRange, memberType, sessionCategory]);

  const members = [...ucStats].sort((a, b) => b.participants - a.participants);
  const chart = useChartColors();

  return (
    <div className="px-4 sm:px-6 lg:px-10 pt-6 md:pt-10 max-w-[1200px] mx-auto space-y-6">
      <PageHeader eyebrow="Analytics" title="Union Councils" subtitle="Attendance, membership and syllabus progress for every union council. Tap a council to see its circles." />

      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 animate-rise">
        <Segmented
          label="Time period"
          value={timeRange}
          onChange={setTimeRange}
          options={[{ value: "week", label: "7 days" }, { value: "month", label: "30 days" }, { value: "3_months", label: "3 months" }, { value: "complete", label: "All time" }]}
        />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select aria-label="Session type" className="form-input !min-h-[36px] !py-1 !text-[14px] sm:w-48" value={sessionCategory} onChange={(e) => setSessionCategory(e.target.value as typeof sessionCategory)}>
            <option value="all">All session types</option>
            <option value="quran_circle">Quran Circle</option>
            <option value="ijtima_arkan">Ijtima Arkan</option>
            <option value="dars_e_quran">Dars-e-Quran</option>
            <option value="other">Other</option>
          </select>
          <select aria-label="Members" className="form-input !min-h-[36px] !py-1 !text-[14px] sm:w-40" value={memberType} onChange={(e) => setMemberType(e.target.value as typeof memberType)}>
            <option value="all">All members</option>
            <option value="haazir_arkan">Arkan only</option>
            <option value="aam_afraad">Public only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card"><SkeletonRows rows={6} /></div>
      ) : ucStats.length === 0 ? (
        <div className="card"><EmptyState icon={Map} title="No union councils yet" /></div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-3 sm:gap-4 items-start">
          {/* Council list */}
          <section className="card overflow-hidden xl:col-span-3">
            <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
              <h2 className="text-[17px] font-semibold">Councils</h2>
              <p className="text-[13px] text-label-2 mt-0.5">{ucStats.length} councils · attendance and topics taught</p>
            </div>
            <ul className="list-inset border-t border-separator">
              {ucStats.map((uc) => {
                const open = expandedUC === uc.id;
                return (
                  <li key={uc.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedUC(open ? null : uc.id)}
                      aria-expanded={open}
                      className={`w-full text-left px-4 sm:px-5 py-3.5 grid grid-cols-[1fr_auto_auto] items-center gap-3 transition-colors ${open ? "bg-grouped" : "hover:bg-grouped"}`}
                    >
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold truncate">{uc.name}</p>
                        <p className="text-[13px] text-label-2 truncate">
                          {uc.circles} circle{uc.circles !== 1 ? "s" : ""} · {uc.participants} members · {uc.uniqueTopics}/{totalTopics} topics
                        </p>
                        <RateBar rate={uc.avgAttendance} className="mt-2 max-w-[260px]" />
                      </div>
                      <span className="text-[17px] font-semibold tabular">{uc.avgAttendance}%</span>
                      <ChevronRight className={`h-4 w-4 text-label-3 transition-transform ${open ? "rotate-90" : ""}`} aria-hidden />
                    </button>
                    {open && (
                      <div className="px-3 sm:px-4 pb-4 bg-grouped animate-fade">
                        {uc.circleDetails.length === 0 ? (
                          <p className="px-2 py-3 text-[14px] text-label-2">No circles in this council.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {uc.circleDetails.map((c: any) => (
                              <div key={c.id} className="rounded-2xl bg-surface p-3.5 shadow-[0_0_0_0.5px_var(--color-separator)]">
                                <p className="text-[15px] font-semibold leading-snug">{c.name}</p>
                                <dl className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                                  <div><dt className="text-[11px] text-label-2">Members</dt><dd className="text-[16px] font-semibold tabular">{c.participants}</dd></div>
                                  <div><dt className="text-[11px] text-label-2">Attendance</dt><dd className="text-[16px] font-semibold tabular">{c.avgAttendance}%</dd></div>
                                  <div><dt className="text-[11px] text-label-2">Syllabus</dt><dd className="text-[16px] font-semibold tabular">{c.progress}%</dd></div>
                                </dl>
                                <RateBar rate={c.avgAttendance} className="mt-2.5" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Membership chart */}
          <section className="card p-4 sm:p-5 xl:col-span-2">
            <h2 className="text-[17px] font-semibold">Members by council</h2>
            <div className="mt-1 mb-3 flex items-center gap-4 text-[13px] text-label-2">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: chart.primary }} />Arkan</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: chart.secondary }} />Public</span>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(220, members.length * 30)}>
              <BarChart data={members} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barCategoryGap={6}>
                <CartesianGrid horizontal={false} stroke={chart.grid} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: chart.axis }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={112} tick={{ fontSize: 11, fill: chart.label }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: chart.cursor }} content={<MembersTip />} />
                <Bar dataKey="arkan" name="Arkan" stackId="m" fill={chart.primary} />
                <Bar dataKey="public" name="Public" stackId="m" fill={chart.secondary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>
      )}
    </div>
  );
}

function MembersTip({ active, payload }: { active?: boolean; payload?: { payload: { name: string; arkan: number; public: number } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="pill-container !rounded-xl px-3 py-2 text-[12px]">
      <p className="font-semibold">{d.name}</p>
      <p className="text-label-2">{d.arkan} Arkan · {d.public} Public</p>
    </div>
  );
}
