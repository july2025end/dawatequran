"use client";

import { useEffect, useMemo, useState } from "react";
import { Info, Phone, UserPlus, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { loadRepresentatives, type Representative } from "@/lib/representatives";
import { EmptyState, PageHeader, SearchField, Sheet, SkeletonRows, toast } from "@/components/ui";

type Form = { id: string | null; name: string; role: string; circle_name: string; uc: string; sector: string; phone: string; whatsapp: string };
const ROLES = ["Circle Head (Murabbi)", "Nazim UC", "Moawin", "Coordinator"];
const blank: Form = { id: null, name: "", role: ROLES[0], circle_name: "", uc: "", sector: "", phone: "", whatsapp: "" };

export default function Representatives() {
  const [reps, setReps] = useState<Representative[]>([]);
  const [fromDb, setFromDb] = useState(true);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const r = await loadRepresentatives();
    setReps(r.reps);
    setFromDb(r.fromDb);
    setLoading(false);
  }

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const by = new Map<string, Representative[]>();
    for (const r of reps.filter((r) => !q || [r.name, r.uc, r.sector, r.circleName, r.phone].some((v) => v?.toLowerCase().includes(q)))) {
      (by.get(r.uc) ?? by.set(r.uc, []).get(r.uc)!).push(r);
    }
    return [...by.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  }, [reps, query]);

  async function save() {
    if (!form) return;
    if (!form.name.trim() || !form.uc.trim()) { toast("Enter a name and the union council (e.g. UC-85).", "error"); return; }
    setSaving(true);
    const row = {
      name: form.name.trim(), role: form.role, circle_name: form.circle_name.trim() || null, uc: form.uc.trim().toUpperCase(),
      sector: form.sector.trim() || null, phone: form.phone.trim() || null, whatsapp: form.whatsapp.replace(/\D/g, "") || null,
    };
    const { error } = form.id ? await supabase.from("representatives").update(row).eq("id", form.id) : await supabase.from("representatives").insert([row]);
    setSaving(false);
    if (error) { toast("Couldn’t save: " + error.message, "error"); return; }
    toast(form.id ? "Contact updated" : "Contact added");
    setForm(null);
    load();
  }

  async function remove() {
    if (!form?.id || !confirm(`Remove ${form.name} from the public directory?`)) return;
    const { error } = await supabase.from("representatives").delete().eq("id", form.id);
    if (error) { toast(error.message, "error"); return; }
    toast("Contact removed");
    setForm(null);
    load();
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 pt-6 md:pt-10 max-w-[900px] mx-auto space-y-5">
      <PageHeader
        eyebrow="Public directory"
        title="Representatives"
        subtitle={loading ? "Loading contacts…" : `${reps.length} contacts shown on the public “Find your circle” page.`}
        actions={fromDb ? <button type="button" onClick={() => setForm({ ...blank })} className="btn btn-primary"><UserPlus className="h-4 w-4" /> Add contact</button> : undefined}
      />
      {!loading && !fromDb && (
        <div role="note" className="card p-4 flex gap-3 text-[14px]">
          <Info className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" aria-hidden />
          <p>These contacts are still built into the app, so they can’t be edited here yet. Run <span className="font-mono text-[13px]">database/v2_migration.sql</span> in the Supabase SQL Editor once; it copies them into the database and turns on editing.</p>
        </div>
      )}
      <div className="animate-rise"><SearchField value={query} onChange={setQuery} placeholder="Search name, council, area or phone" /></div>

      {loading ? (
        <div className="card"><SkeletonRows rows={8} /></div>
      ) : groups.length === 0 ? (
        <div className="card"><EmptyState icon={Users} title="No contacts found" /></div>
      ) : (
        groups.map(([uc, list]) => (
          <section key={uc} className="space-y-2">
            <h2 className="px-1 text-[13px] font-semibold text-label-2">{uc}{list[0].sector ? ` · ${list[0].sector}` : ""}</h2>
            <ul className="card overflow-hidden list-inset">
              {list.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={!fromDb}
                    onClick={() => setForm({ id: r.id, name: r.name, role: r.role, circle_name: r.circleName ?? "", uc: r.uc, sector: r.sector ?? "", phone: r.phone ?? "", whatsapp: r.whatsapp ?? "" })}
                    className="w-full text-left px-4 sm:px-5 py-3 flex items-center gap-3 enabled:hover:bg-grouped disabled:cursor-default"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold truncate">{r.name}</span>
                      <span className="block text-[13px] text-label-2 truncate">{r.role}{r.circleName ? ` · ${r.circleName}` : ""}</span>
                    </span>
                    <span className="text-[13px] tabular text-label-2 inline-flex items-center gap-1">{r.phone ? <><Phone className="h-3.5 w-3.5" /> {r.phone}</> : "No number"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <Sheet
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit contact" : "Add contact"}
        footer={form && (
          <>
            {form.id && <button type="button" onClick={remove} className="btn btn-danger mr-auto">Remove</button>}
            <button type="button" onClick={() => setForm(null)} className="btn btn-secondary">Cancel</button>
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary">{form.id ? "Save" : "Add contact"}</button>
          </>
        )}
      >
        {form && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2"><span className="form-label">Name</span><input dir="auto" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="block"><span className="form-label">Role</span>
              <select className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {[...new Set([...ROLES, form.role])].map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <label className="block"><span className="form-label">Circle</span><input dir="auto" className="form-input" placeholder="e.g. Circle 2" value={form.circle_name} onChange={(e) => setForm({ ...form, circle_name: e.target.value })} /></label>
            <label className="block"><span className="form-label">Union council</span><input dir="auto" className="form-input" placeholder="e.g. UC-85" value={form.uc} onChange={(e) => setForm({ ...form, uc: e.target.value })} /></label>
            <label className="block"><span className="form-label">Area</span><input dir="auto" className="form-input" placeholder="e.g. G-10/1" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} /></label>
            <label className="block"><span className="form-label">Phone</span><input className="form-input" type="tel" inputMode="tel" placeholder="+92 3xx xxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label className="block"><span className="form-label">WhatsApp (if different)</span><input className="form-input" type="tel" inputMode="tel" placeholder="923xxxxxxxxx" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></label>
          </div>
        )}
      </Sheet>
    </div>
  );
}
