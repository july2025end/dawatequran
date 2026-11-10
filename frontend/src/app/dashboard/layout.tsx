"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, CheckSquare, CircleDot, ClipboardList, Contact, FileText, Globe, HeartHandshake, LayoutGrid, LogOut, Map, MoreHorizontal, Users, UsersRound } from "lucide-react";
import { Brand, Sheet, ThemeToggle } from "@/components/ui";

const NAV = [
  { name: "Overview", href: "/dashboard", icon: LayoutGrid },
  { name: "Follow-up", href: "/dashboard/follow-up", icon: HeartHandshake },
  { name: "Circles", href: "/dashboard/circles", icon: CircleDot },
  { name: "Reports", href: "/dashboard/jaiza", icon: ClipboardList },
  { name: "Union Councils", short: "UCs", href: "/dashboard/uc-status", icon: Map },
  { name: "Members", href: "/dashboard/roster", icon: Users },
  { name: "Ijtima Arkan", href: "/dashboard/ijtima", icon: UsersRound },
  { name: "Monthly report", href: "/dashboard/report", icon: FileText },
  { name: "Schedule", href: "/dashboard/schedule", icon: CalendarDays },
  { name: "Syllabus", href: "/dashboard/syllabus", icon: BookOpen },
  { name: "Representatives", href: "/dashboard/representatives", icon: Contact },
];
// No sign-in: each portal has its own address. These are just shortcuts between them.
const PORTALS = [
  { name: "Attendance portal", href: "/attendance", icon: CheckSquare },
  { name: "Public portal", href: "/portal", icon: Globe },
];
const TABS = NAV.slice(0, 4);
const MORE = NAV.slice(4);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));
  const moreActive = MORE.some((m) => isActive(m.href));

  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar: iPad and desktop */}
      <aside className="print:hidden hidden md:flex md:w-[232px] lg:w-[260px] flex-shrink-0 flex-col sticky top-0 h-dvh material border-r border-separator">
        <div className="px-5 pt-6 pb-5 flex items-center justify-between gap-2">
          <Brand href="/dashboard" subtitle="Admin · Zone 5" />
          <ThemeToggle />
        </div>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {NAV.map((item) => (
            <SideLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </nav>
        <div className="px-3 pb-5 pt-3 border-t border-separator space-y-0.5">
          <p className="px-3 pb-1 text-[12px] font-semibold text-label-3">Other portals</p>
          {PORTALS.map((p) => <SideLink key={p.href} {...p} active={false} />)}
          <Link href="/" className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] text-danger hover:bg-danger-tint transition-colors">
            <LogOut className="h-[18px] w-[18px]" /> Sign out
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Phone top bar */}
        <div className="print:hidden md:hidden sticky top-0 z-40 material border-b border-separator pt-[env(safe-area-inset-top)]">
          <div className="h-12 px-4 flex items-center justify-between">
            <Brand href="/dashboard" size="sm" subtitle="Admin" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/attendance" className="btn btn-tinted btn-sm">Mark attendance</Link>
            </div>
          </div>
        </div>

        <main className="pb-28 md:pb-12 print:pb-0">{children}</main>
      </div>

      {/* Phone tab bar */}
      <nav aria-label="Admin" className="print:hidden md:hidden fixed inset-x-0 bottom-0 z-40 material border-t border-separator safe-bottom">
        <div className="grid grid-cols-5 h-[56px]">
          {TABS.map((t) => (
            <TabLink key={t.href} href={t.href} icon={t.icon} label={t.short ?? t.name} active={isActive(t.href)} />
          ))}
          <button type="button" onClick={() => setMoreOpen(true)} className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${moreActive ? "text-accent" : "text-label-2"}`}>
            <MoreHorizontal className="h-[22px] w-[22px]" strokeWidth={moreActive ? 2.4 : 1.9} />
            More
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="card-inset overflow-hidden list-inset mb-2">
          {[...MORE, ...PORTALS].map((m) => (
            <Link key={m.href} href={m.href} onClick={() => setMoreOpen(false)} className="flex items-center gap-3 px-4 py-3.5 bg-surface text-[16px] text-label active:bg-fill">
              <m.icon className="h-5 w-5 text-accent" /> {m.name}
            </Link>
          ))}
          <Link href="/" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 px-4 py-3.5 bg-surface text-[16px] text-danger active:bg-fill">
            <LogOut className="h-5 w-5" /> Sign out
          </Link>
        </div>
      </Sheet>
    </div>
  );
}

function SideLink({ name, href, icon: Icon, active }: { name: string; href: string; icon: typeof Users; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] transition-colors ${active ? "bg-accent-fill text-white font-semibold" : "text-label hover:bg-fill"}`}
    >
      <Icon className={`h-[18px] w-[18px] ${active ? "text-white" : "text-accent"}`} strokeWidth={2} />
      {name}
    </Link>
  );
}

function TabLink({ href, icon: Icon, label, active }: { href: string; icon: typeof Users; label: string; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${active ? "text-accent" : "text-label-2"}`}>
      <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.9} />
      {label}
    </Link>
  );
}
