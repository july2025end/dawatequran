"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Plus, Edit2, Trash2, Save, X, Search, Filter, ChevronUp, ChevronDown } from "lucide-react";

export default function RosterManagement() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUC, setSelectedUC] = useState("All");
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    remarks: "",
    circle_id: "",
    type: "haazir_arkan",
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: pData, error: pError } = await supabase
      .from("participants")
      .select(`
        *,
        quran_circles (
          id,
          name,
          union_councils (
            id,
            name
          )
        )
      `)
      .order("created_at", { ascending: false });

    const { data: cData } = await supabase
      .from("quran_circles")
      .select(`
        id,
        name,
        union_councils (
          name
        )
      `);

    if (pError) console.error("Error fetching participants:", pError);
    else setParticipants(pData || []);
    
    setCircles(cData || []);
    setLoading(false);
  }

  async function handleSave() {
    if (!formData.full_name || !formData.circle_id) {
      alert("Please fill in the name and assign a circle.");
      return;
    }

    if (editingId) {
      const { error } = await supabase.from("participants").update(formData).eq("id", editingId);
      if (error) alert(error.message);
      else { setEditingId(null); fetchData(); }
    } else {
      const { error } = await supabase.from("participants").insert([formData]);
      if (error) alert(error.message);
      else { setIsAdding(false); fetchData(); }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from("participants").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchData();
  }

  function startEdit(p: any) {
    setEditingId(p.id);
    setFormData({
      full_name: p.full_name,
      phone: p.phone || "",
      remarks: p.remarks || "",
      circle_id: p.circle_id,
      type: p.type,
      is_active: p.is_active
    });
    setIsAdding(false);
  }

  function startAdd() {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      full_name: "",
      phone: "",
      remarks: "",
      circle_id: circles[0]?.id || "",
      type: "haazir_arkan",
      is_active: true
    });
  }

  const ucs = ["All", ...Array.from(new Set(circles.map(c => c.union_councils?.name).filter(Boolean)))];

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedParticipants = [...participants].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle nested UC sorting
    if (sortConfig.key === 'uc') {
      aValue = a.quran_circles?.union_councils?.name || '';
      bValue = b.quran_circles?.union_councils?.name || '';
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredParticipants = sortedParticipants.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.phone?.includes(searchQuery) ||
                         p.remarks?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUC = selectedUC === "All" || p.quran_circles?.union_councils?.name === selectedUC;
    return matchesSearch && matchesUC;
  });

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <ChevronUp className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />;
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-emerald-600" />
            Compiled Data Management
          </h1>
          <p className="text-sm text-gray-500">View, edit, and manage all attendee details (S1, UC, Sector, Remarks).</p>
        </div>
        <button onClick={startAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all">
          <Plus className="w-4 h-4" />
          Add Attendee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <input type="text" placeholder="Search..." className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
        </div>
        <div className="relative">
          <select className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none" value={selectedUC} onChange={(e) => setSelectedUC(e.target.value)}>
            {ucs.map(uc => <option key={uc} value={uc}>{uc}</option>)}
          </select>
          <Filter className="absolute left-3 top-3.5 text-gray-400 w-5 h-5 pointer-events-none" />
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-emerald-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800">{editingId ? "Edit Attendee" : "Add New Attendee"}</h3>
            <button onClick={() => {setEditingId(null); setIsAdding(false);}}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" className="w-full p-2 bg-gray-50 border rounded-lg" placeholder="Full Name" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
            <input type="text" className="w-full p-2 bg-gray-50 border rounded-lg" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            <select className="w-full p-2 bg-gray-50 border rounded-lg" value={formData.circle_id} onChange={(e) => setFormData({...formData, circle_id: e.target.value})}>
              {circles.map(c => <option key={c.id} value={c.id}>{c.union_councils?.name} - {c.name}</option>)}
            </select>
            <textarea className="md:col-span-3 w-full p-2 bg-gray-50 border rounded-lg h-20" placeholder="Remarks" value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg flex items-center gap-2"><Save className="w-4 h-4" />Save</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <div className="p-20 text-center text-gray-400">Loading...</div> : (
          <div className="overflow-x-auto md:overflow-visible">
            <table className="w-full text-left text-sm block md:table">
              <thead className="hidden md:table-header-group bg-gray-50 text-gray-500 font-medium border-b">
                <tr>
                  <th className="px-4 py-4 w-12 text-center">#</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('uc')}>
                    <div className="flex items-center gap-1">UC / Sector <SortIcon columnKey="uc" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('full_name')}>
                    <div className="flex items-center gap-1">Name <SortIcon columnKey="full_name" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('phone')}>
                    <div className="flex items-center gap-1">Phone <SortIcon columnKey="phone" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('remarks')}>
                    <div className="flex items-center gap-1">Remarks/Status <SortIcon columnKey="remarks" /></div>
                  </th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="block md:table-row-group space-y-4 md:space-y-0 md:divide-y divide-gray-100 p-4 md:p-0 bg-gray-50/30 md:bg-transparent">
                {filteredParticipants.map((p, index) => (
                  <tr key={p.id} className="block md:table-row bg-white border border-gray-100 rounded-2xl shadow-sm md:shadow-none md:border-0 md:rounded-none mb-4 md:mb-0 hover:bg-gray-50 transition-colors relative overflow-hidden">
                    <td className="hidden md:table-cell px-4 py-4 text-center font-mono text-xs text-gray-400 border-b border-gray-50 md:border-0">{index + 1}</td>
                    <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0 bg-gray-50/50 md:bg-transparent">
                      <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Location</span>
                      <div className="text-right md:text-left">
                        <div className="font-bold text-gray-800">{p.quran_circles?.union_councils?.name}</div>
                        <div className="text-xs text-gray-500 font-bold uppercase">{p.quran_circles?.name}</div>
                      </div>
                    </td>
                    <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0">
                      <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Name & Role</span>
                      <div className="text-right md:text-left">
                        <div className="font-bold text-gray-900">{p.full_name}</div>
                        <div className="text-xs uppercase font-bold text-blue-700">{p.type.replace('_', ' ')}</div>
                      </div>
                    </td>
                    <td className="flex justify-between items-center md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0 font-mono text-gray-600">
                      <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Phone</span>
                      {p.phone || '-'}
                    </td>
                    <td className="flex flex-col md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 md:border-0 text-gray-500">
                      <span className="md:hidden text-xs text-gray-400 font-bold uppercase mb-1">Remarks</span>
                      <span className="max-w-xs truncate" title={p.remarks}>{p.remarks || '-'}</span>
                    </td>
                    <td className="block md:table-cell px-4 py-4 md:px-6 md:py-4 md:text-right bg-gray-50/30 md:bg-transparent">
                      <div className="flex justify-between md:justify-end gap-2 w-full">
                        <button onClick={() => startEdit(p)} className="flex-1 md:flex-none p-2 bg-white border border-gray-200 md:border-transparent text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="flex-1 md:flex-none p-2 bg-white border border-gray-200 md:border-transparent text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredParticipants.length === 0 && (
                  <tr className="block md:table-row">
                    <td colSpan={6} className="block md:table-cell px-6 py-20 text-center text-gray-400">
                      No participants found in the directory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
