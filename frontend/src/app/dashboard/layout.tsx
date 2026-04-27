"use client";

import { useState } from 'react';
import { Activity, BookOpen, Calendar, Users, LogOut, Settings, ClipboardList, Map, Menu, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Activity },
    { name: 'UC Status', href: '/dashboard/uc-status', icon: Map },
    { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
    { name: 'Jaiza Reports', href: '/dashboard/jaiza', icon: ClipboardList },
    { name: 'Syllabus', href: '/dashboard/syllabus', icon: BookOpen },
    { name: 'Directory', href: '/dashboard/roster', icon: Users },
  ];

  const handleLogout = () => {
    // In a real app, you'd call supabase.auth.signOut() here
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-emerald-800 text-white flex-col sticky top-0 h-screen shadow-xl shadow-emerald-900/20">
        <div className="p-8">
          <h1 className="text-2xl font-black tracking-tight text-white">Dawat-e-Quran</h1>
          <p className="text-xs uppercase font-bold tracking-[0.2em] opacity-80 mt-1">Zone 5, Islamabad</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all duration-300 ${
                  isActive 
                    ? 'bg-white text-emerald-800 shadow-lg shadow-emerald-950/20' 
                    : 'text-emerald-100 hover:bg-emerald-700/50 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-emerald-700/50 space-y-2">
           <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-emerald-100 font-bold hover:bg-emerald-700/50 hover:text-white transition-all">
             <Settings className="w-5 h-5 opacity-50" />
             Settings
           </button>
           <button 
             onClick={handleLogout}
             className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-200 font-bold hover:bg-red-900/50 hover:text-white transition-all"
           >
             <LogOut className="w-5 h-5 opacity-50" />
             Logout
           </button>
        </div>
      </div>

      {/* Mobile Top Header */}
      <div className="md:hidden bg-emerald-800 text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div>
          <h1 className="text-lg font-black tracking-tight">Dawat-e-Quran</h1>
          <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Admin Portal</p>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-emerald-700 rounded-xl active:scale-95 transition-all"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-emerald-800 pt-20 animate-in fade-in slide-in-from-top duration-300">
          <nav className="px-6 space-y-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-lg transition-all ${
                    isActive ? 'bg-white text-emerald-800' : 'text-emerald-100'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-10 left-6 right-6 border-t border-emerald-700 pt-6 space-y-4">
            <button className="flex items-center gap-4 text-emerald-100 font-bold text-lg"><Settings className="w-6 h-6" /> Settings</button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-4 text-red-300 font-bold text-lg"
            >
              <LogOut className="w-6 h-6" /> Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </div>

      {/* Mobile Bottom Navigation (Quick Actions) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 sm:px-4 py-3 flex justify-between items-center z-[100] shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] pointer-events-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex flex-col items-center gap-1 px-1 transition-all cursor-pointer ${isActive ? 'text-emerald-600 scale-110' : 'text-gray-400 active:scale-95'}`}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={isActive ? 3 : 2} />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-tighter truncate max-w-[60px] text-center">{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </div>

  );
}
