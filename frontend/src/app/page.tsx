"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, LogIn, Lock, X, ArrowRight, Shield, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [targetPortal, setTargetPortal] = useState<'admin' | 'murabbi' | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handlePortalClick = (portal: 'admin' | 'murabbi') => {
    setTargetPortal(portal);
    setPassword('');
    setError('');
    setShowPass(false);
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetPortal === 'admin') {
      if (password === 'JI2026JI') router.push('/dashboard');
      else setError('Incorrect password. Please try again.');
    } else if (targetPortal === 'murabbi') {
      if (password === 'Marhaba') router.push('/attendance');
      else setError('Incorrect password. Please try again.');
    }
  };

  const portals = [
    {
      key: 'murabbi' as const,
      title: 'Attendance Portal',
      desc: 'Mark attendance & log session details',
      icon: LogIn,
      badge: 'Murabbi',
      badgeClass: 'badge-emerald',
      iconBg: 'from-emerald-400 to-teal-500',
      cardBg: 'from-emerald-50/80 to-teal-50/60',
      cardBorder: 'border-emerald-200/50',
      hoverGlow: 'hover:shadow-emerald-100/80',
      accentBar: 'from-emerald-400 to-teal-400',
    },
    {
      key: 'admin' as const,
      title: 'Admin Dashboard',
      desc: 'Zone analytics & management',
      icon: Shield,
      badge: 'Admin Only',
      badgeClass: 'badge-blue',
      iconBg: 'from-blue-400 to-indigo-500',
      cardBg: 'from-blue-50/80 to-indigo-50/60',
      cardBorder: 'border-blue-200/50',
      hoverGlow: 'hover:shadow-blue-100/80',
      accentBar: 'from-blue-400 to-indigo-400',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4 py-12" style={{
      background: 'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(16,185,129,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(99,102,241,0.08) 0%, transparent 60%), linear-gradient(135deg, #eef2ff 0%, #f0fdf4 40%, #f0f9ff 100%)'
    }}>

      {/* Decorative orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-300/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-300/08 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-teal-300/08 rounded-full blur-[80px] pointer-events-none" />

      {/* Floating dots decoration */}
      <div className="absolute top-16 right-24 w-2 h-2 rounded-full bg-emerald-400/40 hidden md:block" />
      <div className="absolute top-32 right-16 w-1.5 h-1.5 rounded-full bg-indigo-400/30 hidden md:block" />
      <div className="absolute bottom-24 left-20 w-2 h-2 rounded-full bg-teal-400/40 hidden md:block" />
      <div className="absolute bottom-16 left-32 w-1 h-1 rounded-full bg-emerald-400/30 hidden md:block" />

      <div className="w-full max-w-[400px] relative z-10 animate-fade-in-up">

        {/* Brand Pill */}
        <div className="flex justify-center mb-6">
          <div className="pill-container px-5 py-2.5 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">Zone 5 Management</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Main Card */}
        <div className="card overflow-hidden" style={{ borderRadius: '2rem' }}>

          {/* Hero section */}
          <div className="relative overflow-hidden px-8 py-10 text-center" style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 35%, #0f766e 70%, #134e4a 100%)'
          }}>
            {/* Shimmer effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
              <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-teal-400/10 blur-2xl" />
            </div>

            <div className="relative z-10">
              {/* Icon */}
              <div className="relative inline-flex mb-5">
                <div className="w-20 h-20 rounded-[1.75rem] flex items-center justify-center border border-white/20 shadow-2xl"
                  style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}>
                  <BookOpen className="text-white w-9 h-9" />
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center shadow-md">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white mb-2 leading-tight">Dawat-e-Quran</h1>
              <p className="text-emerald-200/60 text-sm font-medium">Regional Circle Management</p>
            </div>
          </div>

          {/* Portal Selection */}
          <div className="p-5 space-y-3">
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Choose Your Portal</p>

            <div className="space-y-2.5 stagger">
              {portals.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handlePortalClick(p.key)}
                    className={`w-full relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl border ${p.cardBorder} bg-gradient-to-br ${p.cardBg} hover:shadow-lg ${p.hoverGlow} hover:-translate-y-0.5 transition-all duration-200 group text-left`}
                  >
                    {/* Top accent line */}
                    <div className={`absolute top-0 left-6 right-6 h-px bg-gradient-to-r ${p.accentBar} opacity-0 group-hover:opacity-60 transition-opacity`} />

                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${p.iconBg} shadow-md group-hover:scale-105 transition-transform duration-200`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h2 className="font-bold text-slate-900 text-sm">{p.title}</h2>
                        <span className={`badge ${p.badgeClass}`}>{p.badge}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                );
              })}

              <Link
                href="/portal"
                className="w-full relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl border border-purple-200/50 bg-gradient-to-br from-purple-50/80 to-fuchsia-50/60 hover:shadow-lg hover:shadow-purple-100/80 hover:-translate-y-0.5 transition-all duration-200 group text-left"
              >
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-purple-400 to-fuchsia-400 opacity-0 group-hover:opacity-60 transition-opacity" />
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-400 to-fuchsia-500 shadow-md group-hover:scale-105 transition-transform duration-200">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="font-bold text-slate-900 text-sm">Public Portal</h2>
                    <span className="badge badge-purple">Public</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">View schedules & curriculum — Open access</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 text-center">
            <p className="text-xs text-slate-300">Dawat-e-Quran · PK-Zone 5 · Islamabad</p>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(12px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPasswordModal(false); }}
        >
          <div className="w-full max-w-sm animate-float-up" style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.95)',
            borderRadius: '2rem',
            boxShadow: '0 25px 80px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)'
          }}>
            {/* Header */}
            <div className={`px-6 py-5 text-white flex items-center justify-between rounded-t-[2rem] overflow-hidden relative`} style={{
              background: targetPortal === 'admin'
                ? 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)'
                : 'linear-gradient(135deg, #064e3b 0%, #0f766e 100%)'
            }}>
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-px bg-white/20" />
                <div className="absolute -top-12 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              </div>
              <div className="relative flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{targetPortal === 'admin' ? 'Admin Access' : 'Murabbi Access'}</h3>
                  <p className="text-xs opacity-60 mt-0.5">Enter your password to continue</p>
                </div>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="relative p-1.5 rounded-lg hover:bg-white/15 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`form-input pr-10 ${error ? '!border-red-300 !shadow-[0_0_0_3px_rgba(239,68,68,0.08)]' : ''}`}
                    placeholder="Enter password"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {error && <p className="text-red-500 text-xs font-semibold mt-2">{error}</p>}
              </div>
              <button type="submit" className={`btn btn-primary w-full py-3 text-sm ${targetPortal === 'admin' ? '!bg-gradient-to-r !from-blue-600 !to-indigo-600 hover:!from-blue-700 hover:!to-indigo-700' : ''}`}>
                Sign In <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
