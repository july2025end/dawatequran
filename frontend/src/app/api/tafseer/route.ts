import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const surah = searchParams.get("surah");
  const ayah = searchParams.get("ayah");

  if (!surah || !ayah) {
    return NextResponse.json({ error: "Missing surah or ayah parameters" }, { status: 400 });
  }

  try {
    const res = await fetch(`http://tafheem.net/islamikitabein/urduref.php?sura=${surah}&verse=${ayah}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (!res.ok) {
      throw new Error("Failed to fetch from tafheem.net");
    }

    const html = await res.text();
    let extractedText = "";

    // The tafseer notes are contained within <div class='nt'>
    const ntDivMatch = html.match(/<div class='nt'>([\s\S]*?)<\/div>/i);
    if (ntDivMatch && ntDivMatch[1]) {
      extractedText = ntDivMatch[1].trim();
      // Remove any trailing <br> or empty <p>
      extractedText = extractedText.replace(/<p><\/p>/gi, "").trim();
    } else {
      // If there are no notes, it might just be the translation
      extractedText = "اس آیت کی تفسیر دستیاب نہیں۔ (Tafseer not available for this ayah)";
    }

    return NextResponse.json({ text: extractedText });
  } catch (error) {
    console.error("Tafseer Proxy Error:", error);
    return NextResponse.json({ error: "Failed to fetch tafseer" }, { status: 500 });
  }
}
