"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come straight from Supabase / external APIs */

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, MessageCircle, Phone, Users } from "lucide-react";
import { EmptyState, SearchField, toast } from "@/components/ui";
import { supabase } from "@/lib/supabase";

// Comprehensive verified representatives directory for Zone 5
interface Representative {
  id: string;
  name: string;
  role: string;
  circleName?: string;
  uc: string;
  sector: string;
  phone: string;
  whatsapp?: string;
  status?: string;
}

const DEFAULT_REPRESENTATIVES: Representative[] = [
  // UC-81 (G-9/3)
  {
    id: "rep-81-1",
    name: "Muhammad Rashid",
    role: "Nazim UC",
    circleName: "UC Leadership",
    uc: "UC-81",
    sector: "G-9/3 Karachi Company",
    phone: "+92 331 6378566",
    whatsapp: "923316378566"
  },
  {
    id: "rep-81-2",
    name: "Hafiz Mubarak Ahmed",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 2",
    uc: "UC-81",
    sector: "G-9/3 Karachi Company",
    phone: "+92 302 5211231",
    whatsapp: "923025211231"
  },
  {
    id: "rep-81-3",
    name: "Dr. Zaheer-ud-Din Bahram",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 3",
    uc: "UC-81",
    sector: "G-9/3 Karachi Company",
    phone: "+92 314 5262303",
    whatsapp: "923145262303"
  },
  {
    id: "rep-81-4",
    name: "Professor Abdul Sami",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 1",
    uc: "UC-81",
    sector: "G-9/3 Karachi Company",
    phone: "+92 322 5006262",
    whatsapp: "923225006262"
  },
  {
    id: "rep-81-5",
    name: "Muhammad Akhtar Abbas",
    role: "Nazim Bait-ul-Maal",
    circleName: "Circle 4",
    uc: "UC-81",
    sector: "G-9/3 Karachi Company",
    phone: "+92 301 7746424",
    whatsapp: "923017746424"
  },

  // UC-82 (G-9/2)
  {
    id: "rep-82-1",
    name: "Abdul Subhan",
    role: "Nazim UC",
    circleName: "UC Leadership",
    uc: "UC-82",
    sector: "G-9/2",
    phone: "+92 334 5328863",
    whatsapp: "923345328863"
  },
  {
    id: "rep-82-2",
    name: "Mubarak Ahmed",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 1",
    uc: "UC-82",
    sector: "G-9/2",
    phone: "+92 302 5211231",
    whatsapp: "923025211231"
  },
  {
    id: "rep-82-3",
    name: "Abdul Samad",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 2",
    uc: "UC-82",
    sector: "G-9/2",
    phone: "+92 310 9064070",
    whatsapp: "923109064070"
  },

  // UC-83 (G-9/4)
  {
    id: "rep-83-1",
    name: "Azhar Baloch",
    role: "Nazim UC",
    circleName: "UC Leadership",
    uc: "UC-83",
    sector: "G-9/4",
    phone: "+92 333 5152913",
    whatsapp: "923335152913"
  },
  {
    id: "rep-83-2",
    name: "Dr. Mubeen Siddiqui",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 1",
    uc: "UC-83",
    sector: "G-9/4",
    phone: "+92 333 5152913",
    whatsapp: "923335152913"
  },

  // UC-84 (G-10/2-3)
  {
    id: "rep-84-1",
    name: "Safeer Ahmed Mughal",
    role: "Nazim UC",
    circleName: "UC Leadership",
    uc: "UC-84",
    sector: "G-10/2-3",
    phone: "+92 300 8270709",
    whatsapp: "923008270709"
  },
  {
    id: "rep-84-2",
    name: "Maaz Siddiqui",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 1",
    uc: "UC-84",
    sector: "G-10/2-3",
    phone: "+92 317 5853656",
    whatsapp: "923175853656"
  },
  {
    id: "rep-84-3",
    name: "Ghulam Sarwar Shakir",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 3",
    uc: "UC-84",
    sector: "G-10/2-3",
    phone: "+92 300 8563212",
    whatsapp: "923008563212"
  },
  {
    id: "rep-84-4",
    name: "Ghulam Mustafa",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 4",
    uc: "UC-84",
    sector: "G-10/2-3",
    phone: "+92 344 5844503",
    whatsapp: "923445844503"
  },

  // UC-85 (G-10/1-4)
  {
    id: "rep-85-1",
    name: "Nadeem Ahmed Subhani",
    role: "Nazim UC",
    circleName: "UC Leadership",
    uc: "UC-85",
    sector: "G-10/1-4",
    phone: "+92 300 8270709",
    whatsapp: "923008270709"
  },
  {
    id: "rep-85-2",
    name: "Dr. Tahir Farooq",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 1",
    uc: "UC-85",
    sector: "G-10/1-4",
    phone: "+92 317 5853656",
    whatsapp: "923175853656"
  },
  {
    id: "rep-85-3",
    name: "Abdullah Sarfraz",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 2",
    uc: "UC-85",
    sector: "G-10/1-4",
    phone: "+92 335 5527165",
    whatsapp: "923355527165"
  },
  {
    id: "rep-85-4",
    name: "Abdul Quddus Qureshi",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 3",
    uc: "UC-85",
    sector: "G-10/1-4",
    phone: "+92 332 4833364",
    whatsapp: "923324833364"
  },

  // UC-86 (G-11/1-2)
  {
    id: "rep-86-1",
    name: "Muhammad Zia-ur-Rahman",
    role: "Nazim UC",
    circleName: "UC Leadership",
    uc: "UC-86",
    sector: "G-11/1-2",
    phone: "+92 331 5418491",
    whatsapp: "923315418491"
  },
  {
    id: "rep-86-2",
    name: "Hafiz Bakht Ali",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 2",
    uc: "UC-86",
    sector: "G-11/1-2",
    phone: "+92 300 5395004",
    whatsapp: "923005395004"
  },
  {
    id: "rep-86-3",
    name: "Farid Brohi",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 4",
    uc: "UC-86",
    sector: "G-11/1-2",
    phone: "+92 333 2386693",
    whatsapp: "923332386693"
  },
  {
    id: "rep-86-4",
    name: "Mushtaq Ahmed",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 5",
    uc: "UC-86",
    sector: "G-11/1-2",
    phone: "+92 300 8555441",
    whatsapp: "923008555441"
  },
  {
    id: "rep-86-5",
    name: "Sagheer Ahmed Bhatti",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 3",
    uc: "UC-86",
    sector: "G-11/1-2",
    phone: "+92 335 55564448",
    whatsapp: "923355564448"
  },

  // UC-87 (G-11/3-4)
  {
    id: "rep-87-1",
    name: "Shabbir Hussain",
    role: "Nazim UC",
    circleName: "UC Leadership",
    uc: "UC-87",
    sector: "G-11/3-4",
    phone: "+92 312 5597792",
    whatsapp: "923125597792"
  },
  {
    id: "rep-87-2",
    name: "Muhammad Tayyab Siddiqui",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 2",
    uc: "UC-87",
    sector: "G-11/3-4",
    phone: "+92 300 8593979",
    whatsapp: "923008593979"
  },
  {
    id: "rep-87-3",
    name: "Syed Mahmood Ahmed",
    role: "Nazim Circle",
    circleName: "Circle 1",
    uc: "UC-87",
    sector: "G-11/3-4",
    phone: "+92 321 9595369",
    whatsapp: "923219595369"
  },
  {
    id: "rep-87-4",
    name: "Zaheer Ahmed",
    role: "Representative",
    circleName: "Circle Coordination",
    uc: "UC-87",
    sector: "G-11/3-4",
    phone: "+92 336 5573767",
    whatsapp: "923365573767"
  },

  // UC-88 (I-8/2-3)
  {
    id: "rep-88-1",
    name: "Najeeb Abbasi",
    role: "Nazim UC",
    circleName: "UC Leadership",
    uc: "UC-88",
    sector: "I-8/2-3, H-8",
    phone: "+92 300 5009351",
    whatsapp: "923005009351"
  },
  {
    id: "rep-88-2",
    name: "Muhammad Zubair Siddiqui",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 1",
    uc: "UC-88",
    sector: "I-8/2-3",
    phone: "+92 302 9200212",
    whatsapp: "923029200212"
  },
  {
    id: "rep-88-3",
    name: "Shams-ul-Islam Abbasi",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 2",
    uc: "UC-88",
    sector: "I-8/2-3",
    phone: "+92 345 5236663",
    whatsapp: "923455236663"
  },

  // UC-89 (I-8/1-4)
  {
    id: "rep-89-1",
    name: "Noor Zaman",
    role: "Nazim UC",
    circleName: "UC Leadership",
    uc: "UC-89",
    sector: "I-8/1-4",
    phone: "+92 333 5685268",
    whatsapp: "923335685268"
  },
  {
    id: "rep-89-2",
    name: "Muhammad Qayyum Johar",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 2",
    uc: "UC-89",
    sector: "I-8/1-4",
    phone: "+92 334 5450677",
    whatsapp: "923345450677"
  },
  {
    id: "rep-89-3",
    name: "Haroon Rashid",
    role: "Circle Head (Murabbi)",
    circleName: "Circle 1",
    uc: "UC-89",
    sector: "I-8/1-4",
    phone: "+92 342 1114206",
    whatsapp: "923421114206"
  },

  // UC-90-A (I-9/4)
  {
    id: "rep-90a-1",
    name: "Ehsan-ul-Haq",
    role: "Nazim UC",
    circleName: "UC Leadership",
    uc: "UC-90-A",
    sector: "I-9/4",
    phone: "+92 302 5761075",
    whatsapp: "923025761075"
  },
  {
    id: "rep-90a-2",
    name: "Ahsan Qaseem Abbasi",
    role: "Circle Representative",
    circleName: "Circle 1",
    uc: "UC-90-A",
    sector: "I-9/4",
    phone: "+92 300 9700050",
    whatsapp: "923009700050"
  },

  // UC-90-B (I-9/1)
  {
    id: "rep-90b-1",
    name: "Ashfaq Ahmed",
    role: "Nazim UC",
    circleName: "UC Leadership",
    uc: "UC-90-B",
    sector: "I-9/1-2-3, H-9",
    phone: "+92 321 6351590",
    whatsapp: "923216351590"
  },
  {
    id: "rep-90b-2",
    name: "Col. Khalid Mahmood Abbasi",
    role: "Nazim Circle",
    circleName: "Circle 1",
    uc: "UC-90-B",
    sector: "I-9/1-2-3, H-9",
    phone: "+92 301 8546915",
    whatsapp: "923018546915"
  },

  // UC-91 (I-10/4)
  {
    id: "rep-91-1",
    name: "Anas Zubair",
    role: "Nazim UC",
    circleName: "UC Leadership",
    uc: "UC-91",
    sector: "I-10/4",
    phone: "+92 331 5044580",
    whatsapp: "923315044580"
  },
  {
    id: "rep-91-2",
    name: "Inayatullah",
    role: "Nazim Circle",
    circleName: "Circle 1",
    uc: "UC-91",
    sector: "I-10/4",
    phone: "+92 310 2346205",
    whatsapp: "923102346205"
  },
  {
    id: "rep-91-3",
    name: "Tariq Malik",
    role: "Circle Representative",
    circleName: "Circle 2",
    uc: "UC-91",
    sector: "I-10/4",
    phone: "+92 333 5389460",
    whatsapp: "923335389460"
  },

  // UC-92 (I-10/2)
  {
    id: "rep-92-1",
    name: "Hanifullah",
    role: "Nazim UC",
    circleName: "UC Leadership",
    uc: "UC-92",
    sector: "I-10/2",
    phone: "+92 345 9532660",
    whatsapp: "923459532660"
  },
  {
    id: "rep-92-2",
    name: "Masood Ali Asdar",
    role: "Nazim Maliyat & Rep",
    circleName: "Circle 1",
    uc: "UC-92",
    sector: "I-10/2",
    phone: "+92 333 9835233",
    whatsapp: "923339835233"
  },
  {
    id: "rep-92-3",
    name: "Sagheer Ahmed",
    role: "Circle Representative",
    circleName: "Circle 2",
    uc: "UC-92",
    sector: "I-10/2",
    phone: "+92 333 5068105",
    whatsapp: "923335068105"
  },

  // UC-93 (I-10/1)
  {
    id: "rep-93-1",
    name: "Anwar Niazi",
    role: "Circle Representative",
    circleName: "Circle 1",
    uc: "UC-93",
    sector: "I-10/1",
    phone: "+92 333 5297198",
    whatsapp: "923335297198"
  },
  {
    id: "rep-93-2",
    name: "Ghufranullah Bhatti",
    role: "Circle Representative",
    circleName: "Circle 2",
    uc: "UC-93",
    sector: "I-10/1",
    phone: "+92 321 5204394",
    whatsapp: "923215204394"
  },
  {
    id: "rep-93-3",
    name: "Malik Mazhar-ul-Hassan",
    role: "Circle Representative",
    circleName: "Circle 3",
    uc: "UC-93",
    sector: "I-10/1",
    phone: "+92 300 5050386",
    whatsapp: "923005050386"
  }
];

