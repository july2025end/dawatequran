"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { SURAHS } from "@/lib/surahs";
import Link from "next/link";
import { BookOpen, Plus, Edit2, Trash2, Save, X, Search, ExternalLink, ChevronDown } from "lucide-react";

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
    const payload = { topic_number: formData.topic_number, title: formData.title, reference };

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
    let suraId = 1, start = 1, end = 7;
    const match = t.reference?.match(/\(([^)]+)\)\s*(\d+)-(\d+)/);
    if (match) {
      const engName = match[1];
      start = parseInt(match[2]);
      end = parseInt(match[3]);
      const foundSura = SURAHS.find(s => s.english === engName);
      if (foundSura) suraId = foundSura.id;
    }
    setFormData({ topic_number: t.topic_number, title: t.title, selectedSura: suraId, startAyat: start, endAyat: end });
    setEditingId(t.id);
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this topic? This cannot be undone.")) {
      const { error } = await supabase.from("syllabus_topics").delete().eq("id", id);
      if (error) alert("Error: " + error.message);
      else fetchSyllabus();
    }
  }

  const filteredTopics = topics.filter(t =>
    t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.reference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <header>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm" />
          <p className="section-label">Curriculum</p>
        </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Syllabus Manager</h2>
          <p className="text-slate-500 mt-1 text-sm leading-relaxed max-w-xl">
            Manage curriculum topics with Quranic references for Quran Circles across Zone 5.
          </p>
        </header>
        <button
          onClick={() => {
            setFormData({ topic_number: topics.length + 1, title: "", selectedSura: 1, startAyat: 1, endAyat: 7 });
            setIsAdding(true);
          }}
          className="btn btn-primary text-sm py-2.5 px-5 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Topic
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Search topics..."
          className="form-input pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>

      {/* Table */}
      <div className="glass-table">
        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-16 text-emerald-600">
            <p className="text-sm text-slate-400">Loading...</p>
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">No topics found</p>
          </div>
        ) : (
          <>
            {/* Mobile/Tablet card view */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredTopics.map(t => (
                  <div key={t.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-xs flex-shrink-0">
                          {t.topic_number}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm leading-snug">{t.title}</p>
                          {t.reference && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate">{t.reference}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {t.reference && (
                          <Link href={`/portal/topic/${t.id}`}
                            className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                        <button onClick={() => startEditing(t)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr style={{ background: 'rgba(248,250,252,0.70)' }}>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">#</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTopics.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-xs group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-200">
                          {t.topic_number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 text-sm leading-snug group-hover:text-emerald-700 transition-colors">{t.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        {t.reference ? (
                          <Link href={`/portal/topic/${t.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all">
                            {t.reference} <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-300 italic">No reference</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => startEditing(t)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(isAdding || editingId) && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) { setEditingId(null); setIsAdding(false); } }}
        >
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-5 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-base">{editingId ? "Edit Topic" : "Add New Topic"}</h3>
                <p className="text-xs text-emerald-200/70 mt-0.5">Curriculum Management</p>
              </div>
              <button onClick={() => { setEditingId(null); setIsAdding(false); }} className="p-2 hover:bg-white/15 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="form-label">Topic #</label>
                  <input type="number" className="form-input" value={formData.topic_number} onChange={e => setFormData({...formData, topic_number: parseInt(e.target.value)})} />
                </div>
                <div className="col-span-3">
                  <label className="form-label">Title</label>
                  <input type="text" className="form-input" placeholder="e.g. Core Theology..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="form-label">Surah</label>
                <div className="relative">
                  <select className="form-input pr-8" value={formData.selectedSura} onChange={e => setFormData({...formData, selectedSura: parseInt(e.target.value)})}>
                    {SURAHS.map(s => (
                      <option key={s.id} value={s.id}>{s.id}. {s.english} ({s.urdu})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Start Ayat</label>
                  <input type="number" className="form-input" min={1} value={formData.startAyat} onChange={e => setFormData({...formData, startAyat: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="form-label">End Ayat</label>
                  <input type="number" className="form-input" min={formData.startAyat} value={formData.endAyat} onChange={e => setFormData({...formData, endAyat: parseInt(e.target.value)})} />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs text-slate-500 font-medium">
                Reference: <span className="font-semibold text-slate-700">
                  {SURAHS.find(s => s.id === formData.selectedSura)?.urdu} ({SURAHS.find(s => s.id === formData.selectedSura)?.english}) {formData.startAyat}-{formData.endAyat}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setEditingId(null); setIsAdding(false); }} className="btn btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
                <button onClick={handleSave} className="btn btn-primary flex-[2] py-2.5 text-sm">
                  <Save className="w-4 h-4" /> {editingId ? "Save Changes" : "Add Topic"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
