"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ClipboardList, Search, Edit2, Trash2, MapPin, Users, X, Save, Loader2, ChevronRight, ChevronDown, Plus, Sparkles } from "lucide-react";
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

  // Edit modal attendee state
  const [editModalParticipants, setEditModalParticipants] = useState<any[]>([]);
  const [editAttendanceMap, setEditAttendanceMap] = useState<{ [participantId: string]: boolean }>({});
  const [loadingModalParticipants, setLoadingModalParticipants] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [isAddingEditAttendee, setIsAddingEditAttendee] = useState(false);
  const [newEditAttendee, setNewEditAttendee] = useState({ full_name: "", phone: "", remarks: "", type: "aam_afraad" });
  const [addingEditAttendee, setAddingEditAttendee] = useState(false);

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

  async function loadParticipantsForModal(circleId: string, sessionId: string) {
    if (!circleId) {
      setEditModalParticipants([]);
      setEditAttendanceMap({});
      return;
    }
    setLoadingModalParticipants(true);
    
    // Fetch participants of the circle
    const { data: pData } = await supabase
      .from("participants")
      .select("id, full_name, type")
      .eq("circle_id", circleId)
      .order("full_name");
      
    setEditModalParticipants(pData || []);

    // Fetch existing attendance records for this session
    const { data: attData } = await supabase
      .from("attendance")
      .select("participant_id, status")
      .eq("session_id", sessionId);

    const map: { [key: string]: boolean } = {};
    (pData || []).forEach(p => {
      map[p.id] = false;
    });
    (attData || []).forEach(a => {
      if (a.participant_id) map[a.participant_id] = a.status;
    });

    setEditAttendanceMap(map);
    setLoadingModalParticipants(false);
  }

  async function handleAddAttendeeInEditModal() {
    if (!newEditAttendee.full_name.trim()) { alert("Please enter a participant name."); return; }
    const circleId = editingReport?.circle_id;
    if (!circleId) return;

    setAddingEditAttendee(true);
    try {
      const { data, error } = await supabase.from("participants")
        .insert({
          full_name: newEditAttendee.full_name.trim(),
          phone: newEditAttendee.phone,
          remarks: newEditAttendee.remarks,
          type: newEditAttendee.type,
          circle_id: circleId,
          is_active: true
        })
        .select().single();

      if (error) throw error;

      setEditModalParticipants(prev => [...prev, data]);
      setEditAttendanceMap(prev => ({ ...prev, [data.id]: true }));
      setIsAddingEditAttendee(false);
      setNewEditAttendee({ full_name: "", phone: "", remarks: "", type: "aam_afraad" });
    } catch (err: any) {
      alert("Error adding attendee: " + err.message);
    } finally {
      setAddingEditAttendee(false);
    }
  }

  async function startEditingReport(report: any) {
    setEditingReport({
      ...report,
      session_date: report.session_date ? report.session_date.split('T')[0] : "",
      topic_id: report.topic_id || "",
      location: report.location || "",
      notes: report.notes || ""
    });

    await loadParticipantsForModal(report.circle_id, report.id);
  }

  async function handleModalCircleChange(newCircleId: string) {
    setEditingReport({ ...editingReport, circle_id: newCircleId });
    if (editingReport?.id) {
      await loadParticipantsForModal(newCircleId, editingReport.id);
    }
  }

  async function handleUpdateReport() {
    if (!editingReport) return;
    setSavingEdit(true);
    try {
      const { error: sessionErr } = await supabase.from("sessions")
        .update({
          session_date: editingReport.session_date,
          location: editingReport.location,
          topic_id: editingReport.topic_id || null,
          notes: editingReport.notes,
          circle_id: editingReport.circle_id
        })
        .eq("id", editingReport.id);

      if (sessionErr) throw sessionErr;

      const attRecords = Object.entries(editAttendanceMap).map(([participant_id, status]) => ({
        session_id: editingReport.id,
        participant_id,
        status
      }));

      if (attRecords.length > 0) {
        const { error: attErr } = await supabase
          .from("attendance")
          .upsert(attRecords, { onConflict: "session_id,participant_id" });
        if (attErr) throw attErr;
      }

      setEditingReport(null);
      await fetchReports();
      if (viewingDetails === editingReport.id) {
        await fetchAttendanceDetails(editingReport.id);
      }
    } catch (err: any) {
      alert("Error updating report: " + err.message);
    } finally {
      setSavingEdit(false);
    }
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
                      <button onClick={() => startEditingReport(report)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Edit Session & Attendees"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(report.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
                {viewingDetails === report.id && (
                  <div className="mt-3 pt-3 border-t border-slate-100 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5 text-emerald-600" /> Attendance Breakdown</p>
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
                          title="View attendance details"
                        >
                          {viewingDetails === report.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <button onClick={() => startEditingReport(report)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Edit session & attendee roster">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(report.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete session">
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
                              <Users className="w-4 h-4 text-emerald-600" /> Attendance Details (Tap to toggle status)
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
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                }`}
                              >
                                <div className="min-w-0 pr-1">
                                  <p className="text-xs font-semibold truncate">{att.participants?.full_name}</p>
                                  <p className="text-xs capitalize opacity-60 mt-0.5">{att.participants?.type?.replace('_', ' ')}</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full ml-1 flex-shrink-0 flex items-center justify-center ${att.status ? 'bg-emerald-500' : 'bg-slate-200'}`}>
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

      {/* Edit Session Modal */}
      {editingReport && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingReport(null); }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-float-up overflow-hidden rounded-3xl" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: '1px solid rgba(255,255,255,0.95)', boxShadow: '0 25px 80px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,1)' }}>
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-5 flex items-center justify-between text-white sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-emerald-400" /> Edit Session & Attendee Roster
                </h3>
                <p className="text-xs text-emerald-200/70 mt-0.5">{editingReport.quran_circles?.name}</p>
              </div>
              <button onClick={() => setEditingReport(null)} className="p-2 hover:bg-white/15 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Session Date</label>
                  <input type="date" className="form-input" value={editingReport.session_date} onChange={(e) => setEditingReport({...editingReport, session_date: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Quran Circle</label>
                  <div className="relative">
                    <select className="form-input pr-8" value={editingReport.circle_id} onChange={(e) => handleModalCircleChange(e.target.value)}>
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
                    <option value="">No Topic / Custom Session</option>
                    {topics.map(t => <option key={t.id} value={t.id}>Topic {t.topic_number}: {t.title}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Location</label>
                  <input type="text" className="form-input" placeholder="e.g. Masjid, Residence..." value={editingReport.location || ""} onChange={(e) => setEditingReport({...editingReport, location: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Notes</label>
                  <input type="text" className="form-input" placeholder="Session notes..." value={editingReport.notes || ""} onChange={(e) => setEditingReport({...editingReport, notes: e.target.value})} />
                </div>
              </div>

              {/* Attendee Roster & Attendance Statuses Section */}
              <div className="space-y-3 pt-2 border-t border-slate-200/80">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <label className="form-label mb-0">
                    Attendees ({Object.values(editAttendanceMap).filter(Boolean).length} / {editModalParticipants.length} Present)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingEditAttendee(!isAddingEditAttendee)}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 bg-emerald-100/80 hover:bg-emerald-200/80 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Attendee
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        const allTrue: { [k: string]: boolean } = {};
                        editModalParticipants.forEach(p => allTrue[p.id] = true);
                        setEditAttendanceMap(allTrue);
                      }}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800"
                    >
                      Mark All Present
                    </button>
                    <span className="text-slate-300">•</span>
                    <button 
                      type="button"
                      onClick={() => {
                        const allFalse: { [k: string]: boolean } = {};
                        editModalParticipants.forEach(p => allFalse[p.id] = false);
                        setEditAttendanceMap(allFalse);
                      }}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-600"
                    >
                      Mark All Absent
                    </button>
                  </div>
                </div>

                {/* Inline form to add new attendee */}
                {isAddingEditAttendee && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 space-y-2 animate-float-up">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> New Attendee for Circle
                      </span>
                      <button type="button" onClick={() => setIsAddingEditAttendee(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder="Full Name *" 
                        className="form-input text-xs py-2" 
                        value={newEditAttendee.full_name} 
                        onChange={(e) => setNewEditAttendee({ ...newEditAttendee, full_name: e.target.value })} 
                      />
                      <input 
                        type="text" 
                        placeholder="Phone (optional)" 
                        className="form-input text-xs py-2" 
                        value={newEditAttendee.phone} 
                        onChange={(e) => setNewEditAttendee({ ...newEditAttendee, phone: e.target.value })} 
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button type="button" onClick={() => setIsAddingEditAttendee(false)} className="btn btn-secondary text-xs py-1.5 px-3">
                        Cancel
                      </button>
                      <button type="button" onClick={handleAddAttendeeInEditModal} disabled={addingEditAttendee} className="btn btn-primary text-xs py-1.5 px-3">
                        {addingEditAttendee ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add & Mark Present"}
                      </button>
                    </div>
                  </div>
                )}

                {loadingModalParticipants ? (
                  <div className="flex items-center justify-center py-6 text-emerald-600 gap-2 text-xs font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading circle attendees...
                  </div>
                ) : editModalParticipants.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No participants found in this circle.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1.5 border border-slate-200/80 rounded-2xl bg-slate-50/50">
                    {editModalParticipants.map(p => {
                      const isPresent = !!editAttendanceMap[p.id];
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setEditAttendanceMap({ ...editAttendanceMap, [p.id]: !isPresent })}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left ${
                            isPresent
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="truncate font-bold">{p.full_name}</p>
                            <p className="text-[10px] font-normal capitalize opacity-60">{p.type?.replace('_', ' ')}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isPresent ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                            {isPresent ? '✓' : ''}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingReport(null)} className="btn btn-secondary flex-1 py-3 text-sm">Cancel</button>
                <button onClick={handleUpdateReport} disabled={savingEdit} className="btn btn-primary flex-[2] py-3 text-sm font-bold">
                  {savingEdit ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Session & Attendance</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

