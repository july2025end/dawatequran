import type { Metadata, Viewport } from "next";
import { Amiri_Quran, Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import { Toaster } from "@/components/ui";
import "./globals.css";

// English uses Apple's system font (SF Pro) on Apple devices; Inter is the close match everywhere else.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Urdu: Jameel Noori Nastaleeq when installed (common in Pakistan), otherwise Noto Nastaliq.
const notoUrdu = Noto_Nastaliq_Urdu({ weight: ["400", "700"], subsets: ["arabic"], variable: "--font-noto-urdu", display: "swap" });
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

// Runs before first paint: the visitor's saved choice, otherwise the device setting (and follows it live).
const themeScript = `(function(){try{var s=localStorage.getItem("theme");var m=window.matchMedia("(prefers-color-scheme: dark)");var r=document.documentElement;var a=function(){var t=localStorage.getItem("theme")||(m.matches?"dark":"light");r.dataset.theme=t;r.style.colorScheme=t;};a();m.addEventListener("change",function(){if(!localStorage.getItem("theme"))a();});}catch(e){}})();`;

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
