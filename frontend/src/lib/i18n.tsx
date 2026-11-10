"use client";

// English / Urdu for the public and murabbi pages. English text is the key, so pages stay readable;
// anything not listed simply stays in English. The admin dashboard is English only.
import { useEffect, useSyncExternalStore } from "react";

export type Lang = "en" | "ur";

const UR: Record<string, string> = {
  // App
  "Dawat-e-Quran": "دعوتِ قرآن",
  "Zone 5 · Islamabad": "زون 5 · اسلام آباد",
  "Dawat-e-Quran · PK-Zone 5 · Islamabad": "دعوتِ قرآن · زون 5 · اسلام آباد",
  "Dawat-e-Quran · Zone 5, Islamabad": "دعوتِ قرآن · زون 5، اسلام آباد",
  "Portal": "پورٹل",
  "Sign out": "باہر نکلیں",
  "Cancel": "منسوخ",
  "Done": "ٹھیک ہے",
  "Delete": "حذف کریں",
  "Loading…": "لوڈ ہو رہا ہے…",
  "Quran Circle": "قرآن حلقہ",
  "Dars-e-Quran": "درسِ قرآن",
  "Dars": "درس",
  "Ijtima Arkan": "اجتماعِ ارکان",
  "Other": "دیگر",
  "Arkan": "ارکان",
  "Public": "عوامی",
  "Present": "حاضر",
  "Leave": "رخصت",
  "Absent": "غیر حاضر",
  "present": "حاضر",
  "absent": "غیر حاضر",
  "leave": "رخصت",
  // Home
  "Choose your portal": "اپنا پورٹل منتخب کریں",
  "Attendance Portal": "حاضری پورٹل",
  "Admin Dashboard": "ایڈمن ڈیش بورڈ",
  "Public Portal": "عوامی پورٹل",
  "Mark attendance and log session details": "حاضری لگائیں اور نشست کی تفصیل درج کریں",
  "Zone analytics, reports and management": "زون کے اعداد و شمار، رپورٹیں اور انتظام",
  "Syllabus, schedules and circle contacts": "نصاب، شیڈول اور حلقوں کے رابطے",
  "Murabbi": "مربی",
  "Admin only": "صرف ایڈمن",
  "Murabbi access": "مربی کی رسائی",
  "Admin access": "ایڈمن کی رسائی",
  "Password": "پاس ورڈ",
  "Sign in": "داخل ہوں",
  "Incorrect password. Please try again.": "پاس ورڈ درست نہیں۔ دوبارہ کوشش کریں۔",
  "Show password": "پاس ورڈ دکھائیں",
  "Hide password": "پاس ورڈ چھپائیں",
  // Public portal
  "Syllabus": "نصاب",
  "Upcoming": "آئندہ",
  "Find a circle": "حلقہ تلاش کریں",
  "Find your circle": "اپنا حلقہ تلاش کریں",
  "Weekly Quran circles in every union council. Follow the syllabus, read each lesson with translation and tafseer, and find the circle nearest you.":
    "ہر یونین کونسل میں ہفتہ وار قرآن حلقے۔ نصاب کے ساتھ چلیں، ہر سبق ترجمہ اور تفسیر کے ساتھ پڑھیں، اور اپنے قریب ترین حلقہ تلاش کریں۔",
  "Browse the syllabus": "نصاب دیکھیں",
  "Quran circles": "قرآن حلقے",
  "Union councils": "یونین کونسلیں",
  "Lessons": "اسباق",
  "This week’s lesson": "اس ہفتے کا سبق",
  "Next lesson": "اگلا سبق",
  "Topic": "موضوع",
  "Read the lesson": "سبق پڑھیں",
  "Every lesson opens with the Arabic text, Urdu translation and tafseer.": "ہر سبق عربی متن، اردو ترجمے اور تفسیر کے ساتھ کھلتا ہے۔",
  "Now": "جاری",
  "Read": "پڑھیں",
  "Show fewer": "کم دکھائیں",
  "Upcoming sessions": "آئندہ نشستیں",
  "No sessions are scheduled yet. Ask your circle’s representative for the next class.": "ابھی کوئی نشست طے نہیں۔ اگلی کلاس کے لیے اپنے حلقے کے نمائندے سے رابطہ کریں۔",
  "Search by area or union council and contact the circle’s representative directly by call or WhatsApp.": "علاقے یا یونین کونسل سے تلاش کریں اور حلقے کے نمائندے سے کال یا واٹس ایپ پر براہِ راست رابطہ کریں۔",
  "Open the directory": "فہرست کھولیں",
  // Representatives
  "Contact the representative of the Quran circle in your area by call or WhatsApp.": "اپنے علاقے کے قرآن حلقے کے نمائندے سے کال یا واٹس ایپ پر رابطہ کریں۔",
  "Search name, area, council or circle": "نام، علاقہ، کونسل یا حلقہ تلاش کریں",
  "All councils": "تمام کونسلیں",
  "Call": "کال",
  "WhatsApp": "واٹس ایپ",
  "Number not added yet": "نمبر ابھی درج نہیں",
  "No one matches that search": "اس تلاش سے کوئی نہیں ملا",
  "Try an area name such as G-9 or a council number such as UC-85.": "علاقے کا نام جیسے G-9 یا کونسل نمبر جیسے UC-85 لکھ کر دیکھیں۔",
  "Number copied": "نمبر کاپی ہو گیا",
  // Lesson reader
  "Play all": "مکمل تلاوت",
  "Stop": "روکیں",
  "Lesson": "سبق",
  "ayaat": "آیات",
  "Recitation: Mishary Alafasy": "تلاوت: مشاری العفاسی",
  "Tap any Arabic word to see its Urdu meaning.": "کسی بھی عربی لفظ پر ٹیپ کریں اور اس کا اردو معنی دیکھیں۔",
  "Back to the portal": "پورٹل پر واپس جائیں",
  // Attendance
  "Mark attendance": "حاضری لگائیں",
  "Mark attendance · Zone 5": "حاضری لگائیں · زون 5",
  "Session type": "نشست کی قسم",
  "Union council": "یونین کونسل",
  "Quran circle": "قرآن حلقہ",
  "Choose your council": "اپنی کونسل منتخب کریں",
  "Choose your circle": "اپنا حلقہ منتخب کریں",
  "Choose a council first": "پہلے کونسل منتخب کریں",
  "Your members and past reports appear here once you choose.": "انتخاب کے بعد آپ کے اراکین اور پچھلی رپورٹیں یہاں نظر آئیں گی۔",
  "Loading members…": "اراکین لوڈ ہو رہے ہیں…",
  "New report": "نئی رپورٹ",
  "Date": "تاریخ",
  "Attendance for month": "حاضری برائے مہینہ",
  "Topic taught": "پڑھایا گیا موضوع",
  "Suggested": "تجویز کردہ",
  "Choose a topic (optional)": "موضوع منتخب کریں (اختیاری)",
  "Add location and notes": "مقام اور نوٹس شامل کریں",
  "Location and notes": "مقام اور نوٹس",
  "Location: masjid, residence…": "مقام: مسجد، گھر…",
  "Notes: discussion, observations…": "نوٹس: گفتگو، مشاہدات…",
  "Members": "اراکین",
  "Choose Present, Leave or Absent for each member": "ہر رکن کے لیے حاضر، رخصت یا غیر حاضر منتخب کریں",
  "Tap a name to mark present": "حاضر لگانے کے لیے نام پر ٹیپ کریں",
  "All present": "سب حاضر",
  "Clear all": "سب ہٹائیں",
  "Same as last time": "پچھلی بار کی طرح",
  "Tick the members who came last time": "پچھلی بار آنے والے اراکین پر نشان لگائیں",
  "Add": "شامل کریں",
  "Search members": "اراکین تلاش کریں",
  "No members yet": "ابھی کوئی رکن نہیں",
  "Add the first member with the Add button.": "”شامل کریں“ سے پہلا رکن شامل کریں۔",
  "Search by date, topic, place or name": "تاریخ، موضوع، مقام یا نام سے تلاش کریں",
  "No reports yet": "ابھی کوئی رپورٹ نہیں",
  "Reports you submit appear here, and you can correct them later.": "آپ کی جمع کرائی گئی رپورٹیں یہاں آئیں گی، اور بعد میں درست بھی کی جا سکتی ہیں۔",
  "Submit report": "رپورٹ جمع کریں",
  "Saving…": "محفوظ ہو رہی ہے…",
  "Add member": "رکن شامل کریں",
  "Full name": "پورا نام",
  "Phone (optional)": "فون (اختیاری)",
  "Member’s circle": "رکن کا حلقہ",
  "Choose a circle": "حلقہ منتخب کریں",
  "Member type": "رکن کی قسم",
  "Add and mark present": "شامل کریں اور حاضر لگائیں",
  "Edit report": "رپورٹ میں ترمیم",
  "Attendance · tap a status to change it": "حاضری · بدلنے کے لیے حالت پر ٹیپ کریں",
  "Save changes": "تبدیلیاں محفوظ کریں",
  "No topic": "کوئی موضوع نہیں",
  "Location": "مقام",
  "Notes": "نوٹس",
  "JazakAllah khair": "جزاک اللہ خیر",
  "Saved on this phone": "اس فون پر محفوظ",
  "There’s no internet connection right now. The report is kept on this phone and will be sent automatically when you’re back online.":
    "ابھی انٹرنیٹ دستیاب نہیں۔ رپورٹ اس فون پر محفوظ ہے اور انٹرنیٹ آتے ہی خود بخود بھیج دی جائے گی۔",
  "Send now": "ابھی بھیجیں",
  "Tafheem": "تفہیم",
  "Public (Aam Afraad)": "عام افراد",
  "Arkan (Haazir Arkan)": "حاضر ارکان",
  "Removed member": "حذف شدہ رکن",
  "Report": "رپورٹ",
  "History": "سابقہ رپورٹیں",
  "Please select required fields.": "براہِ کرم ضروری خانے منتخب کریں۔",
  "Please select a date.": "براہِ کرم تاریخ منتخب کریں۔",
  "Please enter a name.": "براہِ کرم نام درج کریں۔",
  "Please choose the member's circle.": "براہِ کرم رکن کا حلقہ منتخب کریں۔",
  "Report updated": "رپورٹ اپ ڈیٹ ہو گئی",
  "Report deleted": "رپورٹ حذف ہو گئی",
  "Couldn’t save": "محفوظ نہیں ہو سکا",
  "Circle Head (Murabbi)": "مربی (حلقہ نگران)",
  "Nazim UC": "ناظم یونین کونسل",
  "New Arkan member of this council": "اس کونسل کے نئے رکن (ارکان)",
  "Couldn’t copy the number": "نمبر کاپی نہیں ہو سکا",
  "Understand the Quran, together.": "آئیں، مل کر قرآن سمجھیں۔",
};

