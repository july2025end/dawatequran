import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: "Dawat-e-Quran | Management Portal",
  description: "Official management and attendance portal for Dawat-e-Quran Quran Circles.",
  other: {
    "color-scheme": "light",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jakarta.variable} style={{ colorScheme: "light" }}>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#064e3b" />
      </head>
      <body className="min-h-full flex flex-col mesh-gradient text-gray-900 font-sans antialiased">{children}</body>
    </html>
  );
}
