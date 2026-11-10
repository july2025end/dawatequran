// Circle representatives. Read from the "representatives" table (database/v2_migration.sql);
// until that SQL has been run, the built-in list below is used so the directory keeps working.
import { supabase } from "@/lib/supabase";

// Comprehensive verified representatives directory for Zone 5
export interface Representative {
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

export const DEFAULT_REPRESENTATIVES: Representative[] = [
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

type Row = { id: string; name: string; role: string; circle_name: string | null; uc: string; sector: string | null; phone: string | null; whatsapp: string | null };

/** Representatives from the database, or the built-in list if the table isn't there yet. `fromDb` says which. */
export async function loadRepresentatives(): Promise<{ reps: Representative[]; fromDb: boolean }> {
  const { data, error } = await supabase.from("representatives").select("id, name, role, circle_name, uc, sector, phone, whatsapp").order("sort_order").order("name");
  if (error || !data) return { reps: DEFAULT_REPRESENTATIVES, fromDb: false };
  return {
    fromDb: true,
    reps: (data as Row[]).map((r) => ({ id: r.id, name: r.name, role: r.role, circleName: r.circle_name ?? undefined, uc: r.uc, sector: r.sector ?? "", phone: r.phone ?? "", whatsapp: r.whatsapp ?? undefined })),
  };
}

/** WhatsApp number for wa.me links: digits only, Pakistani 03xx → 923xx. */
export function whatsappNumber(phone: string | null | undefined, whatsapp?: string | null): string | null {
  const raw = (whatsapp || phone || "").replace(/\D/g, "");
  if (!raw) return null;
  if (raw.startsWith("0") && raw.length === 11) return "92" + raw.slice(1);
  return raw.length >= 11 ? raw : null;
}

/** Best match for a circle's murabbi among the representatives. */
export function findMurabbi(reps: Representative[], murabbiName: string | null | undefined): Representative | undefined {
  const name = murabbiName?.trim().toLowerCase();
  if (!name || name === "pending") return undefined;
  return reps.find((r) => r.phone && (r.name.toLowerCase().includes(name) || name.includes(r.name.toLowerCase())));
}
