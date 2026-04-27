"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { SURAHS } from "@/lib/surahs";
import { getTafheemLink } from "@/lib/quran_utils";
import { Book, Plus, Edit2, Trash2, Save, X, Search, ExternalLink } from "lucide-react";

export default function SyllabusEditor() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({ 
    topic_number: 0, 
    title: "", 
    selectedSura: 1, 
    startAyat: 1, 
    endAyat: 7 
  });

  useEffect(() => { fetchSyllabus(); }, []);

  async function fetchSyllabus() {
    setLoading(true);
    const { data, error } = await supabase.from("syllabus_topics").select("*").order("topic_number", { ascending: true });
    if (!error) setTopics(data || []);
    setLoading(false);
  }

  async function handleSave() {
    const sura = SURAHS.find(s => s.id === formData.selectedSura);
    const reference = `${sura?.urdu} (${sura?.english}) ${formData.startAyat}-${formData.endAyat}`;
    
    const payload = {
      topic_number: formData.topic_number,
      title: formData.title,
      reference: reference
    };

    if (editingId) {
      await supabase.from("syllabus_topics").update(payload).eq("id", editingId);
      setEditingId(null);
    } else {
      await supabase.from("syllabus_topics").insert([payload]);
      setIsAdding(false);
    }
    fetchSyllabus();
  }

  function startEditing(t: any) {
    // Try to parse the reference "Urdu (English) 1-7"
    let suraId = 1;
    let start = 1;
    let end = 7;

    const match = t.reference?.match(/\(([^)]+)\)\s*(\d+)-(\d+)/);
    if (match) {
      const engName = match[1];
      start = parseInt(match[2]);
      end = parseInt(match[3]);
      const foundSura = SURAHS.find(s => s.english === engName);
      if (foundSura) suraId = foundSura.id;
    }

    setFormData({
      topic_number: t.topic_number,
      title: t.title,
      selectedSura: suraId,
      startAyat: start,
      endAyat: end
    });
    setEditingId(t.id);
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this topic? This action cannot be undone.")) {
      const { error } = await supabase.from("syllabus_topics").delete().eq("id", id);
      if (error) {
        alert("Error deleting topic: " + error.message);
      } else {
        fetchSyllabus();
      }
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Book className="text-emerald-600" />Syllabus</h1>
          <p className="text-sm text-gray-500">Manage topics and references.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ topic_number: topics.length + 1, title: "", selectedSura: 1, startAyat: 1, endAyat: 7 });
            setIsAdding(true);
          }} 
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />Add Topic
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-emerald-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Topic #</label>
              <input type="number" className="p-2 border rounded-xl w-full bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Topic #" value={formData.topic_number} onChange={e => setFormData({...formData, topic_number: parseInt(e.target.value)})} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
              <input type="text" className="p-2 border rounded-xl w-full bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Topic Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Surah</label>
              <select 
                className="p-2 border rounded-xl w-full bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500" 
                value={formData.selectedSura}
                onChange={e => setFormData({...formData, selectedSura: parseInt(e.target.value)})}
              >
                {SURAHS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.id}. {s.english} ({s.urdu})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Ayat</label>
              <input 
                type="number" 
                className="p-2 border rounded-xl w-full bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500" 
                min={1}
                max={SURAHS.find(s => s.id === formData.selectedSura)?.verses}
                value={formData.startAyat} 
                onChange={e => setFormData({...formData, startAyat: parseInt(e.target.value)})} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Ayat</label>
              <input 
                type="number" 
                className="p-2 border rounded-xl w-full bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500" 
                min={formData.startAyat}
                max={SURAHS.find(s => s.id === formData.selectedSura)?.verses}
                value={formData.endAyat} 
                onChange={e => setFormData({...formData, endAyat: parseInt(e.target.value)})} 
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => {setIsAdding(false); setEditingId(null);}} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-8 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">Save Topic</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden md:overflow-visible">
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full text-left text-sm block md:table">
            <thead className="hidden md:table-header-group bg-gray-50 text-gray-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4 w-16">#</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group space-y-4 md:space-y-0 md:divide-y divide-gray-100 p-4 md:p-0 bg-gray-50/30 md:bg-transparent">
              {topics.map(t => (
                <tr key={t.id} className="block md:table-row bg-white border border-gray-100 rounded-2xl shadow-sm md:shadow-none md:border-0 md:rounded-none mb-4 md:mb-0 hover:bg-gray-50 transition-colors">
                  <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0 bg-gray-50/50 md:bg-transparent font-bold text-gray-400">
                    <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Topic Number</span>
                    #{t.topic_number}
                  </td>
                  <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0 font-bold text-gray-800">
                    <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Title</span>
                    <span className="text-right md:text-left">{t.title}</span>
                  </td>
                  <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0">
                    <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Reference</span>
                    <div className="text-right md:text-left">
                      {t.reference ? (
                        <a 
                          href={getTafheemLink(t.reference) || "#"} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-800 font-bold flex items-center justify-end md:justify-start gap-1 group transition-colors"
                        >
                          {t.reference}
                          <ExternalLink className="w-3 h-3 md:opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <span className="text-gray-300 italic">No reference</span>
                      )}
                    </div>
                  </td>
                  <td className="block md:table-cell px-4 py-4 md:px-6 md:py-4 md:text-right bg-gray-50/30 md:bg-transparent">
                    <div className="flex justify-between md:justify-end gap-2 w-full">
                      <button onClick={() => startEditing(t)} className="flex-1 md:flex-none p-2 bg-white border border-gray-200 md:border-transparent text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(t.id)} className="flex-1 md:flex-none p-2 bg-white border border-gray-200 md:border-transparent text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {topics.length === 0 && (
                <tr className="block md:table-row">
                  <td colSpan={4} className="block md:table-cell px-6 py-20 text-center text-gray-400">
                    No syllabus topics found.
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
