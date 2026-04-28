import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dawat-e-Quran | Management Portal",
  description: "Official management and attendance portal for Dawat-e-Quran Quran Circles.",
  other: {
    "color-scheme": "light",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#064e3b" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900">{children}</body>
    </html>
  );
}
