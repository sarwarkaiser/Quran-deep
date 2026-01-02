/**
 * Surah metadata constants
 */

import type { Surah } from '../types/quran';

export const TOTAL_SURAHS = 114;
export const TOTAL_AYAHS = 6236;
export const TOTAL_JUZ = 30;

/**
 * Surah metadata (abbreviated - full data would be loaded from database)
 */
export const SURAH_METADATA: Pick<Surah, 'id' | 'nameArabic' | 'nameTransliterated' | 'nameEnglish' | 'ayahCount' | 'revelationPeriod'>[] = [
    { id: 1, nameArabic: 'الفاتحة', nameTransliterated: 'Al-Fatihah', nameEnglish: 'The Opening', ayahCount: 7, revelationPeriod: 'meccan' },
    { id: 2, nameArabic: 'البقرة', nameTransliterated: 'Al-Baqarah', nameEnglish: 'The Cow', ayahCount: 286, revelationPeriod: 'medinan' },
    { id: 3, nameArabic: 'آل عمران', nameTransliterated: 'Ali \'Imran', nameEnglish: 'Family of Imran', ayahCount: 200, revelationPeriod: 'medinan' },
    { id: 4, nameArabic: 'النساء', nameTransliterated: 'An-Nisa', nameEnglish: 'The Women', ayahCount: 176, revelationPeriod: 'medinan' },
    { id: 5, nameArabic: 'المائدة', nameTransliterated: 'Al-Ma\'idah', nameEnglish: 'The Table Spread', ayahCount: 120, revelationPeriod: 'medinan' },
    // ... Add all 114 surahs
];

/**
 * Get surah metadata by ID
 */
export function getSurahMetadata(id: number): typeof SURAH_METADATA[0] | undefined {
    return SURAH_METADATA.find(s => s.id === id);
}

/**
 * Get surah name by ID
 */
export function getSurahName(id: number, format: 'arabic' | 'transliterated' | 'english' = 'transliterated'): string {
    const surah = getSurahMetadata(id);
    if (!surah) return '';

    switch (format) {
        case 'arabic':
            return surah.nameArabic;
        case 'transliterated':
            return surah.nameTransliterated;
        case 'english':
            return surah.nameEnglish;
    }
}
