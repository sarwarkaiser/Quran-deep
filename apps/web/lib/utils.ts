import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatArabicNumber(num: number): string {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num
    .toString()
    .split("")
    .map((digit) => arabicDigits[parseInt(digit)])
    .join("");
}

export function transliterateArabic(text: string): string {
  // Basic transliteration map
  const map: Record<string, string> = {
    ا: "ā",
    ب: "b",
    ت: "t",
    ث: "th",
    ج: "j",
    ح: "ḥ",
    خ: "kh",
    د: "d",
    ذ: "dh",
    ر: "r",
    ز: "z",
    س: "s",
    ش: "sh",
    ص: "ṣ",
    ض: "ḍ",
    ط: "ṭ",
    ظ: "ẓ",
    ع: "ʿ",
    غ: "gh",
    ف: "f",
    ق: "q",
    ك: "k",
    ل: "l",
    م: "m",
    ن: "n",
    ه: "h",
    و: "w",
    ي: "y",
    ء: "ʾ",
    آ: "ā",
    إ: "i",
    أ: "a",
    ة: "a",
    ى: "ā",
  };

  return text
    .split("")
    .map((char) => map[char] || char)
    .join("");
}
