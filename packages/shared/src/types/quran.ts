/**
 * Core Quran data types
 */

export interface Surah {
    id: number; // 1-114
    nameArabic: string;
    nameTransliterated: string;
    nameEnglish: string;
    ayahCount: number;
    revelationPeriod: 'meccan' | 'medinan';
    revelationPhase: string;
    revelationOrder: number;
    mushafOrder: number;
    metadata: {
        theme: string;
        historicalContext: string;
        exceptions?: string[];
    };
}

export interface Ayah {
    id: string;
    surahId: number;
    ayahNumber: number;
    textArabic: string;
    textUthmani: string;
    textIndopak: string;
    textSimplified: string;
    juzNumber: number;
    hizbNumber: number;
    pageNumber: number;
    sajdah: boolean;
    metadata: {
        wordCount: number;
        uniqueWords: number;
        themes: string[];
    };
}

export interface Word {
    id: string;
    ayahId: string;
    position: number;
    wordArabic: string;
    wordSimplified: string;
    transliteration: string;
    rootId: string;
    morphology: {
        type: 'noun' | 'verb' | 'particle';
        gender?: 'masculine' | 'feminine';
        number?: 'singular' | 'dual' | 'plural';
        case?: string;
        tense?: string;
    };
}

export interface Root {
    id: string;
    rootArabic: string;
    rootTransliterated: string;
    rootType: 'trilateral' | 'quadrilateral';
    semanticField: string[];
    coreMeaning: string;
    derivativeCount: number;
    occurrenceCount: number;
    metadata: {
        relatedRoots: string[];
        linguisticNotes?: string;
    };
}

export interface Translation {
    id: string;
    ayahId: string;
    translatorId: number;
    language: string;
    text: string;
    footnotes?: string[];
}

export interface Translator {
    id: number;
    name: string;
    nameArabic?: string;
    language: string;
    biography?: string;
    methodology?: string;
    year?: number;
}

/**
 * Reference format: "surah:ayah" (e.g., "2:255")
 */
export type AyahReference = `${number}:${number}`;

/**
 * Parse ayah reference string
 */
export function parseAyahReference(ref: AyahReference): { surahId: number; ayahNumber: number } {
    const [surahId, ayahNumber] = ref.split(':').map(Number);
    return { surahId, ayahNumber };
}

/**
 * Format ayah reference
 */
export function formatAyahReference(surahId: number, ayahNumber: number): AyahReference {
    return `${surahId}:${ayahNumber}`;
}
