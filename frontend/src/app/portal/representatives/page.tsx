"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  Phone, 
  MessageCircle, 
  Copy, 
  Check, 
  MapPin, 
  Users, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  BookOpen
} from "lucide-react";
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
                  phone: "+92 300 0000000",
                  whatsapp: "923000000000"
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

  const handleCopy = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getInitials = (name: string) => {
    const parts = name.replace(/^(Dr\.|Professor|Hafiz|Col\.|Syed|Maulana)\s+/i, '').trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen pb-16" style={{
      background: 'linear-gradient(160deg, #f5f3ff 0%, #eef2ff 45%, #fdf4ff 100%)'
    }}>
      {/* ── Top Hero Header ────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #3b0764 0%, #4c1d95 40%, #4338ca 100%)',
        borderRadius: '0 0 2.5rem 2.5rem',
        boxShadow: '0 10px 40px rgba(59,7,100,0.22)'
      }}>
        {/* Subtle glowing orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute -top-24 right-0 w-[450px] h-[450px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)' }} />
          <div className="absolute top-0 left-0 w-[350px] h-[350px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-5 md:px-8 pt-8 pb-12">
          {/* Top navigation links */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/portal" className="inline-flex items-center gap-1.5 group transition-all text-purple-200 hover:text-white"
              style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.02em' }}>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Portal
            </Link>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-white/90">Zone 5 Directory</span>
            </div>
          </div>

          {/* Title & description */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-500/20 border border-purple-300/30 text-purple-200 text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" /> Circle Representatives & Heads
            </div>
            <h1 className="font-bold text-white text-3xl md:text-4xl tracking-tight mb-3">
              Be in Touch with Your Circle Rep
            </h1>
            <p className="text-purple-200/80 text-sm md:text-base leading-relaxed font-medium">
              Find your Union Council Nazim, Circle Head, or Murabbi across Zone 5 Islamabad. Connect instantly via WhatsApp or direct phone call for sessions, study schedules, and queries.
            </p>
          </div>

          {/* Quick Stat Counter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8 max-w-xl">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
              <div className="text-2xl font-black text-white">{representatives.length}</div>
              <div className="text-xs font-semibold text-purple-200/70">Circle Representatives</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
              <div className="text-2xl font-black text-white">{ucList.length - 1}</div>
              <div className="text-xs font-semibold text-purple-200/70">Union Councils (Zone 5)</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md col-span-2 sm:col-span-1">
              <div className="text-2xl font-black text-emerald-400">100%</div>
              <div className="text-xs font-semibold text-purple-200/70">WhatsApp Enabled</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 md:px-8 -mt-6 relative z-20">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 md:p-5 shadow-xl border border-white/70">
          <div className="flex flex-col md:flex-row gap-3.5 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, UC (e.g. UC-81), sector (e.g. G-9), or circle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-lg"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Results Counter */}
            <div className="text-xs font-bold text-slate-500 px-1 whitespace-nowrap">
              Showing <span className="text-purple-700 font-extrabold">{filteredReps.length}</span> of {representatives.length} representatives
            </div>
          </div>

          {/* UC Filter Horizontal Pills */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
              Filter UC:
            </span>
            {ucList.map((uc) => {
              const isSelected = selectedUC === uc;
              const count = uc === "All" 
                ? representatives.length 
                : representatives.filter(r => r.uc === uc).length;

              return (
                <button
                  key={uc}
                  onClick={() => setSelectedUC(uc)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-purple-700 text-white shadow-md shadow-purple-500/25 scale-100"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  <span>{uc}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-purple-900/50 text-purple-200" : "bg-slate-200 text-slate-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Representatives Grid ────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 md:px-8 mt-8">
        {filteredReps.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/80 shadow-lg max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Representatives Found</h3>
            <p className="text-xs text-slate-500 mb-6">
              No representative matched your search &quot;{searchQuery}&quot; in {selectedUC === "All" ? "any Union Council" : selectedUC}.
            </p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedUC("All"); }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-500/20"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReps.map((rep) => {
              const cleanPhone = rep.phone.replace(/[^0-9]/g, "");
              const isCopied = copiedId === rep.id;
              const waText = encodeURIComponent(
                `Assalamu Alaikum ${rep.name}, I would like to connect regarding the Dawat-e-Quran circle in ${rep.uc} (${rep.sector}).`
              );
              const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`;

              return (
                <div
                  key={rep.id}
                  className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                  style={{
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)'
                  }}
                >
                  <div>
                    {/* Header: UC Badge & Role */}
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200/60">
                        <MapPin className="w-3 h-3 text-purple-600" />
                        {rep.uc}
                      </span>
                      {rep.circleName && (
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                          {rep.circleName}
                        </span>
                      )}
                    </div>

                    {/* Profile row: Avatar + Name + Role */}
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-md bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 shrink-0">
                        {getInitials(rep.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-purple-700 transition-colors truncate">
                          {rep.name}
                        </h3>
                        <p className="text-xs font-semibold text-purple-600 flex items-center gap-1 mt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span className="truncate">{rep.role}</span>
                        </p>
                      </div>
                    </div>

                    {/* Sector location detail */}
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                      <span className="text-xs font-medium text-slate-600 truncate">
                        {rep.sector}
                      </span>
                    </div>

                    {/* Phone Number Display with Copy Button */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/80 border border-slate-200/70 mb-4">
                      <div className="flex items-center gap-2 text-slate-700 text-xs font-mono font-bold tracking-wide">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rep.phone || "Number available upon request"}</span>
                      </div>
                      {rep.phone && (
                        <button
                          onClick={() => handleCopy(rep.phone, rep.id)}
                          className="text-slate-400 hover:text-purple-700 p-1 rounded-lg hover:bg-white transition-all flex items-center gap-1 text-[10px] font-bold"
                          title="Copy phone number"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Copied</span>
                            </>
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons: WhatsApp & Direct Call */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    {/* WhatsApp Button */}
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all shadow-md shadow-emerald-600/20"
                    >
                      {/* WhatsApp Icon */}
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      <span>WhatsApp</span>
                    </a>

                    {/* Phone Call Button */}
                    <a
                      href={`tel:${cleanPhone}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl font-bold text-xs text-purple-700 bg-purple-100 hover:bg-purple-200 active:scale-95 transition-all border border-purple-200/80"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Now</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Help / Central Coordination Card */}
        <div className="mt-12 rounded-3xl p-6 md:p-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-purple-200 mb-3">
                <BookOpen className="w-3.5 h-3.5 text-purple-300" /> Central Coordination · Zone 5
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Need Help Finding Your Exact Circle?
              </h3>
              <p className="text-purple-200/80 text-sm max-w-xl">
                If your neighborhood or sector is not listed or you have special requirements, our central coordination desk is available to assist you.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
              <Link
                href="/portal"
                className="px-5 py-3 rounded-2xl font-bold text-xs text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-center"
              >
                Back to Portal
              </Link>
              <a
                href="https://wa.me/923316378566?text=Assalamu%20Alaikum,%20I%20need%20assistance%20finding%20a%20Quran%20Circle%20in%20Zone%205."
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-2xl font-bold text-xs text-purple-950 bg-white hover:bg-purple-50 transition-all shadow-lg text-center flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                Contact Zone Desk
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
