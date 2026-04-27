"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Map, Users, BookOpen, Activity, Loader2, ChevronRight, TrendingUp } from 'lucide-react';

export default function UCStatus() {
  const [loading, setLoading] = useState(true);
  const [ucStats, setUcStats] = useState<any[]>([]);
  const [totalTopics, setTotalTopics] = useState(0);
  const [expandedUC, setExpandedUC] = useState<string | null>(null);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    fetchUCStats();
  }, []);

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
          const cArkan = cParticipants.filter(p => p.type === 'haazir_arkan').length;
          const cPublic = cParticipants.filter(p => p.type === 'aam_afraad').length;
          const cAttendanceList = ucAttendance.filter((a: any) => a.participants?.circle_id === c.id);
          const cPresent = cAttendanceList.filter((a: any) => a.status).length;
          const cAvgAtt = cAttendanceList.length > 0 ? Math.round((cPresent / cAttendanceList.length) * 100) : 0;
          
          const cSessions = sessions?.filter((s: any) => s.circle_id === c.id) || [];
          const cUniqueTopics = new Set(cSessions.filter((s: any) => s.topic_id).map((s: any) => s.topic_id)).size;
          const cProgress = topicCount ? Math.round((cUniqueTopics / topicCount) * 100) : 0;

          return { 
            id: c.id, 
            name: c.name, 
            participants: cParticipants.length, 
            arkan: cArkan, 
            public: cPublic, 
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
          progress: progress,
          uniqueTopics: uniqueTopics,
          circleDetails
        };
      }) || [];

      setUcStats(stats);
    } catch (e) {
      console.error("Error fetching UC stats:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-emerald-700">
        <Loader2 className="animate-spin w-10 h-10 mb-4" />
        <p className="font-bold text-lg">Analyzing UC Performance...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 pb-32">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Map className="text-emerald-600 w-8 h-8" />
          Union Council Status
        </h1>
        <p className="text-gray-500 mt-2">Comparative analysis and detailed performance metrics across all UCs in Zone 5.</p>
      </header>

      {/* Overview Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" /> Participants Distribution by UC
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ucStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" />
                <Bar dataKey="arkan" name="Haazir Arkan" fill="#059669" radius={[6, 6, 0, 0]} />
                <Bar dataKey="public" name="Aam Afraad" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" /> Avg Attendance Rate (%)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ucStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} unit="%" />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="avgAttendance" name="Attendance" stroke="#f59e0b" strokeWidth={4} dot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed UC Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">UC-Wise Performance Breakdown</h3>
        </div>
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full text-left text-sm block md:table">
            <thead className="hidden md:table-header-group bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-8 py-5">Union Council</th>
                <th className="px-6 py-5 text-center">Circles</th>
                <th className="px-6 py-5 text-center">Participants</th>
                <th className="px-6 py-5 text-center">Avg Attendance</th>
                <th className="px-6 py-5">Syllabus Progress</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group space-y-4 md:space-y-0 md:divide-y divide-gray-100 p-4 md:p-0 bg-gray-50/30 md:bg-transparent">
              {ucStats.map((uc, i) => (
                <React.Fragment key={uc.id}>
                  <tr 
                    onClick={() => setExpandedUC(expandedUC === uc.id ? null : uc.id)}
                    className="block md:table-row bg-white border border-gray-100 rounded-2xl shadow-sm md:shadow-none md:border-0 md:rounded-none mb-4 md:mb-0 hover:bg-gray-50/50 transition-colors cursor-pointer overflow-hidden"
                  >
                    <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-8 md:py-6 border-b border-gray-50 md:border-0 bg-gray-50/50 md:bg-transparent">
                      <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Union Council</span>
                      <div className="text-right md:text-left">
                        <div className="font-black text-gray-900 text-base flex items-center justify-end md:justify-start gap-2">
                          {uc.name}
                        </div>
                        <div className="text-xs text-gray-400 font-medium mt-1">Zone 5, Islamabad</div>
                      </div>
                    </td>
                    <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-6 border-b border-gray-50 md:border-0 text-center">
                      <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Total Circles</span>
                      <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl font-black text-xs">
                        {uc.circles} Circles
                      </span>
                    </td>
                    <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-6 border-b border-gray-50 md:border-0 text-center text-gray-600 font-bold">
                      <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Participants</span>
                      <span>{uc.participants}</span>
                    </td>
                    <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-6 border-b border-gray-50 md:border-0 text-center">
                      <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Avg Attendance</span>
                      <div className="flex flex-col items-end md:items-center">
                        <span className={`text-base font-black ${uc.avgAttendance > 70 ? 'text-emerald-600' : uc.avgAttendance > 40 ? 'text-orange-500' : 'text-red-500'}`}>
                          {uc.avgAttendance}%
                        </span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className={`h-full rounded-full ${uc.avgAttendance > 70 ? 'bg-emerald-500' : uc.avgAttendance > 40 ? 'bg-orange-400' : 'bg-red-400'}`} style={{width: `${uc.avgAttendance}%`}}></div>
                        </div>
                      </div>
                    </td>
                    <td className="block md:table-cell px-4 py-4 md:px-6 md:py-6 md:pr-8 bg-gray-50/30 md:bg-transparent">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs font-bold uppercase text-gray-500 mb-1">
                            <span className="md:hidden">Progress</span>
                            <span className="hidden md:inline">{uc.uniqueTopics} / {totalTopics} Topics</span>
                            <span>{uc.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 md:bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{width: `${uc.progress}%`}}></div>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedUC === uc.id ? 'rotate-90' : ''}`} />
                      </div>
                    </td>
                  </tr>
                  
                  {expandedUC === uc.id && (
                    <tr className="block md:table-row bg-gray-50/50">
                      <td colSpan={5} className="block md:table-cell px-4 py-4 md:px-8 md:py-6 border-b border-gray-100 rounded-b-2xl md:rounded-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {uc.circleDetails.map((c: any) => (
                            <div key={c.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 hover:border-emerald-200 transition-colors">
                              <h4 className="font-bold text-gray-800 text-sm truncate">{c.name}</h4>
                              <div className="mt-3 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-500 font-medium">Participants</span>
                                  <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{c.participants}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-500 font-medium">Arkan / Aam</span>
                                  <span className="font-medium text-gray-600">{c.arkan} / {c.public}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-100">
                                  <span className="text-gray-500 font-medium">Avg Attendance</span>
                                  <span className={`font-black ${c.avgAttendance > 70 ? 'text-emerald-600' : c.avgAttendance > 40 ? 'text-orange-500' : 'text-red-500'}`}>
                                    {c.avgAttendance}%
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-500 font-medium">Syllabus Progress</span>
                                  <span className={`font-black ${c.progress > 50 ? 'text-emerald-600' : 'text-gray-500'}`}>
                                    {c.progress}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {uc.circleDetails.length === 0 && (
                            <div className="col-span-full text-center py-4 text-gray-400 text-sm font-medium">
                              No active Quran Circles found in this Union Council.
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
