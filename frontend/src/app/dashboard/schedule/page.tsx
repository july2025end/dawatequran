"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Plus, Edit2, Trash2, Save, X, Search, MapPin } from "lucide-react";

export default function ScheduleEditor() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [ucs, setUcs] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUC, setSelectedUC] = useState("");

  const [formData, setFormData] = useState({ session_date: "", category: "quran_circle", location: "", notes: "", circle_id: "", topic_id: "" });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data: sData } = await supabase.from("sessions").select("*, quran_circles(name, uc_id, union_councils(name)), syllabus_topics(title)").order("session_date", { ascending: false });
    const { data: cData } = await supabase.from("quran_circles").select("id, name, uc_id");
    const { data: uData } = await supabase.from("union_councils").select("id, name").order("name");
    const { data: tData } = await supabase.from("syllabus_topics").select("id, title").order("topic_number");
    
    setSessions(sData || []);
    setCircles(cData || []);
    setUcs(uData || []);
    setTopics(tData || []);
    setLoading(false);
  }

  async function handleSave() {
    const data = { 
      session_date: formData.session_date,
      category: formData.category,
      location: formData.location,
      notes: formData.notes,
      circle_id: formData.circle_id,
      topic_id: formData.topic_id || null 
    };
    if (editingId) await supabase.from("sessions").update(data).eq("id", editingId);
    else await supabase.from("sessions").insert([data]);
    setEditingId(null); setIsAdding(false); fetchData();
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this scheduled event?")) {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) alert("Error deleting event: " + error.message);
      else fetchData();
    }
  }

  const currentCircles = circles.filter(c => c.uc_id === selectedUC);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="text-blue-600" />Schedule</h1>
          <p className="text-sm text-gray-500">Plan upcoming sessions.</p>
        </div>
        <button onClick={() => { setIsAdding(true); setSelectedUC(""); setFormData({ session_date: "", category: "quran_circle", location: "", notes: "", circle_id: "", topic_id: "" }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus className="w-4 h-4" />Add Session</button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-blue-100 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Session Date</label>
              <input type="date" className="w-full p-2 border rounded" value={formData.session_date} onChange={e => setFormData({...formData, session_date: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Select UC</label>
              <select className="w-full p-2 border rounded" value={selectedUC} onChange={e => { setSelectedUC(e.target.value); setFormData({...formData, circle_id: ""}); }}>
                <option value="">-- Choose UC --</option>
                {ucs.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Select Circle</label>
              <select className="w-full p-2 border rounded disabled:bg-gray-50" value={formData.circle_id} onChange={e => setFormData({...formData, circle_id: e.target.value})} disabled={!selectedUC}>
                <option value="">-- Choose Circle --</option>
                {currentCircles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <select className="p-2 border rounded" value={formData.topic_id || ""} onChange={e => setFormData({...formData, topic_id: e.target.value})}>
                <option value="">Select Topic (Optional)</option>
                {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
             </select>
             <input type="text" className="p-2 border rounded" placeholder="Location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => {setIsAdding(false); setEditingId(null);}} className="px-4 py-2 text-gray-500 font-bold">Cancel</button>
            <button onClick={handleSave} className="px-8 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-100">Save Session</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden md:overflow-visible">
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full text-left text-sm block md:table">
            <thead className="hidden md:table-header-group bg-gray-50 text-gray-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Circle & UC</th>
                <th className="px-6 py-4">Topic</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group space-y-4 md:space-y-0 md:divide-y divide-gray-100 p-4 md:p-0 bg-gray-50/30 md:bg-transparent">
              {sessions.map(s => (
                <tr key={s.id} className="block md:table-row bg-white border border-gray-100 rounded-2xl shadow-sm md:shadow-none md:border-0 md:rounded-none mb-4 md:mb-0 hover:bg-gray-50 transition-colors">
                  <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0 bg-gray-50/50 md:bg-transparent">
                    <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Date</span>
                    <span className="font-bold text-gray-700">{new Date(s.session_date).toLocaleDateString()}</span>
                  </td>
                  <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0">
                    <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Circle</span>
                    <div className="text-right md:text-left">
                      <div className="font-bold text-gray-900 flex justify-end md:justify-start">{s.quran_circles?.name}</div>
                      <div className="text-xs text-gray-500 flex items-center justify-end md:justify-start gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-emerald-500" /> {s.quran_circles?.union_councils?.name || 'Unknown UC'}
                      </div>
                    </div>
                  </td>
                  <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0">
                    <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Topic</span>
                    <span className="text-gray-500">{s.syllabus_topics?.title || "No topic"}</span>
                  </td>
                  <td className="block md:table-cell px-4 py-4 md:px-6 md:py-4 md:text-right bg-gray-50/30 md:bg-transparent">
                    <div className="flex justify-between md:justify-end gap-2 w-full">
                      <button onClick={() => {
                        setEditingId(s.id); 
                        setSelectedUC(s.quran_circles?.uc_id || "");
                        setFormData({
                          session_date: s.session_date,
                          category: s.category,
                          location: s.location || "",
                          notes: s.notes || "",
                          circle_id: s.circle_id,
                          topic_id: s.topic_id || ""
                        });
                      }} className="flex-1 md:flex-none p-2 bg-white border border-gray-200 md:border-transparent text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-lg flex items-center justify-center">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id)} 
                        className="flex-1 md:flex-none p-2 bg-white border border-gray-200 md:border-transparent text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr className="block md:table-row">
                  <td colSpan={4} className="block md:table-cell px-6 py-20 text-center text-gray-400">
                    No scheduled sessions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
