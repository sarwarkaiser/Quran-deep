/**
 * Ingest Quranic Arabic Corpus Morphology Data
 * 
 * This script:
 * 1. Downloads the morphology dataset from corpus.quran.com (if not present)
 * 2. Parses the TSV data into structured format
 * 3. Maps words to ayahs in our database
 * 4. Inserts morphology records into word_morphology table
 * 
 * Usage:
 *   pnpm --filter @rcqi/etl ingest:morphology
 *   pnpm --filter @rcqi/etl ingest:morphology --surah=1  # Only Surah Al-Fatiha
 */

import * as cliProgress from 'cli-progress';
import { supabaseDb as db, supabaseSchema as schema } from '@rcqi/database';
import { eq, and, asc } from 'drizzle-orm';
import { downloadMorphologyDataset, parseMorphologyDataset, type WordMorphology } from './fetch-corpus-morphology';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });

interface IngestOptions {
    surah?: number; // Optional: ingest only specific surah
    startFrom?: { chapter: number; verse: number }; // Resume from specific location
}

interface AyahLookup {
    id: number;
    surahId: number;
    ayahNumber: number;
    textArabic: string;
    textUthmani: string | null;
}

/**
 * Get command line arguments
 */
function parseArgs(): IngestOptions {
    const args = process.argv.slice(2);
    const options: IngestOptions = {};

    for (const arg of args) {
        if (arg.startsWith('--surah=')) {
            options.surah = parseInt(arg.split('=')[1]);
        } else if (arg.startsWith('--start=')) {
            const [chapter, verse] = arg.split('=')[1].split(':').map(Number);
            options.startFrom = { chapter, verse };
        }
    }

    return options;
}

/**
 * Get ayah ID from database for a given chapter:verse reference
 */
function makeAyahKey(chapter: number, verse: number): string {
    return `${chapter}:${verse}`;
}

function splitAyahWords(text: string): string[] {
    return text
        .trim()
        .split(/\s+/)
        .filter(Boolean);
}

function buckwalterToArabic(text: string | null | undefined): string | null {
    if (!text) {
        return null;
    }

    const mapping: Record<string, string> = {
        "'": 'ء',
        '|': 'آ',
        '>': 'أ',
        '&': 'ؤ',
        '<': 'إ',
        '}': 'ئ',
        'A': 'ا',
        'b': 'ب',
        'p': 'ة',
        't': 'ت',
        'v': 'ث',
        'j': 'ج',
        'H': 'ح',
        'x': 'خ',
        'd': 'د',
        '*': 'ذ',
        'r': 'ر',
        'z': 'ز',
        's': 'س',
        '$': 'ش',
        'S': 'ص',
        'D': 'ض',
        'T': 'ط',
        'Z': 'ظ',
        'E': 'ع',
        'g': 'غ',
        '_': 'ـ',
        'f': 'ف',
        'q': 'ق',
        'k': 'ك',
        'l': 'ل',
        'm': 'م',
        'n': 'ن',
        'h': 'ه',
        'w': 'و',
        'Y': 'ى',
        'y': 'ي',
        'F': 'ً',
        'N': 'ٌ',
        'K': 'ٍ',
        'a': 'َ',
        'u': 'ُ',
        'i': 'ِ',
        '~': 'ّ',
        'o': 'ْ',
        '`': 'ٰ',
        '{': 'ٱ',
    };

    return text
        .split('')
        .map((char) => mapping[char] ?? (char === '+' ? '' : char))
        .join('');
}

/**
 * Extract root and lemma from features
 */
function extractMorphologicalInfo(wordMorph: WordMorphology) {
    let root: string | null = null;
    let lemma: string | null = null;
    let partOfSpeech: string | null = null;

    // Extract from segments (prefer STEM segment)
    const stemSegment = wordMorph.segments.find(s => s.features.type === 'STEM');
    if (stemSegment) {
        root = stemSegment.features.root || null;
        lemma = stemSegment.features.lem || stemSegment.features.lemma || null;
        partOfSpeech = stemSegment.tag || stemSegment.features.pos || null;
    }

    // Fallback to any segment with these features
    if (!root || !lemma) {
        for (const seg of wordMorph.segments) {
            if (!root && seg.features.root) root = seg.features.root;
            if (!lemma && (seg.features.lem || seg.features.lemma)) {
                lemma = seg.features.lem || seg.features.lemma || null;
            }
            if (!partOfSpeech && (seg.tag || seg.features.pos)) {
                partOfSpeech = seg.tag || seg.features.pos || null;
            }
        }
    }

    return { root, lemma, partOfSpeech };
}

/**
 * Aggregate features from all segments
 */
function aggregateFeatures(wordMorph: WordMorphology) {
    const allFeatures: any = {
        segments: wordMorph.segments.map(s => ({
            location: s.location,
            form: s.form,
            tag: s.tag,
            type: s.features.type,
            pos: s.features.pos,
        })),
    };

    // Extract common features from segments
    for (const seg of wordMorph.segments) {
        if (seg.features.gender) allFeatures.gender = seg.features.gender;
        if (seg.features.number) allFeatures.number = seg.features.number;
        if (seg.features.case) allFeatures.case = seg.features.case;
        if (seg.features.person) allFeatures.person = seg.features.person;
        if (seg.features.mood) allFeatures.mood = seg.features.mood;
        if (seg.features.voice) allFeatures.voice = seg.features.voice;
        if (seg.features.form) allFeatures.verbForm = seg.features.form;
    }

    return allFeatures;
}

