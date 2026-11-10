"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come straight from Supabase / external APIs */

import { LangToggle, useLangDocument, useT } from "@/lib/i18n";
import { useState, useEffect, useRef, useCallback, use } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { parseQuranReference } from "@/lib/quran_utils";
import { BiText, Brand, QuranRef, ThemeToggle } from "@/components/ui";
import { cleanTitle } from "@/lib/data";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Loader2,
  BookText,
  Headphones,
  Globe,
  Calendar,
} from "lucide-react";

/* ─── Word Translation Cache ─────────────────────────────
   Shared across all AyahCards; avoids fetching the same
   ayah's words multiple times during a session.
──────────────────────────────────────────────────────── */
type WordEntry = {
  position: number;
  text_uthmani: string;
  text_simple: string;   // diacritics-stripped, for matching
  translation: string;
};
const wordCache = new Map<string, WordEntry[]>();

/** Strip harakat + tatweel + normalise alef variants for loose text matching */
function stripDiacritics(s: string): string {
  return s
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // harakat + tatweel
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627")  // alef variants (including wasla) → bare alef
    .trim();
}

async function fetchWordTranslations(
  surahNum: number,
  ayahNum: number
): Promise<WordEntry[]> {
  const key = `${surahNum}:${ayahNum}`;
  if (wordCache.has(key)) return wordCache.get(key)!;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `/api/word-translation?surah=${surahNum}&ayah=${ayahNum}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return [];
    const json = await res.json();
    const words: WordEntry[] = json.words || [];
    wordCache.set(key, words);
    return words;
  } catch {
    return [];
  }
}

/* ─── Arabic Word Tooltip ─────────────────────────────── */
function ArabicWordTooltip({
  word,
  surahNum,
  ayahNum,
}: {
  word: string;
  surahNum: number;
  ayahNum: number;
}) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  // Portal needs document to exist (SSR guard)
  const [mounted, setMounted] = useState(false);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null); // ref on inner inline-block for reliable getBoundingClientRect
  const outerRef = useRef<HTMLSpanElement>(null);  // ref on outer wrapper for touch outside detection
  const loadedRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  const computePos = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    // position:fixed uses viewport coords — do NOT add scrollY
    setTooltipPos({
      top: rect.top - 10,
      left: rect.left + rect.width / 2,
    });
  }, []);

  const load = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setLoading(true);
    const allWords = await fetchWordTranslations(surahNum, ayahNum);
    // Match by normalised text rather than index — the two sources
    // (alquran.cloud uthmani + quran.com) may tokenise differently.
    const needle = stripDiacritics(word);
    const entry =
      allWords.find((w) => w.text_simple === needle) ||
      allWords.find((w) => w.text_simple.includes(needle)) ||
      allWords.find((w) => needle.includes(w.text_simple));
    setTranslation(entry?.translation || "ترجمہ دستیاب نہیں");
    setLoading(false);
  }, [surahNum, ayahNum, word]);

  const show = useCallback(() => {
    computePos();
    setVisible(true);
    load();
  }, [computePos, load]);

  const hide = useCallback(() => {
    setVisible(false);
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  }, []);

  // Keep tooltip anchored during scroll / resize
  useEffect(() => {
    if (!visible) return;
    const update = () => computePos();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [visible, computePos]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      show();
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
      touchTimerRef.current = setTimeout(() => setVisible(false), 3000);
    },
    [show]
  );

  useEffect(() => {
    if (!visible) return;
    const onDocTouch = (e: TouchEvent) => {
      if (outerRef.current && !outerRef.current.contains(e.target as Node)) {
        hide();
      }
    };
    document.addEventListener("touchstart", onDocTouch);
    return () => document.removeEventListener("touchstart", onDocTouch);
  }, [visible, hide]);

  useEffect(() => () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  }, []);

  // The tooltip is rendered via portal into document.body so it escapes
  // any ancestor with backdrop-filter / transform / will-change that would
  // create a new containing block for position:fixed.
  const tooltip = visible && mounted
    ? createPortal(
        <span
          className="word-tooltip"
          style={{
            position: "fixed",
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: "translateX(-50%) translateY(-100%)",
            zIndex: 9999,
            bottom: "auto",
          }}
        >
          <span className="word-tooltip-label">ترجمہ</span>
          {loading ? (
            <span className="word-tooltip-shimmer" />
          ) : (
            <span className="word-tooltip-text font-urdu">{translation}</span>
          )}
        </span>,
        document.body
      )
    : null;

  return (
    <>
      <span
        ref={outerRef}
        className="arabic-word-wrapper"
        onMouseEnter={show}
        onMouseLeave={hide}
        onTouchStart={handleTouchStart}
      >
        {/* ref on the inner inline-block span — gives a reliable single
            bounding rect for tooltip placement even in RTL inline flow */}
        <span
          ref={wrapperRef}
          className={`arabic-word font-arabic${visible ? " is-active" : ""}`}
        >
          {word}
        </span>
      </span>
      {tooltip}
    </>
  );
}

/* ─── Interactive Arabic Text ────────────────────────────
   Splits an ayah's Arabic string into individual words and
   renders each as an interactive ArabicWordTooltip.
──────────────────────────────────────────────────────── */
function InteractiveArabicText({
  arabic,
  surahNum,
  ayahNum,
}: {
  arabic: string;
  surahNum: number;
  ayahNum: number;
}) {
  // Split on whitespace, filter empties
  const words = arabic.split(/\s+/).filter(Boolean);

  return (
    <div
      className="font-arabic"
      style={{
        direction: "rtl",
        textAlign: "right",
        fontSize: "clamp(1.65rem, 4.2vw, 2.4rem)",
        lineHeight: 2.35,
        // Add a small letter-spacing to keep words from touching when inline-block
        // spans are rendered next to each other
        wordSpacing: "0.12em",
        color: "var(--color-label)",
      }}
    >
      {words.map((w, i) => (
        <span key={i}>
          <ArabicWordTooltip
            word={w}
            surahNum={surahNum}
            ayahNum={ayahNum}
          />
          {/* Real space between words so bidi/shaping engine handles word
              boundaries correctly and line-wrapping works naturally */}
          {i < words.length - 1 ? '\u0020' : null}
        </span>
      ))}
    </div>
  );
}

/* ─── Types ─────────────────────────────────────────────── */
interface AyahData {
  number: number;
  numberInSurah: number;
  arabic: string;
  maududi: string;
  // tafseer is loaded lazily per-card — not part of initial fetch
}

interface TopicData {
  id: string;
  topic_number: number;
  title: string;
  reference: string;
  start_date?: string;
  end_date?: string;
}

/* ─── Audio helpers ─────────────────────────────────────── */
const QURAN_BASE = "https://api.alquran.cloud/v1";
// verses.quran.com CDN — zero-padded surah + ayah, e.g. 001001.mp3
const AUDIO_CDN = "https://verses.quran.com/Alafasy/mp3";

function ayahAudioUrl(surahNum: number, ayahInSurah: number): string {
  const s = String(surahNum).padStart(3, "0");
  const a = String(ayahInSurah).padStart(3, "0");
  return `${AUDIO_CDN}/${s}${a}.mp3`;
}

const TAFSEER_BASE =
  typeof window === "undefined"
    ? "http://localhost:3000"
    : "";

/* fetchTafseer is called lazily from AyahCard — never during page load.
   A 6-second AbortController timeout prevents tafheem.net slowness from
   ever hanging the UI. */
async function fetchTafseer(surahNum: number, ayahNum: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(
      `/api/tafseer?surah=${surahNum}&ayah=${ayahNum}`,
      { cache: "force-cache", signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return "";
    const json = await res.json();
    return json.text || "";
  } catch {
    clearTimeout(timer);
    return "";
  }
}

/* fetchAyatRange only fetches Arabic text + Maududi tarjuma (both fast).
   Tafseer is loaded separately and lazily per card. */
async function fetchAyatRange(
  surahNum: number,
  startAyah: number,
  endAyah: number
): Promise<AyahData[]> {
  const editions = "quran-uthmani,ur.maududi";

  const surahRes = await fetch(
    `${QURAN_BASE}/surah/${surahNum}/editions/${editions}`
  );

  const json = await surahRes.json();
  if (json.code !== 200 || !json.data) return [];

  const [arabicEd, maududiEd] = json.data;

  const results: AyahData[] = [];
  for (let i = startAyah; i <= endAyah; i++) {
    const arabicAyah = arabicEd.ayahs.find((a: any) => a.numberInSurah === i);
    const maududiAyah = maududiEd.ayahs.find((a: any) => a.numberInSurah === i);

    if (arabicAyah) {
      let arabicText = arabicAyah.text;

      // Strip Bismillah if it's the first ayah of a surah other than Al-Fatihah (1) and At-Tawbah (9)
      if (surahNum !== 1 && surahNum !== 9 && i === 1) {
        const words = arabicText.split(/\s+/).filter(Boolean);
        if (words.length >= 4) {
          const isBismillah =
            stripDiacritics(words[0]) === "بسم" &&
            stripDiacritics(words[1]) === "الله" &&
            stripDiacritics(words[2]) === "الرحمن" &&
            stripDiacritics(words[3]) === "الرحيم";
          if (isBismillah) {
            arabicText = words.slice(4).join(" ");
          }
        }
      }

      results.push({
        number: arabicAyah.number,
        numberInSurah: i,
        arabic: arabicText,
        maududi: maududiAyah?.text || "",
      });
    }
  }
  return results;
}

/* ─── Single Ayah Card ──────────────────────────────────── */

function AyahCard({
  ayah,
  activeAyah,
  onPlay,
  onPause,
  isPlaying,
  surahNum,
}: {
  ayah: AyahData;
  activeAyah: number | null;
  onPlay: (surahNum: number, ayahInSurah: number, globalNum: number) => void;
  onPause: () => void;
  isPlaying: boolean;
  surahNum: number;
}) {
  const [showTafseer, setShowTafseer] = useState(false);
  // null = not yet fetched, '' = fetched but empty, string = content
  const [tafseerText, setTafseerText] = useState<string | null>(null);
  const [tafseerLoading, setTafseerLoading] = useState(false);
  const isActive = activeAyah === ayah.number;

  // Fetch tafseer lazily only when the user first opens the section
  const handleToggleTafseer = useCallback(async () => {
    const opening = !showTafseer;
    setShowTafseer(opening);
    if (opening && tafseerText === null) {
      setTafseerLoading(true);
      const text = await fetchTafseer(surahNum, ayah.numberInSurah);
      setTafseerText(text);
      setTafseerLoading(false);
    }
  }, [showTafseer, tafseerText, surahNum, ayah.numberInSurah]);

  return (
    <article className={`card overflow-visible transition-shadow duration-300 ${isActive ? "ring-2 ring-accent/40 shadow-[var(--shadow-float)]" : ""}`}>
      <div className="p-4 sm:p-6">
        {/* Ayah number + listen */}
        <div className="flex items-center justify-between mb-4">
          <span className={`font-urdu inline-flex items-center rounded-full px-3 py-0.5 text-[13px] ${isActive ? "bg-accent-fill text-white" : "bg-fill text-label-2"}`}>آیت {ayah.numberInSurah}</span>
          <button
            onClick={() => (isActive && isPlaying ? onPause() : onPlay(surahNum, ayah.numberInSurah, ayah.number))}
            className={`btn btn-sm font-urdu ${isActive && isPlaying ? "btn-primary" : "btn-tinted"}`}
            aria-label={isActive && isPlaying ? "Pause recitation" : `Listen to ayah ${ayah.numberInSurah}`}
          >
            {isActive && isPlaying ? <><Pause className="w-3.5 h-3.5" /> روک دیں</> : <><Headphones className="w-3.5 h-3.5" /> سنیں</>}
          </button>
        </div>

        {/* Arabic text, word by word (tap a word for its meaning) */}
        <div className="mb-5 rounded-2xl bg-grouped px-4 py-3 sm:px-5 sm:py-4">
          <InteractiveArabicText arabic={ayah.arabic} surahNum={surahNum} ayahNum={ayah.numberInSurah} />
        </div>

        {/* Translation: Maulana Maududi */}
        {ayah.maududi && (
          <div className="mb-4">
            <p className="font-urdu text-[13px] text-accent mb-1 flex items-center gap-1.5 justify-start">
              ترجمہ — مولانا مودودیؒ <Globe className="w-3.5 h-3.5" />
            </p>
            <p className="font-urdu text-right text-label" style={{ fontSize: "1.15rem" }}>{ayah.maududi}</p>
          </div>
        )}

        {/* Tafseer: loads on first open */}
        <button
          onClick={handleToggleTafseer}
          aria-expanded={showTafseer}
          className={`flex items-center gap-2 w-full py-2.5 px-4 rounded-xl text-[14px] transition-colors font-urdu ${showTafseer ? "bg-accent-tint text-accent-ink" : "bg-fill text-label hover:bg-fill-strong"}`}
        >
          {tafseerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookText className="w-4 h-4" />}
          <span className="flex-1 text-right">تفسیر — تفہیم القرآن، مولانا مودودیؒ</span>
          {showTafseer ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
        </button>
        {showTafseer && (
          <div className="mt-3 p-4 rounded-xl bg-grouped tafseer-content animate-fade" style={{ minHeight: tafseerLoading ? "5rem" : undefined }}>
            {tafseerLoading ? (
              <div className="flex items-center justify-center py-4 gap-2 text-label-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-urdu text-sm">تفسیر لوڈ ہو رہی ہے…</span>
              </div>
            ) : tafseerText ? (
              // tafseerText is sanitised by /api/tafseer before it reaches the page.
              <div className="font-urdu text-right text-label" style={{ fontSize: "1.08rem" }} dangerouslySetInnerHTML={{ __html: tafseerText }} />
            ) : (
              <p className="font-urdu text-center text-sm text-label-2">تفسیر دستیاب نہیں</p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function TopicPage(props: { params: Promise<{ id: string }> }) {
  const t = useT();
  const lang = useLangDocument();
  const { id } = use(props.params);

  const [topic, setTopic] = useState<TopicData | null>(null);
  const [ayaat, setAyaat] = useState<AyahData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAyah, setActiveAyah] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  // Store surahNum in a ref so onEnded can access it without stale closure
  const surahNumRef = useRef<number>(0);
  // Lazily create Audio element on client only (safe for SSR / Next.js)
  const audioRef = useRef<HTMLAudioElement | null>(
    typeof window !== "undefined" ? new Audio() : null
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: dbErr } = await supabase
          .from("syllabus_topics")
          .select("*")
          .eq("id", id)
          .single();

        if (dbErr || !data) {
          setError("Topic not found.");
          setLoading(false);
          return;
        }

        setTopic(data);

        const parsed = parseQuranReference(data.reference);
        if (!parsed) {
          setError("Could not parse Quran reference: " + (data.reference || "none"));
          setLoading(false);
          return;
        }

        surahNumRef.current = parsed.surahNum;

        const ayaatData = await fetchAyatRange(parsed.surahNum, parsed.startAyah, parsed.endAyah);
        setAyaat(ayaatData);

        // Background-prefetch word translations for all ayahs so hovering
        // is instant. Fire-and-forget — we deliberately do NOT await this.
        const ayahNums = Array.from(
          { length: parsed.endAyah - parsed.startAyah + 1 },
          (_, i) => parsed.startAyah + i
        );
        Promise.allSettled(
          ayahNums.map((n) => fetchWordTranslations(parsed.surahNum, n))
        ).catch(() => {/* silent — cache filled as responses arrive */});
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handlePlay = useCallback(
    (surahNum: number, ayahInSurah: number, globalNum: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.src = ayahAudioUrl(surahNum, ayahInSurah);
      audio.muted = isMuted;
      setActiveAyah(globalNum);
      setIsPlaying(true);
      audio.play().catch((err: Error) => {
        // AbortError fires when src changes mid-play — safe to ignore.
        // NotAllowedError means browser blocked autoplay before user gesture.
        if (err.name !== "AbortError" && err.name !== "NotAllowedError") {
          console.error("Audio play error:", err);
        }
      });
    },
    [isMuted]
  );

  const handlePause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const handlePlayAll = useCallback(() => {
    if (ayaat.length === 0) return;
    if (isPlaying) { handlePause(); return; }
    const first = ayaat[0];
    handlePlay(surahNumRef.current, first.numberInSurah, first.number);
  }, [ayaat, isPlaying, handlePlay, handlePause]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      const idx = ayaat.findIndex((a) => a.number === activeAyah);
      if (idx !== -1 && idx < ayaat.length - 1) {
        const next = ayaat[idx + 1];
        handlePlay(surahNumRef.current, next.numberInSurah, next.number);
      } else {
        setIsPlaying(false);
        setActiveAyah(null);
      }
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [ayaat, activeAyah, handlePlay]);

  const ref = topic ? parseQuranReference(topic.reference) : null;
  const fmt = (d?: string) => (d ? new Date(d.slice(0, 10) + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "");

  if (loading) {
    return (
      <div className="min-h-dvh bg-canvas grid place-items-center">
        <div className="flex flex-col items-center gap-3 text-label-2">
          <Loader2 className="animate-spin w-7 h-7 text-accent" />
          <p className="font-urdu text-[15px]">آیات لوڈ ہو رہی ہیں…</p>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="min-h-dvh bg-canvas grid place-items-center px-6">
        <div className="text-center">
          <p className="text-[17px] font-semibold">{error || "This lesson could not be found."}</p>
          <Link href="/portal" className="btn btn-primary mt-5"><ArrowLeft className="w-4 h-4" /> {t("Back to the portal")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Frosted bar with the player, always reachable while reading */}
      <header className="sticky top-0 z-40 material border-b border-separator pt-[env(safe-area-inset-top)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Brand size="sm" name={t("Dawat-e-Quran")} subtitle={<span className="inline-flex items-center gap-0.5"><ArrowLeft className="h-3 w-3" /> {t("Portal")}</span>} />
          <div className="flex items-center gap-2">
          {ayaat.length > 0 && (
            <>
              <button onClick={handlePlayAll} className={`btn btn-sm ${isPlaying ? "btn-secondary" : "btn-primary"}`}>
                {isPlaying ? <><Pause className="w-4 h-4" /> {t("Stop")}</> : <><Play className="w-4 h-4" /> {t("Play all")}</>}
              </button>
              <button
                onClick={() => { const m = !isMuted; setIsMuted(m); if (audioRef.current) audioRef.current.muted = m; }}
                className="btn btn-secondary btn-icon !min-h-[34px] !min-w-[34px]"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </>
          )}
            <LangToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Title */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6 animate-rise">
        <p className="text-[15px] font-semibold text-accent">{t("Lesson")} {topic.topic_number}{topic.start_date ? ` · ${fmt(topic.start_date)}${topic.end_date ? ` – ${fmt(topic.end_date)}` : ""}` : ""}</p>
        <h1 className="mt-2 text-[30px] sm:text-[44px] font-bold tracking-[-0.03em] leading-tight" ><BiText text={cleanTitle(topic.title)} /></h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[14px] text-label-2">
          <QuranRef reference={topic.reference} className="font-medium text-label" />
          {ayaat.length > 0 && <span className="badge badge-gray">{ayaat.length} {t("ayaat")}</span>}
          <span className="badge badge-gray">{t("Recitation: Mishary Alafasy")}</span>
        </div>
        <p className="mt-3 text-[13px] text-label-2">{t("Tap any Arabic word to see its Urdu meaning.")}</p>
      </section>

      {/* Ayaat */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        {ayaat.length === 0 ? (
          <div className="card p-10 text-center">
            <BookOpen className="w-9 h-9 text-label-3 mx-auto mb-3" />
            <p className="font-urdu text-label-2">اس موضوع کے لیے آیات دستیاب نہیں ہیں</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ref && ref.startAyah === 1 && ref.surahNum !== 1 && ref.surahNum !== 9 && (
              <p className="font-quran text-center text-label py-4" style={{ fontSize: "clamp(1.7rem, 4.5vw, 2.4rem)" }}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
            )}
            {ayaat.map((ayah) => (
              <AyahCard
                key={ayah.number}
                ayah={ayah}
                activeAyah={activeAyah}
                onPlay={handlePlay}
                onPause={handlePause}
                isPlaying={isPlaying}
                surahNum={ref?.surahNum ?? 0}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
