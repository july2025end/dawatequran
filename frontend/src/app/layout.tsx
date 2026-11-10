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
  themeColor: "#f5f5f7",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${notoUrdu.variable} ${amiriQuran.variable}`}>
      <body className="min-h-dvh bg-canvas text-label antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
