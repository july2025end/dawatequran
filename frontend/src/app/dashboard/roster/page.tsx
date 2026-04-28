"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Plus, Edit2, Trash2, Save, X, Search, Filter, ChevronUp, ChevronDown, Loader2 } from "lucide-react";

export default function RosterManagement() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUC, setSelectedUC] = useState("All");
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "", phone: "", remarks: "", circle_id: "", type: "haazir_arkan", is_active: true
  });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data: pData, error: pError } = await supabase
      .from("participants")
      .select(`*, quran_circles (id, name, union_councils (id, name))`)
      .order("full_name", { ascending: true });
    const { data: cData } = await supabase
      .from("quran_circles")
      .select(`id, name, union_councils (name)`);
    if (pError) console.error("Error fetching participants:", pError);
    else setParticipants(pData || []);
    setCircles(cData || []);
    setLoading(false);
  }

  async function handleSave() {
    if (!formData.full_name || !formData.circle_id) { alert("Please fill in name and circle."); return; }
    if (editingId) {
      const { error } = await supabase.from("participants").update(formData).eq("id", editingId);
      if (error) alert(error.message); else { setEditingId(null); fetchData(); }
    } else {
      const { error } = await supabase.from("participants").insert([formData]);
      if (error) alert(error.message); else { setIsAdding(false); fetchData(); }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this participant?")) return;
    const { error } = await supabase.from("participants").delete().eq("id", id);
    if (error) alert(error.message); else fetchData();
  }

  function startEdit(p: any) {
    setEditingId(p.id);
    setFormData({ full_name: p.full_name, phone: p.phone || "", remarks: p.remarks || "", circle_id: p.circle_id, type: p.type, is_active: p.is_active });
    setIsAdding(false);
  }

  function startAdd() {
    setIsAdding(true); setEditingId(null);
    setFormData({ full_name: "", phone: "", remarks: "", circle_id: circles[0]?.id || "", type: "haazir_arkan", is_active: true });
  }

  const ucs = ["All", ...Array.from(new Set(circles.map(c => c.union_councils?.name).filter(Boolean)))];

  const handleSort = (key: string) => {
    setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' });
  };

  const sortedParticipants = [...participants].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aValue = sortConfig.key === 'uc' ? a.quran_circles?.union_councils?.name || '' : a[sortConfig.key];
    let bValue = sortConfig.key === 'uc' ? b.quran_circles?.union_councils?.name || '' : b[sortConfig.key];
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredParticipants = sortedParticipants.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery) || p.remarks?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUC = selectedUC === "All" || p.quran_circles?.union_councils?.name === selectedUC;
    return matchesSearch && matchesUC;
  });

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <ChevronUp className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />;
  };

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <header>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm" />
          <p className="section-label">Directory</p>
        </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Participant Registry</h2>
          <p className="text-slate-500 mt-1 text-sm leading-relaxed max-w-xl">
            Manage participant records, circle assignments, and contact details.
          </p>
        </header>
        <button onClick={startAdd} className="btn btn-primary text-sm py-2.5 px-5 flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Participant
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, phone..."
            className="form-input pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative sm:w-52">
          <select className="form-input pl-9 pr-8" value={selectedUC} onChange={(e) => setSelectedUC(e.target.value)}>
            {ucs.map(uc => <option key={uc} value={uc}>{uc}</option>)}
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-2 text-sm">
        <span className="badge badge-slate">{filteredParticipants.length} participant{filteredParticipants.length !== 1 ? 's' : ''}</span>
        {selectedUC !== 'All' && <span className="badge badge-emerald">{selectedUC}</span>}
      </div>

      {/* Table */}
      <div className="glass-table">
        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-16 text-emerald-600">
            <Loader2 className="w-5 h-5 animate-spin opacity-50" />
            <span className="text-sm text-slate-400">Loading registry...</span>
          </div>
        ) : (
          <>
            {/* Mobile / Tablet card view */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredParticipants.length > 0 ? filteredParticipants.map((p, index) => (
                <div key={p.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-800 text-sm">{p.full_name}</p>
                        <span className={`badge ${p.type === 'haazir_arkan' ? 'badge-blue' : 'badge-slate'}`}>
                          {p.type.replace('_', ' ')}
                        </span>
                        {!p.is_active && <span className="badge badge-slate">Inactive</span>}
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">{p.quran_circles?.union_councils?.name}</p>
                      <p className="text-xs text-emerald-600 font-medium">{p.quran_circles?.name}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(p)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {p.phone && (
                    <p className="text-xs text-slate-400 mt-2">{p.phone}</p>
                  )}
                </div>
              )) : (
                <div className="py-16 text-center">
                  <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-400">No participants found</p>
                  {searchQuery && <p className="text-xs text-slate-300 mt-1">Try adjusting your search</p>}
                </div>
              )}
            </div>

            {/* Desktop table view */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0 min-w-[600px]">
                <thead>
                  <tr style={{ background: 'rgba(248,250,252,0.70)' }}>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider w-8">#</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-emerald-600 transition-colors group" onClick={() => handleSort('uc')}>
                      <div className="flex items-center gap-1.5">Circle / UC <SortIcon columnKey="uc" /></div>
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-emerald-600 transition-colors group" onClick={() => handleSort('full_name')}>
                      <div className="flex items-center gap-1.5">Name <SortIcon columnKey="full_name" /></div>
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider" onClick={() => handleSort('phone')}>
                      <div className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-600 transition-colors group">Phone <SortIcon columnKey="phone" /></div>
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Remarks</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParticipants.map((p, index) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-6 py-3.5 text-xs font-medium text-slate-300 group-hover:text-emerald-500 transition-colors">{index + 1}</td>
                      <td className="px-6 py-3.5">
                        <p className="text-xs font-semibold text-slate-500 truncate">{p.quran_circles?.union_councils?.name}</p>
                        <p className="text-xs text-emerald-600 font-medium mt-0.5 truncate">{p.quran_circles?.name}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">{p.full_name}</p>
                        <span className={`badge mt-1 ${p.type === 'haazir_arkan' ? 'badge-blue' : 'badge-slate'}`}>{p.type.replace('_', ' ')}</span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-500">{p.phone || <span className="text-slate-200">—</span>}</td>
                      <td className="px-6 py-3.5 text-xs text-slate-400 max-w-xs">
                        <span className="line-clamp-2">{p.remarks || <span className="text-slate-200">—</span>}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => startEdit(p)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredParticipants.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-slate-400">No participants found</p>
                        {searchQuery && <p className="text-xs text-slate-300 mt-1">Try adjusting your search</p>}
                      </td>
                    </tr>
                  )}
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-5 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-base">{editingId ? "Edit Participant" : "Add Participant"}</h3>
                <p className="text-xs text-emerald-200/70 mt-0.5">Registry Management</p>
              </div>
              <button onClick={() => { setEditingId(null); setIsAdding(false); }} className="p-2 hover:bg-white/15 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-input" placeholder="Enter full name..." value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input type="text" className="form-input" placeholder="03xx-xxxxxxx" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Circle *</label>
                <div className="relative">
                  <select className="form-input pr-8" value={formData.circle_id} onChange={(e) => setFormData({...formData, circle_id: e.target.value})}>
                    <option value="">— Select Circle —</option>
                    {circles.map(c => <option key={c.id} value={c.id}>{c.union_councils?.name} — {c.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="form-label">Type</label>
                <div className="relative">
                  <select className="form-input pr-8" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                    <option value="haazir_arkan">Haazir Arkan</option>
                    <option value="aam_afraad">Aam Afraad</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="form-label">Remarks</label>
                <textarea className="form-input h-24 resize-none" placeholder="Optional notes..." value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setEditingId(null); setIsAdding(false); }} className="btn btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
                <button onClick={handleSave} className="btn btn-primary flex-[2] py-2.5 text-sm">
                  <Save className="w-4 h-4" /> {editingId ? "Save Changes" : "Add Participant"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
