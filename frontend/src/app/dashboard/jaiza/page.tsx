"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, ClipboardList, Edit2, Loader2, MapPin, Plus, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORY_LABEL, cleanTitle, fetchAll, formatDate, localDate } from "@/lib/data";
import { BiText, EmptyState, PageHeader, SearchField, Segmented, Sheet, SkeletonRows, toast, useSearchParam } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come straight from Supabase joins */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const STATUS_LABEL: Record<string, string> = { present: "Present", absent: "Absent", leave: "Leave" };
const STATUS_CLASS: Record<string, string> = { present: "badge-green", absent: "badge-red", leave: "badge-amber" };
const emptyMember = { full_name: "", phone: "", type: "aam_afraad", circle_id: "" };

const placeOf = (r: any) => (r.category === "ijtima_arkan" ? r.union_councils?.name ?? "Union council" : r.quran_circles?.name ?? "Circle");
const ucOf = (r: any) => (r.category === "ijtima_arkan" ? "Ijtima Arkan" : r.quran_circles?.union_councils?.name ?? "");
/** Present → Absent → (Leave, Ijtima only) → Present */
const nextStatus = (s: string, category: string) => (s === "present" ? "absent" : s === "absent" && category === "ijtima_arkan" ? "leave" : "present");

export default function Reports() {
  // The dashboard's "Data to tidy up" link opens this page with ?duplicates=1. The list renders only after loading, so SSR and client agree.
  // Links from the Overview's Data quality panel open this page pre-filtered (?duplicates=1, ?empty=1, ?notopic=1).
  const pDup = useSearchParam("duplicates"), pEmpty = useSearchParam("empty"), pNoTopic = useSearchParam("notopic");
  const [chosenIssue, setIssue] = useState<"all" | "dup" | "empty" | "notopic" | null>(null);
  const issue = chosenIssue ?? (pDup === "1" ? "dup" : pEmpty === "1" ? "empty" : pNoTopic === "1" ? "notopic" : "all");
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [topics, setTopics] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);

  // Details sheet
  const [viewing, setViewing] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<any[] | null>(null);

  // Edit sheet
  const [editing, setEditing] = useState<any | null>(null);
  const [editPeople, setEditPeople] = useState<any[]>([]);
  const [editMap, setEditMap] = useState<Record<string, string>>({});
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [member, setMember] = useState(emptyMember);

  useEffect(() => { fetchReports(); fetchSupportData(); }, []);

  async function fetchSupportData() {
    const [t, c] = await Promise.all([
      supabase.from("syllabus_topics").select("id, title, topic_number").order("topic_number"),
      supabase.from("quran_circles").select("id, name, uc_id").order("name"),
    ]);
    setTopics(t.data ?? []);
    setCircles(c.data ?? []);
  }

  async function fetchReports() {
    try {
      const data = await fetchAll<any>((f, t) => supabase
        .from("sessions")
        .select(`*, quran_circles (id, name, murabbi_name, uc_id, union_councils (name)), union_councils (name), syllabus_topics (id, title, topic_number), attendance (status)`)
        .order("session_date", { ascending: false })
        .order("id")
        .range(f, t));
      setReports(data);
    } catch (e) {
      toast("Couldn’t load reports: " + (e instanceof Error ? e.message : String(e)), "error");
    }
    setLoading(false);
  }

  async function openDetails(report: any) {
    setViewing(report);
    setAttendance(null);
    await loadAttendance(report.id);
  }

  async function loadAttendance(sessionId: string) {
    const { data, error } = await supabase.from("attendance").select("*, participants (id, full_name, type)").eq("session_id", sessionId);
    if (error) toast(error.message, "error");
    setAttendance((data ?? []).sort((a: any, b: any) => (a.participants?.full_name ?? "").localeCompare(b.participants?.full_name ?? "")));
  }

  async function cycleStatus(a: any) {
    const status = nextStatus(a.status, viewing.category);
    setAttendance((prev) => prev?.map((x) => (x.participant_id === a.participant_id ? { ...x, status } : x)) ?? null);
    const { error } = await supabase.from("attendance").update({ status }).eq("session_id", viewing.id).eq("participant_id", a.participant_id);
    if (error) { toast(error.message, "error"); loadAttendance(viewing.id); return; }
    fetchReports();
  }

  async function handleDelete(report: any) {
    if (!confirm(`Delete the ${CATEGORY_LABEL[report.category] ?? ""} report for ${placeOf(report)} on ${formatDate(report.session_date)}?\n\nIts attendance records are deleted too. This cannot be undone.`)) return;
    const { error } = await supabase.from("sessions").delete().eq("id", report.id);
    if (error) { toast(error.message, "error"); return; }
    toast("Report deleted");
    setViewing(null);
    fetchReports();
  }

  async function loadPeople(report: any) {
    const isIjtima = report.category === "ijtima_arkan";
    setLoadingPeople(true);
    let people: any[] = [];
    if (isIjtima && report.uc_id) {
      const ids = circles.filter((c) => c.uc_id === report.uc_id).map((c) => c.id);
      if (ids.length) {
        const { data } = await supabase.from("participants").select("id, full_name, type").in("circle_id", ids).eq("type", "haazir_arkan").order("full_name");
        people = data ?? [];
      }
    } else if (report.circle_id) {
      const { data } = await supabase.from("participants").select("id, full_name, type").eq("circle_id", report.circle_id).order("full_name");
      people = data ?? [];
    }
    const { data: att } = await supabase.from("attendance").select("participant_id, status").eq("session_id", report.id);
    const map: Record<string, string> = {};
    people.forEach((p) => { map[p.id] = "absent"; });
    (att ?? []).forEach((a) => { if (a.participant_id) map[a.participant_id] = a.status; });
    setEditPeople(people);
    setEditMap(map);
    setLoadingPeople(false);
  }

  async function startEditing(report: any) {
    setViewing(null);
    setAdding(false);
    setMember(emptyMember);
    setEditing({
      ...report,
      session_date: report.session_date?.split("T")[0] ?? "",
      topic_id: report.topic_id ?? "",
      location: report.location ?? "",
      notes: report.notes ?? "",
      attendance_month: report.attendance_month ?? "",
    });
    await loadPeople(report);
  }

  async function changeCircle(circleId: string) {
    const next = { ...editing, circle_id: circleId };
    setEditing(next);
    await loadPeople(next);
  }

  async function addMember() {
    if (!member.full_name.trim()) { toast("Enter the member’s name.", "error"); return; }
    const isIjtima = editing.category === "ijtima_arkan";
    // Ijtima Arkan reports belong to a council, so the new member's circle must be chosen.
    const circleId = isIjtima ? member.circle_id : editing.circle_id;
    if (!circleId) { toast("Choose the member’s circle.", "error"); return; }
    const { data, error } = await supabase.from("participants")
      .insert({ full_name: member.full_name.trim(), phone: member.phone, type: isIjtima ? "haazir_arkan" : member.type, circle_id: circleId, is_active: true })
      .select().single();
    if (error) { toast("Couldn’t add member: " + error.message, "error"); return; }
    setEditPeople((prev) => [...prev, data]);
    setEditMap((prev) => ({ ...prev, [data.id]: "present" }));
    setAdding(false);
    setMember(emptyMember);
    toast(`${data.full_name} added and marked present`);
  }

  async function saveEdit() {
    if (!editing.session_date) { toast("Choose a date.", "error"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("sessions").update({
        session_date: editing.session_date,
        location: editing.location,
        topic_id: editing.topic_id || null,
        notes: editing.notes,
        circle_id: editing.circle_id,
        attendance_month: editing.attendance_month || null,
      }).eq("id", editing.id);
      if (error) throw error;
      const rows = Object.entries(editMap).map(([participant_id, status]) => ({ session_id: editing.id, participant_id, status }));
      if (rows.length) {
        const { error: attErr } = await supabase.from("attendance").upsert(rows, { onConflict: "session_id,participant_id" });
        if (attErr) throw attErr;
      }
      toast("Report updated");
      setEditing(null);
      fetchReports();
    } catch (e) {
      toast("Couldn’t save: " + (e instanceof Error ? e.message : String(e)), "error");
    } finally {
      setSaving(false);
    }
  }

  // Same circle (or council for Ijtima), same type, same day: almost always a report submitted twice.
  const dupIds = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const r of reports) (groups[`${r.category}|${r.circle_id ?? r.uc_id}|${r.session_date}`] ??= []).push(r.id);
    return new Set(Object.values(groups).filter((g) => g.length > 1).flat());
  }, [reports]);

  const months = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = reports.filter((r) => {
      if (issue === "dup" && !dupIds.has(r.id)) return false;
      if (issue === "empty" && (r.attendance?.length || r.session_date > localDate())) return false;
      if (issue === "notopic" && (r.category !== "quran_circle" || r.topic_id || r.session_date > localDate())) return false;
      if (category !== "all" && r.category !== category) return false;
      if (!q) return true;
      return [placeOf(r), ucOf(r), r.syllabus_topics?.title, r.location, r.quran_circles?.murabbi_name].some((v) => v?.toLowerCase().includes(q));
    });
    const groups = new Map<string, any[]>();
    for (const r of shown) {
      const key = r.session_date.slice(0, 7);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }
    return [...groups.entries()].map(([key, rows]) => ({ label: `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`, rows, count: shown.length }));
  }, [reports, query, category, issue, dupIds]);
  const shownCount = months.reduce((n, m) => n + m.rows.length, 0);

  const presentOf = (r: any) => (r.attendance ?? []).filter((a: any) => a.status === "present").length;

  return (
    <div className="px-4 sm:px-6 lg:px-10 pt-6 md:pt-10 max-w-[1000px] mx-auto space-y-5">
      <PageHeader eyebrow="Jaiza" title="Reports" subtitle="Every session submitted by murabbis. Tap a report to see who attended, correct attendance or edit the report." />

      <div className="space-y-2.5 animate-rise">
        <SearchField value={query} onChange={setQuery} placeholder="Search circle, council, topic, murabbi or place" />
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Session type" className="form-input !min-h-[36px] !py-1 !text-[14px] !w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All session types</option>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <Segmented
            label="Show"
            value={issue}
            onChange={setIssue}
            options={[
              { value: "all", label: "All reports" },
              { value: "dup", label: `Possible duplicates (${dupIds.size})` },
              { value: "empty", label: "No attendance" },
              { value: "notopic", label: "No topic" },
            ]}
          />
          {!loading && <span className="text-[13px] text-label-2 ml-auto">{shownCount} report{shownCount === 1 ? "" : "s"}</span>}
        </div>
      </div>

      {loading ? (
        <div className="card"><SkeletonRows rows={7} /></div>
      ) : shownCount === 0 ? (
        <div className="card"><EmptyState icon={ClipboardList} title="No reports found" text={query || category !== "all" || issue !== "all" ? "Try a different search or filter." : "Reports appear here when murabbis submit attendance."} /></div>
      ) : (
        months.map((m) => (
          <section key={m.label} className="space-y-2">
            <h2 className="px-1 text-[13px] font-semibold text-label-2">{m.label}</h2>
            <ul className="card overflow-hidden list-inset">
              {m.rows.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => openDetails(r)} className="w-full text-left px-4 sm:px-5 py-3 grid grid-cols-[auto_1fr_auto_auto] items-center gap-3.5 hover:bg-grouped active:bg-fill transition-colors">
                    <div className="w-11 h-11 rounded-xl bg-fill grid place-items-center text-center leading-none">
                      <span>
                        <span className="block text-[16px] font-bold tabular">{r.session_date.slice(8, 10)}</span>
                        <span className="block text-[10px] font-semibold text-label-2 uppercase mt-0.5">{MONTHS[Number(r.session_date.slice(5, 7)) - 1].slice(0, 3)}</span>
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold truncate">{placeOf(r)}</p>
                      <p className="text-[13px] text-label-2 truncate">
                        {CATEGORY_LABEL[r.category] ?? r.category}
                        {r.category === "ijtima_arkan" && r.attendance_month ? ` · ${r.attendance_month}` : ""}
                        {r.category !== "ijtima_arkan" && ucOf(r) ? ` · ${ucOf(r)}` : ""}
                        {r.syllabus_topics ? ` · Topic ${r.syllabus_topics.topic_number}` : ""}
                      </p>
                      {dupIds.has(r.id) && <span className="badge badge-amber mt-1">Possible duplicate</span>}
                    </div>
                    <p className="text-right leading-tight">
                      <span className="text-[17px] font-semibold tabular">{presentOf(r)}</span>
                      <span className="text-[13px] text-label-2">/{r.attendance?.length ?? 0}</span>
                      <span className="block text-[11px] text-label-2">present</span>
                    </p>
                    <ChevronRight className="h-4 w-4 text-label-3" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {/* Details */}
      <Sheet
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? placeOf(viewing) : ""}
        subtitle={viewing ? `${CATEGORY_LABEL[viewing.category] ?? viewing.category} · ${formatDate(viewing.session_date)}` : ""}
        footer={viewing && (
          <>
            <button type="button" onClick={() => handleDelete(viewing)} className="btn btn-danger mr-auto"><Trash2 className="h-4 w-4" /> Delete</button>
            <button type="button" onClick={() => startEditing(viewing)} className="btn btn-primary"><Edit2 className="h-4 w-4" /> Edit report</button>
          </>
        )}
      >
        {viewing && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-[13px]">
              {viewing.syllabus_topics && <span className="badge badge-blue">Topic {viewing.syllabus_topics.topic_number}: <BiText text={cleanTitle(viewing.syllabus_topics.title)} /></span>}
              {viewing.location && <span className="badge badge-gray"><MapPin className="h-3 w-3" /> <BiText text={viewing.location} /></span>}
              {viewing.quran_circles?.murabbi_name && <span className="badge badge-gray">Murabbi: {viewing.quran_circles.murabbi_name}</span>}
            </div>
            {viewing.notes && <p className="text-[15px] text-label-2 whitespace-pre-wrap" dir="auto">{viewing.notes}</p>}
            <div>
              <p className="text-[13px] font-semibold text-label-2 mb-2">Attendance · tap a status to change it</p>
              {attendance === null ? (
                <div className="flex items-center gap-2 py-6 justify-center text-label-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
              ) : attendance.length === 0 ? (
                <p className="text-[15px] text-label-2 py-4">No attendance was marked for this session.</p>
              ) : (
                <ul className="card-inset overflow-hidden list-inset">
                  {attendance.map((a) => (
                    <li key={a.participant_id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-surface">
                      <div className="min-w-0">
                        <p className="text-[15px] truncate"><BiText text={a.participants?.full_name ?? "Removed member"} /></p>
                        <p className="text-[12px] text-label-2">{a.participants?.type === "haazir_arkan" ? "Arkan" : "Public"}</p>
                      </div>
                      <button type="button" onClick={() => cycleStatus(a)} className={`badge ${STATUS_CLASS[a.status] ?? "badge-gray"} !text-[13px] !px-3 !py-1.5 min-w-[78px] justify-center`}>
                        {STATUS_LABEL[a.status] ?? a.status}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Sheet>

      {/* Edit */}
      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        wide
        title="Edit report"
        subtitle={editing ? `${placeOf(editing)} · ${CATEGORY_LABEL[editing.category] ?? editing.category}` : ""}
        footer={editing && (
          <>
            <button type="button" onClick={() => setEditing(null)} className="btn btn-secondary">Cancel</button>
            <button type="button" onClick={saveEdit} disabled={saving} className="btn btn-primary">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes</button>
          </>
        )}
      >
        {editing && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block"><span className="form-label">Date</span>
                <input type="date" className="form-input" value={editing.session_date} onChange={(e) => setEditing({ ...editing, session_date: e.target.value })} />
              </label>
              {editing.category === "ijtima_arkan" ? (
                <label className="block"><span className="form-label">Attendance month</span>
                  <select className="form-input" value={editing.attendance_month} onChange={(e) => setEditing({ ...editing, attendance_month: e.target.value })}>
                    <option value="">Not set</option>
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
              ) : (
                <label className="block"><span className="form-label">Circle</span>
                  <select className="form-input" value={editing.circle_id ?? ""} onChange={(e) => changeCircle(e.target.value)}>
                    {circles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
              )}
              {editing.category !== "ijtima_arkan" && (
                <label className="block sm:col-span-2"><span className="form-label">Topic</span>
                  <select className="form-input" value={editing.topic_id} onChange={(e) => setEditing({ ...editing, topic_id: e.target.value })}>
                    <option value="">No topic</option>
                    {topics.map((t) => <option key={t.id} value={t.id}>Topic {t.topic_number}: {cleanTitle(t.title)}</option>)}
                  </select>
                </label>
              )}
              <label className="block sm:col-span-2"><span className="form-label">Location</span>
                <input dir="auto" className="form-input" value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} placeholder="Masjid, residence…" />
              </label>
              <label className="block sm:col-span-2"><span className="form-label">Notes</span>
                <textarea dir="auto" rows={3} className="form-input resize-none" value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-semibold text-label-2">Attendance ({Object.values(editMap).filter((s) => s === "present").length} present)</p>
                <button type="button" onClick={() => setAdding((v) => !v)} className="btn btn-tinted btn-sm"><UserPlus className="h-4 w-4" /> Add member</button>
              </div>
              {adding && (
                <div className="card-inset p-3 mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade">
                  <input dir="auto" className="form-input" placeholder="Full name" value={member.full_name} onChange={(e) => setMember({ ...member, full_name: e.target.value })} />
                  <input className="form-input" type="tel" inputMode="tel" placeholder="Phone (optional)" value={member.phone} onChange={(e) => setMember({ ...member, phone: e.target.value })} />
                  {editing.category === "ijtima_arkan" ? (
                    <select className="form-input" value={member.circle_id} onChange={(e) => setMember({ ...member, circle_id: e.target.value })}>
                      <option value="">Member’s circle</option>
                      {circles.filter((c) => c.uc_id === editing.uc_id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ) : (
                    <select className="form-input" value={member.type} onChange={(e) => setMember({ ...member, type: e.target.value })}>
                      <option value="aam_afraad">Public (Aam Afraad)</option>
                      <option value="haazir_arkan">Arkan (Haazir Arkan)</option>
                    </select>
                  )}
                  <button type="button" onClick={addMember} className="btn btn-primary"><Plus className="h-4 w-4" /> Add and mark present</button>
                </div>
              )}
              {loadingPeople ? (
                <div className="flex items-center gap-2 py-6 justify-center text-label-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading members…</div>
              ) : editPeople.length === 0 ? (
                <p className="text-[15px] text-label-2 py-3">No members found for this report.</p>
              ) : (
                <ul className="card-inset overflow-hidden list-inset">
                  {editPeople.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-surface">
                      <span className="text-[15px] min-w-0 truncate"><BiText text={p.full_name} /></span>
                      <Segmented
                        label={`Status for ${p.full_name}`}
                        value={editMap[p.id] ?? "absent"}
                        onChange={(v) => setEditMap({ ...editMap, [p.id]: v })}
                        options={[
                          { value: "present", label: "Present" },
                          ...(editing.category === "ijtima_arkan" ? [{ value: "leave", label: "Leave" }] : []),
                          { value: "absent", label: "Absent" },
                        ]}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
