"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, Activity, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [topicProgress, setTopicProgress] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        // 1. Fetch Basic Counts
        const { count: circleCount } = await supabase.from('quran_circles').select('*', { count: 'exact', head: true });
        const { count: sessionCount } = await supabase.from('sessions').select('*', { count: 'exact', head: true });
        const { data: attendanceRaw } = await supabase.from('attendance').select('status');
        
        const totalAttendanceRecords = attendanceRaw?.length || 0;
        const presentCount = attendanceRaw?.filter(r => r.status).length || 0;
        const avgAtt = totalAttendanceRecords > 0 ? Math.round((presentCount / totalAttendanceRecords) * 100) : 0;

        // 2. Fetch Attendance by UC (Aggregated in JS for simplicity)
        const { data: ucAttData } = await supabase
          .from('attendance')
          .select(`
            status,
            participants (
              type,
              quran_circles (
                union_councils (name)
              )
            )
          `);

        const ucMap: Record<string, { name: string, members: number, public: number }> = {};
        ucAttData?.forEach((record: any) => {
          if (!record.status) return;
          const ucName = record.participants?.quran_circles?.union_councils?.name || 'Unknown';
          const type = record.participants?.type;
          
          if (!ucMap[ucName]) ucMap[ucName] = { name: ucName, members: 0, public: 0 };
          if (type === 'haazir_arkan') ucMap[ucName].members++;
          else ucMap[ucName].public++;
        });

        // 3. Fetch Syllabus Progress
        const { count: totalSyllabus } = await supabase.from('syllabus_topics').select('*', { count: 'exact', head: true });
        const { data: completedTopics } = await supabase.from('sessions').select('topic_id').not('topic_id', 'is', null);
        const uniqueCompleted = new Set(completedTopics?.map(t => t.topic_id)).size;

        // 4. Fetch Recent Reports
        const { data: reports } = await supabase
          .from('sessions')
          .select(`
            id,
            session_date,
            quran_circles (name, murabbi_name),
            syllabus_topics (title, topic_number),
            attendance (status)
          `)
          .order('session_date', { ascending: false })
          .limit(5);

        // Update State
        setStats([
          { label: "Total Circles", value: circleCount || 0, icon: <Users className="text-blue-500 w-8 h-8" />, trend: "Active Circles" },
          { label: "Classes Held", value: sessionCount || 0, icon: <BookOpen className="text-emerald-500 w-8 h-8" />, trend: "Total Sessions" },
          { label: "Avg Attendance", value: `${avgAtt}%`, icon: <Activity className="text-orange-500 w-8 h-8" />, trend: "Overall Rate" },
          { label: "Total Syllabus", value: totalSyllabus || 0, icon: <AlertCircle className="text-purple-500 w-8 h-8" />, trend: "Topics defined" },
        ]);

        setAttendanceData(Object.values(ucMap).slice(0, 5)); // Show top 5 UCs
        
        setTopicProgress([
          { name: 'Completed', value: uniqueCompleted },
          { name: 'Remaining', value: (totalSyllabus || 0) - uniqueCompleted },
        ]);

        setRecentReports(reports?.map((r: any) => ({
          circle: r.quran_circles?.name || r.quran_circles?.[0]?.name,
          murabbi: r.quran_circles?.murabbi_name || r.quran_circles?.[0]?.murabbi_name || 'Admin',
          topic: r.syllabus_topics ? `Topic ${r.syllabus_topics.topic_number || r.syllabus_topics[0]?.topic_number}: ${r.syllabus_topics.title || r.syllabus_topics[0]?.title}` : 'General',
          date: new Date(r.session_date).toLocaleDateString(),
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
      <div className="flex flex-col items-center justify-center min-h-screen text-emerald-700">
        <Loader2 className="animate-spin w-10 h-10 mb-4" />
        <p className="font-bold">Syncing Dashboard Data...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Zone Nazim Dashboard</h2>
        <p className="text-gray-500 mt-1">Real-time overview of all sectors and union councils.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              {s.icon}
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{s.trend}</span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{s.label}</h3>
            <p className="text-3xl font-bold text-gray-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Attendance by Union Council</h3>
          <div className="h-[300px] w-full min-h-[300px]">
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                  <Bar dataKey="members" name="Haazir Arkan" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="public" name="Aam Afraad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No attendance data yet</div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Syllabus Progress</h3>
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topicProgress}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {topicProgress.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Jaiza Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Recent Jaiza Reports</h3>
          <a href="/dashboard/schedule" className="text-emerald-600 font-medium text-sm hover:text-emerald-700">Manage Schedule</a>
        </div>
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full text-left text-sm block md:table">
            <thead className="hidden md:table-header-group bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Quran Circle</th>
                <th className="px-6 py-4">Murabbi</th>
                <th className="px-6 py-4">Topic Taught</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Attendance</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group space-y-4 md:space-y-0 md:divide-y divide-gray-100 p-4 md:p-0 bg-gray-50/30 md:bg-transparent">
              {recentReports.length > 0 ? recentReports.map((row, i) => (
                <tr key={i} className="block md:table-row bg-white border border-gray-100 rounded-2xl shadow-sm md:shadow-none md:border-0 md:rounded-none mb-4 md:mb-0 hover:bg-gray-50 transition-colors">
                  <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0 font-medium text-gray-800 bg-gray-50/50 md:bg-transparent">
                    <span className="md:hidden text-xs text-gray-500 font-bold uppercase">Quran Circle</span>
                    {row.circle}
                  </td>
                  <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0 text-gray-600">
                    <span className="md:hidden text-xs text-gray-500 font-bold uppercase">Murabbi</span>
                    {row.murabbi}
                  </td>
                  <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0 text-gray-600">
                    <span className="md:hidden text-xs text-gray-500 font-bold uppercase">Topic</span>
                    {row.topic}
                  </td>
                  <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0 text-gray-500">
                    <span className="md:hidden text-xs text-gray-500 font-bold uppercase">Date</span>
                    {row.date}
                  </td>
                  <td className="flex justify-between items-center md:table-cell px-4 py-4 md:px-6 md:py-4 bg-gray-50/30 md:bg-transparent">
                    <span className="md:hidden text-xs text-gray-500 font-bold uppercase">Attendance</span>
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold text-xs shadow-sm">
                      {row.att}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr className="block md:table-row">
                  <td colSpan={5} className="block md:table-cell px-6 py-10 text-center text-gray-400">No reports submitted yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}