"use client";

import { LangToggle, URDU_MONTHS, useLangDocument, useT } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Check, ChevronRight, ExternalLink, History, Loader2, LogOut, MapPin, Search, Trash2, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { BiText, Brand, EmptyState, QuranRef, Segmented, Sheet, ThemeToggle, toast } from "@/components/ui";
import { getTafheemLink } from "@/lib/quran_utils";
import { CATEGORY_LABEL, cleanTitle, localDate } from "@/lib/data";
import { flushPending, isNetworkError, pendingReports, queueReport, sendReport } from "@/lib/offline";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come straight from Supabase joins */

// Toast instead of a blocking alert; wording decides the colour.
const notify = (m: string) => toast(m, /error|please|couldn|choose|enter/i.test(m) ? "error" : "success");

export default function AttendancePage() {
  const t = useT();
  const lang = useLangDocument();
  const [selectedUC, setSelectedUC] = useState("");
  const [selectedCircle, setSelectedCircle] = useState("");
  const [sessionDate, setSessionDate] = useState(localDate());
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
  const [topicTouched, setTopicTouched] = useState(false);
  const [thanks, setThanks] = useState<{ present: number; total: number; streak: number; place: string; offline: boolean } | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Reports saved without signal are sent as soon as the phone is back online.
  useEffect(() => {
    const trySend = async () => {
      if (!pendingReports().length) { setPendingCount(0); return; }
      const { sent, left } = await flushPending();
      setPendingCount(left);
      if (sent) toast(`${sent} saved report${sent === 1 ? "" : "s"} sent`);
    };
    trySend();
    window.addEventListener("online", trySend);
    return () => window.removeEventListener("online", trySend);
  }, []);
  const [isAddingAttendee, setIsAddingAttendee] = useState(false);
  const [newAttendee, setNewAttendee] = useState({ full_name: "", phone: "", remarks: "", type: "aam_afraad", circle_id: "" });

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
  const [newEditAttendee, setNewEditAttendee] = useState({ full_name: "", phone: "", remarks: "", type: "aam_afraad", circle_id: "" });
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
            .eq('is_active', true)
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
          .eq('is_active', true)
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

  // Suggested topic: the one the syllabus dates put on this day, otherwise the next after the last one taught.
  const suggestedTopicId = (() => {
    if (category === 'ijtima_arkan') return "";
    const dated = syllabus.find(t => t.start_date && t.end_date && t.start_date <= sessionDate && sessionDate <= t.end_date);
    if (dated) return dated.id;
    const lastTaught = pastSessions.find(s => s.syllabus_topics?.topic_number);
    return lastTaught ? syllabus.find(t => t.topic_number === lastTaught.syllabus_topics.topic_number + 1)?.id ?? "" : "";
  })();
  const effectiveTopic = topicTouched ? topic : (topic || suggestedTopicId);

  // Members ticked at the most recent report, for "Same as last time".
  const lastPresentIds = new Set((pastSessions[0]?.attendance ?? []).filter((a: any) => a.status === 'present').map((a: any) => a.participant_id));

  /** Consecutive weeks (Monday-start) up to this one with at least one report of this type. */
  function weekStreak(dates: string[]) {
    const weekOf = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split("-").map(Number); const dt = new Date(y, m - 1, d); dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7)); return localDate(dt); };
    const weeks = new Set(dates.map(weekOf));
    const cur = new Date(); cur.setHours(0, 0, 0, 0); cur.setDate(cur.getDate() - ((cur.getDay() + 6) % 7));
    let n = 0;
    while (weeks.has(localDate(cur))) { n++; cur.setDate(cur.getDate() - 7); }
    return n;
  }

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
    if (category === 'ijtima_arkan' ? !selectedUC : !selectedCircle) { toast(t("Please select required fields."), "error"); return; }
    if (!sessionDate) { toast(t("Please select a date."), "error"); return; }
    const sameDay = pastSessions.find(s => s.session_date?.slice(0, 10) === sessionDate && s.category === category);
    if (sameDay && !confirm(`A ${category.replace(/_/g, ' ')} report for ${sessionDate} already exists. Save another one anyway?\n\nTo change the existing report, press Cancel and edit it under History.`)) return;
    const session = {
      session_date: sessionDate, category, location, notes,
      circle_id: category === 'ijtima_arkan' ? null : selectedCircle,
      uc_id: selectedUC,
      topic_id: effectiveTopic || null,
      attendance_month: category === 'ijtima_arkan' ? attendanceMonth : null,
    };
    const records = participants.map(p => ({ participant_id: p.id, status: p.status }));
    const present = records.filter(r => r.status === 'present').length;
    const place = category === 'ijtima_arkan' ? (ucs.find(u => u.id === selectedUC)?.name ?? "") : (activeCircle?.name ?? "");
    const streak = weekStreak([...pastSessions.filter(s => s.category === category).map(s => s.session_date), sessionDate]);
    const reset = () => {
      setTopic(""); setTopicTouched(false); setLocation(""); setNotes("");
      setParticipants(participants.map(p => ({ ...p, status: 'absent' })));
    };
    setSubmitting(true);
    try {
      await sendReport(session, records);
      setThanks({ present, total: records.length, streak, place, offline: false });
      reset();
      await refreshPastSessions();
    } catch (e: any) {
      if (isNetworkError(e)) {
        // No signal: keep the report on this phone and send it automatically later.
        queueReport(`${place} · ${sessionDate}`, session, records);
        setPendingCount(pendingReports().length);
        setThanks({ present, total: records.length, streak, place, offline: true });
        reset();
      } else {
        toast(`${t("Couldn’t save")}: ${e.message}`, "error");
      }
    } finally { setSubmitting(false); }
  }

  async function handleAddAttendee() {
    if (!newAttendee.full_name.trim()) { toast(t("Please enter a name."), "error"); return; }
    const isIjtima = category === 'ijtima_arkan';
    const circleId = isIjtima ? newAttendee.circle_id : selectedCircle;
    if (!circleId) { toast(t("Please choose the member's circle."), "error"); return; }
    try {
      const { data, error } = await supabase.from('participants')
        .insert({ full_name: newAttendee.full_name.trim(), phone: newAttendee.phone, remarks: newAttendee.remarks, type: isIjtima ? 'haazir_arkan' : newAttendee.type, circle_id: circleId, is_active: true })
        .select().single();
      if (error) throw error;
      setParticipants([...participants, { ...data, status: 'present' }]);
      setIsAddingAttendee(false);
      setNewAttendee({ full_name: "", phone: "", remarks: "", type: "aam_afraad", circle_id: "" });
    } catch (e: any) { toast(`${t("Couldn’t save")}: ${e.message}`, "error"); }
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
      toast(`${t("Couldn’t save")}: ${err.message}`, "error");
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
      toast(t("Report updated"));
    } catch (err: any) {
      toast(`${t("Couldn’t save")}: ${err.message}`, "error");
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
      toast(`${t("Couldn’t save")}: ${err.message}`, "error");
    }
  }

  // Add new participant inside Edit Modal
  async function handleAddAttendeeInEditModal() {
    if (!newEditAttendee.full_name.trim()) { toast(t("Please enter a name."), "error"); return; }
    const isIjtima = editingSession?.category === 'ijtima_arkan';
    const circleId = isIjtima ? newEditAttendee.circle_id : (editingSession?.circle_id || selectedCircle);
    if (!circleId) { toast(t("Please choose the member's circle."), "error"); return; }

    setAddingEditAttendee(true);
    try {
      const { data, error } = await supabase.from('participants')
        .insert({
          full_name: newEditAttendee.full_name.trim(),
          phone: newEditAttendee.phone,
          remarks: newEditAttendee.remarks,
          type: isIjtima ? 'haazir_arkan' : newEditAttendee.type,
          circle_id: circleId,
          is_active: true
        })
        .select().single();

      if (error) throw error;

      setParticipants(prev => [...prev, data]);
      setEditingAttendance(prev => ({ ...prev, [data.id]: 'present' }));
      setIsAddingEditAttendee(false);
      setNewEditAttendee({ full_name: "", phone: "", remarks: "", type: "aam_afraad", circle_id: "" });
    } catch (err: any) {
      toast(`${t("Couldn’t save")}: ${err.message}`, "error");
    } finally {
      setAddingEditAttendee(false);
    }
  }

  const isIjtima = category === "ijtima_arkan";
  const ready = isIjtima ? !!selectedUC : !!selectedCircle;
  const ucName = ucs.find((u) => u.id === selectedUC)?.name ?? "";
  const topicRow = syllabus.find((t) => t.id === effectiveTopic);
  const tafheem = topicRow?.reference ? getTafheemLink(topicRow.reference) : null;
  const viewingSession = pastSessions.find((s) => s.id === expandedSessionId) ?? null;
  const allPresent = filteredParticipants.length > 0 && filteredParticipants.every((p) => p.status === "present");
  const leaveCount = filteredParticipants.filter((p) => p.status === "leave").length;

  // Everyone who can be marked in the edit sheet: current members plus anyone already on the report.
  const editPeople = (() => {
    if (!editingSession) return [];
    const map = new Map<string, any>();
    participants.forEach((p) => map.set(p.id, p));
    (editingSession.attendance || []).forEach((a: any) => a.participants && !map.has(a.participant_id) && map.set(a.participant_id, a.participants));
    return [...map.values()].filter((p) => editingAttendance[p.id] !== undefined).sort((a, b) => a.full_name.localeCompare(b.full_name));
  })();

  const statusOptions = [
    { value: "present", label: t("Present") },
    ...(isIjtima ? [{ value: "leave", label: t("Leave") }] : []),
    { value: "absent", label: t("Absent") },
  ];
  const statusBadge = (s: string) => (s === "present" ? "badge-green" : s === "leave" ? "badge-amber" : "badge-red");

  return (
    <div className="min-h-dvh pb-32">
      {/* Frosted title bar */}
      <header className="sticky top-0 z-40 material border-b border-separator pt-[env(safe-area-inset-top)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Brand
            name={t("Dawat-e-Quran")}
            href="/attendance"
            size="sm"
            subtitle={ready ? <><bdi>{isIjtima ? ucName : activeCircle?.name ?? ""}</bdi> · {t(CATEGORY_LABEL[category])}{!isIjtima && ucName ? <> · <bdi>{ucName}</bdi></> : null}</> : t("Mark attendance · Zone 5")}
          />
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            <Link href="/" className="btn btn-secondary btn-sm !text-danger" aria-label={t("Sign out")}>
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">{t("Sign out")}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {pendingCount > 0 && (
          <div role="status" className="card p-3.5 flex items-center justify-between gap-3 bg-warning-tint">
            <p className="text-[14px] text-warning-ink">{lang === "ur" ? <><span className="font-semibold">{pendingCount} رپورٹ اس فون پر محفوظ ہے۔</span> انٹرنیٹ آتے ہی بھیج دی جائے گی۔</> : <><span className="font-semibold">{pendingCount} report{pendingCount === 1 ? "" : "s"} saved on this phone.</span> {pendingCount === 1 ? "It" : "They"} will be sent when you’re online.</>}</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={async () => { const r = await flushPending(); setPendingCount(r.left); toast(r.sent ? `${r.sent} sent` : "Still offline, will try again", r.sent ? "success" : "info"); }}>{t("Send now")}</button>
          </div>
        )}
        {/* Choose session */}
        <section className="card p-4 sm:p-5 space-y-4 animate-rise">
          <div>
            <p className="form-label">{t("Session type")}</p>
            <Segmented
              label="Session type"
              value={category}
              onChange={(v) => { setCategory(v); setExpandedSessionId(null); }}
              options={[
                { value: "quran_circle", label: t("Quran Circle") },
                { value: "dars_e_quran", label: t("Dars") },
                { value: "ijtima_arkan", label: t("Ijtima Arkan") },
                { value: "other", label: t("Other") },
              ]}
            />
          </div>
          <div className={`grid gap-3 ${isIjtima ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
            <label className="block"><span className="form-label">{t("Union council")}</span>
              <select className="form-input" value={selectedUC} disabled={loading} onChange={(e) => { setSelectedUC(e.target.value); setSelectedCircle(""); }}>
                <option value="">{loading ? t("Loading…") : t("Choose your council")}</option>
                {ucs.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </label>
            {!isIjtima && (
              <label className="block"><span className="form-label">{t("Quran circle")}</span>
                <select className="form-input" value={selectedCircle} disabled={!selectedUC} onChange={(e) => setSelectedCircle(e.target.value)}>
                  <option value="">{selectedUC ? t("Choose your circle") : t("Choose a council first")}</option>
                  {currentCircles.map((c) => <option key={c.id} value={c.id}>{c.name}{c.murabbi_name ? ` · ${c.murabbi_name}` : ""}</option>)}
                </select>
              </label>
            )}
          </div>
        </section>

        {!ready ? (
          <div className="card"><EmptyState icon={Users} title={isIjtima ? t("Choose your council") : t("Choose your circle")} text={t("Your members and past reports appear here once you choose.")} /></div>
        ) : loadingCircleData ? (
          <div className="card p-10 flex items-center justify-center gap-2 text-label-2"><Loader2 className="h-5 w-5 animate-spin text-accent" /> {t("Loading members…")}</div>
        ) : (
          <>
            <Segmented
              label="View"
              value={activeTab}
              onChange={setActiveTab}
              options={[{ value: "new", label: t("New report") }, { value: "history", label: `${t("History")} (${pastSessions.length})` }]}
            />

            {activeTab === "new" ? (
              <>
                {/* Session details */}
                <section className="card p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-rise">
                  <label className="block"><span className="form-label">{t("Date")}</span>
                    <input type="date" className="form-input" value={sessionDate} max={localDate()} onChange={(e) => setSessionDate(e.target.value)} />
                  </label>
                  {isIjtima ? (
                    <label className="block"><span className="form-label">{t("Attendance for month")}</span>
                      <select className="form-input" value={attendanceMonth} onChange={(e) => setAttendanceMonth(e.target.value)}>
                        {months.map((m, i) => <option key={m} value={m}>{lang === "ur" ? URDU_MONTHS[i] : m}</option>)}
                      </select>
                    </label>
                  ) : (
                    <label className="block"><span className="form-label">{t("Topic taught")}{!topicTouched && !topic && suggestedTopicId ? <span className="ms-1.5 badge badge-blue">{t("Suggested")}</span> : null}</span>
                      <select className="form-input" value={effectiveTopic} onChange={(e) => { setTopic(e.target.value); setTopicTouched(true); }}>
                        <option value="">{t("Choose a topic (optional)")}</option>
                        {syllabus.map((tp) => <option key={tp.id} value={tp.id}>{t("Topic")} {tp.topic_number}: {cleanTitle(tp.title)}</option>)}
                      </select>
                    </label>
                  )}
                  {topicRow?.reference && !isIjtima && (
                    <div className="sm:col-span-2 flex items-center justify-between gap-3 rounded-xl bg-accent-tint px-3.5 py-2.5">
                      <QuranRef reference={topicRow.reference} className="text-[14px] font-medium text-accent-ink" />
                      {tafheem && <a href={tafheem} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold text-link inline-flex items-center gap-1 flex-shrink-0">{t("Tafheem")} <ExternalLink className="h-3.5 w-3.5" /></a>}
                    </div>
                  )}
                  <details className="sm:col-span-2 group">
                    <summary className="cursor-pointer list-none text-[14px] font-medium text-link inline-flex items-center gap-1">
                      <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" /> {location || notes ? t("Location and notes") : t("Add location and notes")}
                    </summary>
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      <input dir="auto" className="form-input" placeholder={t("Location: masjid, residence…")} value={location} onChange={(e) => setLocation(e.target.value)} />
                      <textarea dir="auto" rows={3} className="form-input resize-none" placeholder={t("Notes: discussion, observations…")} value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                  </details>
                </section>

                {/* Members */}
                <section className="space-y-2.5">
                  <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2 px-1">
                    <div>
                      <h2 className="text-[20px] font-bold">{t("Members")}</h2>
                      <p className="text-[13px] text-label-2">{isIjtima ? t("Choose Present, Leave or Absent for each member") : t("Tap a name to mark present")}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {filteredParticipants.length > 0 && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                          const shown = new Set(filteredParticipants.map((p) => p.id));
                          setParticipants(participants.map((p) => (shown.has(p.id) ? { ...p, status: allPresent ? "absent" : "present" } : p)));
                        }}>{allPresent ? t("Clear all") : t("All present")}</button>
                      )}
                      {lastPresentIds.size > 0 && (
                        <button type="button" className="btn btn-secondary btn-sm" title={t("Tick the members who came last time")} onClick={() => setParticipants(participants.map((p) => ({ ...p, status: lastPresentIds.has(p.id) ? "present" : "absent" })))}>
                          {t("Same as last time")}
                        </button>
                      )}
                      <button type="button" className="btn btn-tinted btn-sm" onClick={() => setIsAddingAttendee(true)}><UserPlus className="h-4 w-4" /> {t("Add")}</button>
                    </div>
                  </div>

                  {participants.length > 8 && (
                    <label className="relative block">
                      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-label-3" />
                      <input dir="auto" type="search" className="form-input !bg-fill !border-transparent !ps-9" placeholder={t("Search members")} value={search} onChange={(e) => setSearch(e.target.value)} />
                    </label>
                  )}

                  {filteredParticipants.length === 0 ? (
                    <div className="card"><EmptyState icon={Users} title={search ? t("No one matches that search") : t("No members yet")} text={search ? undefined : t("Add the first member with the Add button.")} /></div>
                  ) : (
                    <ul className="card overflow-hidden list-inset">
                      {filteredParticipants.map((p) => {
                        const present = p.status === "present";
                        return isIjtima ? (
                          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-[16px] font-medium truncate"><BiText text={p.full_name} /></p>
                              <p className="text-[12px] text-label-2">{t("Arkan")}</p>
                            </div>
                            <Segmented label={`Status for ${p.full_name}`} value={p.status} onChange={(v) => toggleAttendance(p.id, v)} options={statusOptions} />
                          </li>
                        ) : (
                          <li key={p.id}>
                            <button type="button" onClick={() => toggleAttendance(p.id)} aria-pressed={present} className={`w-full flex items-center gap-3 px-4 py-3 text-start transition-colors ${present ? "bg-success-tint" : "active:bg-fill"}`}>
                              <span className={`h-7 w-7 flex-shrink-0 rounded-full grid place-items-center transition-colors ${present ? "bg-[#30a14e] text-white" : "border-2 border-[var(--color-check-off)]"}`}>
                                {present && <Check className="h-4 w-4" strokeWidth={3} />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[16px] font-medium truncate"><BiText text={p.full_name} /></span>
                                <span className="block text-[12px] text-label-2">{p.type === "haazir_arkan" ? t("Arkan") : t("Public")}</span>
                              </span>
                              {present && <span className="text-[13px] font-semibold text-success">{t("Present")}</span>}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </>
            ) : (
              /* History */
              <section className="space-y-2.5">
                {pastSessions.length > 5 && (
                  <label className="relative block">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-label-3" />
                    <input dir="auto" type="search" className="form-input !bg-fill !border-transparent !ps-9" placeholder={t("Search by date, topic, place or name")} value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
                  </label>
                )}
                {filteredPastSessions.length === 0 ? (
                  <div className="card"><EmptyState icon={History} title={t("No reports yet")} text={t("Reports you submit appear here, and you can correct them later.")} /></div>
                ) : (
                  <ul className="card overflow-hidden list-inset">
                    {filteredPastSessions.map((s) => {
                      const att = s.attendance || [];
                      const present = att.filter((a: any) => a.status === "present").length;
                      const [y, m, d] = s.session_date.slice(0, 10).split("-");
                      return (
                        <li key={s.id}>
                          <button type="button" onClick={() => setExpandedSessionId(s.id)} className="w-full text-start px-4 py-3 grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 active:bg-fill hover:bg-grouped">
                            <span className="w-11 h-11 rounded-xl bg-fill grid place-items-center text-center leading-none">
                              <span>
                                <span className="block text-[16px] font-bold tabular">{d}</span>
                                <span className="block text-[10px] font-semibold text-label-2 uppercase mt-0.5">{months[Number(m) - 1].slice(0, 3)}</span>
                              </span>
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[15px] font-semibold truncate">{s.syllabus_topics ? <>{t("Topic")} {s.syllabus_topics.topic_number}: <BiText text={cleanTitle(s.syllabus_topics.title)} /></> : t(CATEGORY_LABEL[s.category]) ?? s.category}</span>
                              <span className="block text-[13px] text-label-2 truncate">{y}{s.location ? <> · <BiText text={s.location} /></> : null}</span>
                            </span>
                            <span className="text-right leading-tight">
                              <span className="text-[17px] font-semibold tabular">{present}</span><span className="text-[13px] text-label-2">/{att.length}</span>
                              <span className="block text-[11px] text-label-2">{t("present")}</span>
                            </span>
                            <ChevronRight className="h-4 w-4 text-label-3" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* Submit bar */}
      {ready && activeTab === "new" && !loadingCircleData && (
        <div className="fixed inset-x-0 bottom-0 z-40 material border-t border-separator safe-bottom">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <p className="text-[14px] leading-tight" aria-live="polite">
              <span className="text-[20px] font-bold tabular">{presentCount}</span>
              <span className="text-label-2">{lang === "ur" ? ` / ${filteredParticipants.length} حاضر${leaveCount ? ` · ${leaveCount} رخصت` : ""}` : ` of ${filteredParticipants.length} present${leaveCount ? ` · ${leaveCount} on leave` : ""}`}</span>
            </p>
            <button type="button" onClick={handleSubmit} disabled={submitting || participants.length === 0} className="btn btn-primary px-6">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("Saving…")}</> : t("Submit report")}
            </button>
          </div>
        </div>
      )}

      {/* Thank you */}
      <Sheet open={!!thanks} onClose={() => setThanks(null)} title={thanks?.offline ? t("Saved on this phone") : t("JazakAllah khair")} footer={<button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => setThanks(null)}>{t("Done")}</button>}>
        {thanks && (
          <div className="text-center py-2">
            <div className={`mx-auto h-16 w-16 rounded-full grid place-items-center ${thanks.offline ? "bg-warning-tint text-warning" : "bg-success-tint text-success"}`}><Check className="h-8 w-8" strokeWidth={3} /></div>
            <p className="mt-4 text-[34px] font-bold tabular tracking-[-0.03em]">{thanks.present}<span className="text-[20px] text-label-2 font-semibold"> / {thanks.total}</span></p>
            <p className="text-[15px] text-label-2">{lang === "ur" ? `${thanks.place} میں حاضر` : `present at ${thanks.place}`}</p>
            {thanks.offline ? (
              <p className="mt-4 text-[14px] text-label-2">{t("There’s no internet connection right now. The report is kept on this phone and will be sent automatically when you’re back online.")}</p>
            ) : thanks.streak > 1 ? (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-3.5 py-1.5 text-[14px] font-semibold text-accent-ink">{lang === "ur" ? `مسلسل ${thanks.streak} ہفتوں سے رپورٹ جمع` : `${thanks.streak} weeks in a row with a report`}</p>
            ) : null}
          </div>
        )}
      </Sheet>

      {/* Add member */}
      <Sheet
        open={isAddingAttendee}
        onClose={() => setIsAddingAttendee(false)}
        title={t("Add member")}
        subtitle={isIjtima ? t("New Arkan member of this council") : lang === "ur" ? `${activeCircle?.name ?? "حلقہ"} کا نیا رکن` : `New member of ${activeCircle?.name ?? "this circle"}`}
        footer={<><button type="button" className="btn btn-secondary" onClick={() => setIsAddingAttendee(false)}>{t("Cancel")}</button><button type="button" className="btn btn-primary" onClick={handleAddAttendee}>{t("Add and mark present")}</button></>}
      >
        <div className="grid grid-cols-1 gap-3">
          <label className="block"><span className="form-label">{t("Full name")}</span>
            <input dir="auto" className="form-input" autoComplete="off" value={newAttendee.full_name} onChange={(e) => setNewAttendee({ ...newAttendee, full_name: e.target.value })} />
          </label>
          <label className="block"><span className="form-label">{t("Phone (optional)")}</span>
            <input className="form-input" type="tel" inputMode="tel" value={newAttendee.phone} onChange={(e) => setNewAttendee({ ...newAttendee, phone: e.target.value })} />
          </label>
          {isIjtima ? (
            <label className="block"><span className="form-label">{t("Member’s circle")}</span>
              <select className="form-input" value={newAttendee.circle_id} onChange={(e) => setNewAttendee({ ...newAttendee, circle_id: e.target.value })}>
                <option value="">{t("Choose a circle")}</option>
                {currentCircles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          ) : (
            <div><span className="form-label">{t("Member type")}</span>
              <Segmented label="Member type" value={newAttendee.type} onChange={(v) => setNewAttendee({ ...newAttendee, type: v })} options={[{ value: "aam_afraad", label: t("Public") }, { value: "haazir_arkan", label: t("Arkan") }]} />
            </div>
          )}
        </div>
      </Sheet>

      {/* Past report */}
      <Sheet
        open={!!viewingSession}
        onClose={() => setExpandedSessionId(null)}
        title={viewingSession?.syllabus_topics ? `${t("Topic")} ${viewingSession.syllabus_topics.topic_number}` : t(CATEGORY_LABEL[viewingSession?.category]) ?? "Report"}
        subtitle={viewingSession ? new Date(viewingSession.session_date.slice(0, 10) + "T00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
        footer={viewingSession && (
          <>
            <button type="button" className="btn btn-danger me-auto" onClick={async () => { await handleDeleteSession(viewingSession.id); setExpandedSessionId(null); }}><Trash2 className="h-4 w-4" /> {t("Delete")}</button>
            <button type="button" className="btn btn-primary" onClick={() => { startEditingSession(viewingSession); setExpandedSessionId(null); }}>{t("Edit report")}</button>
          </>
        )}
      >
        {viewingSession && (
          <div className="space-y-4">
            {viewingSession.syllabus_topics && <p className="text-[15px] font-medium"><BiText text={cleanTitle(viewingSession.syllabus_topics.title)} /></p>}
            {viewingSession.location && <p className="text-[14px] text-label-2 inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> <BiText text={viewingSession.location} /></p>}
            {viewingSession.notes && <p className="text-[15px] text-label-2 whitespace-pre-wrap" dir="auto">{viewingSession.notes}</p>}
            <p className="text-[13px] font-semibold text-label-2">{t("Attendance · tap a status to change it")}</p>
            <ul className="card-inset overflow-hidden list-inset">
              {[...(viewingSession.attendance || [])].sort((a: any, b: any) => (a.participants?.full_name ?? "").localeCompare(b.participants?.full_name ?? "")).map((a: any) => (
                <li key={a.participant_id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-surface">
                  <span className="text-[15px] truncate"><BiText text={a.participants?.full_name ?? "Removed member"} /></span>
                  <button type="button" onClick={() => togglePastAttendance(viewingSession.id, a.participant_id, a.status)} className={`badge ${statusBadge(a.status)} !text-[13px] !px-3 !py-1.5 min-w-[78px] justify-center capitalize`}>{t(a.status)}</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Sheet>

      {/* Edit past report */}
      <Sheet
        open={!!editingSession}
        onClose={() => setEditingSession(null)}
        wide
        title={t("Edit report")}
        footer={<><button type="button" className="btn btn-secondary" onClick={() => setEditingSession(null)}>{t("Cancel")}</button><button type="button" className="btn btn-primary" disabled={savingEdit} onClick={handleSaveEditedSession}>{savingEdit && <Loader2 className="h-4 w-4 animate-spin" />} Save changes</button></>}
      >
        {editingSession && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block"><span className="form-label">{t("Date")}</span>
                <input type="date" className="form-input" value={editingSession.session_date} onChange={(e) => setEditingSession({ ...editingSession, session_date: e.target.value })} />
              </label>
              {editingSession.category !== "ijtima_arkan" && (
                <label className="block"><span className="form-label">{t("Topic")}</span>
                  <select className="form-input" value={editingSession.topic_id} onChange={(e) => setEditingSession({ ...editingSession, topic_id: e.target.value })}>
                    <option value="">{t("No topic")}</option>
                    {syllabus.map((tp) => <option key={tp.id} value={tp.id}>{t("Topic")} {tp.topic_number}: {cleanTitle(tp.title)}</option>)}
                  </select>
                </label>
              )}
              <label className="block sm:col-span-2"><span className="form-label">{t("Location")}</span>
                <input dir="auto" className="form-input" value={editingSession.location} onChange={(e) => setEditingSession({ ...editingSession, location: e.target.value })} />
              </label>
              <label className="block sm:col-span-2"><span className="form-label">{t("Notes")}</span>
                <textarea dir="auto" rows={3} className="form-input resize-none" value={editingSession.notes} onChange={(e) => setEditingSession({ ...editingSession, notes: e.target.value })} />
              </label>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-semibold text-label-2">Attendance ({Object.values(editingAttendance).filter((s) => s === "present").length} present)</p>
                <button type="button" className="btn btn-tinted btn-sm" onClick={() => setIsAddingEditAttendee((v) => !v)}><UserPlus className="h-4 w-4" /> {t("Add member")}</button>
              </div>
              {isAddingEditAttendee && (
                <div className="card-inset p-3 mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade">
                  <input dir="auto" className="form-input" placeholder={t("Full name")} value={newEditAttendee.full_name} onChange={(e) => setNewEditAttendee({ ...newEditAttendee, full_name: e.target.value })} />
                  <input className="form-input" type="tel" inputMode="tel" placeholder={t("Phone (optional)")} value={newEditAttendee.phone} onChange={(e) => setNewEditAttendee({ ...newEditAttendee, phone: e.target.value })} />
                  {editingSession.category === "ijtima_arkan" ? (
                    <select className="form-input" value={newEditAttendee.circle_id} onChange={(e) => setNewEditAttendee({ ...newEditAttendee, circle_id: e.target.value })}>
                      <option value="">{t("Member’s circle")}</option>
                      {currentCircles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ) : (
                    <select className="form-input" value={newEditAttendee.type} onChange={(e) => setNewEditAttendee({ ...newEditAttendee, type: e.target.value })}>
                      <option value="aam_afraad">{t("Public (Aam Afraad)")}</option>
                      <option value="haazir_arkan">{t("Arkan (Haazir Arkan)")}</option>
                    </select>
                  )}
                  <button type="button" className="btn btn-primary" disabled={addingEditAttendee} onClick={handleAddAttendeeInEditModal}>{t("Add and mark present")}</button>
                </div>
              )}
              <ul className="card-inset overflow-hidden list-inset">
                {editPeople.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-surface">
                    <span className="text-[15px] min-w-0 truncate"><BiText text={p.full_name} /></span>
                    <Segmented
                      label={`Status for ${p.full_name}`}
                      value={editingAttendance[p.id] ?? "absent"}
                      onChange={(v) => setEditingAttendance({ ...editingAttendance, [p.id]: v })}
                      options={editingSession.category === "ijtima_arkan" ? statusOptions : statusOptions.filter((o) => o.value !== "leave")}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
