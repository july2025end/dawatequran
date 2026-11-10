import type { MetadataRoute } from "next";

// "Add to Home Screen" installs the app with its own icon and opens it full-screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dawat-e-Quran · Zone 5",
    short_name: "Dawat-e-Quran",
    description: "Quran circles of Zone 5, Islamabad: attendance, syllabus and circle contacts.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f7",
    theme_color: "#f5f5f7",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
