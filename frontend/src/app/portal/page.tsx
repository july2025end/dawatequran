"use client";

import { LangToggle, useLangDocument, useT } from "@/lib/i18n";
import { BiText, Brand, QuranRef, ThemeToggle } from "@/components/ui";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, ChevronRight, MapPin, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORY_LABEL, cleanTitle, formatDate, localDate } from "@/lib/data";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come straight from Supabase joins */

export default function PublicPortal() {
  const t = useT();
  const lang = useLangDocument();
  const loc = lang === "ur" ? "ur-PK" : "en-GB";
  const [loading, setLoading] = useState(true);
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [ucCount, setUcCount] = useState(0);
  const [circleCount, setCircleCount] = useState(0);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, u, c, sess] = await Promise.all([
        supabase.from("syllabus_topics").select("*").order("topic_number"),
        supabase.from("union_councils").select("id", { count: "exact", head: true }),
        supabase.from("quran_circles").select("id", { count: "exact", head: true }),
        supabase.from("sessions")
          .select("id, session_date, category, location, quran_circles(name, union_councils(name)), union_councils(name), syllabus_topics(title, topic_number)")
          .gte("session_date", localDate())
          .order("session_date")
          .limit(6),
      ]);
      setSyllabus(s.data ?? []);
      setUcCount(u.count ?? 0);
      setCircleCount(c.count ?? 0);
      setUpcoming(sess.data ?? []);
      setLoading(false);
    })();
  }, []);

  const today = localDate();
  // This week's lesson: the topic whose teaching dates include today, else the next one coming up.
  const current = useMemo(
    () => syllabus.find((tp) => tp.start_date && tp.end_date && tp.start_date <= today && today <= tp.end_date)
      ?? syllabus.filter((tp) => tp.start_date && tp.start_date > today).sort((a, b) => a.start_date.localeCompare(b.start_date))[0],
    [syllabus, today],
  );
  const topics = showAll ? syllabus : syllabus.slice(0, 9);

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Frosted nav */}
      <header className="sticky top-0 z-40 material border-b border-separator pt-[env(safe-area-inset-top)]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <Brand size="sm" href="/" name={t("Dawat-e-Quran")} />
          <nav className="flex items-center gap-4 sm:gap-5 text-[13px] text-label-2">
            <a href="#syllabus" className="hover:text-label hidden sm:inline">{t("Syllabus")}</a>
            <a href="#upcoming" className="hover:text-label hidden sm:inline">{t("Upcoming")}</a>
            <Link href="/portal/representatives" className="hover:text-label">{t("Find a circle")}</Link>
            <LangToggle />
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-surface border-b border-separator">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-12 sm:pb-16 text-center animate-rise">
          <p className="text-[15px] sm:text-[17px] font-semibold text-accent">{t("Zone 5 · Islamabad")}</p>
          <h1 className="mt-3 text-[40px] sm:text-[64px] font-bold tracking-[-0.035em] leading-[1.05]">{lang === "ur" ? t("Understand the Quran, together.") : <>Understand the Quran,<br className="hidden sm:block" /> together.</>}</h1>
          <p className="mt-4 text-[17px] sm:text-[21px] text-label-2 max-w-2xl mx-auto leading-snug">{t("Weekly Quran circles in every union council. Follow the syllabus, read each lesson with translation and tafseer, and find the circle nearest you.")}</p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/portal/representatives" className="btn btn-primary px-6">{t("Find your circle")}</Link>
            <a href="#syllabus" className="btn btn-ghost">{t("Browse the syllabus")} <ChevronRight className="h-4 w-4" /></a>
          </div>
          <dl className="mt-10 grid grid-cols-3 max-w-lg mx-auto divide-x divide-separator">
            {[
              { label: t("Quran circles"), value: circleCount },
              { label: t("Union councils"), value: ucCount },
              { label: t("Lessons"), value: syllabus.length },
            ].map((s) => (
              <div key={s.label} className="px-2">
                <dd className="text-[28px] sm:text-[34px] font-bold tabular tracking-[-0.03em]">{loading ? "–" : s.value}</dd>
                <dt className="text-[12px] sm:text-[13px] text-label-2">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-14">
        {/* This week */}
        {current && (
          <Link href={`/portal/topic/${current.id}`} className="group block rounded-[1.75rem] overflow-hidden bg-gradient-to-br from-[#0a1f3d] via-[#0b3a75] to-[#0071e3] text-white p-6 sm:p-10 shadow-[var(--shadow-float)] animate-rise">
            <p className="text-[13px] sm:text-[15px] font-semibold text-white/75">
              {t(current.start_date <= today ? t("This week’s lesson") : t("Next lesson"))} · {formatDate(current.start_date, loc)}{current.end_date ? ` – ${formatDate(current.end_date, loc)}` : ""}
            </p>
            <p className="mt-2 text-[15px] font-semibold text-white/75">{t("Topic")} {current.topic_number}</p>
            <h2 className="mt-1 text-[28px] sm:text-[40px] font-bold tracking-[-0.03em] leading-tight" ><BiText text={cleanTitle(current.title)} /></h2>
            {current.reference && <p className="mt-3 text-[17px] text-white/85"><QuranRef reference={current.reference} /></p>}
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white text-[#0058b0] px-5 py-2.5 text-[15px] font-semibold group-hover:gap-2.5 transition-all">{t("Read the lesson")} <ArrowRight className="h-4 w-4" /></span>
          </Link>
        )}

        {/* Syllabus */}
        <section id="syllabus" className="scroll-mt-20">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-[28px] sm:text-[34px] font-bold tracking-[-0.025em]">{t("Syllabus")}</h2>
              <p className="text-[15px] text-label-2 mt-1">{t("Every lesson opens with the Arabic text, Urdu translation and tafseer.")}</p>
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-32 !rounded-[var(--radius-card)]" />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 stagger">
                {topics.map((tp) => {
                  const isCurrent = current?.id === tp.id;
                  return (
                    <Link key={tp.id} href={`/portal/topic/${tp.id}`} className="card group p-5 flex flex-col hover:shadow-[var(--shadow-float)] hover:-translate-y-0.5 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <span className={`h-8 min-w-8 px-2 rounded-lg grid place-items-center text-[14px] font-bold tabular ${isCurrent ? "bg-accent-fill text-white" : "bg-fill text-label"}`}>{tp.topic_number}</span>
                        {isCurrent && <span className="badge badge-blue">{t("Now")}</span>}
                      </div>
                      <h3 className="mt-3 text-[17px] font-semibold leading-snug"><BiText text={cleanTitle(tp.title)} /></h3>
                      {tp.reference && <p className="mt-1.5 text-[14px] text-label-2"><QuranRef reference={tp.reference} /></p>}
                      <span className="mt-auto pt-4 flex items-center justify-between text-[13px]">
                        <span className="text-label-2">{tp.start_date ? formatDate(tp.start_date, loc) : ""}</span>
                        <span className="font-semibold text-link inline-flex items-center">{t("Read")} <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
                      </span>
                    </Link>
                  );
                })}
              </div>
              {syllabus.length > 9 && (
                <div className="mt-6 text-center">
                  <button type="button" onClick={() => setShowAll((v) => !v)} className="btn btn-secondary">{showAll ? t("Show fewer") : lang === "ur" ? `تمام ${syllabus.length} اسباق دیکھیں` : `Show all ${syllabus.length} lessons`}</button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Upcoming */}
        <section id="upcoming" className="scroll-mt-20 grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          <div className="lg:col-span-3">
            <h2 className="text-[28px] sm:text-[34px] font-bold tracking-[-0.025em] mb-5">{t("Upcoming sessions")}</h2>
            {upcoming.length === 0 ? (
              <div className="card p-6 text-[15px] text-label-2 flex items-center gap-3"><CalendarDays className="h-5 w-5 text-label-3" /> {t("No sessions are scheduled yet. Ask your circle’s representative for the next class.")}</div>
            ) : (
              <ul className="card overflow-hidden list-inset">
                {upcoming.map((s) => {
                  const place = s.category === "ijtima_arkan" ? s.union_councils?.name : s.quran_circles?.name;
                  const council = s.quran_circles?.union_councils?.name;
                  return (
                    <li key={s.id} className="px-4 sm:px-5 py-3.5 flex items-center gap-3.5">
                      <span className="w-12 h-12 rounded-xl bg-accent-tint text-accent-ink grid place-items-center text-center leading-none flex-shrink-0">
                        <span><span className="block text-[17px] font-bold tabular">{s.session_date.slice(8, 10)}</span><span className="block text-[10px] font-semibold uppercase mt-0.5">{formatDate(s.session_date, loc).split(" ")[1]}</span></span>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold truncate"><bdi>{place ?? t(CATEGORY_LABEL[s.category])}</bdi>{council ? <> · <bdi>{council}</bdi></> : null}</span>
                        <span className="block text-[13px] text-label-2 truncate">{s.syllabus_topics ? <>{t("Topic")} {s.syllabus_topics.topic_number}: <BiText text={cleanTitle(s.syllabus_topics.title)} /></> : t(CATEGORY_LABEL[s.category])}</span>
                        {s.location && <span className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-label-2"><MapPin className="h-3 w-3" /><BiText text={s.location} /></span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <Link href="/portal/representatives" className="lg:col-span-2 lg:mt-[3.75rem] card group p-6 sm:p-7 block hover:shadow-[var(--shadow-float)] transition-shadow">
            <span className="h-12 w-12 rounded-2xl grid place-items-center bg-accent-tint text-accent"><Users className="h-6 w-6" /></span>
            <h3 className="mt-4 text-[22px] font-bold tracking-[-0.02em]">{t("Find your circle")}</h3>
            <p className="mt-1.5 text-[15px] text-label-2">{t("Search by area or union council and contact the circle’s representative directly by call or WhatsApp.")}</p>
            <span className="mt-4 inline-flex items-center text-[15px] font-semibold text-link">{t("Open the directory")} <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
        </section>
      </main>

      <footer className="border-t border-separator">
        <p className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 text-[12px] text-label-2">{t("Dawat-e-Quran · Zone 5, Islamabad")}</p>
      </footer>
    </div>
  );
}
