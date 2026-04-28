"use client";

import { Activity, BookOpen, Calendar, Users, LogOut, ClipboardList, Map } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Dashboard',  href: '/dashboard',           icon: Activity,     short: 'Home'      },
    { name: 'UC Status',  href: '/dashboard/uc-status', icon: Map,          short: 'UC'        },
    { name: 'Schedule',   href: '/dashboard/schedule',  icon: Calendar,     short: 'Schedule'  },
    { name: 'Jaiza',      href: '/dashboard/jaiza',     icon: ClipboardList,short: 'Jaiza'     },
    { name: 'Syllabus',   href: '/dashboard/syllabus',  icon: BookOpen,     short: 'Syllabus'  },
    { name: 'Directory',  href: '/dashboard/roster',    icon: Users,        short: 'Directory' },
  ];

  const handleLogout = () => router.push('/');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">

      {/* ─── Sidebar (icon-only @ md, full @ lg) ─────────────────── */}
      <aside className="hidden md:flex flex-col sticky top-0 h-screen
                        w-18 lg:w-64
                        bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-900
                        shadow-2xl shadow-emerald-950/30 transition-all duration-300 overflow-hidden">

        {/* Logo */}
        <div className="p-3 lg:p-7 lg:pb-6 border-b border-white/10 flex items-center justify-center lg:justify-start gap-3">
          <div className="w-9 h-9 flex-shrink-0 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          {/* Text only shows on lg */}
          <div className="hidden lg:block">
            <h1 className="text-base font-bold text-white tracking-tight leading-none">Dawat-e-Quran</h1>
            <p className="text-[10px] text-emerald-300/80 font-semibold uppercase tracking-widest mt-0.5">Zone 5</p>
          </div>
        </div>

        {/* Online badge — lg only */}
        <div className="hidden lg:flex items-center gap-2 mx-4 mt-3 bg-emerald-950/40 rounded-xl px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-xs text-emerald-300 font-medium">Admin Portal • Active</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 lg:px-4 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          <p className="hidden lg:block text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/60 px-3 mb-3">Navigation</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={`flex items-center gap-3 rounded-2xl font-semibold text-sm transition-all duration-200 group
                  justify-center lg:justify-start
                  p-2.5 lg:px-4 lg:py-3
                  ${isActive
                    ? 'bg-white text-emerald-800 shadow-lg shadow-emerald-950/20'
                    : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? 'bg-emerald-100' : 'bg-white/5 group-hover:bg-white/15'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : ''}`} />
                </div>
                <span className="hidden lg:block truncate">{item.name}</span>
                {isActive && <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 lg:p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex items-center gap-3 w-full rounded-2xl text-rose-300/80 font-semibold text-sm hover:bg-rose-500/20 hover:text-rose-200 transition-all group
                       justify-center lg:justify-start
                       p-2.5 lg:px-4 lg:py-3"
          >
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors flex-shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="hidden lg:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── Mobile Top Header (<md only) ───────────────────────── */}
      <div className="md:hidden sticky top-0 z-50 bg-gradient-to-r from-emerald-900 to-teal-900 text-white px-4 py-3 flex items-center justify-between shadow-lg shadow-emerald-950/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-none">Dawat-e-Quran</h1>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300/80 leading-none mt-0.5">Admin Portal</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 bg-white/10 rounded-xl border border-white/10 active:scale-95 transition-all hover:bg-white/20">
          <LogOut className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* ─── Main Content ────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-y-auto pb-24 md:pb-0">
        {children}
      </main>

      {/* ─── Mobile Bottom Navigation (<md only) ─────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-gray-200/80 shadow-[0_-8px_30px_-8px_rgba(0,0,0,0.12)]">
        <div className="flex justify-around items-center px-1 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className="flex flex-col items-center gap-1 flex-1 py-1 px-0.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 ${isActive ? 'bg-emerald-600 shadow-lg shadow-emerald-300/40 scale-110' : 'bg-transparent'}`}>
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400'}`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] font-semibold uppercase tracking-tighter transition-colors ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>{item.short}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
