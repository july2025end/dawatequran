"use client";

import { Activity, BookOpen, Calendar, Users, LogOut, ClipboardList, Map } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Dashboard',  href: '/dashboard',           icon: Activity,      short: 'Home'  },
    { name: 'UC Status',  href: '/dashboard/uc-status', icon: Map,           short: 'UC'    },
    { name: 'Schedule',   href: '/dashboard/schedule',  icon: Calendar,      short: 'Sched' },
    { name: 'Jaiza',      href: '/dashboard/jaiza',     icon: ClipboardList, short: 'Jaiza' },
    { name: 'Syllabus',   href: '/dashboard/syllabus',  icon: BookOpen,      short: 'Syllab'},
    { name: 'Directory',  href: '/dashboard/roster',    icon: Users,         short: 'Dir'   },
  ];

  const handleLogout = () => router.push('/');

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden" style={{
      background: 'radial-gradient(ellipse 70% 50% at 15% 10%, rgba(16,185,129,0.10) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 85% 90%, rgba(99,102,241,0.07) 0%, transparent 55%), linear-gradient(135deg, #eef2ff 0%, #f0fdf4 40%, #f0f9ff 100%)'
    }}>

      {/* ─── Sidebar (Desktop md+) ───────────────────────── */}
      <aside className="hidden md:flex flex-col h-full flex-shrink-0 w-16 xl:w-64 sidebar-glass shadow-2xl z-40 transition-all duration-300">

        {/* Logo area */}
        <div className="flex items-center justify-center xl:justify-start gap-3 p-4 xl:px-5 xl:py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center border border-white/20 shadow-lg"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)' }}>
            <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="hidden xl:block min-w-0">
            <h1 className="text-sm font-bold text-white leading-tight">Dawat-e-Quran</h1>
            <p className="text-xs font-semibold mt-0.5" style={{ color: 'rgba(110,231,183,0.8)' }}>Admin Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 xl:px-3 space-y-1 overflow-y-auto scrollbar-hide">
          <p className="hidden xl:block text-xs font-bold uppercase tracking-widest px-3 mb-3" style={{ color: 'rgba(110,231,183,0.35)', letterSpacing: '0.12em' }}>Navigation</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={`flex items-center gap-3 w-full transition-all duration-200 group
                  justify-center xl:justify-start
                  rounded-2xl p-2.5 xl:px-3.5 xl:py-2.5
                  ${isActive
                    ? 'text-white'
                    : 'hover:text-emerald-100'
                  }`}
                style={isActive ? {
                  background: 'rgba(255,255,255,0.16)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.1)'
                } : {
                  color: 'rgba(167,243,208,0.55)'
                }}
              >
                <Icon
                  className={`w-4.5 h-4.5 flex-shrink-0 transition-all duration-200 ${isActive ? 'text-emerald-300' : 'group-hover:text-emerald-300'}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="hidden xl:block text-sm font-semibold truncate">{item.name}</span>
                {isActive && <div className="hidden xl:block ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 shadow-sm" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 xl:p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center gap-3 w-full rounded-2xl p-2.5 xl:px-3.5 xl:py-2.5 transition-all group justify-center xl:justify-start"
            style={{ color: 'rgba(252,165,165,0.6)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut className="w-4.5 h-4.5 flex-shrink-0 group-hover:text-red-300 transition-colors" strokeWidth={2} />
            <span className="hidden xl:block text-sm font-semibold group-hover:text-red-300 transition-colors">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── Mobile Top Header ─────────────────────────────── */}
      <div className="md:hidden sticky top-0 z-50 px-4 py-3.5 flex items-center justify-between shadow-lg" style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0f766e 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.12)'
      }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/20"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}>
            <BookOpen className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Dawat-e-Quran</h1>
            <p className="text-xs font-medium leading-none mt-0.5" style={{ color: 'rgba(110,231,183,0.7)' }}>Admin Portal</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2.5 rounded-xl border border-white/15 active:scale-90 transition-all hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          <LogOut className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* ─── Main Content ────────────────────────────────────── */}
      <main className="flex-1 h-full overflow-y-auto scroll-smooth">
        <div className="min-h-full">
          {children}
        </div>
      </main>

      {/* ─── Mobile Bottom Navigation ──────────────────────── */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm">
        <div className="glass-pill border border-white/90 shadow-2xl p-1.5 flex items-center justify-between gap-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-full transition-all duration-300 px-3 py-2
                  ${isActive
                    ? 'text-white flex-1 justify-center shadow-md'
                    : 'flex-shrink-0 text-slate-400 hover:text-emerald-600'
                  }`}
                style={isActive ? {
                  background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                  boxShadow: '0 4px 14px rgba(5,150,105,0.35)'
                } : {}}
              >
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                {isActive && <span className="text-xs font-bold truncate">{item.short}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
