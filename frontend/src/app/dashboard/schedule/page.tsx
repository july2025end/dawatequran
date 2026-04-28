"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Plus, Edit2, Trash2, Save, X, MapPin, Loader2, ChevronDown } from "lucide-react";

export default function ScheduleEditor() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [ucs, setUcs] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUC, setSelectedUC] = useState("");

  const [formData, setFormData] = useState({
    session_date: "", category: "quran_circle", location: "", notes: "", circle_id: "", topic_id: ""
  });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data: sData } = await supabase.from("sessions").select("*, quran_circles(name, uc_id, union_councils(name)), syllabus_topics(title)").order("session_date", { ascending: false });
    const { data: cData } = await supabase.from("quran_circles").select("id, name, uc_id");
    const { data: uData } = await supabase.from("union_councils").select("id, name").order("name");
    const { data: tData } = await supabase.from("syllabus_topics").select("id, title").order("topic_number");
    setSessions(sData || []); setCircles(cData || []); setUcs(uData || []); setTopics(tData || []);
    setLoading(false);
  }

  async function handleSave() {
    const data = { session_date: formData.session_date, category: formData.category, location: formData.location, notes: formData.notes, circle_id: formData.circle_id, topic_id: formData.topic_id || null };
    if (editingId) await supabase.from("sessions").update(data).eq("id", editingId);
    else await supabase.from("sessions").insert([data]);
    setEditingId(null); setIsAdding(false); fetchData();
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this scheduled session?")) {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) alert("Error: " + error.message); else fetchData();
    }
  }

  const currentCircles = circles.filter(c => c.uc_id === selectedUC);

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <header>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 shadow-sm" />
          <p className="section-label" style={{ color: '#2563eb' }}>Calendar</p>
        </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Session Schedule</h2>
          <p className="text-slate-500 mt-1 text-sm leading-relaxed max-w-xl">
            Plan and manage upcoming Quran Circle sessions and regional assemblies.
          </p>
        </header>
        <button
          onClick={() => { setIsAdding(true); setSelectedUC(""); setFormData({ session_date: "", category: "quran_circle", location: "", notes: "", circle_id: "", topic_id: "" }); }}
          className="btn btn-primary text-sm py-2.5 px-5 flex-shrink-0 bg-blue-600 hover:bg-blue-700 shadow-blue-200"
        >
          <Plus className="w-4 h-4" /> Schedule Session
        </button>
      </div>

      {/* Table */}
      <div className="glass-table">
        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-16">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500 opacity-50" />
            <span className="text-sm text-slate-400">Loading schedule...</span>
          </div>
        ) : (
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr style={{ background: 'rgba(248,250,252,0.70)' }}>
                <th className="px-5 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Type</th>
                <th className="px-5 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Circle</th>
                <th className="px-5 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Topic</th>
                <th className="px-5 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Location</th>
                <th className="px-5 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-5 md:px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">
                      {new Date(s.session_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <span className="badge badge-blue mt-1.5">{s.category.replace('_', ' ')}</span>
                  </td>
                  <td className="px-5 md:px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{s.quran_circles?.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{s.quran_circles?.union_councils?.name || 'Unknown UC'}
                    </p>
                  </td>
                  <td className="px-5 md:px-6 py-4 hidden md:table-cell">
                    {s.syllabus_topics ? (
                      <p className="text-sm text-slate-600 leading-snug">{s.syllabus_topics.title}</p>
                    ) : (
                      <span className="text-xs text-slate-300 italic">General</span>
                    )}
                  </td>
                  <td className="px-5 md:px-6 py-4 hidden sm:table-cell text-sm text-slate-500">
                    {s.location || <span className="text-slate-300 italic text-xs">—</span>}
                  </td>
                  <td className="px-5 md:px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setEditingId(s.id);
                          setSelectedUC(s.quran_circles?.uc_id || "");
                          setFormData({ session_date: s.session_date, category: s.category, location: s.location || "", notes: s.notes || "", circle_id: s.circle_id, topic_id: s.topic_id || "" });
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-400">No sessions scheduled</p>
                    <p className="text-xs text-slate-300 mt-1">Add a session to get started</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(isAdding || editingId) && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) { setEditingId(null); setIsAdding(false); } }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="bg-gradient-to-r from-blue-800 to-indigo-900 px-6 py-5 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-base">{editingId ? "Edit Session" : "Schedule Session"}</h3>
                <p className="text-xs text-blue-200/70 mt-0.5">Session Management</p>
              </div>
              <button onClick={() => { setEditingId(null); setIsAdding(false); }} className="p-2 hover:bg-white/15 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={formData.session_date} onChange={e => setFormData({...formData, session_date: e.target.value})} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="form-label">Category</label>
                  <div className="relative">
                    <select className="form-input pr-8" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
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
                <label className="form-label">Union Council</label>
                <div className="relative">
                  <select className="form-input pr-8" value={selectedUC} onChange={e => { setSelectedUC(e.target.value); setFormData({...formData, circle_id: ""}); }}>
                    <option value="">— Select UC —</option>
                    {ucs.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="form-label">Circle</label>
                <div className="relative">
                  <select className="form-input pr-8" value={formData.circle_id} onChange={e => setFormData({...formData, circle_id: e.target.value})} disabled={!selectedUC}>
                    <option value="">— Select Circle —</option>
                    {currentCircles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="form-label">Topic (optional)</label>
                <div className="relative">
                  <select className="form-input pr-8" value={formData.topic_id || ""} onChange={e => setFormData({...formData, topic_id: e.target.value})}>
                    <option value="">No specific topic</option>
                    {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="form-label">Location</label>
                <input type="text" className="form-input" placeholder="e.g. Masjid, Residence..." value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setEditingId(null); setIsAdding(false); }} className="btn btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
                <button onClick={handleSave} className="btn btn-primary flex-[2] py-2.5 text-sm bg-blue-600 hover:bg-blue-700 shadow-blue-200">
                  <Save className="w-4 h-4" /> {editingId ? "Save Changes" : "Schedule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
