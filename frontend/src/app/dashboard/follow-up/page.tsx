"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, HeartHandshake, MessageCircle, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchAll, formatDate, localDate } from "@/lib/data";
import { MemberSummary, downloadCsv, loadMemberSummaries } from "@/lib/queries";
import { whatsappNumber } from "@/lib/representatives";
import { BiText, EmptyState, PageHeader, SearchField, Segmented, SkeletonRows, toast } from "@/components/ui";

type Person = { id: string; full_name: string; phone: string | null; type: string; circle_id: string; is_active: boolean };
type Circle = { id: string; name: string; uc_id: string; murabbi_name: string | null };

// A gentle message, not a reprimand: the aim is to bring people back.
const message = (name: string) => `السلام علیکم ${name}، قرآن سرکل میں آپ کی کمی محسوس ہوئی۔ ان شاء اللہ اگلی نشست میں آپ سے ملاقات ہوگی۔`;

export default function FollowUp() {
  const [people, setPeople] = useState<Person[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [ucs, setUcs] = useState<{ id: string; name: string }[]>([]);
  const [summary, setSummary] = useState<Map<string, MemberSummary>>(new Map());
  const [loading, setLoading] = useState(true);
  const [uc, setUc] = useState("all");
  const [type, setType] = useState<"all" | "haazir_arkan" | "aam_afraad">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [p, c, u, s] = await Promise.all([
          fetchAll<Person>((f, t) => supabase.from("participants").select("id, full_name, phone, type, circle_id, is_active").eq("is_active", true).order("id").range(f, t)),
          supabase.from("quran_circles").select("id, name, uc_id, murabbi_name").order("name"),
          supabase.from("union_councils").select("id, name").order("name"),
          fetchAll<{ id: string; session_date: string }>((f, t) => supabase.from("sessions").select("id, session_date").order("id").range(f, t)),
        ]);
        setPeople(p); setCircles(c.data ?? []); setUcs(u.data ?? []);
        setSummary(await loadMemberSummaries(new Map(s.map((x) => [x.id, x.session_date])), localDate()));
      } catch (e) {
        toast("Couldn’t load the follow-up list: " + (e instanceof Error ? e.message : String(e)), "error");
      }
      setLoading(false);
    })();
  }, []);

  const circleById = useMemo(() => new Map(circles.map((c) => [c.id, c])), [circles]);
  const ucName = useMemo(() => new Map(ucs.map((u) => [u.id, u.name])), [ucs]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const due = people.filter((p) => {
      const m = summary.get(p.id);
      if (!m || m.recent.length < 3 || !m.recent.every((s) => s === "absent")) return false;
      const c = circleById.get(p.circle_id);
      return (type === "all" || p.type === type) && (uc === "all" || c?.uc_id === uc) && (!q || p.full_name.toLowerCase().includes(q) || c?.name.toLowerCase().includes(q));
    });
    const by = new Map<string, Person[]>();
    for (const p of due) (by.get(p.circle_id) ?? by.set(p.circle_id, []).get(p.circle_id)!).push(p);
    return [...by.entries()]
      .map(([cid, list]) => ({ circle: circleById.get(cid), list: list.sort((a, b) => (summary.get(a.id)?.lastPresent ?? "").localeCompare(summary.get(b.id)?.lastPresent ?? "")) }))
      .sort((a, b) => b.list.length - a.list.length);
  }, [people, summary, circleById, uc, type, query]);
  const total = groups.reduce((n, g) => n + g.list.length, 0);

  function exportCsv() {
    const rows: (string | number | null)[][] = [["Name", "Type", "Phone", "Circle", "Union council", "Murabbi", "Last present", "Present", "Marked"]];
    for (const g of groups) for (const p of g.list) {
      const m = summary.get(p.id)!;
      rows.push([p.full_name, p.type === "haazir_arkan" ? "Arkan" : "Public", p.phone, g.circle?.name ?? "", ucName.get(g.circle?.uc_id ?? "") ?? "", g.circle?.murabbi_name ?? "", m.lastPresent ?? "Never", m.present, m.marked]);
    }
    downloadCsv(`follow-up-${localDate()}.csv`, rows);
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 pt-6 md:pt-10 max-w-[1000px] mx-auto space-y-5">
      <PageHeader
        eyebrow="Follow-up"
        title="Members to contact"
        subtitle={loading ? "Finding members who have been away…" : `${total} members missed their last 3 classes in a row. A call or message often brings them back.`}
        actions={total > 0 ? <button type="button" onClick={exportCsv} className="btn btn-secondary btn-sm"><Download className="h-4 w-4" /> Export</button> : undefined}
      />
      <div className="space-y-2.5 animate-rise">
        <SearchField value={query} onChange={setQuery} placeholder="Search member or circle" />
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Member type" value={type} onChange={setType} options={[{ value: "all", label: "All" }, { value: "haazir_arkan", label: "Arkan" }, { value: "aam_afraad", label: "Public" }]} />
          <select aria-label="Union council" className="form-input !min-h-[36px] !py-1 !text-[14px] !w-auto" value={uc} onChange={(e) => setUc(e.target.value)}>
            <option value="all">All councils</option>
            {ucs.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card"><SkeletonRows rows={6} /></div>
      ) : total === 0 ? (
        <div className="card"><EmptyState icon={HeartHandshake} title="Nobody to follow up" text="No member has missed three classes in a row with these filters." /></div>
      ) : (
        groups.map(({ circle, list }) => (
          <section key={circle?.id ?? "none"} className="space-y-2">
            <h2 className="px-1 text-[13px] font-semibold text-label-2">
              {circle?.name ?? "No circle"} · {ucName.get(circle?.uc_id ?? "") ?? ""}{circle?.murabbi_name ? ` · Murabbi: ${circle.murabbi_name}` : ""} · {list.length}
            </h2>
            <ul className="card overflow-hidden list-inset">
              {list.map((p) => {
                const m = summary.get(p.id)!;
                const wa = whatsappNumber(p.phone);
                return (
                  <li key={p.id} className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold truncate"><BiText text={p.full_name} /></p>
                      <p className="text-[13px] text-label-2">
                        {p.type === "haazir_arkan" ? "Arkan" : "Public"} · {m.lastPresent ? `Last came ${formatDate(m.lastPresent)}` : "Never present yet"} · {m.present} of {m.marked} classes
                      </p>
                    </div>
                    {p.phone ? (
                      <div className="flex gap-2">
                        <a href={`tel:${p.phone.replace(/[^\d+]/g, "")}`} className="btn btn-tinted btn-sm flex-1 sm:flex-none"><Phone className="h-4 w-4" /> Call</a>
                        {wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(message(p.full_name))}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm flex-1 sm:flex-none bg-success-tint text-success hover:brightness-95"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
                      </div>
                    ) : (
                      <span className="text-[13px] text-label-2">No phone number</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
