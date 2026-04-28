"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, Activity, AlertCircle, Loader2, TrendingUp, ArrowRight } from 'lucide-react';
import Link from "next/link";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [topicProgress, setTopicProgress] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  const COLORS = ['#059669', '#e5e7eb'];

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
          .select(`id, session_date, quran_circles (name, murabbi_name), syllabus_topics (title, topic_number), attendance (status)`)
          .order('session_date', { ascending: false })
          .limit(5);

        setStats([
          { label: "Total Circles", value: circleCount || 0, icon: Users, color: 'blue', trend: "Active", gradient: 'from-blue-500 to-indigo-500' },
          { label: "Classes Held", value: sessionCount || 0, icon: BookOpen, color: 'emerald', trend: "Sessions", gradient: 'from-emerald-500 to-teal-500' },
          { label: "Avg Attendance", value: `${avgAtt}%`, icon: Activity, color: 'orange', trend: "Rate", gradient: 'from-orange-500 to-amber-500' },
          { label: "Syllabus Topics", value: totalSyllabus || 0, icon: AlertCircle, color: 'purple', trend: "Defined", gradient: 'from-purple-500 to-violet-500' },
        ]);

        setAttendanceData(Object.values(ucMap).slice(0, 5));
        setTopicProgress([
          { name: 'Completed', value: uniqueCompleted },
          { name: 'Remaining', value: (totalSyllabus || 0) - uniqueCompleted },
        ]);
        setRecentReports(reports?.map((r: any) => ({
          circle: r.quran_circles?.name || r.quran_circles?.[0]?.name,
          murabbi: r.quran_circles?.murabbi_name || r.quran_circles?.[0]?.murabbi_name || 'Admin',
          topic: r.syllabus_topics ? `Topic ${r.syllabus_topics.topic_number || r.syllabus_topics[0]?.topic_number}: ${r.syllabus_topics.title || r.syllabus_topics[0]?.title}` : 'General',
          date: new Date(r.session_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }),
          att: `${r.attendance?.filter((a: any) => a.status).length} / ${r.attendance?.length}`
        })) || []);
      } catch (e) {
        console.error("Dashboard data fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <Loader2 className="animate-spin w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <div className="text-center">
          <p className="font-black text-gray-800 text-lg">Syncing Dashboard</p>
          <p className="text-sm text-gray-500 mt-1">Fetching latest data from all circles...</p>
        </div>
      </div>
    );
  }

  const statColorMap: any = {
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   val: 'text-blue-900',   badge: 'bg-blue-100 text-blue-600' },
    emerald:{ bg: 'bg-emerald-50',icon: 'bg-emerald-100 text-emerald-600', val: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-600' },
    orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600',  val: 'text-orange-900',  badge: 'bg-orange-100 text-orange-600' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600',  val: 'text-purple-900',  badge: 'bg-purple-100 text-purple-600' },
  };

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <header className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Overview</p>
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Zone Nazim Dashboard</h2>
        <p className="text-gray-500 mt-1 text-sm md:text-base">Real-time overview of all sectors and union councils.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        {stats.map((s, i) => {
          const Icon = s.icon;
          const c = statColorMap[s.color];
          return (
            <div key={i} className={`${c.bg} p-5 rounded-3xl border border-white shadow-sm animate-fade-in-up flex flex-col gap-4`}>
              <div className="flex items-start justify-between">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${c.icon}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${c.badge}`}>{s.trend}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{s.label}</p>
                <p className={`text-3xl font-black mt-0.5 ${c.val}`}>{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-600 mb-0.5">Analytics</p>
              <h3 className="text-lg font-black text-gray-900">Attendance by Union Council</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="h-[260px]">
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)', fontSize: '13px' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px', fontSize: '12px', fontWeight: 700 }} />
                  <Bar dataKey="members" name="Haazir Arkan" fill="#059669" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="public" name="Aam Afraad" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <Activity className="w-10 h-10 opacity-20" />
                <p className="text-sm font-medium">No attendance data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-purple-600 mb-0.5">Progress</p>
            <h3 className="text-lg font-black text-gray-900">Syllabus Coverage</h3>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={topicProgress} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {topicProgress.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)', fontSize: '13px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="space-y-2 mt-2">
            {topicProgress.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-gray-600 font-medium">{item.name}</span>
                </div>
                <span className="font-black text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Jaiza Reports */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-600 mb-0.5">Recent Activity</p>
            <h3 className="text-lg font-black text-gray-900">Jaiza Reports</h3>
          </div>
          <Link href="/dashboard/jaiza" className="flex items-center gap-1 text-xs font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full text-left text-sm block md:table">
            <thead className="hidden md:table-header-group bg-slate-50/70 text-gray-500 text-xs font-black uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Quran Circle</th>
                <th className="px-6 py-4">Murabbi</th>
                <th className="px-6 py-4">Topic Taught</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Attendance</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group space-y-3 md:space-y-0 md:divide-y divide-gray-100 p-4 md:p-0 bg-slate-50/30 md:bg-transparent">
              {recentReports.length > 0 ? recentReports.map((row, i) => (
                <tr key={i} className="block md:table-row bg-white border border-gray-100 rounded-2xl shadow-sm md:shadow-none md:border-0 md:rounded-none mb-3 md:mb-0 hover:bg-slate-50/70 transition-colors">
                  <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0 bg-slate-50/50 md:bg-transparent rounded-t-2xl md:rounded-none">
                    <span className="md:hidden text-[10px] text-gray-400 font-black uppercase tracking-wider">Circle</span>
                    <span className="font-bold text-gray-800">{row.circle}</span>
                  </td>
                  <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0 text-gray-600">
                    <span className="md:hidden text-[10px] text-gray-400 font-black uppercase tracking-wider">Murabbi</span>
                    {row.murabbi}
                  </td>
                  <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0 text-gray-600">
                    <span className="md:hidden text-[10px] text-gray-400 font-black uppercase tracking-wider">Topic</span>
                    <span className="text-right md:text-left text-xs md:text-sm">{row.topic}</span>
                  </td>
                  <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0 text-gray-500">
                    <span className="md:hidden text-[10px] text-gray-400 font-black uppercase tracking-wider">Date</span>
                    {row.date}
                  </td>
                  <td className="flex justify-between items-center md:table-cell px-4 py-4 md:px-6 md:py-4 rounded-b-2xl md:rounded-none">
                    <span className="md:hidden text-[10px] text-gray-400 font-black uppercase tracking-wider">Attendance</span>
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-black text-xs border border-emerald-200">
                      ✓ {row.att}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr className="block md:table-row">
                  <td colSpan={5} className="block md:table-cell py-16 text-center">
                    <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No reports submitted yet</p>
                    <p className="text-xs text-gray-300 mt-1">Reports will appear here once Murabbis log attendance</p>
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