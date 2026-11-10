"use client";

import { useEffect, useMemo, useState } from "react";
import { Phone, UserPlus, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchAll } from "@/lib/data";
import { BiText, EmptyState, PageHeader, RateBar, SearchField, Segmented, Sheet, SkeletonRows, toast, useSearchParam } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come straight from Supabase joins */

type Form = { full_name: string; phone: string; remarks: string; circle_id: string; type: string; is_active: boolean };
const blank: Form = { full_name: "", phone: "", remarks: "", circle_id: "", type: "haazir_arkan", is_active: true };
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export default function Directory() {
  const [people, setPeople] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [uc, setUc] = useState("all");
  const [type, setType] = useState<"all" | "haazir_arkan" | "aam_afraad">("all");
  const [showInactive, setShowInactive] = useState(false);
  // ?duplicates=1 (from the Overview's Data quality panel) lists members whose name appears twice in one circle.
  const dupParam = useSearchParam("duplicates");
  const [chosenDup, setOnlyDuplicates] = useState<boolean | null>(null);
  const onlyDuplicates = chosenDup ?? dupParam === "1";
  const [sort, setSort] = useState<"name" | "attendance_low" | "attendance_high" | "uc">("name");
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [p, c, att] = await Promise.all([
        fetchAll<any>((f, t) => supabase.from("participants").select("*, quran_circles (id, name, union_councils (id, name))").order("full_name").order("id").range(f, t)),
        supabase.from("quran_circles").select("id, name, union_councils (name)").order("name"),
        // Every attendance row, so each member's percentage is right.
        fetchAll<{ status: string; participant_id: string }>((f, t) => supabase.from("attendance").select("status, participant_id, session_id").order("session_id").order("participant_id").range(f, t)),
      ]);
      const stats: Record<string, { present: number; total: number }> = {};
      for (const a of att) {
        if (a.status === "leave") continue; // leave is excused
        const s = (stats[a.participant_id] ??= { present: 0, total: 0 });
        s.total++;
        if (a.status === "present") s.present++;
      }
      setPeople(p.map((x) => {
        const s = stats[x.id];
        return { ...x, attendance_total: s?.total ?? 0, attendance_present: s?.present ?? 0, attendance_pct: s?.total ? Math.round((s.present / s.total) * 100) : null };
      }));
      setCircles(c.data ?? []);
    } catch (e) {
      toast("Couldn’t load members: " + (e instanceof Error ? e.message : String(e)), "error");
    }
    setLoading(false);
  }

  const ucs = useMemo(() => [...new Set(circles.map((c) => c.union_councils?.name).filter(Boolean))].sort() as string[], [circles]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const key = (p: any) => `${p.circle_id}|${p.full_name.trim().toLowerCase()}`;
    const seen = new Map<string, number>();
    for (const p of people) if (p.is_active !== false) seen.set(key(p), (seen.get(key(p)) ?? 0) + 1);
    const list = people.filter((p) =>
      (!onlyDuplicates || (seen.get(key(p)) ?? 0) > 1) &&
      (showInactive || p.is_active !== false) &&
      (type === "all" || p.type === type) &&
      (uc === "all" || p.quran_circles?.union_councils?.name === uc) &&
      (!q || p.full_name.toLowerCase().includes(q) || p.phone?.includes(q) || p.remarks?.toLowerCase().includes(q) || p.quran_circles?.name?.toLowerCase().includes(q)),
    );
    const pct = (p: any) => p.attendance_pct ?? -1;
    return list.sort((a, b) =>
      sort === "attendance_low" ? pct(a) - pct(b)
      : sort === "attendance_high" ? pct(b) - pct(a)
      : sort === "uc" ? (a.quran_circles?.union_councils?.name ?? "").localeCompare(b.quran_circles?.union_councils?.name ?? "") || a.full_name.localeCompare(b.full_name)
      : a.full_name.localeCompare(b.full_name));
  }, [people, query, uc, type, showInactive, sort, onlyDuplicates]);

  const inactiveCount = people.filter((p) => p.is_active === false).length;

  function openEdit(p: any) {
    setEditing({ id: p.id, form: { full_name: p.full_name, phone: p.phone ?? "", remarks: p.remarks ?? "", circle_id: p.circle_id ?? "", type: p.type, is_active: p.is_active !== false } });
  }

  async function save() {
    if (!editing) return;
    const { id, form } = editing;
    if (!form.full_name.trim() || !form.circle_id) { toast("Enter a name and choose a circle.", "error"); return; }
    setSaving(true);
    const payload = { ...form, full_name: form.full_name.trim() };
    const { error } = id ? await supabase.from("participants").update(payload).eq("id", id) : await supabase.from("participants").insert([payload]);
    setSaving(false);
    if (error) { toast("Couldn’t save: " + error.message, "error"); return; }
    toast(id ? "Member updated" : `${payload.full_name} added`);
    setEditing(null);
    fetchData();
  }

  async function remove() {
    if (!editing?.id) return;
    const p = people.find((x) => x.id === editing.id);
    const name = p?.full_name ?? "this member";
    // Deleting also deletes the member's attendance history, so offer the safe option first.
    if (p?.is_active !== false && confirm(`Mark ${name} as inactive?\n\nThey leave the attendance sheets but their history is kept. (Recommended)`)) {
      const { error } = await supabase.from("participants").update({ is_active: false }).eq("id", editing.id);
      if (error) { toast(error.message, "error"); return; }
      toast(`${name} marked inactive`);
    } else {
      if (!confirm(`Permanently delete ${name}${p?.attendance_total ? ` and their ${p.attendance_total} attendance records` : ""}?\n\nThis cannot be undone.`)) return;
      const { error } = await supabase.from("participants").delete().eq("id", editing.id);
      if (error) { toast(error.message, "error"); return; }
      toast(`${name} deleted`);
    }
    setEditing(null);
    fetchData();
  }

  const f = editing?.form;
  const setF = (patch: Partial<Form>) => editing && setEditing({ ...editing, form: { ...editing.form, ...patch } });

  return (
    <div className="px-4 sm:px-6 lg:px-10 pt-6 md:pt-10 max-w-[1100px] mx-auto space-y-5">
      <PageHeader
        eyebrow="Directory"
        title="Members"
        subtitle={loading ? "Loading members…" : `${people.length - inactiveCount} active members${inactiveCount ? ` · ${inactiveCount} inactive` : ""}`}
        actions={<button type="button" onClick={() => setEditing({ id: null, form: { ...blank, circle_id: circles[0]?.id ?? "" } })} className="btn btn-primary"><UserPlus className="h-4 w-4" /> Add member</button>}
      />

      <div className="space-y-2.5 animate-rise">
        <SearchField value={query} onChange={setQuery} placeholder="Search name, phone, circle or remarks" />
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Member type" value={type} onChange={setType} options={[{ value: "all", label: "All" }, { value: "haazir_arkan", label: "Arkan" }, { value: "aam_afraad", label: "Public" }]} />
          <select aria-label="Union council" className="form-input !min-h-[36px] !py-1 !text-[14px] !w-auto max-w-[11rem]" value={uc} onChange={(e) => setUc(e.target.value)}>
            <option value="all">All councils</option>
            {ucs.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <select aria-label="Sort by" className="form-input !min-h-[36px] !py-1 !text-[14px] !w-auto" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="name">Sort: Name</option>
            <option value="attendance_low">Sort: Lowest attendance</option>
            <option value="attendance_high">Sort: Highest attendance</option>
            <option value="uc">Sort: Council</option>
          </select>
          <label className="inline-flex items-center gap-2 text-[14px] text-label-2 cursor-pointer select-none">
            <input type="checkbox" className="h-4 w-4 accent-[#0071e3]" checked={onlyDuplicates} onChange={(e) => setOnlyDuplicates(e.target.checked)} /> Possible duplicates
          </label>
          {inactiveCount > 0 && (
            <label className="inline-flex items-center gap-2 text-[14px] text-label-2 cursor-pointer select-none">
              <input type="checkbox" className="h-4 w-4 accent-[#0071e3]" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show inactive
            </label>
          )}
          {!loading && <span className="text-[13px] text-label-2 ml-auto">{shown.length} shown</span>}
        </div>
      </div>

      {loading ? (
        <div className="card"><SkeletonRows rows={8} /></div>
      ) : shown.length === 0 ? (
        <div className="card"><EmptyState icon={Users} title="No members found" text="Try a different search or filter." /></div>
      ) : (
        <ul className="card overflow-hidden list-inset">
          {shown.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-grouped transition-colors">
              <button type="button" onClick={() => openEdit(p)} className="flex flex-1 min-w-0 items-center gap-3 text-left" aria-label={`Edit ${p.full_name}`}>
                <span className={`h-10 w-10 flex-shrink-0 rounded-full grid place-items-center text-[14px] font-semibold ${p.type === "haazir_arkan" ? "bg-accent-fill text-white" : "bg-fill text-label"}`}>{initials(p.full_name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold truncate"><BiText text={p.full_name} /></span>
                    {p.is_active === false && <span className="badge badge-gray">Inactive</span>}
                  </span>
                  <span className="block text-[13px] text-label-2 truncate">
                    {p.type === "haazir_arkan" ? "Arkan" : "Public"} · {p.quran_circles?.name ?? "No circle"}{p.quran_circles?.union_councils?.name ? ` · ${p.quran_circles.union_councils.name}` : ""}
                  </span>
                  {p.remarks && p.remarks.trim().replace(/^[-–—.\s]+$/, "") && <span className="block text-[12px] text-label-3 truncate" dir="auto">{p.remarks}</span>}
                </span>
                <span className="hidden sm:block w-28">
                  <RateBar rate={p.attendance_pct} />
                </span>
                <span className="w-14 text-right">
                  <span className="block text-[15px] font-semibold tabular">{p.attendance_pct === null ? "—" : `${p.attendance_pct}%`}</span>
                  <span className="block text-[11px] text-label-2 tabular">{p.attendance_present}/{p.attendance_total}</span>
                </span>
              </button>
              {p.phone && (
                <a href={`tel:${p.phone.replace(/[^\d+]/g, "")}`} className="btn btn-tinted btn-icon flex-shrink-0" aria-label={`Call ${p.full_name}`}>
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit member" : "Add member"}
        footer={editing && (
          <>
            {editing.id && <button type="button" onClick={remove} className="btn btn-danger mr-auto">Remove</button>}
            <button type="button" onClick={() => setEditing(null)} className="btn btn-secondary">Cancel</button>
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary">{editing.id ? "Save" : "Add member"}</button>
          </>
        )}
      >
        {f && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2"><span className="form-label">Full name</span>
              <input dir="auto" className="form-input" value={f.full_name} onChange={(e) => setF({ full_name: e.target.value })} autoComplete="off" />
            </label>
            <label className="block"><span className="form-label">Phone</span>
              <input className="form-input" type="tel" inputMode="tel" placeholder="03xx xxxxxxx" value={f.phone} onChange={(e) => setF({ phone: e.target.value })} />
            </label>
            <label className="block"><span className="form-label">Member type</span>
              <select className="form-input" value={f.type} onChange={(e) => setF({ type: e.target.value })}>
                <option value="haazir_arkan">Arkan (Haazir Arkan)</option>
                <option value="aam_afraad">Public (Aam Afraad)</option>
              </select>
            </label>
            <label className="block sm:col-span-2"><span className="form-label">Circle</span>
              <select className="form-input" value={f.circle_id} onChange={(e) => setF({ circle_id: e.target.value })}>
                <option value="">Choose a circle</option>
                {circles.map((c) => <option key={c.id} value={c.id}>{c.union_councils?.name} · {c.name}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2"><span className="form-label">Remarks</span>
              <textarea dir="auto" rows={3} className="form-input resize-none" value={f.remarks} onChange={(e) => setF({ remarks: e.target.value })} />
            </label>
            {editing?.id && (
              <label className="sm:col-span-2 flex items-center justify-between gap-3 rounded-xl bg-fill px-3.5 py-3 cursor-pointer">
                <span>
                  <span className="block text-[15px] font-medium">Active</span>
                  <span className="block text-[13px] text-label-2">Inactive members don’t appear on attendance sheets.</span>
                </span>
                <input type="checkbox" role="switch" className="h-5 w-5 accent-[#0071e3]" checked={f.is_active} onChange={(e) => setF({ is_active: e.target.checked })} />
              </label>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
