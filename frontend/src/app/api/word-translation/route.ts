import { NextRequest, NextResponse } from "next/server";

// Strip Arabic diacritics (harakat) for loose matching
function stripDiacritics(s: string): string {
  return s
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // harakat + tatweel
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627")   // alef variants (including wasla) → alef
    .trim();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const surah = searchParams.get("surah");
  const ayah = searchParams.get("ayah");

  if (!surah || !ayah) {
    return NextResponse.json(
      { error: "Missing surah or ayah parameters" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}` +
        `?words=true&language=ur&word_fields=text_uthmani` +
        `&word_translation_language=ur`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    );

    if (!res.ok) {
      throw new Error(`Quran.com API error: ${res.status}`);
    }

    const json = await res.json();
    const verse = json?.verse;

    if (!verse || !Array.isArray(verse.words)) {
      return NextResponse.json({ words: [] });
    }

    // Only real words (exclude punctuation / ayah-end markers)
    const words = verse.words
      .filter((w: any) => w.char_type_name === "word")
      .map((w: any) => ({
        position: w.position,
        text_uthmani: w.text_uthmani || "",
        // Pre-normalised text for client-side matching (no diacritics)
        text_simple: stripDiacritics(w.text_uthmani || ""),
        translation: w.translation?.text || "",
      }));

    return NextResponse.json({ words });
  } catch (error) {
    console.error("Word Translation Proxy Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch word translation" },
      { status: 500 }
    );
  }
}
