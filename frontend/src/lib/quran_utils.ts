const surahMap: { [key: string]: number } = {
  "الفاتحة": 1, "Al-Fatihah": 1, "Al-Fatiha": 1,
  "البقرة": 2, "Al-Baqarah": 2, "Al-Baqara": 2,
  "آل عمران": 3, "Al Imran": 3, "Al-i-Imran": 3,
  "النساء": 4, "An-Nisa": 4, "An-Nisa'": 4,
  "المائدة": 5, "Al-Ma'idah": 5, "Al-Maida": 5,
  "الأنعام": 6, "Al-An'am": 6, "Al-Anam": 6,
  "الأعراف": 7, "Al-A'raf": 7, "Al-Araf": 7,
  "الأنفال": 8, "Al-Anfal": 8,
  "التوبة": 9, "At-Tawbah": 9, "At-Tawba": 9,
  "يونس": 10, "Yunus": 10,
  "هود": 11, "Hud": 11,
  "يوسف": 12, "Yusuf": 12,
  "الرعد": 13, "Ar-Ra'd": 13, "Ar-Rad": 13,
  "إبراهيم": 14, "Ibrahim": 14,
  "الحجر": 15, "Al-Hijr": 15,
  "النحل": 16, "An-Nahl": 16,
  "الإسراء": 17, "Al-Isra": 17,
  "الكهف": 18, "Al-Kahf": 18,
  "مريم": 19, "Maryam": 19,
  "طه": 20, "Ta-Ha": 20, "Taha": 20,
  "الأنبياء": 21, "Al-Anbiya": 21,
  "الحج": 22, "Al-Hajj": 22,
  "المؤمنون": 23, "Al-Mu'minun": 23, "Al-Muminun": 23,
  "النور": 24, "An-Nur": 24,
  "الفرقان": 25, "Al-Furqan": 25,
  "الشعراء": 26, "Ash-Shu'ara": 26, "Ash-Shuara": 26,
  "النمل": 27, "An-Naml": 27,
  "القصص": 28, "Al-Qasas": 28,
  "العنكبوت": 29, "Al-Ankabut": 29,
  "الروم": 30, "Ar-Rum": 30,
  "لقمان": 31, "Luqman": 31,
  "السجدة": 32, "As-Sajdah": 32, "As-Sajda": 32,
  "الأحزاب": 33, "Al-Ahzab": 33,
  "سبأ": 34, "Saba": 34,
  "فاطر": 35, "Fatir": 35,
  "يس": 36, "Ya-Sin": 36, "Yasin": 36,
  "الصافات": 37, "As-Saffat": 37,
  "ص": 38, "Sad": 38,
  "الزمر": 39, "Az-Zumar": 39,
  "غافر": 40, "Ghafir": 40,
  "فصلت": 41, "Fussilat": 41,
  "الشورى": 42, "Ash-Shura": 42,
  "الزخرف": 43, "Az-Zukhruf": 43,
  "الدخان": 44, "Ad-Dukhan": 44,
  "الجاثية": 45, "Al-Jathiyah": 45, "Al-Jathiya": 45,
  "الأحقاف": 46, "Al-Ahqaf": 46,
  "محمد": 47, "Muhammad": 47,
  "الفتح": 48, "Al-Fath": 48,
  "الحجرات": 49, "Al-Hujurat": 49,
  "ق": 50, "Qaf": 50,
  "الذريت": 51, "Adh-Dhariyat": 51, "Az-Zariyat": 51,
  "الطور": 52, "At-Tur": 52,
  "النجم": 53, "An-Najm": 53,
  "القمر": 54, "Al-Qamar": 54,
  "الرحمن": 55, "Ar-Rahman": 55,
  "الواقعة": 56, "Al-Waqi'ah": 56, "Al-Waqia": 56,
  "الحديد": 57, "Al-Hadid": 57,
  "المجادلة": 58, "Al-Mujadilah": 58, "Al-Mujadila": 58,
  "الحشر": 59, "Al-Hashr": 59,
  "الممتحنة": 60, "Al-Mumtahanah": 60, "Al-Mumtahana": 60,
  "الصف": 61, "As-Saff": 61,
  "الجمعة": 62, "Al-Jumu'ah": 62, "Al-Jumua": 62,
  "المنافقون": 63, "Al-Munafiqun": 63,
  "التغابن": 64, "At-Taghabun": 64,
  "الطلاق": 65, "At-Talaq": 65,
  "التحريم": 66, "At-Tahrim": 66,
  "الملک": 67, "Al-Mulk": 67,
  "القلم": 68, "Al-Qalam": 68,
  "الحاقة": 69, "Al-Haqqah": 69, "Al-Haqqa": 69,
  "المعارج": 70, "Al-Ma'arij": 70, "Al-Maarij": 70,
  "نوح": 71, "Nuh": 71,
  "الجن": 72, "Al-Jinn": 72,
  "المزمل": 73, "Al-Muzzammil": 73,
  "المدثر": 74, "Al-Muddathir": 74,
  "القيامة": 75, "Al-Qiyamah": 75, "Al-Qiyama": 75,
  "الإنسان": 76, "Al-Insan": 76,
  "المرسلات": 77, "Al-Mursalat": 77,
  "النبأ": 78, "An-Naba": 78,
  "النازعات": 79, "An-Nazi'at": 79, "An-Naziat": 79,
  "عبس": 80, "Abasa": 80,
  "التكوير": 81, "At-Takwir": 81,
  "الانفطار": 82, "Al-Infitar": 82,
  "المطففين": 83, "Al-Mutaffifin": 83,
  "الانشقاق": 84, "Al-Inshiqaq": 84,
  "البروج": 85, "Al-Buruj": 85,
  "الطارق": 86, "At-Tariq": 86,
  "الأعلى": 87, "Al-A'la": 87, "Al-Ala": 87,
  "الغاشية": 88, "Al-Ghashiyah": 88, "Al-Ghashiya": 88,
  "الفجر": 89, "Al-Fajr": 89,
  "البلد": 90, "Al-Balad": 90,
  "الشمس": 91, "Ash-Shams": 91,
  "الليل": 92, "Al-Layl": 92,
  "الضحى": 93, "Ad-Duha": 93,
  "الشرح": 94, "Ash-Sharh": 94,
  "التين": 95, "At-Tin": 95,
  "العلق": 96, "Al-Alaq": 96,
  "القدر": 97, "Al-Qadr": 97,
  "البينة": 98, "Al-Bayyinah": 98, "Al-Bayyina": 98,
  "الزلزلة": 99, "Az-Zalzalah": 99, "Az-Zalzal": 99,
  "العاديات": 100, "Al-Adiyat": 100,
  "القارعة": 101, "Al-Qari'ah": 101, "Al-Qaria": 101,
  "التكاثر": 102, "At-Takathur": 102,
  "العصر": 103, "Al-Asr": 103,
  "الهمزة": 104, "Al-Humazah": 104, "Al-Humaza": 104,
  "الفيل": 105, "Al-Fil": 105,
  "قريش": 106, "Quraysh": 106,
  "الماعون": 107, "Al-Ma'un": 107, "Al-Maun": 107,
  "الكوثر": 108, "Al-Kawthar": 108,
  "الكافرون": 109, "Al-Kafirun": 109,
  "النصر": 110, "An-Nasr": 110,
  "المسد": 111, "Al-Masad": 111,
  "الإخلاص": 112, "Al-Ikhlas": 112,
  "الفلق": 113, "Al-Falaq": 113,
  "الناس": 114, "An-Nas": 114
};

