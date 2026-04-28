"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ClipboardList, Search, Edit2, Trash2, Calendar, MapPin, Users, X, Save, Loader2, ChevronRight, ChevronDown } from "lucide-react";
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

  useEffect(() => { fetchReports(); fetchSupportData(); }, []);

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
      .select(`*, quran_circles (id, name, murabbi_name, union_councils (name)), syllabus_topics (id, title, topic_number), attendance (status)`)
      .order("session_date", { ascending: false });
    if (error) console.error("Error fetching reports:", error);
    else setReports(data || []);
    setLoading(false);
  }

  async function fetchAttendanceDetails(sessionId: string) {
    const { data, error } = await supabase
      .from("attendance")
      .select(`*, participants (id, full_name, type)`)
      .eq("session_id", sessionId);
    if (error) console.error("Error fetching attendance details:", error);
    else setSessionAttendance(data || []);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this session report? This will also remove attendance records.")) return;
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchReports();
  }

  async function handleUpdateReport() {
    if (!editingReport) return;
    const { error } = await supabase.from("sessions")
      .update({ session_date: editingReport.session_date, location: editingReport.location, topic_id: editingReport.topic_id || null, notes: editingReport.notes, circle_id: editingReport.circle_id })
      .eq("id", editingReport.id);
    if (error) alert(error.message);
    else { setEditingReport(null); fetchReports(); }
  }

  async function toggleAttendance(sessionId: string, participantId: string, currentStatus: boolean) {
    const { error } = await supabase.from("attendance").update({ status: !currentStatus }).eq("session_id", sessionId).eq("participant_id", participantId);
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
    <div className="p-5 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <header>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm" />
          <p className="section-label">Session Log</p>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Jaiza Reports</h2>
        <p className="text-slate-500 mt-1.5 text-sm leading-relaxed max-w-2xl">
          View and manage all recorded Quran Circle sessions, attendance, and curriculum progress.
        </p>
      </header>

      {/* Search */}
      <div className="relative max-w-lg">
        <input
          type="text"
          placeholder="Search by circle, UC, topic, or location..."
          className="form-input pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-emerald-600">
          <Loader2 className="w-8 h-8 animate-spin opacity-50" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading sessions...</p>
        </div>
      ) : (
        <div className="glass-table">
          {/* Mobile / Tablet card view */}
          <div className="lg:hidden divide-y divide-slate-100">
            {filteredReports.length > 0 ? filteredReports.map((report) => (
              <div key={report.id + '-card'} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-xs font-bold text-slate-500">
                        {new Date(report.session_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="badge badge-emerald">{report.category.replace('_', ' ')}</span>
                    </div>
                    <p className="font-bold text-slate-800 text-sm">{report.quran_circles?.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{report.quran_circles?.union_councils?.name || 'Unknown UC'}
                    </p>
                    {report.syllabus_topics && (
                      <p className="text-xs text-slate-500 mt-1.5">
                        <span className="font-semibold">Topic #{report.syllabus_topics.topic_number}:</span> {report.syllabus_topics.title}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="badge badge-emerald">{report.attendance?.filter((a: any) => a.status).length || 0} present</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { if (viewingDetails === report.id) setViewingDetails(null); else { setViewingDetails(report.id); fetchAttendanceDetails(report.id); } }}
                        className={`p-2 rounded-lg transition-all ${viewingDetails === report.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                        {viewingDetails === report.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setEditingReport(report)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(report.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
                {viewingDetails === report.id && (
                  <div className="mt-3 pt-3 border-t border-slate-100 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5 text-emerald-600" /> Attendance</p>
                      <span className="badge badge-emerald">{sessionAttendance.filter(a => a.status).length} / {sessionAttendance.length} present</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {sessionAttendance.map(att => (
                        <button key={`m-${att.session_id}-${att.participant_id}`}
                          onClick={() => toggleAttendance(att.session_id, att.participant_id, att.status)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border-2 transition-all text-left text-xs ${att.status ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-100 text-slate-400'}`}>
                          <span className="font-semibold truncate">{att.participants?.full_name}</span>
                          <div className={`w-4 h-4 rounded-full flex-shrink-0 ml-1 flex items-center justify-center ${att.status ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                            {att.status && <span className="text-white text-[10px]">✓</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <div className="py-16 text-center">
                <ClipboardList className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No reports found</p>
              </div>
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden lg:block">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr style={{ background: 'rgba(248,250,252,0.70)' }}>
                <th className="px-5 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-5 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Circle</th>
                <th className="px-5 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Topic</th>
                <th className="px-5 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center hidden sm:table-cell">Attendance</th>
                <th className="px-5 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length > 0 ? filteredReports.map((report) => (
                <React.Fragment key={report.id}>
                  <tr className={`group transition-colors ${viewingDetails === report.id ? '' : ''}`} style={viewingDetails === report.id ? { background: 'rgba(236,253,245,0.5)' } : {}} onMouseEnter={e => { if (viewingDetails !== report.id) e.currentTarget.style.background = 'rgba(248,250,252,0.6)'; }} onMouseLeave={e => { if (viewingDetails !== report.id) e.currentTarget.style.background = 'transparent'; }}>
                    <td className="px-5 md:px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {new Date(report.session_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <span className="badge badge-emerald mt-1.5">{report.category.replace('_', ' ')}</span>
                    </td>
                    <td className="px-5 md:px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">{report.quran_circles?.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{report.quran_circles?.union_councils?.name || 'Unknown UC'}
                      </p>
                    </td>
                    <td className="px-5 md:px-6 py-4 hidden md:table-cell">
                      {report.syllabus_topics ? (
                        <div>
                          <p className="text-sm font-medium text-slate-700 leading-snug">{report.syllabus_topics.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Topic #{report.syllabus_topics.topic_number}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 italic">General / Custom</span>
                      )}
                    </td>
                    <td className="px-5 md:px-6 py-4 text-center hidden sm:table-cell">
                      <span className="badge badge-emerald">
                        {report.attendance?.filter((a: any) => a.status).length || 0} present
                      </span>
                    </td>
                    <td className="px-5 md:px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            if (viewingDetails === report.id) setViewingDetails(null);
                            else { setViewingDetails(report.id); fetchAttendanceDetails(report.id); }
                          }}
                          className={`p-2 rounded-lg transition-all ${viewingDetails === report.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                          title="View details"
                        >
                          {viewingDetails === report.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setEditingReport(report)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(report.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable Details Row */}
                  {viewingDetails === report.id && (
                    <tr>
                      <td colSpan={5} className="px-5 md:px-6 pb-4 pt-0 bg-emerald-50/30">
                        <div className="card border border-emerald-100 p-5 animate-fade-in">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                              <Users className="w-4 h-4 text-emerald-600" /> Attendance Details
                            </h4>
                            <span className="badge badge-emerald">
                              {sessionAttendance.filter(a => a.status).length} / {sessionAttendance.length} present
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {sessionAttendance.map(att => (
                              <button
                                key={`${att.session_id}-${att.participant_id}`}
                                onClick={() => toggleAttendance(att.session_id, att.participant_id, att.status)}
                                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                                  att.status
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate">{att.participants?.full_name}</p>
                                  <p className="text-xs capitalize opacity-60 mt-0.5">{att.participants?.type?.replace('_', ' ')}</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full ml-2 flex-shrink-0 flex items-center justify-center ${att.status ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                                  {att.status && <span className="text-white text-xs">✓</span>}
                                </div>
                              </button>
                            ))}
                          </div>
                          {report.notes && (
                            <div className="mt-4 pt-4 border-t border-emerald-100">
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes</p>
                              <p className="text-sm text-slate-600 leading-relaxed">{report.notes}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <ClipboardList className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-400">No reports found</p>
                    <p className="text-xs text-slate-300 mt-1">
                      {searchQuery ? 'Try adjusting your search' : 'Reports will appear after sessions are submitted'}
                    </p>
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
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingReport(null); }}
        >
          <div className="w-full max-w-xl animate-float-up overflow-hidden" style={{ background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: '1px solid rgba(255,255,255,0.95)', borderRadius: '1.75rem', boxShadow: '0 25px 80px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,1)' }}>
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-5 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-base">Edit Session</h3>
                <p className="text-xs text-emerald-200/70 mt-0.5">{editingReport.quran_circles?.name}</p>
              </div>
              <button onClick={() => setEditingReport(null)} className="p-2 hover:bg-white/15 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={editingReport.session_date} onChange={(e) => setEditingReport({...editingReport, session_date: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Circle</label>
                  <div className="relative">
                    <select className="form-input pr-8" value={editingReport.circle_id} onChange={(e) => setEditingReport({...editingReport, circle_id: e.target.value})}>
                      {circles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="form-label">Topic</label>
                <div className="relative">
                  <select className="form-input pr-8" value={editingReport.topic_id || ""} onChange={(e) => setEditingReport({...editingReport, topic_id: e.target.value})}>
                    <option value="">No Topic</option>
                    {topics.map(t => <option key={t.id} value={t.id}>Topic {t.topic_number}: {t.title}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="form-label">Location</label>
                <input type="text" className="form-input" placeholder="e.g. Masjid, Residence..." value={editingReport.location || ""} onChange={(e) => setEditingReport({...editingReport, location: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea className="form-input h-24 resize-none" placeholder="Session notes..." value={editingReport.notes || ""} onChange={(e) => setEditingReport({...editingReport, notes: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingReport(null)} className="btn btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
                <button onClick={handleUpdateReport} className="btn btn-primary flex-[2] py-2.5 text-sm">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
