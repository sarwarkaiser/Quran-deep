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
import { db, schema } from '@rcqi/database';
import { eq, and } from 'drizzle-orm';
import { downloadMorphologyDataset, parseMorphologyDataset, type WordMorphology } from './fetch-corpus-morphology';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });

interface IngestOptions {
    surah?: number; // Optional: ingest only specific surah
    startFrom?: { chapter: number; verse: number }; // Resume from specific location
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
async function getAyahId(chapter: number, verse: number): Promise<number | null> {
    const ayah = await db.query.ayahs.findFirst({
        where: and(
            eq(schema.ayahs.surahId, chapter),
            eq(schema.ayahs.ayahNumber, verse)
        ),
    });
    return ayah?.id ?? null;
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
        if (seg.features.gen) allFeatures.gender = seg.features.gen;
        if (seg.features.num) allFeatures.number = seg.features.num;
        if (seg.features.case) allFeatures.case = seg.features.case;
        if (seg.features.per) allFeatures.person = seg.features.per;
        if (seg.features.mod) allFeatures.mood = seg.features.mod;
        if (seg.features.vox) allFeatures.voice = seg.features.vox;
        if (seg.features.form) allFeatures.verbForm = seg.features.form;
    }

    return allFeatures;
}

/**
 * Build full Arabic word from segments
 */
function buildWordArabic(wordMorph: WordMorphology): string {
    return wordMorph.segments.map(s => s.form).join('');
}

/**
 * Main ingestion function
 */
async function ingestMorphology(options: IngestOptions = {}) {
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
        console.log('Ingesting into database...\n');
        const progressBar = new cliProgress.SingleBar({
            format: 'Progress |{bar}| {percentage}% | {value}/{total} words | Ayah: {currentAyah}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });

        progressBar.start(words.length, 0, { currentAyah: '1:1' });

        let insertCount = 0;
        let skipCount = 0;

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            progressBar.update(i + 1, { currentAyah: `${word.chapter}:${word.verse}` });

            // Get ayah ID from database
            const ayahId = await getAyahId(word.chapter, word.verse);
            if (!ayahId) {
                skipCount++;
                console.warn(`\nWarning: Ayah not found in database: ${word.chapter}:${word.verse}`);
                continue;
            }

            // Extract morphological info
            const { root, lemma, partOfSpeech } = extractMorphologicalInfo(word);
            const features = aggregateFeatures(word);
            const token = buildWordArabic(word);

            // Insert into database - using schema matching column names
            await db.insert(schema.wordMorphology).values({
                ayahId,
                position: word.word,
                token,
                root: root || undefined,
                lemma: lemma || undefined,
                partOfSpeech: partOfSpeech || undefined,
                morphology: JSON.stringify(word.segments), // Store full segments
                features,
                source: 'corpus',
            });

            insertCount++;
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
