"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, Activity, LayoutGrid, Loader2, TrendingUp, ArrowRight } from 'lucide-react';
import Link from "next/link";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [topicProgress, setTopicProgress] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  const DONUT_COLORS = ['#059669', '#e2e8f0'];

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const { count: circleCount } = await supabase.from('quran_circles').select('*', { count: 'exact', head: true });
        const { count: sessionCount } = await supabase.from('sessions').select('*', { count: 'exact', head: true });
        const { data: attendanceRaw } = await supabase.from('attendance').select('status');
        const totalAttendanceRecords = attendanceRaw?.length || 0;
        const presentCount = attendanceRaw?.filter(r => r.status).length || 0;
        const avgAtt = totalAttendanceRecords > 0 ? Math.round((presentCount / totalAttendanceRecords) * 100) : 0;

        const { data: ucAttData } = await supabase.from('attendance').select(`status, participants (type, quran_circles (union_councils (name)))`);
        const ucMap: Record<string, { name: string, members: number, public: number }> = {};
        ucAttData?.forEach((record: any) => {
          if (!record.status) return;
          const ucName = record.participants?.quran_circles?.union_councils?.name || 'Unknown';
          const type = record.participants?.type;
          if (!ucMap[ucName]) ucMap[ucName] = { name: ucName, members: 0, public: 0 };
          if (type === 'haazir_arkan') ucMap[ucName].members++;
          else ucMap[ucName].public++;
        });

        const { count: totalSyllabus } = await supabase.from('syllabus_topics').select('*', { count: 'exact', head: true });
        const { data: completedTopics } = await supabase.from('sessions').select('topic_id').not('topic_id', 'is', null);
        const uniqueCompleted = new Set(completedTopics?.map(t => t.topic_id)).size;

        const { data: reports } = await supabase
          .from('sessions')
          .select(`id, session_date, quran_circles (name, murabbi_name, union_councils (name)), syllabus_topics (title, topic_number), attendance (status)`)
          .order('session_date', { ascending: false })
          .limit(5);

        setStats([
          { label: "Total Circles",   value: circleCount || 0,   icon: Users,       color: 'blue',    gradient: 'from-blue-500 to-indigo-600',   bg: 'from-blue-50/80 to-indigo-50/60',   border: 'border-blue-200/50'   },
          { label: "Classes Held",    value: sessionCount || 0,  icon: BookOpen,    color: 'emerald', gradient: 'from-emerald-500 to-teal-600',  bg: 'from-emerald-50/80 to-teal-50/60', border: 'border-emerald-200/50' },
          { label: "Avg Attendance",  value: `${avgAtt}%`,       icon: Activity,    color: 'amber',   gradient: 'from-amber-500 to-orange-500',  bg: 'from-amber-50/80 to-orange-50/60', border: 'border-amber-200/50'   },
          { label: "Syllabus Topics", value: totalSyllabus || 0, icon: LayoutGrid,  color: 'purple',  gradient: 'from-purple-500 to-fuchsia-600',bg: 'from-purple-50/80 to-fuchsia-50/60',border:'border-purple-200/50' },
        ]);

        setAttendanceData(Object.values(ucMap).slice(0, 5));
        setTopicProgress([
          { name: 'Completed', value: uniqueCompleted },
          { name: 'Remaining', value: (totalSyllabus || 0) - uniqueCompleted },
        ]);
        setRecentReports(reports?.map((r: any) => ({
          circle:  r.quran_circles?.name || r.quran_circles?.[0]?.name,
          uc:      r.quran_circles?.union_councils?.name || r.quran_circles?.[0]?.union_councils?.name || 'N/A',
          murabbi: r.quran_circles?.murabbi_name || r.quran_circles?.[0]?.murabbi_name || 'Admin',
          topic:   r.syllabus_topics ? `Topic ${r.syllabus_topics.topic_number || r.syllabus_topics[0]?.topic_number}: ${r.syllabus_topics.title || r.syllabus_topics[0]?.title}` : 'General',
          date:    new Date(r.session_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }),
          att:     `${r.attendance?.filter((a: any) => a.status).length} / ${r.attendance?.length}`
        })) || []);
      } catch (e) { console.error("Dashboard data fetch error:", e); }
      finally { setLoading(false); }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/80"
          style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)' }}>
          <Loader2 className="animate-spin w-6 h-6 text-emerald-600" />
        </div>
        <p className="text-sm font-semibold text-slate-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">

      {/* Page Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm" />
          <p className="section-label">Overview</p>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Zone Dashboard</h2>
        <p className="text-slate-500 mt-1.5 text-sm leading-relaxed max-w-2xl">
          Real-time overview of Quran Circle performance, syllabus progress, and participant engagement.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-7 stagger">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`stat-card p-5 md:p-6 bg-gradient-to-br ${s.bg} border ${s.border} hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group cursor-default`}>
              {/* Shine */}
              <div className="absolute inset-0 rounded-[1.75rem] overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              </div>
              <div className="relative flex items-start justify-between mb-5">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br ${s.gradient} shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="relative">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{s.label}</p>
                <p className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 mb-7">
        {/* Bar Chart */}
        <div className="card p-5 md:p-6 lg:col-span-2 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="section-label">Regional</p>
                <h3 className="text-base font-bold text-slate-900 tracking-tight leading-none mt-0.5">UC Attendance</h3>
              </div>
            </div>
          </div>
          <div className="h-[250px] md:h-[290px]">
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(16,185,129,0.06)', radius: 8 }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 32px rgba(0,0,0,0.10)', fontSize: '12px', fontWeight: 600, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px', fontSize: '11px', fontWeight: 600 }} />
                  <Bar dataKey="members" name="Haazir Arkan" fill="url(#emeraldGrad)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="public" name="Aam Afraad" fill="url(#indigoGrad)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Activity className="w-12 h-12 text-slate-200" />
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-300">No regional data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Donut Chart */}
        <div className="card p-5 md:p-6 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-md">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-600 leading-none">Progress</p>
              <h3 className="text-base font-bold text-slate-900 tracking-tight leading-none mt-0.5">Curriculum</h3>
            </div>
          </div>
          <div className="h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={topicProgress} cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={6} dataKey="value" stroke="none">
                  {topicProgress.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', fontSize: '12px', fontWeight: 600, background: 'rgba(255,255,255,0.92)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900">{topicProgress[0]?.value || 0}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">done</span>
            </div>
          </div>
          <div className="space-y-2.5 mt-4">
            {topicProgress.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl" style={{ background: 'rgba(248,250,252,0.7)', border: '1px solid rgba(255,255,255,0.8)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i] }} />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="card overflow-hidden hover:-translate-y-0.5 transition-all duration-300">
        <div className="p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.7)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center shadow-md">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="section-label">Audit Log</p>
              <h3 className="text-base font-bold text-slate-900 tracking-tight leading-none mt-0.5">Recent Sessions</h3>
            </div>
          </div>
          <Link href="/dashboard/jaiza" className="btn btn-primary text-xs py-2.5 px-4 flex-shrink-0">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile/Tablet card view */}
        <div className="lg:hidden divide-y divide-slate-100">
          {recentReports.length > 0 ? recentReports.map((row, i) => (
            <div key={i} className="p-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800 text-sm leading-snug">{row.circle}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{row.uc}</p>
                </div>
                <span className="badge badge-emerald flex-shrink-0">{row.att}</span>
              </div>
              <div className="mt-2.5 space-y-1">
                <p className="text-xs text-slate-500 truncate"><span className="font-semibold text-slate-600">Murabbi:</span> {row.murabbi}</p>
                <p className="text-xs text-slate-500 truncate"><span className="font-semibold text-slate-600">Topic:</span> {row.topic}</p>
                <p className="text-xs text-slate-400">{row.date}</p>
              </div>
            </div>
          )) : (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm"
                style={{ background: 'rgba(236,253,245,0.8)', border: '1px solid rgba(167,243,208,0.5)' }}>
                <BookOpen className="w-6 h-6 text-emerald-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No sessions recorded yet</p>
            </div>
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr style={{ background: 'rgba(248,250,252,0.7)' }}>
                {['Circle / UC', 'Murabbi', 'Topic', 'Date', 'Attendance'].map((h, i) => (
                  <th key={h} className={`px-5 md:px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider ${i === 4 ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ '--tw-divide-opacity': 1 } as any}>
              {recentReports.length > 0 ? recentReports.map((row, i) => (
                <tr key={i} className="group transition-colors" onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,250,252,0.5)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-5 py-4" style={{ borderBottom: '1px solid rgba(241,245,249,0.8)' }}>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">{row.circle}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{row.uc}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-sm" style={{ borderBottom: '1px solid rgba(241,245,249,0.8)' }}>{row.murabbi}</td>
                  <td className="px-5 py-4 text-slate-500 text-sm max-w-xs" style={{ borderBottom: '1px solid rgba(241,245,249,0.8)' }}>
                    <span className="truncate block">{row.topic}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-sm" style={{ borderBottom: '1px solid rgba(241,245,249,0.8)' }}>{row.date}</td>
                  <td className="px-5 py-4 text-right" style={{ borderBottom: '1px solid rgba(241,245,249,0.8)' }}>
                    <span className="badge badge-emerald">{row.att}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm"
                      style={{ background: 'rgba(236,253,245,0.8)', border: '1px solid rgba(167,243,208,0.5)' }}>
                      <BookOpen className="w-6 h-6 text-emerald-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">No sessions recorded yet</p>
                    <p className="text-xs text-slate-400 mt-1">Session reports will appear here after submission</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
