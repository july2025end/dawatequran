"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come straight from Supabase / external APIs */

import { LangToggle, useLangDocument, useT } from "@/lib/i18n";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, MessageCircle, Phone, Users } from "lucide-react";
import { Brand, EmptyState, SearchField, ThemeToggle, toast } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { DEFAULT_REPRESENTATIVES, loadRepresentatives, whatsappNumber, type Representative } from "@/lib/representatives";



export default function RepresentativesDirectory() {
  const t = useT();
  const lang = useLangDocument();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUC, setSelectedUC] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [representatives, setRepresentatives] = useState<Representative[]>(DEFAULT_REPRESENTATIVES);

  useEffect(() => {
    async function syncDynamicData() {
      try {
        const [{ reps: base }, { data: dbCircles }] = await Promise.all([
          loadRepresentatives(),
          supabase.from("quran_circles").select("*, union_councils(name)"),
        ]);
        const updated = [...base];
        if (dbCircles && dbCircles.length > 0) {
          // Add murabbis named on circles who aren't in the contact list yet (without a phone number).
          dbCircles.forEach((c: any) => {
            if (c.murabbi_name && c.murabbi_name !== "Pending") {
              const exists = updated.some(
                r => r.name.toLowerCase().includes(c.murabbi_name.toLowerCase()) || 
                     c.murabbi_name.toLowerCase().includes(r.name.toLowerCase())
              );
              if (!exists) {
                const rawUc = c.union_councils?.name || "UC";
                const ucMatch = rawUc.match(/(UC-[\w-]+)/i);
                const ucCode = ucMatch ? ucMatch[1].toUpperCase() : rawUc;
                updated.push({
                  id: `db-${c.id}`,
                  name: c.murabbi_name,
                  role: "Circle Head (Murabbi)",
                  circleName: c.name,
                  uc: ucCode,
                  sector: rawUc,
                  phone: "",
                });
              }
            }
          });
        }
        setRepresentatives(updated);
      } catch (err) {
        console.error("Error fetching live circle reps:", err);
      }
    }
    syncDynamicData();
  }, []);

  // Extract unique UCs for the filter tabs
  const ucList = useMemo(() => {
    const list = Array.from(new Set(representatives.map(r => r.uc))).sort((a, b) => {
      // Natural sorting for UC codes (UC-81, UC-82, ..., UC-90-A, etc.)
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
    return ["All", ...list];
  }, [representatives]);

  // Filtered representatives based on search & UC filter
  const filteredReps = useMemo(() => {
    return representatives.filter(rep => {
      const matchesUC = selectedUC === "All" || rep.uc === selectedUC;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        rep.name.toLowerCase().includes(q) ||
        rep.uc.toLowerCase().includes(q) ||
        rep.sector.toLowerCase().includes(q) ||
        rep.role.toLowerCase().includes(q) ||
        (rep.circleName && rep.circleName.toLowerCase().includes(q)) ||
        rep.phone.includes(q);

      return matchesUC && matchesSearch;
    });
  }, [representatives, selectedUC, searchQuery]);

  const handleCopy = async (phone: string, id: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedId(id);
      toast(t("Number copied"));
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      toast(t("Couldn’t copy the number"), "error");
    }
  };

  // Group by council so people scan to their own area.
  const groups = useMemo(() => {
    const map = new Map<string, Representative[]>();
    for (const r of filteredReps) {
      if (!map.has(r.uc)) map.set(r.uc, []);
      map.get(r.uc)!.push(r);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  }, [filteredReps]);

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-40 material border-b border-separator pt-[env(safe-area-inset-top)]">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Brand size="sm" name={t("Dawat-e-Quran")} subtitle={t("Find your circle")} />
          <div className="flex items-center gap-2">
            <Link href="/portal" className="btn btn-ghost btn-sm"><ArrowLeft className="h-4 w-4" /> {t("Portal")}</Link>
            <LangToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-5">
        <div className="animate-rise">
          <p className="eyebrow">{t("Zone 5 · Islamabad")}</p>
          <h1 className="text-[34px] sm:text-[44px] font-bold tracking-[-0.03em] leading-tight">{t("Find your circle")}</h1>
          <p className="mt-1.5 text-[17px] text-label-2">{t("Contact the representative of the Quran circle in your area by call or WhatsApp.")}</p>
        </div>

        <div className="space-y-3 animate-rise">
          <SearchField value={searchQuery} onChange={setSearchQuery} placeholder={t("Search name, area, council or circle")} />
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            {ucList.map((uc) => (
              <button
                key={uc}
                type="button"
                onClick={() => setSelectedUC(uc)}
                aria-pressed={selectedUC === uc}
                className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-[14px] font-medium transition-colors ${selectedUC === uc ? "bg-label text-white" : "bg-surface text-label shadow-[0_0_0_0.5px_var(--color-separator)] hover:bg-fill"}`}
              >
                {uc === "All" ? t("All councils") : uc}
              </button>
            ))}
          </div>
          <p className="text-[13px] text-label-2">{lang === "ur" ? `${filteredReps.length} نمائندے` : `${filteredReps.length} representative${filteredReps.length === 1 ? "" : "s"}`}</p>
        </div>

        {groups.length === 0 ? (
          <div className="card"><EmptyState icon={Users} title={t("No one matches that search")} text={t("Try an area name such as G-9 or a council number such as UC-85.")} /></div>
        ) : (
          groups.map(([uc, reps]) => (
            <section key={uc} className="space-y-2">
              <h2 className="px-1 text-[13px] font-semibold text-label-2"><bdi>{uc}</bdi> · <bdi>{reps[0].sector}</bdi></h2>
              <ul className="card overflow-hidden list-inset">
                {reps.map((r) => (
                  <li key={r.id} className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="h-11 w-11 flex-shrink-0 rounded-full grid place-items-center bg-fill text-[15px] font-semibold">
                        {r.name.replace(/^(Dr\.|Hafiz|Muhammad|Mohammad)\s+/i, "").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[16px] font-semibold truncate">{r.name}</p>
                        <p className="text-[13px] text-label-2 truncate">{t(r.role)}{r.circleName ? <> · <bdi>{r.circleName}</bdi></> : null}</p>
                        <p className="text-[13px] tabular text-label-2">{r.phone ? <span className="ltr-text">{r.phone}</span> : t("Number not added yet")}</p>
                      </div>
                    </div>
                    {r.phone && (
                      <div className="flex gap-2 sm:flex-shrink-0">
                        <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="btn btn-tinted btn-sm flex-1 sm:flex-none"><Phone className="h-4 w-4" /> {t("Call")}</a>
                        {whatsappNumber(r.phone, r.whatsapp) && (
                          <a href={`https://wa.me/${whatsappNumber(r.phone, r.whatsapp)}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm flex-1 sm:flex-none bg-success-tint text-success hover:brightness-95"><MessageCircle className="h-4 w-4" /> {t("WhatsApp")}</a>
                        )}
                        <button type="button" onClick={() => handleCopy(r.phone, r.id)} className="btn btn-secondary btn-sm btn-icon !min-w-[34px]" aria-label={`Copy ${r.name}'s number`}>
                          {copiedId === r.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
