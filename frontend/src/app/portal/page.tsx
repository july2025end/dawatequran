"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BookOpen, Map, LayoutDashboard, Loader2, ChevronRight, Activity, Calendar, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from "next/link";
import { getTafheemLink } from "@/lib/quran_utils";

export default function AttendeePortal() {
  const [loading, setLoading] = useState(true);
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [ucs, setUcs] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [showAllTopics, setShowAllTopics] = useState(false);

  useEffect(() => {
    async function fetchPortalData() {
      setLoading(true);
      try {
        const { data: sData } = await supabase.from('syllabus_topics').select('*').order('topic_number');
        const { data: uData } = await supabase.from('union_councils').select('*').order('name');
        const { data: cData } = await supabase.from('quran_circles').select('*, union_councils(name)');
        const now = new Date().toISOString().split('T')[0];
        const { data: sessData } = await supabase
          .from('sessions')
          .select('*, quran_circles(name), syllabus_topics(title)')
          .gte('session_date', now)
          .order('session_date', { ascending: true })
          .limit(6);
        setSyllabus(sData || []);
        setUcs(uData || []);
        setCircles(cData || []);
        setUpcomingSessions(sessData || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchPortalData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3" style={{
        background: 'linear-gradient(135deg, #f5f3ff 0%, #eef2ff 40%, #fdf4ff 100%)'
      }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.9)' }}>
          <Loader2 className="animate-spin w-6 h-6 text-purple-600" />
        </div>
        <p className="text-sm font-semibold text-slate-600">Loading portal...</p>
      </div>
    );
  }

  const visibleTopics = showAllTopics ? syllabus : syllabus.slice(0, 8);

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(160deg, #f5f3ff 0%, #eef2ff 50%, #fdf4ff 100%)'
    }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #3b0764 0%, #4c1d95 40%, #4338ca 100%)',
        borderRadius: '0 0 2.5rem 2.5rem',
        boxShadow: '0 10px 40px rgba(59,7,100,0.25)'
      }}>
        {/* Decorative blurs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute -top-24 right-0 w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)' }} />
          <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 pt-8 pb-12">
          {/* Back link */}
          <Link href="/" className="inline-flex items-center gap-1.5 mb-8 group transition-all"
            style={{ color: 'rgba(196,181,253,0.65)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.02em' }}>
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>

          {/* Hero content: title + stats card */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">

            {/* Left: title */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span style={{ color: 'rgba(196,181,253,0.65)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Public Portal</span>
              </div>
              <h1 className="font-bold text-white leading-tight mb-3" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', letterSpacing: '-0.025em' }}>
                Quran Circle Hub
              </h1>
              <p className="font-bold mb-3" style={{ fontSize: 'clamp(1.2rem, 3vw, 1.7rem)', color: 'rgba(196,181,253,0.85)', letterSpacing: '-0.02em' }}>
                Zone 5, Islamabad
              </p>
              <p style={{ color: 'rgba(196,181,253,0.55)', fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.7, maxWidth: '400px' }}>
                Access circle schedules, track syllabus progress, and find your nearest learning unit.
              </p>
            </div>

            {/* Right: stats glass card */}
            <div className="w-full md:w-56 flex-shrink-0">
              <div className="rounded-2xl overflow-hidden" style={{
                background: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.18)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.15)'
              }}>
                {/* Card header */}
                <div className="flex items-center gap-2.5 px-5 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                    <LayoutDashboard className="w-3.5 h-3.5 text-purple-200" />
                  </div>
                  <span className="text-sm font-bold text-white">Zone Overview</span>
                </div>
                {/* Stats */}
                <div className="px-5 py-2">
                  {[
                    { label: 'Active Circles', value: circles.length },
                    { label: 'UC Sectors', value: ucs.length },
                    { label: 'Topics', value: syllabus.length },
                  ].map((item, i, arr) => (
                    <div key={i} className="flex items-center justify-between py-3"
                      style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                      <span style={{ color: 'rgba(196,181,253,0.65)', fontSize: '0.75rem', fontWeight: 600 }}>{item.label}</span>
                      <span className="text-white font-bold text-xl">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-5 md:px-8 pt-8 pb-16 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* ── Curriculum ──────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                  <BookOpen className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p style={{ fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7c3aed' }}>Curriculum</p>
                  <h2 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">Topics</h2>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full"
                style={{ background: 'linear-gradient(135deg, rgba(237,233,254,0.9), rgba(221,214,254,0.8))', border: '1px solid rgba(196,181,253,0.4)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#5b21b6' }}>{syllabus.length} Topics</span>
              </div>
            </div>

            {/* Topic cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visibleTopics.map((t) => {
                const tafheemUrl = getTafheemLink(t.reference);
                const CardTag = tafheemUrl ? 'a' : 'div';
                const cardProps = tafheemUrl
                  ? { href: tafheemUrl, target: '_blank', rel: 'noopener noreferrer' }
                  : {};
                return (
                  <CardTag
                    key={t.id}
                    {...(cardProps as any)}
                    className={`group relative block hover:-translate-y-1 transition-all duration-300 ${tafheemUrl ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="h-full rounded-2xl overflow-hidden" style={{
                      background: 'rgba(255,255,255,0.80)',
                      backdropFilter: 'blur(20px)',
                      border: tafheemUrl ? '1px solid rgba(196,181,253,0.35)' : '1px solid rgba(255,255,255,0.9)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.95)',
                    }}>
                      {/* Top accent line */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7)' }} />
                      <div className="p-4 md:p-5">
                        <div className="flex items-start justify-between mb-3">
                          {/* Topic number badge */}
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                            style={{
                              background: 'linear-gradient(135deg, rgba(245,243,255,0.9), rgba(237,233,254,0.8))',
                              border: '1px solid rgba(221,214,254,0.6)',
                              color: '#6d28d9',
                            }}>
                            {t.topic_number}
                          </div>
                          {tafheemUrl ? (
                            <ExternalLink className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
                              style={{ color: '#7c3aed' }} />
                          ) : (
                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0"
                              style={{ color: 'rgba(203,213,225,0.5)' }} />
                          )}
                        </div>
                        {/* Title */}
                        <h3 className="font-semibold leading-snug mb-2 transition-colors duration-200 group-hover:text-purple-900"
                          style={{ fontSize: '0.875rem', color: '#1e293b' }}>
                          {t.title}
                        </h3>
                        {/* Reference */}
                        {t.reference ? (
                          <div className="flex items-center gap-1.5">
                            <p style={{ fontSize: '0.72rem', color: tafheemUrl ? '#7c3aed' : '#94a3b8', fontWeight: 600 }}>
                              {t.reference}
                            </p>
                            {tafheemUrl && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tafheem ↗</span>
                            )}
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 500, fontStyle: 'italic' }}>General Module</p>
                        )}
                      </div>
                    </div>
                  </CardTag>
                );
              })}
            </div>

            {syllabus.length > 8 && (
              <button
                onClick={() => setShowAllTopics(!showAllTopics)}
                className="w-full py-3 rounded-2xl font-semibold text-sm transition-all"
                style={{
                  background: 'rgba(255,255,255,0.70)',
                  backdropFilter: 'blur(12px)',
                  border: '1.5px dashed rgba(196,181,253,0.5)',
                  color: '#7c3aed',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                {showAllTopics ? 'Show Less' : `Show All ${syllabus.length} Topics`}
              </button>
            )}
          </div>

          {/* ── Sidebar ───────────────────────────────────── */}
          <div className="space-y-5">

            {/* Upcoming Sessions */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md"
                  style={{ background: 'linear-gradient(135deg, #4338ca, #6366f1)' }}>
                  <Calendar className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p style={{ fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#4338ca' }}>Schedule</p>
                  <h2 className="font-bold text-slate-900 text-base leading-tight tracking-tight">Upcoming Sessions</h2>
                </div>
              </div>

              <div className="space-y-2.5">
                {upcomingSessions.length > 0 ? upcomingSessions.map((s) => (
                  <div key={s.id} className="group rounded-2xl overflow-hidden hover:-translate-y-0.5 transition-all duration-200" style={{
                    background: 'rgba(255,255,255,0.80)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.9)',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)'
                  }}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2.5">
                        {/* Date badge */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                          style={{ background: 'linear-gradient(135deg, rgba(237,233,254,0.9), rgba(221,214,254,0.7))', border: '1px solid rgba(196,181,253,0.35)' }}>
                          <Calendar className="w-3 h-3" style={{ color: '#6d28d9' }} />
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#5b21b6', letterSpacing: '0.04em' }}>
                            {new Date(s.session_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }).toUpperCase()}
                          </span>
                        </div>
                        {/* Active dot */}
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                          style={{ boxShadow: '0 0 6px rgba(52,211,153,0.7)' }} />
                      </div>
                      <h4 className="font-bold text-slate-800 leading-tight mb-1" style={{ fontSize: '0.875rem' }}>
                        {s.quran_circles?.name}
                      </h4>
                      <p className="truncate font-medium" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {s.syllabus_topics?.title || 'General Discussion'}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl p-6 text-center" style={{
                    background: 'rgba(255,255,255,0.65)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.85)'
                  }}>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 500 }}>No upcoming sessions scheduled</p>
                  </div>
                )}
              </div>
            </div>

            {/* CTA card */}
            <div className="relative overflow-hidden rounded-3xl p-5 group" style={{
              background: 'linear-gradient(135deg, #3b0764 0%, #4c1d95 60%, #4338ca 100%)',
              boxShadow: '0 8px 32px rgba(109,40,217,0.22), inset 0 1px 0 rgba(255,255,255,0.12)'
            }}>
              {/* Decorative glow */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-125"
                style={{ background: 'rgba(255,255,255,0.05)', filter: 'blur(20px)' }} />
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />

              <div className="relative">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                  <Map className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                    style={{ color: 'rgba(196,181,253,0.9)' }} />
                </div>
                <h3 className="font-bold text-white mb-1.5" style={{ fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>
                  Find a Circle Near You
                </h3>
                <p className="mb-4 leading-relaxed" style={{ fontSize: '0.75rem', fontWeight: 500, color: 'rgba(196,181,253,0.6)' }}>
                  View all active circles across Zone 5 Union Councils.
                </p>
                <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold active:scale-95 transition-all hover:shadow-lg"
                  style={{ background: 'rgba(255,255,255,0.92)', color: '#4c1d95', fontSize: '0.75rem', letterSpacing: '0.04em', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  Explore <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center" style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 500 }}>
              Zone 5 · Islamabad, Pakistan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