const KEY = "dq-lang";
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => { listeners.delete(cb); window.removeEventListener("storage", cb); };
}
function readLang(): Lang {
  try { return localStorage.getItem(KEY) === "ur" ? "ur" : "en"; } catch { return "en"; }
}

/** Server and first client render are English, so hydration always matches. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, readLang, () => "en");
}

export function setLang(lang: Lang) {
  try { localStorage.setItem(KEY, lang); } catch { /* storage blocked: switch for this page only */ }
  listeners.forEach((l) => l());
}

export function useT() {
  const lang = useLang();
  return (s: string) => (lang === "ur" ? UR[s] ?? s : s);
}

/** For public and murabbi pages: sets lang/dir on <html> (so sheets and toasts follow) and resets when the page is left. */
export function useLangDocument() {
  const lang = useLang();
  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ur" ? "rtl" : "ltr";
    return () => { html.lang = "en"; html.dir = "ltr"; };
  }, [lang]);
  return lang;
}

export function LangToggle({ className = "" }: { className?: string }) {
  const lang = useLang();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "ur" ? "en" : "ur")}
      className={`btn btn-secondary !min-h-[34px] !px-3 !text-[14px] ${className}`}
      aria-label={lang === "ur" ? "Switch to English" : "اردو میں دیکھیں"}
      lang={lang === "ur" ? "en" : "ur"}
    >
      {lang === "ur" ? "English" : <span className="font-urdu-inline">اردو</span>}
    </button>
  );
}

export const URDU_MONTHS = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];