export default function RepresentativesDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUC, setSelectedUC] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [representatives, setRepresentatives] = useState<Representative[]>(DEFAULT_REPRESENTATIVES);

  useEffect(() => {
    async function syncDynamicData() {
      try {
        const { data: dbCircles } = await supabase
          .from("quran_circles")
          .select("*, union_councils(name)");
        
        if (dbCircles && dbCircles.length > 0) {
          // Merge dynamic murabbis from Supabase with verified contact roster
          const updated = [...DEFAULT_REPRESENTATIVES];
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
          setRepresentatives(updated);
        }
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
      toast("Number copied");
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      toast("Couldn’t copy the number", "error");
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
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 h-12 flex items-center">
          <Link href="/portal" className="inline-flex items-center gap-1 text-[15px] text-link"><ArrowLeft className="h-4 w-4" /> Portal</Link>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-5">
        <div className="animate-rise">
          <p className="eyebrow">Zone 5 · Islamabad</p>
          <h1 className="text-[34px] sm:text-[44px] font-bold tracking-[-0.03em] leading-tight">Find your circle</h1>
          <p className="mt-1.5 text-[17px] text-label-2">Contact the representative of the Quran circle in your area by call or WhatsApp.</p>
        </div>

        <div className="space-y-3 animate-rise">
          <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search name, area, council or circle" />
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            {ucList.map((uc) => (
              <button
                key={uc}
                type="button"
                onClick={() => setSelectedUC(uc)}
                aria-pressed={selectedUC === uc}
                className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-[14px] font-medium transition-colors ${selectedUC === uc ? "bg-label text-white" : "bg-surface text-label shadow-[0_0_0_0.5px_var(--color-separator)] hover:bg-fill"}`}
              >
                {uc === "All" ? "All councils" : uc}
              </button>
            ))}
          </div>
          <p className="text-[13px] text-label-2">{filteredReps.length} representative{filteredReps.length === 1 ? "" : "s"}</p>
        </div>

        {groups.length === 0 ? (
          <div className="card"><EmptyState icon={Users} title="No one matches that search" text="Try an area name such as G-9 or a council number such as UC-85." /></div>
        ) : (
          groups.map(([uc, reps]) => (
            <section key={uc} className="space-y-2">
              <h2 className="px-1 text-[13px] font-semibold text-label-2">{uc} · {reps[0].sector}</h2>
              <ul className="card overflow-hidden list-inset">
                {reps.map((r) => (
                  <li key={r.id} className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="h-11 w-11 flex-shrink-0 rounded-full grid place-items-center bg-fill text-[15px] font-semibold">
                        {r.name.replace(/^(Dr\.|Hafiz|Muhammad|Mohammad)\s+/i, "").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[16px] font-semibold truncate">{r.name}</p>
                        <p className="text-[13px] text-label-2 truncate">{r.role}{r.circleName ? ` · ${r.circleName}` : ""}</p>
                        <p className="text-[13px] tabular text-label-2">{r.phone || "Number not added yet"}</p>
                      </div>
                    </div>
                    {r.phone && (
                      <div className="flex gap-2 sm:flex-shrink-0">
                        <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="btn btn-tinted btn-sm flex-1 sm:flex-none"><Phone className="h-4 w-4" /> Call</a>
                        {r.whatsapp && (
                          <a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm flex-1 sm:flex-none bg-[#e7f7ec] text-[#1a7f37] hover:bg-[#d6f1df]"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
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
