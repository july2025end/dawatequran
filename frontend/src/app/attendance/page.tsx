"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Search, Save, Loader2, Plus, X, ExternalLink, LogOut } from "lucide-react";
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

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      const { data: ucData } = await supabase.from('union_councils').select('*').order('name');
      const { data: circleData } = await supabase.from('quran_circles').select('*, murabbi_name').order('name');
      const { data: syllabusData } = await supabase.from('syllabus_topics').select('*').order('topic_number');
      
      setUcs(ucData || []);
      setCircles(circleData || []);
      setSyllabus(syllabusData || []);
      setLoading(false);
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadParticipants() {
      if (!selectedCircle) {
        setParticipants([]);
        return;
      }
      const { data } = await supabase
        .from('participants')
        .select('*')
        .eq('circle_id', selectedCircle)
        .order('full_name');
      
      // Initialize with `present: false` for the local UI state
      const initialized = (data || []).map(p => ({ ...p, present: false }));
      setParticipants(initialized);
    }
    loadParticipants();
  }, [selectedCircle]);

  const currentCircles = circles.filter(c => c.uc_id === selectedUC);
  const activeCircle = circles.find(c => c.id === selectedCircle);

  const toggleAttendance = (id: string) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, present: !p.present } : p
    ));
  };

  async function handleSubmit() {
    if (!selectedCircle || !sessionDate) {
      alert("Please select a circle and date.");
      return;
    }

    try {
      // 1. Create the session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          session_date: sessionDate,
          category,
          location,
          notes,
          circle_id: selectedCircle,
          topic_id: topic || null
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // 2. Mark Attendance
      const attendanceRecords = participants.map(p => ({
        session_id: session.id,
        participant_id: p.id,
        status: p.present
      }));

      if (attendanceRecords.length > 0) {
        const { error: attError } = await supabase.from('attendance').insert(attendanceRecords);
        if (attError) throw attError;
      }

      alert("Jaiza Report Submitted Successfully!");
      
      // Reset form
      setTopic("");
      setLocation("");
      setNotes("");
      setParticipants(participants.map(p => ({ ...p, present: false })));

    } catch (e: any) {
      alert("Error: " + e.message);
    }
  }

  const [isAddingAttendee, setIsAddingAttendee] = useState(false);
  const [newAttendee, setNewAttendee] = useState({ full_name: "", phone: "", remarks: "", type: "haazir_arkan" });

  const filteredParticipants = participants.filter(p => 
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAddAttendee() {
    if (!newAttendee.full_name) {
      alert("Please enter a name.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('participants')
        .insert({
          full_name: newAttendee.full_name,
          phone: newAttendee.phone,
          remarks: newAttendee.remarks,
          type: newAttendee.type,
          circle_id: selectedCircle,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setParticipants([...participants, { ...data, present: true }]); // Default to present for the one just added
      setIsAddingAttendee(false);
      setNewAttendee({ full_name: "", phone: "", remarks: "", type: "haazir_arkan" });
    } catch (e: any) {
      alert("Error adding attendee: " + e.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Mobile Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white px-5 pt-6 pb-8 shadow-xl sticky top-0 z-10 relative overflow-hidden">
        {/* Decorative rings */}
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full border border-white/5 pointer-events-none" />
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-300/80">Murabbi Portal</p>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
              {activeCircle ? activeCircle.name : 'Select Your Circle'}
            </h1>
            {activeCircle?.murabbi_name && (
              <p className="text-sm text-emerald-200/80 font-medium">
                Murabbi: {activeCircle.murabbi_name}
              </p>
            )}
            {!activeCircle && (
              <p className="text-sm text-emerald-200/70 font-medium">Choose a UC and circle to get started</p>
            )}
          </div>
          <button 
            onClick={() => router.push('/')}
            className="p-2.5 bg-white/10 rounded-xl border border-white/10 active:scale-95 transition-all text-emerald-100 flex-shrink-0 hover:bg-white/20"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Selection Details */}
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 space-y-4 shadow-sm">
          <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Assignment Selection</h2>
          {loading ? (
             <div className="flex items-center gap-2 text-emerald-700">
               <Loader2 className="animate-spin w-4 h-4" /> Loading regions...
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-700 mb-1">
                  Select UC
                </label>
                <select 
                  className="w-full bg-white border border-emerald-200 text-gray-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                  value={selectedUC}
                  onChange={(e) => {
                    setSelectedUC(e.target.value);
                    setSelectedCircle(""); // Reset circle on UC change
                  }}
                >
                  <option value="">-- Choose UC --</option>
                  {ucs.map(uc => (
                    <option key={uc.id} value={uc.id}>{uc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-700 mb-1">
                  Select Quran Circle
                </label>
                <select 
                  className="w-full bg-white border border-emerald-200 text-gray-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none disabled:bg-gray-100 disabled:text-gray-400"
                  value={selectedCircle}
                  onChange={(e) => setSelectedCircle(e.target.value)}
                  disabled={!selectedUC}
                >
                  <option value="">-- Choose Circle --</option>
                  {currentCircles.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.murabbi_name ? `(${c.murabbi_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Session Details (Only visible if circle is selected) */}
        {selectedCircle ? (
          <>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Event Details</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Event Date
                  </label>
                  <input 
                    type="date" 
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Event Category
                  </label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="quran_circle">Quran Circle</option>
                    <option value="ijtima_arkan">Ijtima Arkan</option>
                    <option value="dars_e_quran">Dars-e-Quran</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Location (Optional)
                </label>
                <input 
                  type="text" 
                  placeholder="Masjid/Home"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Select Syllabus Topic
                </label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                >
                  <option value="">-- Choose Topic Covered --</option>
                  {syllabus.map(t => (
                    <option key={t.id} value={t.id}>
                      Topic {t.topic_number}: {t.title}
                    </option>
                  ))}
                </select>
                {topic && (
                  <div className="mt-2 flex items-center justify-between px-1">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Reference:</span>
                    <a 
                      href={getTafheemLink(syllabus.find(t => t.id === topic)?.reference) || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1"
                    >
                      {syllabus.find(t => t.id === topic)?.reference}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Brief Notes / Remarks
                </label>
                <textarea 
                  placeholder="Any special updates or points discussed..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-20 resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Participants List */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h2 className="text-lg font-bold text-gray-800">Mark Attendance</h2>
                <button 
                  onClick={() => setIsAddingAttendee(true)}
                  className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-full font-bold flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3 h-3" /> New Attendee
                </button>
              </div>

              {isAddingAttendee && (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-emerald-800 uppercase">Add New Attendee</h3>
                    <button onClick={() => setIsAddingAttendee(false)}><X className="w-4 h-4 text-emerald-400" /></button>
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      className="w-full p-2 text-sm rounded-lg border border-emerald-100 outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newAttendee.full_name}
                      onChange={(e) => setNewAttendee({...newAttendee, full_name: e.target.value})}
                    />
                    <input 
                      type="text" 
                      placeholder="Phone Number" 
                      className="w-full p-2 text-sm rounded-lg border border-emerald-100 outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newAttendee.phone}
                      onChange={(e) => setNewAttendee({...newAttendee, phone: e.target.value})}
                    />
                    <select 
                      className="w-full p-2 text-sm rounded-lg border border-emerald-100 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      value={newAttendee.type}
                      onChange={(e) => setNewAttendee({...newAttendee, type: e.target.value})}
                    >
                      <option value="haazir_arkan">Haazir Arkan</option>
                      <option value="aam_afraad">Aam Afraad</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleAddAttendee}
                    className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold text-sm shadow-md"
                  >
                    Add to Circle
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center px-1">
                <span className="text-xs text-gray-500 font-medium">
                  Search & Select
                </span>
                <span className="text-xs bg-white border text-gray-500 px-2 py-0.5 rounded-full font-bold">
                  {filteredParticipants.filter(p => p.present).length} / {filteredParticipants.length} Present
                </span>
              </div>

              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search by name..." 
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
              </div>

              <div className="space-y-2">
                {filteredParticipants.map((p) => (
                  <div 
                    key={p.id} 
                    onClick={() => toggleAttendance(p.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${p.present ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100'}`}
                  >
                    <div>
                      <h3 className={`font-bold ${p.present ? 'text-emerald-900' : 'text-gray-800'}`}>{p.full_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-1 font-bold inline-block uppercase tracking-tighter ${p.type === 'haazir_arkan' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {p.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className={`p-2 rounded-full transition-all ${p.present ? 'bg-emerald-600 text-white scale-110 shadow-lg shadow-emerald-200' : 'bg-gray-100 text-gray-300'}`}>
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  </div>
                ))}
                {filteredParticipants.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    No participants found for this circle.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-emerald-600 w-8 h-8" />
            </div>
            <h2 className="text-gray-800 font-bold text-lg">Choose Your Circle</h2>
            <p className="text-gray-500 text-sm max-w-[200px] mx-auto mt-1">
              Select a Union Council and Circle above to start marking attendance.
            </p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] z-50">
        <button 
          onClick={handleSubmit} 
          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
        >
          <Save className="w-6 h-6" />
          Submit Jaiza Report
        </button>
      </div>
    </div>
  );
}