"use client";

import { LangToggle, useLangDocument, useT } from "@/lib/i18n";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, ClipboardCheck, Eye, EyeOff, Globe, Lock, ShieldCheck } from "lucide-react";
import { Sheet, ThemeToggle } from "@/components/ui";

// Same passwords as before. They live in the page code, so they keep casual visitors out
// but are not real security: anyone can read them, and /attendance and /dashboard open directly.
const PORTALS = {
  murabbi: { title: "Attendance Portal", label: "Murabbi access", password: "Marhaba", href: "/attendance" },
  admin: { title: "Admin Dashboard", label: "Admin access", password: "JI2026JI", href: "/dashboard" },
} as const;
type Locked = keyof typeof PORTALS;

export default function Home() {
  const t = useT();
  const lang = useLangDocument();
  const router = useRouter();
  const [target, setTarget] = useState<Locked | null>(null);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  function open(p: Locked) {
    setTarget(p);
    setPassword("");
    setShow(false);
    setError("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    if (password === PORTALS[target].password) router.push(PORTALS[target].href);
    else setError(t("Incorrect password. Please try again."));
  }

  const cards = [
    { key: "murabbi" as const, title: t("Attendance Portal"), text: t("Mark attendance and log session details"), badge: t("Murabbi"), icon: ClipboardCheck, tint: "from-[#34c759] to-[#248a3d]" },
    { key: "admin" as const, title: t("Admin Dashboard"), text: t("Zone analytics, reports and management"), badge: t("Admin only"), icon: ShieldCheck, tint: "from-[#2b8cff] to-[#0062d1]" },
  ];

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="flex justify-end gap-2 px-4 sm:px-6 pt-[max(1rem,env(safe-area-inset-top))]">
        <LangToggle />
        <ThemeToggle />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] animate-rise">
          {/* App identity */}
          <div className="text-center">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-[22px] bg-gradient-to-b from-[#2b8cff] to-[#0062d1] text-white shadow-[0_12px_32px_-8px_rgba(0,113,227,0.55)]">
              <BookOpen className="h-9 w-9" strokeWidth={2} aria-hidden />
            </span>
            <h1 className="mt-6 text-[34px] sm:text-[40px] font-bold tracking-[-0.03em]">{t("Dawat-e-Quran")}</h1>
            <p className="mt-1 text-[17px] text-label-2">{t("Zone 5 · Islamabad")}</p>
          </div>

          {/* Portals */}
          <p className="mt-10 mb-2 px-1 text-[13px] font-semibold text-label-2">{t("Choose your portal")}</p>
          <ul className="card overflow-hidden list-inset stagger">
            {cards.map((c) => (
              <li key={c.key}>
                <button type="button" onClick={() => open(c.key)} className="w-full flex items-center gap-4 px-4 py-4 text-start hover:bg-grouped active:bg-fill transition-colors">
                  <span className={`h-11 w-11 flex-shrink-0 rounded-[12px] grid place-items-center bg-gradient-to-b ${c.tint} text-white`}>
                    <c.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[17px] font-semibold whitespace-nowrap">{c.title}</span>
                      <span className="badge badge-gray"><Lock className="h-3 w-3" aria-hidden /> {c.badge}</span>
                    </span>
                    <span className="block text-[14px] text-label-2">{c.text}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 text-label-3 flex-shrink-0" aria-hidden />
                </button>
              </li>
            ))}
            <li>
              <Link href="/portal" className="flex items-center gap-4 px-4 py-4 hover:bg-grouped active:bg-fill transition-colors">
                <span className="h-11 w-11 flex-shrink-0 rounded-[12px] grid place-items-center bg-gradient-to-b from-[#bf5af2] to-[#8944ab] text-white">
                  <Globe className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-[17px] font-semibold whitespace-nowrap">{t("Public Portal")}</span>
                    <span className="badge badge-blue">{t("Public")}</span>
                  </span>
                  <span className="block text-[14px] text-label-2">{t("Syllabus, schedules and circle contacts")}</span>
                </span>
                <ChevronRight className="h-5 w-5 text-label-3 flex-shrink-0" aria-hidden />
              </Link>
            </li>
          </ul>
        </div>
      </main>

      <footer className="pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center text-[12px] text-label-2">{t("Dawat-e-Quran · PK-Zone 5 · Islamabad")}</footer>

      <Sheet
        open={!!target}
        onClose={() => setTarget(null)}
        title={target ? t(PORTALS[target].label) : ""}
        subtitle={target ? (lang === "ur" ? `${t(PORTALS[target].title)} کھولنے کے لیے پاس ورڈ درج کریں۔` : `Enter the password to open the ${PORTALS[target].title}.`) : ""}
      >
        <form onSubmit={submit} className="space-y-4 pb-2">
          <label className="block">
            <span className="form-label">{t("Password")}</span>
            <span className="relative block">
              <input
                type={show ? "text" : "password"}
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                aria-invalid={!!error}
                aria-describedby={error ? "pw-error" : undefined}
                className={`form-input !pe-11 ${error ? "!border-danger focus:!shadow-[0_0_0_4px_rgba(255,59,48,0.18)]" : ""}`}
                placeholder={t("Password")}
              />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute end-1.5 top-1/2 -translate-y-1/2 btn btn-ghost btn-icon !min-h-[36px] !min-w-[36px] !text-label-2" aria-label={show ? t("Hide password") : t("Show password")}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
            {error && <span id="pw-error" role="alert" className="mt-2 block text-[14px] text-danger">{error}</span>}
          </label>
          <button type="submit" className="btn btn-primary w-full">{t("Sign in")}</button>
        </form>
      </Sheet>
    </div>
  );
}
