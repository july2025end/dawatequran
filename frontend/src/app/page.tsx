"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, LogIn, Lock, X, ArrowRight, Shield, Eye } from 'lucide-react';

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
      title: 'Murabbi Portal',
      desc: 'Log Jaiza & mark attendance for your circle',
      icon: LogIn,
      accent: 'emerald',
      badge: 'Mark Attendance',
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100 hover:border-emerald-300',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      key: 'admin' as const,
      title: 'Admin Portal',
      desc: 'Zone Nazim dashboard with full analytics',
      icon: Shield,
      accent: 'blue',
      badge: 'Admin Only',
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100 hover:border-blue-300',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-md w-full relative z-10 animate-fade-in-up">
        {/* Hero Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-900/10 overflow-hidden border border-gray-100">

          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-900 p-8 text-center relative overflow-hidden">
            {/* Decorative rings */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full border border-white/5" />
              <div className="absolute -top-4 -right-4 w-28 h-28 rounded-full border border-white/10" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full border border-white/5" />
            </div>

            <div className="relative z-10">
              <div className="w-18 h-18 bg-white/10 rounded-2xl backdrop-blur-sm flex items-center justify-center mx-auto mb-5 border border-white/20 shadow-xl w-16 h-16">
                <BookOpen className="text-white w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Dawat-e-Quran</h1>
              <div className="mt-2 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Zone 5 Management</p>
              </div>
            </div>
          </div>

          {/* Portal Cards */}
          <div className="p-6 space-y-4">
            <p className="text-center text-sm text-gray-500 font-medium">Select your portal to get started</p>

            <div className="space-y-3 stagger">
              {portals.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handlePortalClick(p.key)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 ${p.border} bg-white hover:shadow-lg hover:shadow-gray-100 hover:-translate-y-0.5 transition-all duration-200 group text-left animate-fade-in-up`}
                  >
                    <div className={`${p.iconBg} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className={`${p.iconColor} w-6 h-6`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-gray-900">{p.title}</h2>
                        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${p.badgeColor}`}>{p.badge}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 leading-snug">{p.desc}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <ArrowRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Attendee Portal - no password */}
              <Link
                href="/portal"
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-purple-100 hover:border-purple-300 bg-white hover:shadow-lg hover:shadow-gray-100 hover:-translate-y-0.5 transition-all duration-200 group animate-fade-in-up"
              >
                <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <BookOpen className="text-purple-700 w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-900">Attendee Portal</h2>
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Public</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">View schedule & syllabus — no login needed</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 text-center">
            <p className="text-xs text-gray-400 font-medium">Dawat-e-Quran Zone 5 · Internal Platform</p>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className={`p-5 text-white flex justify-between items-center bg-gradient-to-r ${targetPortal === 'admin' ? 'from-blue-600 to-indigo-700' : 'from-emerald-600 to-teal-700'}`}>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Lock className="w-4 h-4" />
                  <h3 className="font-bold text-base">{targetPortal === 'admin' ? 'Admin Login' : 'Murabbi Login'}</h3>
                </div>
                <p className="text-xs text-white/70">Enter your password to continue</p>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3.5 pr-12 bg-gray-50 border-2 text-gray-900 rounded-2xl outline-none transition-all text-base ${error ? 'border-red-300 focus:border-red-400' : targetPortal === 'admin' ? 'border-gray-200 focus:border-blue-400' : 'border-gray-200 focus:border-emerald-400'}`}
                    placeholder="Enter password..."
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
                {error && (
                  <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1">
                    <span>⚠</span> {error}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className={`w-full py-4 text-white font-bold rounded-2xl transition-all active:scale-[0.98] shadow-lg text-base bg-gradient-to-r ${targetPortal === 'admin' ? 'from-blue-600 to-indigo-600 shadow-blue-200 hover:shadow-blue-300' : 'from-emerald-600 to-teal-600 shadow-emerald-200 hover:shadow-emerald-300'}`}
              >
                Enter Portal →
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}