/**
 * Build full Buckwalter transliteration from segments
 */
function buildWordTransliteration(wordMorph: WordMorphology): string {
    return wordMorph.segments.map(s => s.form).join('');
}

async function loadAyahMap(surah?: number): Promise<Map<string, AyahLookup>> {
    const ayahs = await db.query.ayahs.findMany({
        where: surah ? eq(schema.ayahs.surahId, surah) : undefined,
        orderBy: [asc(schema.ayahs.surahId), asc(schema.ayahs.ayahNumber)],
    });

    const ayahMap = new Map<string, AyahLookup>();
    for (const ayah of ayahs) {
        ayahMap.set(makeAyahKey(ayah.surahId, ayah.ayahNumber), ayah);
    }

    return ayahMap;
}

/**
 * Main ingestion function
 */
export async function ingestMorphology(options: IngestOptions = {}) {
    console.log('=== Quranic Arabic Corpus Morphology Ingestion ===\n');

    try {
        // Step 1: Download dataset
        await downloadMorphologyDataset();

        // Step 2: Parse dataset
        console.log('\nParsing morphology dataset...');
        const allWords = parseMorphologyDataset();
        console.log(`Parsed ${allWords.length} words\n`);

        // Step 3: Filter by options
        let words = allWords;
        if (options.surah) {
            words = words.filter(w => w.chapter === options.surah);
            console.log(`Filtered to Surah ${options.surah}: ${words.length} words\n`);
        }
        if (options.startFrom) {
            words = words.filter(w =>
                w.chapter > options.startFrom!.chapter ||
                (w.chapter === options.startFrom!.chapter && w.verse >= options.startFrom!.verse)
            );
            console.log(`Starting from ${options.startFrom.chapter}:${options.startFrom.verse}: ${words.length} words\n`);
        }

        // Step 4: Ingest with progress bar
        console.log('Loading ayah index from database...\n');
        const ayahMap = await loadAyahMap(options.surah);

        console.log('Ingesting into database...\n');
        const progressBar = new cliProgress.SingleBar({
            format: 'Progress |{bar}| {percentage}% | {value}/{total} ayahs | Ayah: {currentAyah}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });

        const groupedWords = new Map<string, WordMorphology[]>();
        for (const word of words) {
            const key = makeAyahKey(word.chapter, word.verse);
            const group = groupedWords.get(key);
            if (group) {
                group.push(word);
            } else {
                groupedWords.set(key, [word]);
            }
        }

        const entries = Array.from(groupedWords.entries());
        progressBar.start(entries.length, 0, { currentAyah: '1:1' });

        let insertCount = 0;
        let skipCount = 0;

        for (let i = 0; i < entries.length; i++) {
            const [ayahKey, ayahWords] = entries[i];
            progressBar.update(i + 1, { currentAyah: ayahKey });

            const [chapter, verse] = ayahKey.split(':').map(Number);
            const ayah = ayahMap.get(ayahKey);
            if (!ayah) {
                skipCount += ayahWords.length;
                console.warn(`\nWarning: Ayah not found in database: ${chapter}:${verse}`);
                continue;
            }

            const arabicWords = splitAyahWords(ayah.textUthmani || ayah.textArabic);

            await db.delete(schema.wordMorphology).where(eq(schema.wordMorphology.ayahId, ayah.id));

            const rows = ayahWords
                .sort((left, right) => left.word - right.word)
                .map((word) => {
                    const { root, lemma, partOfSpeech } = extractMorphologicalInfo(word);
                    const transliteration = buildWordTransliteration(word);
                    const rootArabic = buckwalterToArabic(root) || undefined;
                    const lemmaArabic = buckwalterToArabic(lemma) || undefined;
                    const fallbackArabic = buckwalterToArabic(transliteration) || transliteration;
                    const wordArabic = arabicWords[word.word - 1] || fallbackArabic;
                    const features = {
                        ...aggregateFeatures(word),
                        buckwalter: transliteration,
                        rootBuckwalter: root || undefined,
                        lemmaBuckwalter: lemma || undefined,
                    };

                    return {
                        ayahId: ayah.id,
                        wordPosition: word.word,
                        wordArabic,
                        transliteration,
                        root: rootArabic,
                        rootTransliterated: root || undefined,
                        lemma: lemmaArabic,
                        partOfSpeech: partOfSpeech || undefined,
                        features,
                    };
                });

            if (rows.length > 0) {
                await db.insert(schema.wordMorphology).values(rows);
                insertCount += rows.length;
            }
        }

        progressBar.stop();

        console.log(`\n\n=== Ingestion Complete ===`);
        console.log(`✓ Inserted: ${insertCount} words`);
        console.log(`⚠ Skipped: ${skipCount} words (ayah not found in database)`);
        console.log(`Total processed: ${words.length} words\n`);

    } catch (error) {
        console.error('\n❌ Error during ingestion:', error);
        process.exit(1);
    }
}

/**
 * Main entry point
 */
async function main() {
    const options = parseArgs();
    await ingestMorphology(options);
    process.exit(0);
}

// Run if executed directly
if (require.main === module) {
    main();
}
