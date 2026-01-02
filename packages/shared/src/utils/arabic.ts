/**
 * Arabic text utilities
 */

/**
 * Remove diacritics (tashkeel) from Arabic text
 */
export function removeDiacritics(text: string): string {
    return text.replace(/[\u064B-\u065F\u0670]/g, '');
}

/**
 * Normalize Arabic text for search
 */
export function normalizeArabic(text: string): string {
    return text
        .replace(/[إأآا]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/[\u064B-\u065F\u0670]/g, ''); // Remove diacritics
}

/**
 * Check if text contains Arabic characters
 */
export function isArabic(text: string): boolean {
    return /[\u0600-\u06FF]/.test(text);
}

/**
 * Extract root from Arabic word (simplified - real implementation would be more complex)
 */
export function extractRoot(word: string): string | null {
    const normalized = removeDiacritics(word);
    // This is a placeholder - actual root extraction requires morphological analysis
    if (normalized.length >= 3) {
        return normalized.slice(0, 3);
    }
    return null;
}

/**
 * Count Arabic words in text
 */
export function countArabicWords(text: string): number {
    const words = text.trim().split(/\s+/);
    return words.filter(isArabic).length;
}

/**
 * Transliterate Arabic to Latin (basic mapping)
 */
export function transliterate(arabic: string): string {
    const mapping: Record<string, string> = {
        'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
        'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r',
        'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd',
        'ط': 't', 'ظ': 'z', 'ع': "'", 'غ': 'gh', 'ف': 'f',
        'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
        'ه': 'h', 'و': 'w', 'ي': 'y', 'ة': 'h', 'ى': 'a',
        'ء': "'", 'أ': 'a', 'إ': 'i', 'آ': 'a', 'ؤ': 'u', 'ئ': 'i'
    };

    return arabic.split('').map(char => mapping[char] || char).join('');
}
