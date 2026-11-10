import type { Metadata, Viewport } from "next";
import { Amiri_Quran, Inter } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui";
import "./globals.css";

// English uses Apple's system font (SF Pro) on Apple devices; Inter is the close match everywhere else.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Urdu: Jameel Noori Nastaleeq when installed (common in Pakistan), otherwise Noto Nastaliq.
// Self-hosted Noto Nastaliq Urdu (OFL), limited to Arabic-script characters so English letters
// fall through to SF Pro / Inter instead of the Nastaliq face's own Latin glyphs.
const notoUrdu = localFont({
  src: [{ path: "./fonts/NotoNastaliqUrdu.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-noto-urdu",
  display: "swap",
  fallback: [],
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0600-06FF, U+0750-077F, U+0870-08FF, U+200C-200E, U+FB50-FDFF, U+FE70-FEFC" }],
});
// Quran: the IndoPak face in /public/fonts first, Amiri Quran as the web fallback.
const amiriQuran = Amiri_Quran({ weight: ["400"], subsets: ["arabic"], variable: "--font-amiri", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Dawat-e-Quran · Zone 5", template: "%s · Dawat-e-Quran" },
  description: "Quran circles of Zone 5, Islamabad: syllabus, schedules and circle representatives.",
  applicationName: "Dawat-e-Quran",
  appleWebApp: { capable: true, title: "Dawat-e-Quran", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light dark",
};

// Runs before first paint. The device's light/dark setting is the default on every visit;
// the toggle only overrides it for the current visit (sessionStorage), and live device changes are followed.
const themeScript = `(function(){try{localStorage.removeItem("theme");var m=window.matchMedia("(prefers-color-scheme: dark)");var r=document.documentElement;var a=function(){var t=sessionStorage.getItem("theme")||(m.matches?"dark":"light");r.dataset.theme=t;r.style.colorScheme=t;};a();m.addEventListener("change",function(){sessionStorage.removeItem("theme");a();});}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: data-theme is set by themeScript before React loads.
    <html lang="en" className={`${inter.variable} ${notoUrdu.variable} ${amiriQuran.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-canvas text-label antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
