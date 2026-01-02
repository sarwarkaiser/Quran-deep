/**
 * Formatting utilities
 */

import type { AyahReference } from '../types/quran';

/**
 * Format number with Arabic-Indic digits
 */
export function toArabicNumerals(num: number): string {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.toString().split('').map(d => arabicNumerals[parseInt(d)] || d).join('');
}

/**
 * Format ayah reference for display
 */
export function formatAyahDisplay(surahId: number, ayahNumber: number, surahName?: string): string {
    if (surahName) {
        return `${surahName} ${surahId}:${ayahNumber}`;
    }
    return `${surahId}:${ayahNumber}`;
}

/**
 * Format date relative to now
 */
export function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
}

/**
 * Format time duration in seconds to readable format
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
    return num.toLocaleString('en-US');
}

/**
 * Generate citation in different formats
 */
export function generateCitation(
    ayahRef: AyahReference,
    translator: string,
    format: 'mla' | 'apa' | 'chicago' = 'mla'
): string {
    const [surah, ayah] = ayahRef.split(':');

    switch (format) {
        case 'mla':
            return `The Quran ${surah}:${ayah}. Trans. ${translator}.`;
        case 'apa':
            return `The Quran ${surah}:${ayah} (${translator}, Trans.).`;
        case 'chicago':
            return `The Quran, ${surah}:${ayah}, translated by ${translator}.`;
        default:
            return `Quran ${surah}:${ayah} (${translator})`;
    }
}
