"use client";

// Shared Apple-style building blocks used by every portal.
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { BookOpen, CheckCircle2, Info, Moon, Search, Sun, X, XCircle } from "lucide-react";

/* ─── Toasts: replace alert() with a calm, non-blocking message ─── */
type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; text: string; kind: ToastKind };
let listeners: ((t: ToastItem) => void)[] = [];
let nextId = 1;

export function toast(text: string, kind: ToastKind = "success") {
  const item = { id: nextId++, text, kind };
  listeners.forEach((l) => l(item));
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    const add = (t: ToastItem) => {
      setItems((prev) => [...prev.slice(-2), t]);
      // Errors stay a little longer so they can be read.
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), t.kind === "error" ? 6000 : 3200);
    };
    listeners.push(add);
    return () => { listeners = listeners.filter((l) => l !== add); };
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex flex-col items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      {items.map((t) => {
        const Icon = t.kind === "success" ? CheckCircle2 : t.kind === "error" ? XCircle : Info;
        const color = t.kind === "success" ? "text-success" : t.kind === "error" ? "text-danger" : "text-accent";
        return (
          <div key={t.id} role={t.kind === "error" ? "alert" : "status"} className="pill-container pointer-events-auto flex max-w-md items-center gap-2.5 px-4 py-2.5 text-[14px] font-medium animate-sheet">
            <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${color}`} aria-hidden />
            <span>{t.text}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Page header: Apple large title ─── */
export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-rise">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="text-[28px] sm:text-[34px] font-bold tracking-[-0.025em] text-label">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-label-2 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/* ─── Segmented control ─── */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Sheet: bottom sheet on phones, centred dialog on larger screens ─── */
export function Sheet({ open, onClose, title, subtitle, children, footer, wide }: {
  open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    if (!open) return;
    // Read onClose through a ref: callers pass a new arrow function on every render, and
    // re-running this effect on each keystroke used to pull focus out of the input being typed in.
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus the sheet once on open, unless a field inside it (autoFocus) already has focus.
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-black/30 animate-fade" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`relative w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"} max-h-[92dvh] flex flex-col bg-surface rounded-t-[1.5rem] sm:rounded-[1.5rem] shadow-[var(--shadow-float)] animate-sheet outline-none`}
      >
        <div className="sm:hidden mx-auto mt-2 h-1.5 w-10 rounded-full bg-fill-strong" aria-hidden />
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-4 sm:pt-6 pb-3">
          <div className="min-w-0">
            <h2 className="text-[20px] font-bold text-label">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[14px] text-label-2">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-icon !min-h-[32px] !min-w-[32px]" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-4">{children}</div>
        {footer && <div className="border-t border-separator px-5 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2 justify-end">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ─── Misc ─── */
export function EmptyState({ icon: Icon, title, text, action }: { icon: typeof Search; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-12">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-fill text-label-2"><Icon className="h-6 w-6" aria-hidden /></div>
      <p className="mt-4 text-[17px] font-semibold text-label">{title}</p>
      {text && <p className="mt-1 max-w-sm text-[14px] text-label-2">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton h-12" />)}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder, className = "" }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-label-3" aria-hidden />
      <input dir="auto" type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="form-input !bg-fill !border-transparent !ps-9 focus:!bg-surface focus:!border-accent" />
    </label>
  );
}

export function Stat({ label, value, note, tone }: { label: string; value: ReactNode; note?: ReactNode; tone?: "good" | "warn" | "bad" }) {
  const color = tone === "good" ? "text-success" : tone === "warn" ? "text-warning" : tone === "bad" ? "text-danger" : "text-label";
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-[13px] font-medium text-label-2">{label}</p>
      <p className={`mt-1 text-[28px] sm:text-[34px] font-bold tracking-[-0.03em] tabular ${color}`}>{value}</p>
      {note && <p className="mt-0.5 text-[12px] text-label-2">{note}</p>}
    </div>
  );
}

/** Percentage bar; colour follows the value and the number is always shown next to it. */
export function RateBar({ rate, className = "" }: { rate: number | null; className?: string }) {
  const color = rate === null ? "transparent" : rate >= 60 ? "#30a14e" : rate >= 35 ? "#f5a623" : "#ff453a"; // readable on light and dark
  return (
    <div className={`h-1.5 rounded-full bg-fill overflow-hidden ${className}`} role="img" aria-label={rate === null ? "No attendance marked" : `${rate}% attendance`}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${rate ?? 0}%`, background: color }} />
    </div>
  );
}

/* ─── Mixed English + Urdu/Arabic text ─── */
// Arabic-script runs (with the spaces between them) get the Nastaliq face; Latin stays in SF / Inter.
const ARABIC_RUN = /([؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+(?:[\s‌‍]+[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+)*)/;

export function BiText({ text, className = "" }: { text: string | null | undefined; className?: string }) {
  if (!text) return null;
  return (
    <span className={className}>
      {text.split(ARABIC_RUN).map((part, i) =>
        i % 2 ? <bdi key={i} dir="rtl" className="font-urdu-inline">{part}</bdi> : <span key={i}>{part}</span>,
      )}
    </span>
  );
}

/** "الفاتحة (Al-Fatiha) 1-7" → "Al-Fatiha 1–7" with the Arabic surah name in the Quran face. */
export function QuranRef({ reference, className = "" }: { reference: string | null | undefined; className?: string }) {
  if (!reference) return null;
  const m = reference.match(/^(.*?)\s*\(([^)]+)\)\s*(\d+)\s*-\s*(\d+)/);
  if (!m) return <BiText text={reference} className={className} />;
  const [, arabic, english, from, to] = m;
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`} dir="ltr">
      <span>{english} {from}–{to}</span>
      <bdi dir="rtl" className="font-quran-inline">{arabic}</bdi>
    </span>
  );
}

/* ─── Theme ─── */
// The inline script in layout.tsx sets <html data-theme> before first paint; these keep React in step.
function subscribeTheme(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}
export function useIsDark() {
  return useSyncExternalStore(subscribeTheme, () => document.documentElement.dataset.theme === "dark", () => false);
}

/** Chart colours for the current theme (SVG attributes can't read CSS variables reliably). */
export function useChartColors() {
  const dark = useIsDark();
  return dark
    ? { primary: "#0a84ff", secondary: "#5e9fd8", grid: "rgba(84,84,88,0.55)", axis: "#a1a1a6", label: "#f5f5f7", cursor: "rgba(10,132,255,0.12)", dotRing: "#1c1c1e" }
    : { primary: "#0071e3", secondary: "#8ec1f5", grid: "#ececf0", axis: "#86868b", label: "#1d1d1f", cursor: "rgba(0,113,227,0.06)", dotRing: "#ffffff" };
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    root.style.colorScheme = next;
    try {
      // Override only for this visit; choosing the device's own mode goes back to following the device.
      const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      if (next === system) sessionStorage.removeItem("theme"); else sessionStorage.setItem("theme", next);
    } catch { /* storage blocked: the switch still applies to this page */ }
  };
  return (
    <button type="button" onClick={toggle} className={`btn btn-secondary btn-icon !min-h-[34px] !min-w-[34px] ${className}`} aria-label="Switch between light and dark mode" title="Light / dark mode">
      <Moon className="theme-icon-dark h-[17px] w-[17px]" aria-hidden />
      <Sun className="theme-icon-light h-[17px] w-[17px]" aria-hidden />
    </button>
  );
}

/* ─── Brand: the app name appears on every page ─── */
export function Brand({ subtitle, href = "/portal", size = "md", name = "Dawat-e-Quran" }: { subtitle?: ReactNode; href?: string; size?: "sm" | "md"; name?: string }) {
  const box = size === "sm" ? "h-8 w-8 rounded-[9px]" : "h-10 w-10 rounded-[11px]";
  return (
    <Link href={href} className="flex items-center gap-2.5 min-w-0">
      <span className={`${box} flex-shrink-0 grid place-items-center bg-gradient-to-b from-[#2b8cff] to-[#0062d1] text-white shadow-sm`}>
        <BookOpen className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} strokeWidth={2.2} aria-hidden />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-[15px] font-semibold text-label truncate">{name}</span>
        {subtitle && <span className="block text-[12px] text-label-2 truncate">{subtitle}</span>}
      </span>
    </Link>
  );
}

/** A URL query parameter, read so the server render and the first client render match (no hydration warning). */
const noSubscribe = () => () => {};
export function useSearchParam(name: string): string | null {
  return useSyncExternalStore(noSubscribe, () => new URLSearchParams(window.location.search).get(name), () => null);
}
