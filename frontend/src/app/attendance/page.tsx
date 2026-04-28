"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { CheckCircle2, Search, Save, Loader2, Plus, X, ExternalLink, LogOut, Calendar, MapPin, ChevronDown, Users, Sparkles } from "lucide-react";
import { getTafheemLink } from "@/lib/quran_utils";

export default function AttendancePage() {
  const router = useRouter();
  const [selectedUC, setSelectedUC] = useState("");
  const [selectedCircle, setSelectedCircle] = useState("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState("quran_circle");
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
  const [newAttendee, setNewAttendee] = useState({ full_name: "", phone: "", remarks: "", type: "haazir_arkan" });

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
    async function loadParticipants() {
      if (!selectedCircle) { setParticipants([]); return; }
      const { data } = await supabase.from('participants').select('*').eq('circle_id', selectedCircle).order('full_name');
      setParticipants((data || []).map(p => ({ ...p, present: false })));
    }
    loadParticipants();
  }, [selectedCircle]);

  const currentCircles = circles.filter(c => c.uc_id === selectedUC);
  const activeCircle = circles.find(c => c.id === selectedCircle);
  const filteredParticipants = participants.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()));
  const presentCount = filteredParticipants.filter(p => p.present).length;

  const toggleAttendance = (id: string) => {
    setParticipants(participants.map(p => p.id === id ? { ...p, present: !p.present } : p));
  };

  async function handleSubmit() {
    if (!selectedCircle || !sessionDate) { alert("Please select a circle and date."); return; }
    setSubmitting(true);
    try {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({ session_date: sessionDate, category, location, notes, circle_id: selectedCircle, topic_id: topic || null })
        .select().single();
      if (sessionError) throw sessionError;
      const attendanceRecords = participants.map(p => ({ session_id: session.id, participant_id: p.id, status: p.present }));
      if (attendanceRecords.length > 0) {
        const { error: attError } = await supabase.from('attendance').insert(attendanceRecords);
        if (attError) throw attError;
      }
      alert("Session submitted successfully.");
      setTopic(""); setLocation(""); setNotes("");
      setParticipants(participants.map(p => ({ ...p, present: false })));
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
      setParticipants([...participants, { ...data, present: true }]);
      setIsAddingAttendee(false);
      setNewAttendee({ full_name: "", phone: "", remarks: "", type: "haazir_arkan" });
    } catch (e: any) { alert("Error adding attendee: " + e.message); }
  }

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
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(110,231,183,0.7)' }}>Attendance</p>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight pr-4">
              {activeCircle ? activeCircle.name : 'Mark Attendance'}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
          )}
        </div>

        {selectedCircle ? (
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
                <div>
                  <label className="form-label">Category</label>
                  <div className="relative">
                    <select className="form-input pr-8" value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="quran_circle">Quran Circle</option>
                      <option value="ijtima_arkan">Ijtima Arkan</option>
                      <option value="dars_e_quran">Dars-e-Quran</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

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

              <div>
                <label className="form-label"><MapPin className="w-3 h-3 inline mr-1" />Location</label>
                <input type="text" placeholder="e.g. Masjid, Residence..." className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>

              <div>
                <label className="form-label">Notes</label>
                <textarea placeholder="Discussion details, observations..." className="form-input h-28 resize-none leading-relaxed" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>

            {/* Attendance */}
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Attendance</h2>
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
                  <input type="text" placeholder="Full Name *" className="form-input" value={newAttendee.full_name} onChange={(e) => setNewAttendee({...newAttendee, full_name: e.target.value})} />
                  <input type="text" placeholder="Phone (optional)" className="form-input" value={newAttendee.phone} onChange={(e) => setNewAttendee({...newAttendee, phone: e.target.value})} />
                  <div className="relative">
                    <select className="form-input pr-8" value={newAttendee.type} onChange={(e) => setNewAttendee({...newAttendee, type: e.target.value})}>
                      <option value="haazir_arkan">Haazir Arkan</option>
                      <option value="aam_afraad">Aam Afraad</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setIsAddingAttendee(false)} className="btn btn-secondary flex-1 text-xs py-2">Cancel</button>
                    <button onClick={handleAddAttendee} className="btn btn-primary flex-1 text-xs py-2">Add & Mark Present</button>
                  </div>
                </div>
              )}

              {/* Participant Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2.5 pb-4">
                {filteredParticipants.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleAttendance(p.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left active:scale-97 ${
                      p.present
                        ? 'border-emerald-300'
                        : 'border-transparent hover:border-white'
                    }`}
                    style={p.present ? {
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
                      <p className={`font-bold text-sm leading-tight truncate ${p.present ? 'text-emerald-900' : 'text-slate-700'}`}>{p.full_name}</p>
                      <p className={`text-xs mt-0.5 capitalize font-medium ${p.present ? 'text-emerald-600' : 'text-slate-400'}`}>{p.type.replace('_', ' ')}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                      p.present
                        ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-200'
                        : 'text-slate-300'
                    }`} style={!p.present ? { background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(226,232,240,0.8)' } : {}}>
                      <CheckCircle2 className="w-4.5 h-4.5" />
                    </div>
                  </button>
                ))}
                {filteredParticipants.length === 0 && (
                  <div className="col-span-full text-center py-12 rounded-3xl border-2 border-dashed" style={{ borderColor: 'rgba(226,232,240,0.6)', background: 'rgba(255,255,255,0.4)' }}>
                    <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-400">No participants found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 rounded-3xl border-2 border-dashed animate-float-up" style={{ borderColor: 'rgba(167,243,208,0.4)', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)' }}>
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg"
              style={{ background: 'linear-gradient(135deg, rgba(236,253,245,0.9), rgba(204,251,241,0.8))', border: '1px solid rgba(167,243,208,0.5)' }}>
              <Search className="text-emerald-400 w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Select a Circle</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">Choose a Union Council and circle above to begin marking attendance.</p>
          </div>
        )}
      </div>

      {/* Fixed Submit Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-50" style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 -4px 24px rgba(0,0,0,0.06)' }}>
        <div className="max-w-5xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!selectedCircle || submitting}
            className="btn btn-primary w-full py-3.5 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Save className="w-4 h-4" /> Submit Session Report</>}
          </button>
        </div>
      </div>
    </div>
  );
}
