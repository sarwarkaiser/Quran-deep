/**
 * Quran schema - Core Quranic text tables
 */

import { pgTable, serial, integer, text, varchar, boolean, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const surahs = pgTable('surahs', {
    id: integer('id').primaryKey(), // 1-114
    nameArabic: varchar('name_arabic', { length: 255 }).notNull(),
    nameTransliterated: varchar('name_transliterated', { length: 255 }).notNull(),
    nameEnglish: varchar('name_english', { length: 255 }).notNull(),
    ayahCount: integer('ayah_count').notNull(),
    revelationPeriod: varchar('revelation_period', { length: 20 }).notNull(), // 'meccan' | 'medinan'
    revelationPhase: varchar('revelation_phase', { length: 100 }),
    revelationOrder: integer('revelation_order'),
    mushafOrder: integer('mushaf_order'),
    metadata: jsonb('metadata').$type<{
        theme: string;
        historicalContext: string;
        exceptions?: string[];
    }>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    revelationPeriodIdx: index('surah_revelation_period_idx').on(table.revelationPeriod),
    mushafOrderIdx: index('surah_mushaf_order_idx').on(table.mushafOrder),
}));

export const ayahs = pgTable('ayahs', {
    id: serial('id').primaryKey(),
    surahId: integer('surah_id').notNull().references(() => surahs.id),
    ayahNumber: integer('ayah_number').notNull(),
    textArabic: text('text_arabic').notNull(),
    textUthmani: text('text_uthmani'),
    textIndopak: text('text_indopak'),
    textSimplified: text('text_simplified').notNull(), // No diacritics
    juzNumber: integer('juz_number'),
    hizbNumber: integer('hizb_number'),
    pageNumber: integer('page_number'),
    sajdah: boolean('sajdah').default(false),
    // Vector embedding for semantic search (pgvector)
    // embedding: vector('embedding', { dimensions: 1536 }),
    metadata: jsonb('metadata').$type<{
        wordCount: number;
        uniqueWords: number;
        themes: string[];
    }>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    surahAyahIdx: uniqueIndex('ayah_surah_ayah_idx').on(table.surahId, table.ayahNumber),
    surahIdx: index('ayah_surah_idx').on(table.surahId),
    juzIdx: index('ayah_juz_idx').on(table.juzNumber),
}));

export const words = pgTable('words', {
    id: serial('id').primaryKey(),
    ayahId: integer('ayah_id').notNull().references(() => ayahs.id),
    position: integer('position').notNull(),
    wordArabic: varchar('word_arabic', { length: 255 }).notNull(),
    wordSimplified: varchar('word_simplified', { length: 255 }).notNull(),
    transliteration: varchar('transliteration', { length: 255 }),
    rootId: integer('root_id').references(() => roots.id),
    morphology: jsonb('morphology').$type<{
        type: 'noun' | 'verb' | 'particle';
        gender?: 'masculine' | 'feminine';
        number?: 'singular' | 'dual' | 'plural';
        case?: string;
        tense?: string;
    }>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    ayahIdx: index('word_ayah_idx').on(table.ayahId),
    rootIdx: index('word_root_idx').on(table.rootId),
    simplifiedIdx: index('word_simplified_idx').on(table.wordSimplified),
}));

export const roots = pgTable('roots', {
    id: serial('id').primaryKey(),
    rootArabic: varchar('root_arabic', { length: 10 }).notNull().unique(),
    rootTransliterated: varchar('root_transliterated', { length: 20 }),
    rootType: varchar('root_type', { length: 20 }).notNull(), // 'trilateral' | 'quadrilateral'
    semanticField: jsonb('semantic_field').$type<string[]>(),
    coreMeaning: text('core_meaning'),
    derivativeCount: integer('derivative_count').default(0),
    occurrenceCount: integer('occurrence_count').default(0),
    // embedding: vector('embedding', { dimensions: 1536 }),
    metadata: jsonb('metadata').$type<{
        relatedRoots: number[];
        linguisticNotes?: string;
    }>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const translators = pgTable('translators', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    nameArabic: varchar('name_arabic', { length: 255 }),
    language: varchar('language', { length: 10 }).notNull(),
    biography: text('biography'),
    methodology: text('methodology'),
    year: integer('year'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const translations = pgTable('translations', {
    id: serial('id').primaryKey(),
    ayahId: integer('ayah_id').notNull().references(() => ayahs.id),
    translatorId: integer('translator_id').notNull().references(() => translators.id),
    language: varchar('language', { length: 10 }).notNull(),
    text: text('text').notNull(),
    footnotes: jsonb('footnotes').$type<string[]>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    ayahTranslatorIdx: uniqueIndex('translation_ayah_translator_idx').on(table.ayahId, table.translatorId),
    ayahIdx: index('translation_ayah_idx').on(table.ayahId),
}));

/**
 * Word Morphology - Detailed morphological analysis from Quranic Arabic Corpus
 * Source: https://corpus.quran.com/
 */
export const wordMorphology = pgTable('word_morphology', {
    id: serial('id').primaryKey(),
    ayahId: integer('ayah_id').notNull().references(() => ayahs.id),
    wordPosition: integer('word_position').notNull(), // Position of word in ayah (1-indexed)

    // Arabic text and transliteration
    wordArabic: varchar('word_arabic', { length: 255 }).notNull(),
    transliteration: varchar('transliteration', { length: 255 }),

    // Root information
    root: varchar('root', { length: 20 }), // Arabic root letters (e.g., "smw")
    rootTransliterated: varchar('root_transliterated', { length: 30 }), // Transliterated root
    lemma: varchar('lemma', { length: 255 }), // Dictionary form of the word

    // Core morphological classification
    partOfSpeech: varchar('part_of_speech', { length: 50 }), // N, V, P, etc.

    // Detailed morphological features stored as JSON for flexibility
    // Includes: segments (prefix/stem/suffix), gender, number, case, person, mood, voice, etc.
    features: jsonb('features').$type<{
        // Word segments (morphemes)
        segments?: Array<{
            location: string; // e.g., "(1:1:1:1)" - chapter:verse:word:segment
            form: string; // Arabic text of segment
            tag: string; // Part of speech tag
            type?: 'PREFIX' | 'STEM' | 'SUFFIX';
            pos?: string; // Part of speech
        }>;

        // Grammatical features
        gender?: 'M' | 'F'; // Masculine/Feminine
        number?: 'S' | 'D' | 'P'; // Singular/Dual/Plural
        case?: 'NOM' | 'ACC' | 'GEN'; // Nominative/Accusative/Genitive
        person?: '1' | '2' | '3'; // 1st/2nd/3rd person
        mood?: 'IND' | 'SUBJ' | 'JUS'; // Indicative/Subjunctive/Jussive
        voice?: 'ACT' | 'PASS'; // Active/Passive

        // Verb form (for verbs)
        verbForm?: string; // 'I', 'II', 'III', etc.

        // Additional features
        [key: string]: any;
    }>(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    ayahIdx: index('word_morph_ayah_idx').on(table.ayahId),
    positionIdx: index('word_morph_position_idx').on(table.ayahId, table.wordPosition),
    rootIdx: index('word_morph_root_idx').on(table.root),
    posIdx: index('word_morph_pos_idx').on(table.partOfSpeech),
}));
