"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Search, Save, Loader2, Plus, X,
  Calendar, MapPin, ChevronDown, Users, Sparkles, History, ChevronRight,
  FileText, UserCheck, CalendarDays, Edit2, Trash2, LogOut, ExternalLink,
  CheckCircle, XCircle
} from "lucide-react";
import { getTafheemLink } from "@/lib/quran_utils";

export default function AttendancePage() {
  const router = useRouter();
  const [selectedUC, setSelectedUC] = useState("");
  const [selectedCircle, setSelectedCircle] = useState("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState("quran_circle");
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonth = months[new Date().getMonth()];
  const [attendanceMonth, setAttendanceMonth] = useState(currentMonth);
  const [topic, setTopic] = useState("");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [ucs, setUcs] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAddingAttendee, setIsAddingAttendee] = useState(false);
  const [newAttendee, setNewAttendee] = useState({ full_name: "", phone: "", remarks: "", type: "aam_afraad" });

  // History & Old Attendances state
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [loadingCircleData, setLoadingCircleData] = useState(false);
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");

  // Editing state for Old Attendances
  const [editingSession, setEditingSession] = useState<any | null>(null);
  const [editingAttendance, setEditingAttendance] = useState<{ [participantId: string]: string }>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [isAddingEditAttendee, setIsAddingEditAttendee] = useState(false);
  const [newEditAttendee, setNewEditAttendee] = useState({ full_name: "", phone: "", remarks: "", type: "aam_afraad" });
  const [addingEditAttendee, setAddingEditAttendee] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      const { data: ucData } = await supabase.from('union_councils').select('*').order('name');
      const { data: circleData } = await supabase.from('quran_circles').select('*, murabbi_name').order('name');
      const { data: syllabusData } = await supabase.from('syllabus_topics').select('*').order('topic_number');
      setUcs(ucData || []); setCircles(circleData || []); setSyllabus(syllabusData || []);
      setLoading(false);
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadCircleData() {
      if (category === 'ijtima_arkan') {
        if (!selectedUC) {
          setParticipants([]);
          setPastSessions([]);
          setExpandedSessionId(null);
          setEditingSession(null);
          return;
        }
        setLoadingCircleData(true);
        const currentUcCircles = circles.filter(c => c.uc_id === selectedUC).map(c => c.id);
        if (currentUcCircles.length > 0) {
          const { data: pData } = await supabase
            .from('participants')
            .select('*')
            .in('circle_id', currentUcCircles)
            .eq('type', 'haazir_arkan')
            .order('full_name');
          setParticipants((pData || []).map(p => ({ ...p, status: 'absent' })));
        } else {
          setParticipants([]);
        }

        const { data: sData } = await supabase
          .from('sessions')
          .select(`
            id, session_date, category, location, notes, circle_id, uc_id, topic_id, created_at,
            syllabus_topics (id, title, topic_number, reference),
            attendance ( status, participant_id, participants (id, full_name, type) )
          `)
          .eq('uc_id', selectedUC)
          .eq('category', 'ijtima_arkan')
          .order('session_date', { ascending: false });
        setPastSessions(sData || []);
        setLoadingCircleData(false);
      } else {
        if (!selectedCircle) {
          setParticipants([]);
          setPastSessions([]);
          setExpandedSessionId(null);
          setEditingSession(null);
          return;
        }
        setLoadingCircleData(true);
        const { data: pData } = await supabase
          .from('participants')
          .select('*')
          .eq('circle_id', selectedCircle)
          .order('full_name');
        setParticipants((pData || []).map(p => ({ ...p, status: 'absent' })));

        const { data: sData } = await supabase
          .from('sessions')
          .select(`
            id, session_date, category, location, notes, circle_id, uc_id, topic_id, created_at,
            syllabus_topics (id, title, topic_number, reference),
            attendance ( status, participant_id, participants (id, full_name, type) )
          `)
          .eq('circle_id', selectedCircle)
          .neq('category', 'ijtima_arkan')
          .order('session_date', { ascending: false });
        setPastSessions(sData || []);
        setLoadingCircleData(false);
      }
    }
    loadCircleData();
  }, [selectedCircle, selectedUC, category, circles]);

  const currentCircles = circles.filter(c => c.uc_id === selectedUC);
  const activeCircle = circles.find(c => c.id === selectedCircle);
  const filteredParticipants = participants.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(search.toLowerCase());
    if (category === 'ijtima_arkan') {
      return matchesSearch && p.type === 'haazir_arkan';
    }
    return matchesSearch;
  });
  const presentCount = filteredParticipants.filter(p => p.status === 'present').length;

  const filteredPastSessions = pastSessions.filter(s => {
    const query = historySearch.toLowerCase();
    const dateStr = s.session_date ? s.session_date.toString() : "";
    const topicTitle = s.syllabus_topics?.title ? s.syllabus_topics.title.toLowerCase() : "";
    const loc = s.location ? s.location.toLowerCase() : "";
    const notesStr = s.notes ? s.notes.toLowerCase() : "";
    const attendeeNames = (s.attendance || []).map((a: any) => a.participants?.full_name?.toLowerCase() || "").join(" ");

    const matchesSearch = dateStr.includes(query) || topicTitle.includes(query) || loc.includes(query) || notesStr.includes(query) || attendeeNames.includes(query);

    if (category === 'ijtima_arkan') {
      return matchesSearch && s.category === 'ijtima_arkan';
    } else {
      return matchesSearch && s.category !== 'ijtima_arkan';
    }
  });

  const toggleAttendance = (id: string, newStatus?: string) => {
    setParticipants(participants.map(p => {
      if (p.id === id) {
        if (newStatus) return { ...p, status: newStatus };
        return { ...p, status: p.status === 'present' ? 'absent' : 'present' };
      }
      return p;
    }));
  };

  async function refreshPastSessions() {
    if (category === 'ijtima_arkan') {
      if (!selectedUC) return;
      const { data: sData } = await supabase
        .from('sessions')
        .select(`
          id, session_date, category, location, notes, circle_id, uc_id, topic_id, created_at,
          syllabus_topics (id, title, topic_number, reference),
          attendance ( status, participant_id, participants (id, full_name, type) )
        `)
        .eq('uc_id', selectedUC)
        .eq('category', 'ijtima_arkan')
        .order('session_date', { ascending: false });
      setPastSessions(sData || []);
    } else {
      if (!selectedCircle) return;
      const { data: sData } = await supabase
        .from('sessions')
        .select(`
          id, session_date, category, location, notes, circle_id, uc_id, topic_id, created_at,
          syllabus_topics (id, title, topic_number, reference),
          attendance ( status, participant_id, participants (id, full_name, type) )
        `)
        .eq('circle_id', selectedCircle)
        .neq('category', 'ijtima_arkan')
        .order('session_date', { ascending: false });
      setPastSessions(sData || []);
    }
  }

  async function handleSubmit() {
    if (category === 'ijtima_arkan' ? !selectedUC : !selectedCircle) { alert("Please select required fields."); return; }
    if (!sessionDate) { alert("Please select a date."); return; }
    setSubmitting(true);
    try {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          session_date: sessionDate,
          category, location, notes,
          circle_id: category === 'ijtima_arkan' ? null : selectedCircle,
          uc_id: selectedUC,
          topic_id: topic || null,
          attendance_month: category === 'ijtima_arkan' ? attendanceMonth : null
        })
        .select().single();
      if (sessionError) throw sessionError;
      const attendanceRecords = participants.map(p => ({ session_id: session.id, participant_id: p.id, status: p.status }));
      if (attendanceRecords.length > 0) {
        const { error: attError } = await supabase.from('attendance').insert(attendanceRecords);
        if (attError) throw attError;
      }
      alert("Session submitted successfully.");
      setTopic(""); setLocation(""); setNotes("");
      setParticipants(participants.map(p => ({ ...p, status: 'absent' })));
      await refreshPastSessions();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally { setSubmitting(false); }
  }

  async function handleAddAttendee() {
    if (!newAttendee.full_name) { alert("Please enter a name."); return; }
    try {
      const { data, error } = await supabase.from('participants')
        .insert({ full_name: newAttendee.full_name, phone: newAttendee.phone, remarks: newAttendee.remarks, type: newAttendee.type, circle_id: selectedCircle, is_active: true })
        .select().single();
      if (error) throw error;
      setParticipants([...participants, { ...data, status: 'present' }]);
      setIsAddingAttendee(false);
      setNewAttendee({ full_name: "", phone: "", remarks: "", type: "aam_afraad" });
    } catch (e: any) { alert("Error adding attendee: " + e.message); }
  }

  // Quick 1-click toggle for past attendance in expanded details
  async function togglePastAttendance(sessionId: string, participantId: string, currentStatus: string) {
    try {
      const nextStatus = currentStatus === 'present' ? 'absent' : (currentStatus === 'absent' && category === 'ijtima_arkan' ? 'leave' : (currentStatus === 'leave' ? 'present' : 'present'));
      const { error } = await supabase
        .from('attendance')
        .upsert({ session_id: sessionId, participant_id: participantId, status: nextStatus }, { onConflict: 'session_id,participant_id' });
      if (error) throw error;
      await refreshPastSessions();
    } catch (err: any) {
      alert("Error updating attendance: " + err.message);
    }
  }

  // Open Edit Modal for a past session report
  function startEditingSession(session: any) {
    setEditingSession({
      ...session,
      session_date: session.session_date ? session.session_date.split('T')[0] : "",
      topic_id: session.topic_id || "",
      category: session.category || "quran_circle",
      location: session.location || "",
      notes: session.notes || ""
    });

    const attMap: { [key: string]: string } = {};
    participants.forEach(p => { attMap[p.id] = 'absent'; });
    (session.attendance || []).forEach((a: any) => {
      if (a.participant_id) attMap[a.participant_id] = a.status;
    });

    setEditingAttendance(attMap);
  }

  // Save changes from Edit Modal
  async function handleSaveEditedSession() {
    if (!editingSession || !editingSession.id) return;
    setSavingEdit(true);
    try {
      const { error: sessionErr } = await supabase
        .from('sessions')
        .update({
          session_date: editingSession.session_date,
          category: editingSession.category,
          topic_id: editingSession.topic_id || null,
          location: editingSession.location,
          notes: editingSession.notes
        })
        .eq('id', editingSession.id);

      if (sessionErr) throw sessionErr;

      const attendanceRecords = Object.entries(editingAttendance).map(([participant_id, status]) => ({
        session_id: editingSession.id,
        participant_id,
        status
      }));

      if (attendanceRecords.length > 0) {
        const { error: attErr } = await supabase
          .from('attendance')
          .upsert(attendanceRecords, { onConflict: 'session_id,participant_id' });
        if (attErr) throw attErr;
      }

      setEditingSession(null);
      await refreshPastSessions();
      alert("Old attendance report updated successfully!");
    } catch (err: any) {
      alert("Error updating report: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  // Delete past session
  async function handleDeleteSession(sessionId: string) {
    if (!confirm("Are you sure you want to delete this past session report and its attendance records?")) return;
    try {
      const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
      if (error) throw error;
      await refreshPastSessions();
    } catch (err: any) {
      alert("Error deleting session: " + err.message);
    }
  }

  // Add new participant inside Edit Modal
  async function handleAddAttendeeInEditModal() {
    if (!newEditAttendee.full_name.trim()) { alert("Please enter a participant name."); return; }
    const circleId = editingSession?.circle_id || selectedCircle;
    if (!circleId) return;

    setAddingEditAttendee(true);
    try {
      const { data, error } = await supabase.from('participants')
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

      setParticipants(prev => [...prev, data]);
      setEditingAttendance(prev => ({ ...prev, [data.id]: 'present' }));
      setIsAddingEditAttendee(false);
      setNewEditAttendee({ full_name: "", phone: "", remarks: "", type: "aam_afraad" });
    } catch (err: any) {
      alert("Error adding attendee: " + err.message);
    } finally {
      setAddingEditAttendee(false);
    }
  }

  // Calculate stats for old attendances
  const totalPastSessions = pastSessions.length;
  const avgAttendancePct = totalPastSessions > 0
    ? Math.round(
      (pastSessions.reduce((acc, s) => {
        const present = (s.attendance || []).filter((a: any) => a.status === 'present').length;
        const total = (s.attendance || []).length;
        return acc + (total > 0 ? present / total : 0);
      }, 0) / totalPastSessions) * 100
    )
    : 0;

  return (
    <div className="min-h-screen pb-28" style={{
      background: 'radial-gradient(ellipse 70% 50% at 15% 10%, rgba(16,185,129,0.10) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 85% 90%, rgba(99,102,241,0.07) 0%, transparent 55%), linear-gradient(135deg, #eef2ff 0%, #f0fdf4 40%, #f0f9ff 100%)'
    }}>
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 md:px-6 lg:px-8 pt-8 pb-10 shadow-xl" style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 35%, #0f766e 70%, #134e4a 100%)',
        borderRadius: '0 0 2rem 2rem',
        boxShadow: '0 8px 32px rgba(6,78,59,0.25)'
      }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute -top-16 right-0 w-80 h-80 bg-white/4 rounded-full blur-[60px]" />
          <div className="absolute -bottom-12 -left-12 w-60 h-60 bg-teal-400/10 rounded-full blur-[50px]" />
        </div>
        <div className="relative z-10 flex justify-between items-center max-w-5xl mx-auto">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(110,231,183,0.7)' }}>Attendance Portal</p>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight pr-4">
              {category === 'ijtima_arkan' ? (ucs.find(u => u.id === selectedUC)?.name || 'Mark Attendance') : (activeCircle ? activeCircle.name : 'Mark Attendance')}
            </h1>
            {activeCircle?.murabbi_name && (
              <p className="text-sm font-medium mt-1" style={{ color: 'rgba(110,231,183,0.6)' }}>
                Murabbi: <span style={{ color: 'rgba(167,243,208,0.9)' }}>{activeCircle.murabbi_name}</span>
              </p>
            )}
          </div>
          <button onClick={() => router.push('/')} className="p-2.5 rounded-2xl border border-white/15 active:scale-90 transition-all hover:bg-white/15 flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)' }}>
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 pt-6 space-y-5 max-w-5xl mx-auto animate-fade-in">
        {/* Circle Selection */}
        <div className="card p-5 md:p-6">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Search className="w-3 h-3 text-white" />
            </div>
            Select Circle
          </h2>
          {loading ? (
            <div className="flex items-center gap-2.5 text-emerald-600 py-4 font-medium text-sm">
              <Loader2 className="animate-spin w-4 h-4" /> Loading data...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Category</label>
                <div className="relative">
                  <select className="form-input pr-10" value={category} onChange={(e) => { setCategory(e.target.value); if (e.target.value === 'ijtima_arkan') setSelectedCircle(""); }}>
                    <option value="quran_circle">Quran Circle</option>
                    <option value="ijtima_arkan">Ijtima Arkan</option>
                    <option value="dars_e_quran">Dars-e-Quran</option>
                    <option value="other">Other</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="form-label">Union Council</label>
                <div className="relative">
                  <select className="form-input pr-10" value={selectedUC} onChange={(e) => { setSelectedUC(e.target.value); setSelectedCircle(""); }}>
                    <option value="">— Select UC —</option>
                    {ucs.map(uc => <option key={uc.id} value={uc.id}>{uc.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              {category !== 'ijtima_arkan' && (
                <div>
                  <label className="form-label">Quran Circle</label>
                  <div className="relative">
                    <select className="form-input pr-10" value={selectedCircle} onChange={(e) => setSelectedCircle(e.target.value)} disabled={!selectedUC}>
                      <option value="">— Select Circle —</option>
                      {currentCircles.map(c => <option key={c.id} value={c.id}>{c.name}{c.murabbi_name ? ` (${c.murabbi_name})` : ''}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedCircle || (category === 'ijtima_arkan' && selectedUC) ? (
          <div>
            {/* View Switcher Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 mb-5 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('new')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all cursor-pointer ${activeTab === 'new'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-white/80 text-slate-600 hover:bg-white hover:text-emerald-700'
                  }`}
              >
                <Plus className="w-4 h-4" />
                Mark New Attendance
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all cursor-pointer relative ${activeTab === 'history'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-white/80 text-slate-600 hover:bg-white hover:text-emerald-700'
                  }`}
              >
                <History className="w-4 h-4" />
                Old Attendances
                {pastSessions.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                    {pastSessions.length}
                  </span>
                )}
              </button>
            </div>

            {loadingCircleData ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-emerald-600 card">
                <Loader2 className="animate-spin w-6 h-6" />
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading circle details & history...</p>
              </div>
            ) : activeTab === 'new' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Session Details */}
                  <div className="card p-5 md:p-6 space-y-5">
                    <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Calendar className="w-3 h-3 text-white" />
                      </div>
                      Session Details
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Date</label>
                        <input type="date" className="form-input" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
                      </div>
                      {category === 'ijtima_arkan' && (
                        <div>
                          <label className="form-label">Ijtima Month</label>
                          <div className="relative">
                            <select className="form-input pr-10" value={attendanceMonth} onChange={(e) => setAttendanceMonth(e.target.value)}>
                              {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                      )}
                    </div>

                    {category !== "ijtima_arkan" && (
                      <div>
                        <label className="form-label">Topic Covered</label>
                        <div className="relative">
                          <select className="form-input pr-8" value={topic} onChange={(e) => setTopic(e.target.value)}>
                            <option value="">— Select topic (optional) —</option>
                            {syllabus.map(t => <option key={t.id} value={t.id}>Topic {t.topic_number}: {t.title}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                        {topic && (() => {
                          const topicRef = syllabus.find(t => t.id === topic)?.reference;
                          const link = getTafheemLink(topicRef);
                          return topicRef ? (
                            <div className="mt-3 flex items-center justify-between px-4 py-3 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(236,253,245,0.9), rgba(204,251,241,0.7))', border: '1px solid rgba(167,243,208,0.5)' }}>
                              <span className="text-xs text-emerald-700 font-bold">Ref: {topicRef}</span>
                              {link && (
                                <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 font-bold flex items-center gap-1 hover:text-emerald-800 transition-colors">
                                  Tafheem <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}

                    <div>
                      <label className="form-label"><MapPin className="w-3 h-3 inline mr-1" />Location</label>
                      <input type="text" placeholder="e.g. Masjid, Residence..." className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>

                    <div>
                      <label className="form-label">Notes</label>
                      <textarea placeholder="Discussion details, observations..." className="form-input h-28 resize-none leading-relaxed" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                  </div>

                  {/* Attendance Marking */}
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between px-1">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">Attendance Checklist</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Tap to mark present</p>
                      </div>
                      <div className="pill-container px-3.5 py-2 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-700">{presentCount} / {filteredParticipants.length}</span>
                      </div>
                    </div>

                    {/* Search + Add */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input type="text" placeholder="Search participants..." className="form-input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      </div>
                      <button onClick={() => setIsAddingAttendee(true)} className="btn btn-primary px-3.5 flex-shrink-0" title="Add participant">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Add Attendee Form */}
                    {isAddingAttendee && (
                      <div className="card p-5 animate-float-up space-y-3" style={{ background: 'linear-gradient(135deg, rgba(236,253,245,0.9), rgba(204,251,241,0.7))', border: '1px solid rgba(167,243,208,0.5)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Add Participant
                          </h3>
                          <button onClick={() => setIsAddingAttendee(false)} className="p-1 hover:bg-white/60 rounded-lg transition-colors text-slate-400">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input type="text" placeholder="Full Name *" className="form-input" value={newAttendee.full_name} onChange={(e) => setNewAttendee({ ...newAttendee, full_name: e.target.value })} />
                        <input type="text" placeholder="Phone (optional)" className="form-input" value={newAttendee.phone} onChange={(e) => setNewAttendee({ ...newAttendee, phone: e.target.value })} />

                        <div className="flex gap-2 pt-1">
                          <button onClick={() => setIsAddingAttendee(false)} className="btn btn-secondary flex-1 text-xs py-2">Cancel</button>
                          <button onClick={handleAddAttendee} className="btn btn-primary flex-1 text-xs py-2">Add & Mark Present</button>
                        </div>
                      </div>
                    )}

                    {/* Participant Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2.5 pb-4">
                      {filteredParticipants.map((p) => {
                        const isPresent = p.status === 'present';
                        const isLeave = p.status === 'leave';
                        const isAbsent = p.status === 'absent';
                        return category === 'ijtima_arkan' ? (
                          <div key={p.id} className="w-full flex flex-col items-start justify-between p-3.5 rounded-2xl border-2 transition-all duration-200 bg-white/70 backdrop-blur-md border-white shadow-sm gap-2.5">
                            <div className="flex-1 min-w-0 w-full">
                              <p className="font-bold text-sm leading-tight truncate text-slate-800">{p.full_name}</p>
                              <p className="text-xs mt-0.5 capitalize font-medium text-slate-500">{p.type?.replace('_', ' ')}</p>
                            </div>
                            <div className="flex items-center gap-1.5 w-full">
                              <button onClick={() => toggleAttendance(p.id, 'present')} className={`flex-1 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${isPresent ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Present</button>
                              <button onClick={() => toggleAttendance(p.id, 'leave')} className={`flex-1 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${isLeave ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Leave</button>
                              <button onClick={() => toggleAttendance(p.id, 'absent')} className={`flex-1 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${isAbsent ? 'bg-red-500 text-white shadow-md shadow-red-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Absent</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => toggleAttendance(p.id)}
                            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left active:scale-97 ${isPresent
                              ? 'border-emerald-300'
                              : 'border-transparent hover:border-white'
                              }`}
                            style={isPresent ? {
                              background: 'linear-gradient(135deg, rgba(236,253,245,0.95), rgba(204,251,241,0.85))',
                              boxShadow: '0 4px 16px rgba(5,150,105,0.12), inset 0 1px 0 rgba(255,255,255,0.8)'
                            } : {
                              background: 'rgba(255,255,255,0.70)',
                              backdropFilter: 'blur(12px)',
                              border: '1px solid rgba(255,255,255,0.85)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)'
                            }}
                          >
                            <div className="flex-1 min-w-0 pr-3">
                              <p className={`font-bold text-sm leading-tight truncate ${isPresent ? 'text-emerald-900' : 'text-slate-700'}`}>{p.full_name}</p>
                              <p className={`text-xs mt-0.5 capitalize font-medium ${isPresent ? 'text-emerald-600' : 'text-slate-400'}`}>{p.type?.replace('_', ' ')}</p>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${isPresent
                              ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-200'
                              : 'text-slate-300'
                              }`} style={!isPresent ? { background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(226,232,240,0.8)' } : {}}>
                              <CheckCircle2 className="w-4.5 h-4.5" />
                            </div>
                          </button>
                        );
                      })}
                      {filteredParticipants.length === 0 && (
                        <div className="col-span-full text-center py-12 rounded-3xl border-2 border-dashed" style={{ borderColor: 'rgba(226,232,240,0.6)', background: 'rgba(255,255,255,0.4)' }}>
                          <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-slate-400">No participants found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Old Attendances Section Preview */}
                <div className="card p-5 md:p-6 mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-100">
                        <History className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800">Old Attendances ({pastSessions.length})</h3>
                        <p className="text-xs text-slate-400">Recorded sessions history for {activeCircle?.name}</p>
                      </div>
                    </div>
                    {pastSessions.length > 0 && (
                      <button
                        onClick={() => setActiveTab('history')}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors"
                      >
                        View All <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {pastSessions.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-white/40">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-500">No old attendances recorded for this circle yet</p>
                      <p className="text-xs text-slate-400 mt-1">Submit your first report above to start building session history.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pastSessions.slice(0, 3).map((session) => {
                        const presentAtt = (session.attendance || []).filter((a: any) => a.status === 'present');
                        const totalAtt = (session.attendance || []).length;
                        const isExpanded = expandedSessionId === session.id;

                        return (
                          <div key={session.id} className="border border-slate-200/80 rounded-2xl p-4 bg-white/70 hover:bg-white transition-all shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                    <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                                    {new Date(session.session_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                  <span className="badge badge-emerald capitalize">{session.category?.replace('_', ' ')}</span>
                                </div>

                                {session.category !== "ijtima_arkan" && (
                                  session.syllabus_topics ? (
                                    <p className="text-sm font-bold text-slate-800 mt-1">
                                      Topic #{session.syllabus_topics.topic_number}: {session.syllabus_topics.title}
                                    </p>
                                  ) : (
                                    <p className="text-sm font-semibold text-slate-500 italic mt-1">General Circle Session</p>
                                  )
                                )}

                                {session.location && (
                                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {session.location}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => startEditingSession(session)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    title="Edit Session & Attendance"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSession(session.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Delete Session"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <span className="badge badge-emerald">
                                  {presentAtt.length} / {totalAtt} Present
                                </span>
                                <button
                                  onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-emerald-50 transition-colors"
                                >
                                  {isExpanded ? "Hide Attendees" : "View Attendees"}
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              </div>
                            </div>

                            {/* Expandable attendee list with 1-click toggle editing */}
                            {isExpanded && (
                              <div className="mt-4 pt-3 border-t border-slate-100 animate-fade-in space-y-2">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                  <span>Tap any participant to toggle attendance status</span>
                                </p>
                                {session.notes && (
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-3 text-xs text-slate-600">
                                    <span className="font-bold text-slate-500 block mb-0.5">Notes:</span>
                                    {session.notes}
                                  </div>
                                )}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                  {(session.attendance || []).map((att: any) => (
                                    <button
                                      key={att.participant_id}
                                      onClick={() => togglePastAttendance(session.id, att.participant_id, att.status)}
                                      className={`p-2 rounded-xl text-xs flex items-center justify-between border cursor-pointer transition-all active:scale-97 text-left ${att.status
                                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 font-bold hover:bg-emerald-100'
                                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                                        }`}
                                      title="Click to toggle attendance status"
                                    >
                                      <span className="truncate pr-1">{att.participants?.full_name || 'Participant'}</span>
                                      {att.status ? (
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                      ) : (
                                        <XCircle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Dedicated History Tab View */
              <div className="space-y-6 animate-fade-in">
                {/* Stats Header Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Sessions</p>
                      <p className="text-xl font-extrabold text-slate-800">{totalPastSessions}</p>
                    </div>
                  </div>

                  <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Avg Attendance</p>
                      <p className="text-xl font-extrabold text-slate-800">{avgAttendancePct}%</p>
                    </div>
                  </div>

                  <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Roster Members</p>
                      <p className="text-xl font-extrabold text-slate-800">{participants.length}</p>
                    </div>
                  </div>
                </div>

                {/* History Search & Filter */}
                <div className="card p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-600" /> Past Attendance Records
                    </h2>
                    <div className="relative max-w-sm w-full">
                      <input
                        type="text"
                        placeholder="Search by date, topic, location, attendee..."
                        className="form-input pl-9 text-xs"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                    </div>
                  </div>

                  {filteredPastSessions.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white/40">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-base font-bold text-slate-600">No matching old attendances</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        {historySearch ? 'Try a different search term.' : 'No previous session reports found for this circle yet.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {filteredPastSessions.map((session) => {
                        const presentAtt = (session.attendance || []).filter((a: any) => a.status === 'present');
                        const absentAtt = (session.attendance || []).filter((a: any) => a.status === 'absent');
                        const totalAtt = (session.attendance || []).length;
                        const isExpanded = expandedSessionId === session.id;

                        return (
                          <div key={session.id} className="border border-slate-200/90 rounded-2xl p-4 md:p-5 bg-white/80 hover:bg-white transition-all shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                                    <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                                    {new Date(session.session_date).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                  <span className="badge badge-emerald capitalize">{session.category?.replace('_', ' ')}</span>
                                  {session.location && (
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-slate-400" /> {session.location}
                                    </span>
                                  )}
                                </div>

                                {session.category !== "ijtima_arkan" && (
                                  session.syllabus_topics ? (
                                    <div>
                                      <p className="text-base font-bold text-slate-900 mt-1">
                                        Topic #{session.syllabus_topics.topic_number}: {session.syllabus_topics.title}
                                      </p>
                                      {session.syllabus_topics.reference && (
                                        <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                                          Ref: {session.syllabus_topics.reference}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-sm font-semibold text-slate-500 italic mt-1">General Circle Session</p>
                                  )
                                )}
                              </div>

                              <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                                <div className="pill-container px-3 py-1 text-xs font-bold text-emerald-800">
                                  {presentAtt.length} / {totalAtt} Present ({totalAtt > 0 ? Math.round((presentAtt.length / totalAtt) * 100) : 0}%)
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => startEditingSession(session)}
                                    className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-slate-200/80 bg-white"
                                    title="Edit Session & Attendance"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSession(session.id)}
                                    className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-slate-200/80 bg-white"
                                    title="Delete Session"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                                    className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1"
                                  >
                                    {isExpanded ? "Hide Details" : "View Attendance"}
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Detailed Breakdown with 1-click attendance toggle */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in space-y-4">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  Tap any participant card to toggle their attendance status for this session:
                                </p>

                                {session.notes && (
                                  <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900">
                                    <span className="font-bold text-amber-800 block mb-1">Session Notes & Observations:</span>
                                    {session.notes}
                                  </div>
                                )}

                                <div>
                                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Present Participants ({presentAtt.length})
                                  </h4>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {presentAtt.map((att: any) => (
                                      <button
                                        key={att.participant_id}
                                        onClick={() => togglePastAttendance(session.id, att.participant_id, att.status)}
                                        className="p-2.5 rounded-xl text-xs bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold flex items-center justify-between hover:bg-emerald-100 cursor-pointer transition-all active:scale-97 text-left"
                                        title="Click to mark absent"
                                      >
                                        <span className="truncate pr-1">{att.participants?.full_name || 'Participant'}</span>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                      </button>
                                    ))}
                                    {presentAtt.length === 0 && (
                                      <p className="text-xs text-slate-400 italic col-span-full">No participants marked present</p>
                                    )}
                                  </div>
                                </div>

                                {absentAtt.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                      <XCircle className="w-3.5 h-3.5 text-slate-400" /> Absent Participants ({absentAtt.length})
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                      {absentAtt.map((att: any) => (
                                        <button
                                          key={att.participant_id}
                                          onClick={() => togglePastAttendance(session.id, att.participant_id, att.status)}
                                          className="p-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-400 font-medium flex items-center justify-between line-through hover:border-emerald-300 hover:text-emerald-700 hover:no-underline cursor-pointer transition-all active:scale-97 text-left"
                                          title="Click to mark present"
                                        >
                                          <span className="truncate pr-1">{att.participants?.full_name || 'Participant'}</span>
                                          <XCircle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 rounded-3xl border-2 border-dashed animate-float-up" style={{ borderColor: 'rgba(167,243,208,0.4)', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)' }}>
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg"
              style={{ background: 'linear-gradient(135deg, rgba(236,253,245,0.9), rgba(204,251,241,0.8))', border: '1px solid rgba(167,243,208,0.5)' }}>
              <Search className="text-emerald-400 w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Select a Circle</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">Choose a Union Council and circle above to view old attendances and mark new attendance.</p>
          </div>
        )}
      </div>

      {/* Fixed Submit Bar (only active when on 'new' tab and circle selected) */}
      {(selectedCircle || (category === 'ijtima_arkan' && selectedUC)) && activeTab === 'new' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50" style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 -4px 24px rgba(0,0,0,0.06)' }}>
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-700">{activeCircle?.name}</p>
              <p className="text-[11px] text-emerald-600 font-semibold">{presentCount} of {filteredParticipants.length} present</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={(category === 'ijtima_arkan' ? !selectedUC : !selectedCircle) || submitting}
              className="btn btn-primary w-full sm:w-auto px-8 py-3.5 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Save className="w-4 h-4" /> Submit Session Report</>}
            </button>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingSession(null); }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-float-up rounded-3xl shadow-2xl"
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.95)'
            }}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-5 flex items-center justify-between text-white sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-emerald-400" /> Edit Past Attendance Report
                </h3>
                <p className="text-xs text-emerald-200/70 mt-0.5">{activeCircle?.name}</p>
              </div>
              <button onClick={() => setEditingSession(null)} className="p-2 hover:bg-white/15 rounded-xl transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Session Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editingSession.session_date}
                    onChange={(e) => setEditingSession({ ...editingSession, session_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <div className="relative">
                    <select
                      className="form-input pr-8"
                      value={editingSession.category}
                      onChange={(e) => setEditingSession({ ...editingSession, category: e.target.value })}
                    >
                      <option value="quran_circle">Quran Circle</option>
                      <option value="ijtima_arkan">Ijtima Arkan</option>
                      <option value="dars_e_quran">Dars-e-Quran</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {editingSession.category !== "ijtima_arkan" && (
                <div>
                  <label className="form-label">Topic Covered</label>
                  <div className="relative">
                    <select
                      className="form-input pr-8"
                      value={editingSession.topic_id || ""}
                      onChange={(e) => setEditingSession({ ...editingSession, topic_id: e.target.value })}
                    >
                      <option value="">— Select topic (optional) —</option>
                      {syllabus.map(t => <option key={t.id} value={t.id}>Topic {t.topic_number}: {t.title}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Masjid, Residence..."
                    value={editingSession.location || ""}
                    onChange={(e) => setEditingSession({ ...editingSession, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Session observations..."
                    value={editingSession.notes || ""}
                    onChange={(e) => setEditingSession({ ...editingSession, notes: e.target.value })}
                  />
                </div>
              </div>

              {/* Attendance checklist editing in modal */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <label className="form-label mb-0">Participant Attendance ({Object.values(editingAttendance).filter(Boolean).length} / {participants.length} Present)</label>
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
                        const allTrue: { [k: string]: string } = {};
                        participants.forEach(p => allTrue[p.id] = 'present');
                        setEditingAttendance(allTrue);
                      }}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800"
                    >
                      Mark All Present
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        const allFalse: { [k: string]: string } = {};
                        participants.forEach(p => allFalse[p.id] = 'absent');
                        setEditingAttendance(allFalse);
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-200/80 rounded-2xl bg-slate-50/50">
                  {participants.map((p) => {
                    const currentStatus = editingAttendance[p.id] || 'absent';
                    const isPresent = currentStatus === 'present';
                    const isLeave = currentStatus === 'leave';

                    if (editingSession.category === 'ijtima_arkan') {
                      return (
                        <div key={p.id} className="flex flex-col gap-2 p-3 rounded-xl border bg-white border-slate-200">
                          <span className="text-xs font-bold text-slate-700 truncate">{p.full_name}</span>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => setEditingAttendance({ ...editingAttendance, [p.id]: 'present' })} className={`flex-1 py-1 text-[10px] rounded-lg font-bold ${isPresent ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>P</button>
                            <button type="button" onClick={() => setEditingAttendance({ ...editingAttendance, [p.id]: 'leave' })} className={`flex-1 py-1 text-[10px] rounded-lg font-bold ${isLeave ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>L</button>
                            <button type="button" onClick={() => setEditingAttendance({ ...editingAttendance, [p.id]: 'absent' })} className={`flex-1 py-1 text-[10px] rounded-lg font-bold ${currentStatus === 'absent' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'}`}>A</button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setEditingAttendance({ ...editingAttendance, [p.id]: isPresent ? 'absent' : 'present' })}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left ${isPresent
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                          }`}
                      >
                        <span className="truncate pr-2">{p.full_name}</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isPresent ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          {isPresent ? '✓' : ''}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setEditingSession(null)}
                  className="btn btn-secondary flex-1 py-3 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditedSession}
                  disabled={savingEdit}
                  className="btn btn-primary flex-[2] py-3 text-sm font-bold"
                >
                  {savingEdit ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


