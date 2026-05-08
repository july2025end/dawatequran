"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import { supabase } from "@/lib/supabase";
import { parseQuranReference } from "@/lib/quran_utils";
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
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
interface AyahData {
  number: number;
  numberInSurah: number;
  arabic: string;
  maududi: string;
  tafseer: string;
}

interface TopicData {
  id: string;
  topic_number: number;
  title: string;
  reference: string;
}

/* ─── AlQuran.cloud helpers ─────────────────────────────── */
const QURAN_BASE = "https://api.alquran.cloud/v1";
const AUDIO_BASE = "https://cdn.alquran.cloud/media/audio/ayah/ar.alafasy";

const TAFSEER_BASE =
  typeof window === "undefined"
    ? "http://localhost:3000"
    : "";

async function fetchTafseer(surahNum: number, ayahNum: number): Promise<string> {
  try {
    const res = await fetch(
      `${TAFSEER_BASE}/api/tafseer?surah=${surahNum}&ayah=${ayahNum}`,
      { cache: "no-store" }
    );
    if (!res.ok) return "";
    const json = await res.json();
    return json.text || "";
  } catch {
    return "";
  }
}

async function fetchAyatRange(
  surahNum: number,
  startAyah: number,
  endAyah: number
): Promise<AyahData[]> {
  const editions = "quran-uthmani,ur.maududi";
  const ayahNums = Array.from(
    { length: endAyah - startAyah + 1 },
    (_, i) => startAyah + i
  );

  const [surahRes, tafseerTexts] = await Promise.all([
    fetch(`${QURAN_BASE}/surah/${surahNum}/editions/${editions}`),
    Promise.all(ayahNums.map((n) => fetchTafseer(surahNum, n))),
  ]);

  const json = await surahRes.json();
  if (json.code !== 200 || !json.data) return [];

  const [arabicEd, maududiEd] = json.data;

  const results: AyahData[] = [];
  for (let i = startAyah; i <= endAyah; i++) {
    const arabicAyah = arabicEd.ayahs.find((a: any) => a.numberInSurah === i);
    const maududiAyah = maududiEd.ayahs.find((a: any) => a.numberInSurah === i);
    const tafseerText = tafseerTexts[i - startAyah] || "";

    if (arabicAyah) {
      results.push({
        number: arabicAyah.number,
        numberInSurah: i,
        arabic: arabicAyah.text,
        maududi: maududiAyah?.text || "",
        tafseer: tafseerText,
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
}: {
  ayah: AyahData;
  activeAyah: number | null;
  onPlay: (num: number) => void;
  onPause: () => void;
  isPlaying: boolean;
}) {
  const [showTafseer, setShowTafseer] = useState(false);
  const isActive = activeAyah === ayah.number;

  return (
    <div
      className={`rounded-3xl overflow-hidden transition-all duration-500${isActive ? " ring-2 ring-purple-400/40" : ""}`}
      style={{
        background: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.80)",
        backdropFilter: "blur(20px)",
        border: isActive
          ? "1px solid rgba(139,92,246,0.4)"
          : "1px solid rgba(255,255,255,0.9)",
        boxShadow: isActive
          ? "0 8px 32px rgba(109,40,217,0.15), inset 0 1px 0 rgba(255,255,255,0.95)"
          : "0 2px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.95)",
      }}
    >
      {isActive && (
        <div
          className="h-0.5 w-full"
          style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7, #6366f1)" }}
        />
      )}

      <div className="p-5 md:p-6">
        {/* Ayah number + audio controls */}
        <div className="flex items-center justify-between mb-5">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full font-urdu"
            style={{
              background: isActive
                ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                : "linear-gradient(135deg, rgba(245,243,255,0.9), rgba(237,233,254,0.8))",
              border: isActive ? "none" : "1px solid rgba(221,214,254,0.6)",
            }}
          >
            <span className="text-xs font-bold" style={{ color: isActive ? "white" : "#6d28d9" }}>
              آیت {ayah.numberInSurah}
            </span>
          </div>

          <button
            onClick={() => (isActive && isPlaying ? onPause() : onPlay(ayah.number))}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs font-urdu transition-all active:scale-95 hover:scale-105"
            style={{
              background:
                isActive && isPlaying
                  ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                  : "linear-gradient(135deg, rgba(245,243,255,0.9), rgba(237,233,254,0.7))",
              border: isActive && isPlaying ? "none" : "1px solid rgba(196,181,253,0.4)",
              color: isActive && isPlaying ? "white" : "#6d28d9",
              boxShadow:
                isActive && isPlaying
                  ? "0 4px 14px rgba(124,58,237,0.4)"
                  : "0 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            {isActive && isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                روک دیں
              </>
            ) : (
              <>
                <Headphones className="w-3.5 h-3.5" />
                سنیں
              </>
            )}
          </button>
        </div>

        {/* Arabic text */}
        <div
          className="mb-5 p-4 md:p-5 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(245,243,255,0.6), rgba(237,233,254,0.4))",
            border: "1px solid rgba(221,214,254,0.3)",
          }}
        >
          <p
            className="font-arabic text-right text-slate-800"
            style={{
              fontSize: "clamp(1.4rem, 3.5vw, 2.2rem)",
            }}
          >
            {ayah.arabic}
          </p>
        </div>

        {/* Maudoodi Tarjuma */}
        {ayah.maududi && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-3.5 h-3.5" style={{ color: "#7c3aed" }} />
              <span className="font-urdu text-xs font-bold uppercase tracking-wider" style={{ color: "#7c3aed" }}>
                ترجمہ — مولانا مودودیؒ
              </span>
            </div>
            <p
              className="font-urdu text-right"
              style={{
                fontSize: "1.1rem",
                color: "#334155",
              }}
            >
              {ayah.maududi}
            </p>
          </div>
        )}

        {/* Tafseer toggle */}
        {ayah.tafseer && (
          <div>
            <button
              onClick={() => setShowTafseer(!showTafseer)}
              className="flex items-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-sm transition-all font-urdu"
              style={{
                background: showTafseer
                  ? "linear-gradient(135deg, rgba(237,233,254,0.9), rgba(221,214,254,0.7))"
                  : "rgba(248,250,252,0.8)",
                border: "1px solid rgba(221,214,254,0.4)",
                color: "#5b21b6",
              }}
            >
              <BookText className="w-4 h-4" />
              <span className="flex-1 text-right">
                تفسیر — تفہیم القرآن، مولانا مودودیؒ
              </span>
              {showTafseer ? (
                <ChevronUp className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              )}
            </button>

            {showTafseer && (
              <div
                className="mt-3 p-4 rounded-xl tafseer-content"
                style={{
                  background: "rgba(245,243,255,0.5)",
                  border: "1px solid rgba(221,214,254,0.3)",
                }}
              >
                <div
                  className="font-urdu text-right"
                  style={{
                    fontSize: "1.05rem",
                    color: "#475569",
                  }}
                  dangerouslySetInnerHTML={{ __html: ayah.tafseer }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function TopicPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);

  const [topic, setTopic] = useState<TopicData | null>(null);
  const [ayaat, setAyaat] = useState<AyahData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAyah, setActiveAyah] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

        const ayaatData = await fetchAyatRange(parsed.surahNum, parsed.startAyah, parsed.endAyah);
        setAyaat(ayaatData);
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handlePlay = useCallback(
    (globalNum: number) => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = `${AUDIO_BASE}/${globalNum}`;
        audioRef.current.muted = isMuted;
        audioRef.current.play();
        setActiveAyah(globalNum);
        setIsPlaying(true);
      }
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
    handlePlay(ayaat[0].number);
  }, [ayaat, isPlaying, handlePlay, handlePause]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      const idx = ayaat.findIndex((a) => a.number === activeAyah);
      if (idx !== -1 && idx < ayaat.length - 1) {
        handlePlay(ayaat[idx + 1].number);
      } else {
        setIsPlaying(false);
        setActiveAyah(null);
      }
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [ayaat, activeAyah, handlePlay]);

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-4"
        style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #eef2ff 40%, #fdf4ff 100%)" }}
      >
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg"
          style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)" }}
        >
          <Loader2 className="animate-spin w-7 h-7 text-purple-600" />
        </div>
        <p className="text-sm font-semibold text-slate-500">آیات لوڈ ہو رہی ہیں…</p>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-4 px-6"
        style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #eef2ff 40%, #fdf4ff 100%)" }}
      >
        <p className="text-slate-600 font-semibold text-center">{error || "Topic not found."}</p>
        <Link
          href="/portal"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-white"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
        >
          <ArrowLeft className="w-4 h-4" /> واپس جائیں
        </Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #f5f3ff 0%, #eef2ff 50%, #fdf4ff 100%)" }}
    >
      <audio ref={audioRef} preload="none" />

      {/* ── Hero ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #3b0764 0%, #4c1d95 40%, #4338ca 100%)",
          borderRadius: "0 0 2.5rem 2.5rem",
          boxShadow: "0 10px 40px rgba(59,7,100,0.25)",
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div
            className="absolute -top-24 right-0 w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)" }}
          />
          <div
            className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-5 md:px-8 pt-8 pb-12">
          <Link
            href="/portal"
            className="inline-flex items-center gap-1.5 mb-8 group transition-all"
            style={{ color: "rgba(196,181,253,0.65)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.02em" }}
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Attendee Portal
          </Link>

          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-purple-100 flex-shrink-0 text-sm"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              {topic.topic_number}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span
                  style={{
                    color: "rgba(196,181,253,0.65)",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  Topic {topic.topic_number}
                </span>
              </div>
              <h1
                className="font-bold text-white leading-tight mb-2"
                style={{ fontSize: "clamp(1.2rem, 3vw, 1.8rem)", letterSpacing: "-0.025em" }}
              >
                {topic.title}
              </h1>
              <p style={{ color: "rgba(196,181,253,0.7)", fontSize: "0.875rem", fontWeight: 600 }}>
                {topic.reference}
              </p>
            </div>
          </div>

          {/* Player controls bar */}
          {ayaat.length > 0 && (
            <div
              className="mt-8 flex items-center justify-between p-3 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayAll}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all"
                  style={{
                    background: isPlaying ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.92)",
                    color: isPlaying ? "white" : "#4c1d95",
                    border: isPlaying ? "1px solid rgba(255,255,255,0.2)" : "none",
                    boxShadow: isPlaying ? "none" : "0 4px 14px rgba(0,0,0,0.15)",
                  }}
                >
                  {isPlaying ? (
                    <><Pause className="w-4 h-4" /> Stop</>
                  ) : (
                    <><Play className="w-4 h-4" /> Play All</>
                  )}
                </button>
                <span style={{ fontSize: "0.75rem", color: "rgba(196,181,253,0.6)", fontWeight: 600 }}>
                  Mishary Alafasy
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <BookOpen className="w-3.5 h-3.5 text-purple-300" />
                  <span style={{ fontSize: "0.7rem", color: "rgba(196,181,253,0.7)", fontWeight: 700 }}>
                    {ayaat.length} آیات
                  </span>
                </div>

                <button
                  onClick={() => {
                    const newMuted = !isMuted;
                    setIsMuted(newMuted);
                    if (audioRef.current) audioRef.current.muted = newMuted;
                  }}
                  className="p-2 rounded-xl transition-all"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-purple-300" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-purple-300" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Ayaat list ──────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-5 md:px-8 pt-8 pb-16">
        {ayaat.length === 0 ? (
          <div
            className="rounded-3xl p-10 text-center"
            style={{
              background: "rgba(255,255,255,0.80)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.9)",
            }}
          >
            <BookOpen className="w-10 h-10 text-purple-300 mx-auto mb-3" />
            <p className="font-semibold" style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
              اس موضوع کے لیے آیات دستیاب نہیں ہیں
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {ayaat.map((ayah) => (
              <AyahCard
                key={ayah.number}
                ayah={ayah}
                activeAyah={activeAyah}
                onPlay={handlePlay}
                onPause={handlePause}
                isPlaying={isPlaying}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