/**
 * Generates a link to islamicstudies.info/tafheem for a given Quran reference string.
 * Supports formats like "2:153", "Al-Baqarah 284-286", etc.
 */
export function getTafheemLink(reference: string): string | null {
  if (!reference) return null;

  // 1. Try standard format "2:153"
  const standardMatch = reference.match(/(\d+)\s*:\s*([\d-]+)/);
  if (standardMatch) {
    return `https://www.islamicstudies.info/tafheem.php?sura=${standardMatch[1]}&verse=${standardMatch[2]}`;

  }

  // 2. Try Name Based format "Al-Baqarah 284-286"
  // This extracts the name and the verse numbers
  const nameMatch = reference.match(/([^\d\(\)]+).*?([\d-]+)$/);
  if (nameMatch) {
    let name = nameMatch[1].trim();
    const verse = nameMatch[2];
    
    // Look up surah number
    let suraNum = surahMap[name];
    
    // If not found, try to find the English name in parentheses if it exists
    if (!suraNum) {
      const engMatch = reference.match(/\(([^)]+)\)/);
      if (engMatch) {
        suraNum = surahMap[engMatch[1].trim()];
      }
    }

    if (suraNum) {
      return `https://www.islamicstudies.info/tafheem.php?sura=${suraNum}&verse=${verse}`;
    }
  }

  return null;
}
