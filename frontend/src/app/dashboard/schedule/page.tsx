"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORY_LABEL, cleanTitle, fetchAll, localDate } from "@/lib/data";
import { BiText, EmptyState, PageHeader, Segmented, Sheet, SkeletonRows, toast } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come straight from Supabase joins */

type Form = { id: string | null; session_date: string; category: string; uc_id: string; circle_id: string; topic_id: string; location: string; notes: string };
const blank: Form = { id: null, session_date: "", category: "quran_circle", uc_id: "", circle_id: "", topic_id: "", location: "", notes: "" };

const dayLabel = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
};

export default function Schedule() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [ucs, setUcs] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [when, setWhen] = useState<"upcoming" | "past">("upcoming");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [s, c, u, t] = await Promise.all([
        fetchAll<any>((f, to) => supabase.from("sessions").select("*, quran_circles(name, uc_id, union_councils(name)), union_councils(name), syllabus_topics(title, topic_number)").order("session_date").order("id").range(f, to)),
        supabase.from("quran_circles").select("id, name, uc_id").order("name"),
        supabase.from("union_councils").select("id, name").order("name"),
        supabase.from("syllabus_topics").select("id, title, topic_number").order("topic_number"),
      ]);
      setSessions(s); setCircles(c.data ?? []); setUcs(u.data ?? []); setTopics(t.data ?? []);
    } catch (e) {
      toast("Couldn’t load the schedule: " + (e instanceof Error ? e.message : String(e)), "error");
    }
    setLoading(false);
  }

  const days = useMemo(() => {
    const today = localDate();
    const list = sessions.filter((s) => (when === "upcoming" ? s.session_date >= today : s.session_date < today));
    if (when === "past") list.reverse();
    const groups = new Map<string, any[]>();
    for (const s of list.slice(0, when === "past" ? 120 : undefined)) {
      if (!groups.has(s.session_date)) groups.set(s.session_date, []);
      groups.get(s.session_date)!.push(s);
    }
    return [...groups.entries()];
  }, [sessions, when]);

  function edit(s: any) {
    setForm({
      id: s.id, session_date: s.session_date, category: s.category,
      uc_id: s.uc_id ?? s.quran_circles?.uc_id ?? "", circle_id: s.circle_id ?? "",
      topic_id: s.topic_id ?? "", location: s.location ?? "", notes: s.notes ?? "",
    });
  }

  async function save() {
    if (!form) return;
    const isIjtima = form.category === "ijtima_arkan";
    // Ijtima Arkan is held for a whole council; everything else belongs to a circle.
    if (!form.session_date || (isIjtima ? !form.uc_id : !form.circle_id)) { toast(isIjtima ? "Choose a date and a council." : "Choose a date and a circle.", "error"); return; }
    setSaving(true);
    const data = {
      session_date: form.session_date, category: form.category, location: form.location, notes: form.notes,
      circle_id: isIjtima ? null : form.circle_id, uc_id: form.uc_id || null, topic_id: form.topic_id || null,
    };
    const { error } = form.id ? await supabase.from("sessions").update(data).eq("id", form.id) : await supabase.from("sessions").insert([data]);
    setSaving(false);
    if (error) { toast("Couldn’t save: " + error.message, "error"); return; }
    toast(form.id ? "Session updated" : "Session scheduled");
    setForm(null);
    fetchData();
  }

  async function remove() {
    if (!form?.id || !confirm("Delete this session? Any attendance marked for it is deleted too.")) return;
    const { error } = await supabase.from("sessions").delete().eq("id", form.id);
    if (error) { toast(error.message, "error"); return; }
    toast("Session deleted");
    setForm(null);
    fetchData();
  }

  const place = (s: any) => (s.category === "ijtima_arkan" ? s.union_councils?.name ?? "Council" : s.quran_circles?.name ?? "Circle");
  const council = (s: any) => s.quran_circles?.union_councils?.name ?? s.union_councils?.name ?? "";

  return (
    <div className="px-4 sm:px-6 lg:px-10 pt-6 md:pt-10 max-w-[900px] mx-auto space-y-5">
      <PageHeader
        eyebrow="Calendar"
        title="Schedule"
        subtitle="Plan upcoming classes and assemblies. They appear on the public portal as upcoming sessions."
        actions={<button type="button" onClick={() => setForm({ ...blank, session_date: localDate() })} className="btn btn-primary"><Plus className="h-4 w-4" /> Schedule session</button>}
      />
      <div className="animate-rise">
        <Segmented label="Show" value={when} onChange={setWhen} options={[{ value: "upcoming", label: "Upcoming" }, { value: "past", label: "Past" }]} />
      </div>

      {loading ? (
        <div className="card"><SkeletonRows rows={5} /></div>
      ) : days.length === 0 ? (
        <div className="card"><EmptyState icon={CalendarDays} title={when === "upcoming" ? "Nothing scheduled yet" : "No past sessions"} text={when === "upcoming" ? "Schedule a session and it will show here and on the public portal." : undefined} /></div>
      ) : (
        days.map(([day, list]) => (
          <section key={day} className="space-y-2">
            <h2 className="px-1 text-[13px] font-semibold text-label-2">{day === localDate() ? "Today" : dayLabel(day)}</h2>
            <ul className="card overflow-hidden list-inset">
              {list.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => edit(s)} className="w-full text-left px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-grouped transition-colors">
                    <span className="h-9 w-1 rounded-full bg-accent flex-shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold truncate">{place(s)}</span>
                      <span className="block text-[13px] text-label-2 truncate">
                        {CATEGORY_LABEL[s.category] ?? s.category}{council(s) && s.category !== "ijtima_arkan" ? ` · ${council(s)}` : ""}
                        {s.syllabus_topics ? <> · Topic {s.syllabus_topics.topic_number}: <BiText text={cleanTitle(s.syllabus_topics.title)} /></> : ""}
                      </span>
                      {s.location && <span className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-label-2"><MapPin className="h-3 w-3" /><BiText text={s.location} /></span>}
                    </span>
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
        title={form?.id ? "Edit session" : "Schedule a session"}
        footer={form && (
          <>
            {form.id && <button type="button" onClick={remove} className="btn btn-danger mr-auto">Delete</button>}
            <button type="button" onClick={() => setForm(null)} className="btn btn-secondary">Cancel</button>
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary">{form.id ? "Save" : "Schedule"}</button>
          </>
        )}
      >
        {form && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block"><span className="form-label">Date</span>
              <input type="date" className="form-input" value={form.session_date} onChange={(e) => setForm({ ...form, session_date: e.target.value })} />
            </label>
            <label className="block"><span className="form-label">Type</span>
              <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="block"><span className="form-label">Union council</span>
              <select className="form-input" value={form.uc_id} onChange={(e) => setForm({ ...form, uc_id: e.target.value, circle_id: "" })}>
                <option value="">Choose a council</option>
                {ucs.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </label>
            {form.category !== "ijtima_arkan" && (
              <label className="block"><span className="form-label">Circle</span>
                <select className="form-input" value={form.circle_id} disabled={!form.uc_id} onChange={(e) => setForm({ ...form, circle_id: e.target.value })}>
                  <option value="">{form.uc_id ? "Choose a circle" : "Choose a council first"}</option>
                  {circles.filter((c) => c.uc_id === form.uc_id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            )}
            <label className="block sm:col-span-2"><span className="form-label">Topic</span>
              <select className="form-input" value={form.topic_id} onChange={(e) => setForm({ ...form, topic_id: e.target.value })}>
                <option value="">No specific topic</option>
                {topics.map((t) => <option key={t.id} value={t.id}>Topic {t.topic_number}: {cleanTitle(t.title)}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2"><span className="form-label">Location</span>
              <input dir="auto" className="form-input" placeholder="Masjid, residence…" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </label>
            <label className="block sm:col-span-2"><span className="form-label">Notes</span>
              <textarea dir="auto" rows={3} className="form-input resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
          </div>
        )}
      </Sheet>
    </div>
  );
}
