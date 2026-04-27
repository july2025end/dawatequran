"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ClipboardList, Search, Edit2, Trash2, Calendar, MapPin, Book, Users, X, Save, Loader2, ChevronRight, ChevronDown } from "lucide-react";
import React from "react";

export default function JaizaReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingReport, setEditingReport] = useState<any>(null);
  const [viewingDetails, setViewingDetails] = useState<string | null>(null);
  const [sessionAttendance, setSessionAttendance] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
    fetchSupportData();
  }, []);

  async function fetchSupportData() {
    const { data: tData } = await supabase.from("syllabus_topics").select("id, title, topic_number").order("topic_number");
    const { data: cData } = await supabase.from("quran_circles").select("id, name");
    setTopics(tData || []);
    setCircles(cData || []);
  }

  async function fetchReports() {
    setLoading(true);
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        *,
        quran_circles (id, name, murabbi_name, union_councils (name)),
        syllabus_topics (id, title, topic_number),
        attendance (status)
      `)
      .order("session_date", { ascending: false });

    if (error) console.error("Error fetching reports:", error);
    else setReports(data || []);
    setLoading(false);
  }

  async function fetchAttendanceDetails(sessionId: string) {
    const { data, error } = await supabase
      .from("attendance")
      .select(`
        *,
        participants (id, full_name, type)
      `)
      .eq("session_id", sessionId);
    
    if (error) console.error("Error fetching attendance details:", error);
    else setSessionAttendance(data || []);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this Jaiza report? This will also remove the attendance records for this session.")) return;
    
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchReports();
  }

  async function handleUpdateReport() {
    if (!editingReport) return;
    
    const { error } = await supabase
      .from("sessions")
      .update({
        session_date: editingReport.session_date,
        location: editingReport.location,
        topic_id: editingReport.topic_id || null,
        notes: editingReport.notes,
        circle_id: editingReport.circle_id
      })
      .eq("id", editingReport.id);

    if (error) alert(error.message);
    else {
      setEditingReport(null);
      fetchReports();
    }
  }

  async function toggleAttendance(sessionId: string, participantId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from("attendance")
      .update({ status: !currentStatus })
      .eq("session_id", sessionId)
      .eq("participant_id", participantId);
    
    if (error) alert(error.message);
    else fetchAttendanceDetails(viewingDetails!);
  }

  const filteredReports = reports.filter(r => 
    r.quran_circles?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.quran_circles?.union_councils?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.syllabus_topics?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="text-emerald-600" />
            Jaiza Reports Management
          </h1>
          <p className="text-sm text-gray-500">Review, edit, and audit all submitted reports and attendance.</p>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="relative max-w-md">
        <input 
          type="text" 
          placeholder="Search by UC, circle, topic, or location..." 
          className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-emerald-600">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="font-bold">Loading reports...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-4">Session Date</th>
                  <th className="px-6 py-4">Quran Circle & UC</th>
                  <th className="px-6 py-4">Topic / Syllabus</th>
                  <th className="px-6 py-4">Attendance</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReports.map((report) => (
                  <React.Fragment key={report.id}>
                    <tr className={`hover:bg-gray-50 transition-colors ${viewingDetails === report.id ? 'bg-emerald-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{new Date(report.session_date).toLocaleDateString()}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">{report.category.replace('_', ' ')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{report.quran_circles?.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-emerald-500" /> {report.quran_circles?.union_councils?.name || 'Unknown UC'}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3" /> {report.quran_circles?.murabbi_name || 'Admin'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {report.syllabus_topics ? (
                          <>
                            <div className="font-medium text-gray-800">{report.syllabus_topics.title}</div>
                            <div className="text-[10px] text-emerald-600 font-bold">TOPIC #{report.syllabus_topics.topic_number}</div>
                          </>
                        ) : (
                          <span className="text-gray-400 italic">No topic assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
                            {report.attendance?.filter((a: any) => a.status).length || 0} Present
                          </span>
                          <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs font-bold">
                            {report.attendance?.length || 0} Total
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              if (viewingDetails === report.id) setViewingDetails(null);
                              else {
                                setViewingDetails(report.id);
                                fetchAttendanceDetails(report.id);
                              }
                            }}
                            className={`p-2 rounded-lg transition-colors ${viewingDetails === report.id ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-100'}`}
                            title="View Attendance Details"
                          >
                            {viewingDetails === report.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => setEditingReport(report)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit Report"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(report.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {viewingDetails === report.id && (
                      <tr>
                        <td colSpan={5} className="px-8 py-6 bg-gray-50/50">
                          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                              <h4 className="font-bold text-gray-700 flex items-center gap-2 text-sm">
                                <Users className="w-4 h-4" /> Attendance Breakdown
                              </h4>
                              <div className="text-xs text-gray-500">
                                Click on status to toggle manually
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                              {sessionAttendance.map(att => (
                                <div 
                                  key={`${att.session_id}-${att.participant_id}`} 
                                  className="flex items-center justify-between p-3 border rounded-lg hover:border-emerald-200 transition-colors"
                                >
                                  <div>
                                    <div className="text-sm font-bold text-gray-800">{att.participants?.full_name}</div>
                                    <div className="text-[10px] uppercase font-black text-gray-400">{att.participants?.type.replace('_', ' ')}</div>
                                  </div>
                                  <button 
                                    onClick={() => toggleAttendance(att.session_id, att.participant_id, att.status)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${att.status ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}
                                  >
                                    {att.status ? 'Present' : 'Absent'}
                                  </button>
                                </div>
                              ))}
                              {sessionAttendance.length === 0 && (
                                <div className="col-span-full py-10 text-center text-gray-400 text-sm">
                                  No attendance records found for this session.
                                </div>
                              )}
                            </div>
                            {report.notes && (
                              <div className="p-4 bg-emerald-50/50 border-t">
                                <div className="text-xs font-bold text-emerald-700 uppercase mb-1">Session Notes:</div>
                                <div className="text-sm text-gray-600">{report.notes}</div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                      No Jaiza reports found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-700 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Edit Jaiza Report</h3>
                <p className="text-emerald-100 text-sm">{editingReport.quran_circles?.name} - {new Date(editingReport.session_date).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setEditingReport(null)} className="p-2 hover:bg-emerald-600 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Session Date</label>
                  <input 
                    type="date" 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={editingReport.session_date}
                    onChange={(e) => setEditingReport({...editingReport, session_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Circle</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={editingReport.circle_id}
                    onChange={(e) => setEditingReport({...editingReport, circle_id: e.target.value})}
                  >
                    {circles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Topic Taught</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={editingReport.topic_id || ""}
                  onChange={(e) => setEditingReport({...editingReport, topic_id: e.target.value})}
                >
                  <option value="">No Topic Assigned</option>
                  {topics.map(t => <option key={t.id} value={t.id}>Topic {t.topic_number}: {t.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Masjid, Markaz, House #"
                  value={editingReport.location || ""}
                  onChange={(e) => setEditingReport({...editingReport, location: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Session Notes</label>
                <textarea 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 h-24 resize-none"
                  placeholder="Enter details about the session discussion..."
                  value={editingReport.notes || ""}
                  onChange={(e) => setEditingReport({...editingReport, notes: e.target.value})}
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
              <button 
                onClick={() => setEditingReport(null)}
                className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateReport}
                className="px-8 py-2 bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-800 transition-all flex items-center gap-2"
              >
                <Safe className="w-4 h-4" />
                Update Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
