"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Map, Users, Activity, Loader2, ChevronRight, TrendingUp } from 'lucide-react';

export default function UCStatus() {
  const [loading, setLoading] = useState(true);
  const [ucStats, setUcStats] = useState<any[]>([]);
  const [totalTopics, setTotalTopics] = useState(0);
  const [expandedUC, setExpandedUC] = useState<string | null>(null);

  useEffect(() => { fetchUCStats(); }, []);

  async function fetchUCStats() {
    setLoading(true);
    try {
      const { data: ucs } = await supabase.from('union_councils').select('id, name').order('name');
      const { data: circles } = await supabase.from('quran_circles').select('id, name, uc_id');
      const { data: participants } = await supabase.from('participants').select('id, circle_id, type');
      const { data: attendance } = await supabase.from('attendance').select(`status, session_id, participants (circle_id)`);
      const { data: sessions } = await supabase.from('sessions').select('id, circle_id, topic_id');
      const { count: topicCount } = await supabase.from('syllabus_topics').select('*', { count: 'exact', head: true });
      setTotalTopics(topicCount || 0);

      const stats = ucs?.map((uc: any) => {
        const ucCircles = circles?.filter(c => c.uc_id === uc.id) || [];
        const ucCircleIds = ucCircles.map(c => c.id);
        const ucParticipants = participants?.filter(p => ucCircleIds.includes(p.circle_id)) || [];
        const arkanCount = ucParticipants.filter(p => p.type === 'haazir_arkan').length;
        const publicCount = ucParticipants.filter(p => p.type === 'aam_afraad').length;
        const ucAttendance = attendance?.filter((a: any) => a.participants && ucCircleIds.includes(a.participants.circle_id)) || [];
        const presentCount = ucAttendance.filter((a: any) => a.status).length;
        const avgAtt = ucAttendance.length > 0 ? Math.round((presentCount / ucAttendance.length) * 100) : 0;
        const ucSessions = sessions?.filter(s => ucCircleIds.includes(s.circle_id)) || [];
        const uniqueTopics = new Set(ucSessions.filter(s => s.topic_id).map(s => s.topic_id)).size;
        const progress = topicCount ? Math.round((uniqueTopics / topicCount) * 100) : 0;

        const circleDetails = ucCircles.map(c => {
          const cParticipants = ucParticipants.filter(p => p.circle_id === c.id);
          const cAttendanceList = ucAttendance.filter((a: any) => a.participants?.circle_id === c.id);
          const cPresent = cAttendanceList.filter((a: any) => a.status).length;
          const cAvgAtt = cAttendanceList.length > 0 ? Math.round((cPresent / cAttendanceList.length) * 100) : 0;
          const cSessions = sessions?.filter((s: any) => s.circle_id === c.id) || [];
          const cUniqueTopics = new Set(cSessions.filter((s: any) => s.topic_id).map((s: any) => s.topic_id)).size;
          const cProgress = topicCount ? Math.round((cUniqueTopics / topicCount) * 100) : 0;
          return { id: c.id, name: c.name, participants: cParticipants.length, arkan: cParticipants.filter(p => p.type === 'haazir_arkan').length, public: cParticipants.filter(p => p.type === 'aam_afraad').length, avgAttendance: cAvgAtt, progress: cProgress };
        });

        return { id: uc.id, name: uc.name, circles: ucCircles.length, participants: ucParticipants.length, arkan: arkanCount, public: publicCount, avgAttendance: avgAtt, progress, uniqueTopics, circleDetails };
      }) || [];

      setUcStats(stats);
    } catch (e) { console.error("Error fetching UC stats:", e); } finally { setLoading(false); }
  }

  const attColor = (v: number) => v > 70 ? 'text-emerald-600' : v > 40 ? 'text-amber-500' : 'text-red-500';
  const attBg = (v: number) => v > 70 ? 'bg-emerald-500' : v > 40 ? 'bg-amber-400' : 'bg-red-400';
  const attDot = (v: number) => v > 70 ? 'bg-emerald-400' : v > 40 ? 'bg-amber-400' : 'bg-red-400';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shadow-inner border border-emerald-200/50">
          <Loader2 className="animate-spin w-6 h-6 text-emerald-600" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-800 text-sm">Loading UC Status</p>
          <p className="text-xs text-slate-400 mt-0.5">Mapping regional sectors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <header>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm" />
          <p className="section-label">Analytics</p>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Union Council Status</h2>
        <p className="text-slate-500 mt-1 text-sm leading-relaxed max-w-2xl">
          Comparative analytics across all Union Councils — attendance, participation, and curriculum progress.
        </p>
      </header>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <div className="card p-5 md:p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Personnel Distribution</h3>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ucStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 600 }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px', fontSize: '11px', fontWeight: 600 }} />
                <Bar dataKey="arkan" name="Haazir Arkan" fill="#059669" radius={[6, 6, 0, 0]} />
                <Bar dataKey="public" name="Aam Afraad" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 md:p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Attendance Rate by UC</h3>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ucStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} unit="%" />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 600 }} />
                <Line type="monotone" dataKey="avgAttendance" name="Avg Attendance" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed UC Table */}
      <div className="glass-table">
        <div className="px-5 md:px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">UC Breakdown</h3>
        </div>
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr style={{ background: 'rgba(248,250,252,0.70)' }}>
              <th className="px-5 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Union Council</th>
              <th className="px-5 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center hidden sm:table-cell">Circles</th>
              <th className="px-5 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center hidden sm:table-cell">Members</th>
              <th className="px-5 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance</th>
              <th className="px-5 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Syllabus</th>
              <th className="px-5 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ucStats.map((uc) => (
              <React.Fragment key={uc.id}>
                <tr
                  onClick={() => setExpandedUC(expandedUC === uc.id ? null : uc.id)}
                  className={`cursor-pointer transition-colors ${expandedUC === uc.id ? 'bg-emerald-50/50' : 'hover:bg-slate-50/60'}`}
                >
                  <td className="px-5 md:px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${attDot(uc.avgAttendance)}`} />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{uc.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{uc.circles} circle{uc.circles !== 1 ? 's' : ''} · {uc.participants} members</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 md:px-6 py-4 text-center hidden sm:table-cell">
                    <span className="badge badge-blue">{uc.circles}</span>
                  </td>
                  <td className="px-5 md:px-6 py-4 text-center hidden sm:table-cell">
                    <span className="text-sm font-bold text-slate-800">{uc.participants}</span>
                  </td>
                  <td className="px-5 md:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${attColor(uc.avgAttendance)}`}>{uc.avgAttendance}%</span>
                      <div className="flex-1 max-w-[80px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${attBg(uc.avgAttendance)}`} style={{ width: `${uc.avgAttendance}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 md:px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 max-w-[100px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${uc.progress}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-emerald-600">{uc.uniqueTopics}/{totalTopics}</span>
                    </div>
                  </td>
                  <td className="px-5 md:px-6 py-4 text-right">
                    <div className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all ${expandedUC === uc.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedUC === uc.id ? 'rotate-90' : ''}`} />
                    </div>
                  </td>
                </tr>

                {expandedUC === uc.id && (
                  <tr>
                    <td colSpan={6} className="px-5 md:px-6 pb-4 pt-0 bg-emerald-50/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in">
                        {uc.circleDetails.map((c: any) => (
                          <div key={c.id} className="card p-4 border border-white/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200">
                            <h4 className="text-sm font-semibold text-slate-800 mb-3 leading-snug">{c.name}</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-medium">Members</span>
                                <span className="font-semibold text-slate-700">{c.participants}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-medium">Attendance</span>
                                <span className={`font-bold ${attColor(c.avgAttendance)}`}>{c.avgAttendance}%</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-medium">Syllabus</span>
                                <span className="font-semibold text-emerald-600">{c.progress}%</span>
                              </div>
                              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-2">
                                <div className={`h-full rounded-full ${attBg(c.avgAttendance)}`} style={{ width: `${c.avgAttendance}%` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                        {uc.circleDetails.length === 0 && (
                          <div className="col-span-full text-center py-4">
                            <p className="text-xs text-slate-400">No circles in this UC</p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {ucStats.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <Map className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-400">No UC data available</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
