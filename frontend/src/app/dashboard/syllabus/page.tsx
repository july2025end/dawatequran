"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, CalendarRange, ChevronRight, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SURAHS } from "@/lib/surahs";
import { cleanTitle, formatDate, localDate } from "@/lib/data";
import { BiText, EmptyState, PageHeader, QuranRef, SearchField, Sheet, SkeletonRows, toast } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come straight from Supabase */

type Form = { id: string | null; topic_number: number; title: string; sura: number; from: number; to: number; start_date: string; end_date: string };

/** Reference text is stored as "<urdu> (<english>) <from>-<to>", e.g. "الفاتحة (Al-Fatiha) 1-7". */
function parseReference(ref: string | null) {
  const m = ref?.match(/\(([^)]+)\)\s*(\d+)-(\d+)/);
  const sura = SURAHS.find((s) => s.english === m?.[1]);
  return { sura: sura?.id ?? 1, from: m ? Number(m[2]) : 1, to: m ? Number(m[3]) : 7 };
}

export default function Syllabus() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [fill, setFill] = useState<{ start: string; days: number } | null>(null);

  useEffect(() => { fetchSyllabus(); }, []);

  async function fetchSyllabus() {
    const { data, error } = await supabase.from("syllabus_topics").select("*").order("topic_number");
    if (error) toast("Couldn’t load the syllabus: " + error.message, "error");
    setTopics(data ?? []);
    setLoading(false);
  }

  const today = localDate();
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return topics.filter((t) => !q || t.title?.toLowerCase().includes(q) || t.reference?.toLowerCase().includes(q) || String(t.topic_number) === q);
  }, [topics, query]);

  function edit(t: any) {
    setForm({ id: t.id, topic_number: t.topic_number, title: t.title ?? "", ...parseReference(t.reference), start_date: t.start_date ?? "", end_date: t.end_date ?? "" });
  }

  const surah = form ? SURAHS.find((s) => s.id === form.sura) : undefined;

  async function save() {
    if (!form || !surah) return;
    if (!form.title.trim()) { toast("Enter a title.", "error"); return; }
    if (form.from < 1 || form.to < form.from || form.to > surah.verses) { toast(`Choose verses between 1 and ${surah.verses}.`, "error"); return; }
    if (form.start_date && form.end_date && form.end_date < form.start_date) { toast("The end date is before the start date.", "error"); return; }
    setSaving(true);
    const payload = {
      topic_number: form.topic_number, title: form.title.trim(),
      reference: `${surah.urdu} (${surah.english}) ${form.from}-${form.to}`,
      start_date: form.start_date || null, end_date: form.end_date || null,
    };
    const { error } = form.id ? await supabase.from("syllabus_topics").update(payload).eq("id", form.id) : await supabase.from("syllabus_topics").insert([payload]);
    setSaving(false);
    if (error) {
      // topic_number is unique, so the usual cause is reusing a number.
      toast(error.code === "23505" ? `Topic ${payload.topic_number} already exists. Choose another number.` : "Couldn’t save: " + error.message, "error");
      return;
    }
    toast(form.id ? "Topic updated" : "Topic added");
    setForm(null);
    fetchSyllabus();
  }

  async function remove() {
    if (!form?.id || !confirm(`Delete topic ${form.topic_number}? Sessions that used it keep their attendance but lose the topic.`)) return;
    const { error } = await supabase.from("syllabus_topics").delete().eq("id", form.id);
    if (error) { toast(error.message, "error"); return; }
    toast("Topic deleted");
    setForm(null);
    fetchSyllabus();
  }

  const nextNumber = topics.reduce((m, t) => Math.max(m, t.topic_number ?? 0), 0) + 1;

  // Auto-fill: give every undated topic, in number order, a run of days after the start date.
  const undated = topics.filter((t) => !t.start_date).sort((a, b) => a.topic_number - b.topic_number);
  const addDays = (iso: string, n: number) => { const [y, m, d] = iso.split("-").map(Number); return localDate(new Date(y, m - 1, d + n)); };
  const plan = fill && fill.start && fill.days > 0
    ? undated.map((t, i) => ({ t, start: addDays(fill.start, i * fill.days), end: addDays(fill.start, i * fill.days + fill.days - 1) }))
    : [];

  function openFill() {
    // Start the day after the last dated topic ends, or today if none have dates.
    const lastEnd = topics.map((t) => t.end_date).filter(Boolean).sort().at(-1);
    setFill({ start: lastEnd ? addDays(lastEnd, 1) : localDate(), days: 7 });
  }

  async function applyFill() {
    if (!plan.length) return;
    if (!confirm(`Set teaching dates for ${plan.length} topics, from ${formatDate(plan[0].start)} to ${formatDate(plan.at(-1)!.end)}? Topics that already have dates are not changed.`)) return;
    setSaving(true);
    let done = 0;
    for (const p of plan) {
      const { error } = await supabase.from("syllabus_topics").update({ start_date: p.start, end_date: p.end }).eq("id", p.t.id);
      if (error) { toast(`Stopped after ${done} topics: ${error.message}`, "error"); break; }
      done++;
    }
    setSaving(false);
    if (done === plan.length) toast(`Dates set for ${done} topics`);
    setFill(null);
    fetchSyllabus();
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 pt-6 md:pt-10 max-w-[1000px] mx-auto space-y-5">
      <PageHeader
        eyebrow="Curriculum"
        title="Syllabus"
        subtitle={loading ? "Loading topics…" : `${topics.length} topics with their Quran passages and teaching dates.`}
        actions={
          <>
            {undated.length > 0 && <button type="button" onClick={openFill} className="btn btn-secondary"><CalendarRange className="h-4 w-4" /> Auto-fill {undated.length} dates</button>}
            <button type="button" onClick={() => setForm({ id: null, topic_number: nextNumber, title: "", sura: 1, from: 1, to: 7, start_date: "", end_date: "" })} className="btn btn-primary"><Plus className="h-4 w-4" /> Add topic</button>
          </>
        }
      />
      <div className="animate-rise"><SearchField value={query} onChange={setQuery} placeholder="Search topic, surah or number" /></div>

      {loading ? (
        <div className="card"><SkeletonRows rows={8} /></div>
      ) : shown.length === 0 ? (
        <div className="card"><EmptyState icon={BookOpen} title="No topics found" /></div>
      ) : (
        <ul className="card overflow-hidden list-inset">
          {shown.map((t) => {
            const current = t.start_date && t.end_date && t.start_date <= today && today <= t.end_date;
            return (
              <li key={t.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-grouped transition-colors">
                <button type="button" onClick={() => edit(t)} className="flex flex-1 min-w-0 items-center gap-3.5 text-left" aria-label={`Edit topic ${t.topic_number}`}>
                  <span className={`h-10 w-10 flex-shrink-0 rounded-xl grid place-items-center text-[15px] font-bold tabular ${current ? "bg-accent-fill text-white" : "bg-fill text-label"}`}>{t.topic_number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold truncate"><BiText text={cleanTitle(t.title)} /></span>
                      {current && <span className="badge badge-blue">This week</span>}
                    </span>
                    <span className="block text-[13px] text-label-2 truncate"><QuranRef reference={t.reference} /></span>
                    {t.start_date && <span className="block text-[12px] text-label-3">{formatDate(t.start_date)}{t.end_date ? ` – ${formatDate(t.end_date)}` : ""}</span>}
                  </span>
                </button>
                <Link href={`/portal/topic/${t.id}`} className="btn btn-ghost btn-sm flex-shrink-0">Read <ChevronRight className="h-4 w-4" /></Link>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet
        open={!!fill}
        onClose={() => setFill(null)}
        title="Auto-fill teaching dates"
        subtitle={`${undated.length} topics have no dates. They are filled in topic order; dated topics stay as they are.`}
        footer={<><button type="button" className="btn btn-secondary" onClick={() => setFill(null)}>Cancel</button><button type="button" className="btn btn-primary" disabled={saving || !plan.length} onClick={applyFill}>{saving ? "Saving…" : `Set ${plan.length} dates`}</button></>}
      >
        {fill && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="form-label">First topic starts</span>
                <input type="date" className="form-input" value={fill.start} onChange={(e) => setFill({ ...fill, start: e.target.value })} />
              </label>
              <label className="block"><span className="form-label">Days per topic</span>
                <input type="number" inputMode="numeric" min={1} max={60} className="form-input" value={fill.days} onChange={(e) => setFill({ ...fill, days: Math.max(1, Number(e.target.value) || 1) })} />
              </label>
            </div>
            <div>
              <p className="form-label">Preview</p>
              <ul className="card-inset overflow-hidden list-inset max-h-72 overflow-y-auto">
                {plan.map((p) => (
                  <li key={p.t.id} className="flex items-center justify-between gap-3 px-3.5 py-2 bg-surface text-[14px]">
                    <span className="min-w-0 truncate"><span className="font-semibold tabular mr-2">{p.t.topic_number}</span><BiText text={cleanTitle(p.t.title)} /></span>
                    <span className="text-label-2 tabular flex-shrink-0">{formatDate(p.start)} – {formatDate(p.end)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Sheet>

      <Sheet
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? `Edit topic ${form.topic_number}` : "Add topic"}
        footer={form && (
          <>
            {form.id && <button type="button" onClick={remove} className="btn btn-danger mr-auto">Delete</button>}
            <button type="button" onClick={() => setForm(null)} className="btn btn-secondary">Cancel</button>
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary">{form.id ? "Save" : "Add topic"}</button>
          </>
        )}
      >
        {form && surah && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="form-label">Topic number</span>
              <input type="number" inputMode="numeric" min={1} className="form-input" value={form.topic_number} onChange={(e) => setForm({ ...form, topic_number: Number(e.target.value) })} />
            </label>
            <div />
            <label className="block col-span-2"><span className="form-label">Title</span>
              <input className="form-input" dir="auto" placeholder="e.g. ثنائے رب (Praise of the Lord)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="block col-span-2"><span className="form-label">Surah</span>
              <select className="form-input" value={form.sura} onChange={(e) => { const s = SURAHS.find((x) => x.id === Number(e.target.value))!; setForm({ ...form, sura: s.id, from: 1, to: Math.min(form.to, s.verses) }); }}>
                {SURAHS.map((s) => <option key={s.id} value={s.id}>{s.id}. {s.english} · {s.urdu}</option>)}
              </select>
            </label>
            <label className="block"><span className="form-label">From verse</span>
              <input type="number" inputMode="numeric" min={1} max={surah.verses} className="form-input" value={form.from} onChange={(e) => setForm({ ...form, from: Number(e.target.value) })} />
            </label>
            <label className="block"><span className="form-label">To verse (max {surah.verses})</span>
              <input type="number" inputMode="numeric" min={form.from} max={surah.verses} className="form-input" value={form.to} onChange={(e) => setForm({ ...form, to: Number(e.target.value) })} />
            </label>
            <label className="block"><span className="form-label">Teaching starts</span>
              <input type="date" className="form-input" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </label>
            <label className="block"><span className="form-label">Teaching ends</span>
              <input type="date" className="form-input" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </label>
            <p className="col-span-2 rounded-xl bg-fill px-3.5 py-2.5 text-[14px]">
              <span className="text-label-2">Reference: </span>
              <QuranRef reference={`${surah.urdu} (${surah.english}) ${form.from}-${form.to}`} className="font-medium" />
            </p>
          </div>
        )}
      </Sheet>
    </div>
  );
}
