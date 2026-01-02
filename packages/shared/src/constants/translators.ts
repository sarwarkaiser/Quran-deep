/**
 * Translator metadata constants
 */

import type { Translator } from '../types/quran';

export const TRANSLATORS: Translator[] = [
    {
        id: 1,
        name: 'Abdel Haleem',
        language: 'en',
        year: 2004,
        methodology: 'Modern English, accessible style',
    },
    {
        id: 2,
        name: 'Sahih International',
        language: 'en',
        year: 1997,
        methodology: 'Literal translation with clarity',
    },
    {
        id: 3,
        name: 'Yusuf Ali',
        language: 'en',
        year: 1934,
        methodology: 'Classical English with extensive footnotes',
    },
    {
        id: 4,
        name: 'Pickthall',
        language: 'en',
        year: 1930,
        methodology: 'Literal, archaic English',
    },
    {
        id: 5,
        name: 'Dr. Mustafa Khattab',
        language: 'en',
        year: 2016,
        methodology: 'Clear, modern English with context',
    },
    // Add more translators
];

/**
 * Get translator by ID
 */
export function getTranslator(id: number): Translator | undefined {
    return TRANSLATORS.find(t => t.id === id);
}

/**
 * Get translators by language
 */
export function getTranslatorsByLanguage(language: string): Translator[] {
    return TRANSLATORS.filter(t => t.language === language);
}
