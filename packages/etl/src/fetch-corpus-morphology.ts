/**
 * Quranic Arabic Corpus Data Client
 * Fetches and parses morphological data from the Quranic Arabic Corpus
 * 
 * Data Source: https://corpus.quran.com/download/
 * Format: Tab-separated values (TSV)
 * 
 * Dataset Structure (quranic-corpus-morphology-0.4.txt):
 * LOCATION | FORM | TAG | FEATURES
 * (1:1:1:1) | bi   | P   | PREFIX|bi
 * (1:1:1:2) | somi | N   | STEM|POS:N|LEM:Asm|ROOT:smw|GEN:M|NUM:S|CASE:GEN
 */

import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

const CORPUS_DATA_DIR = path.join(__dirname, '../data/corpus');
const MORPHOLOGY_FILE_URLS = [
    'https://corpus.quran.com/download/morphology-0.4.txt',
    'https://raw.githubusercontent.com/bnjasim/quranic-corpus/master/quranic-corpus-morphology-0.4.txt',
];
const MORPHOLOGY_FILE_PATH = path.join(CORPUS_DATA_DIR, 'morphology-0.4.txt');

export interface MorphologySegment {
    location: string; // e.g., "(1:1:1:1)" where format is (chapter:verse:word:segment)
    form: string; // Arabic text of the segment
    tag: string; // Part of speech tag (N, V, P, etc.)
    features: {
        type?: 'PREFIX' | 'STEM' | 'SUFFIX';
        pos?: string; // Part of speech
        lemma?: string; // Lemma/dictionary form
        root?: string; // Root letters
        gender?: 'M' | 'F'; // Masculine/Feminine
        number?: 'S' | 'D' | 'P'; // Singular/Dual/Plural
        case?: 'NOM' | 'ACC' | 'GEN'; // Nominative/Accusative/Genitive
        person?: '1' | '2' | '3'; // 1st/2nd/3rd person
        mood?: 'IND' | 'SUBJ' | 'JUS'; // Indicative/Subjunctive/Jussive
        voice?: 'ACT' | 'PASS'; // Active/Passive
        form?: string; // Verb form (I, II, III, etc.)
        [key: string]: string | undefined; // Other features
    };
}

export interface WordMorphology {
    chapter: number;
    verse: number;
    word: number;
    segments: MorphologySegment[];
}

function isMorphologyDatasetContent(content: string): boolean {
    const trimmed = content.trimStart();

    if (trimmed.startsWith('<!DOCTYPE html') || trimmed.startsWith('<html')) {
        return false;
    }

    return /^\(\d+:\d+:\d+:\d+\)\t/m.test(content);
}

/**
 * Parse location string to extract chapter, verse, word, segment
 * Format: "(1:1:1:1)" -> { chapter: 1, verse: 1, word: 1, segment: 1 }
 */
function parseLocation(location: string): { chapter: number; verse: number; word: number; segment: number } {
    const match = location.match(/\((\d+):(\d+):(\d+):(\d+)\)/);
    if (!match) {
        throw new Error(`Invalid location format: ${location}`);
    }
    return {
        chapter: parseInt(match[1]),
        verse: parseInt(match[2]),
        word: parseInt(match[3]),
        segment: parseInt(match[4]),
    };
}

/**
 * Parse feature string into structured object
 * Example: "STEM|POS:N|LEM:Asm|ROOT:smw|GEN:M|NUM:S|CASE:GEN"
 */
function parseFeatures(featureString: string): MorphologySegment['features'] {
    const features: MorphologySegment['features'] = {};
    const parts = featureString.split('|');

    for (const part of parts) {
        if (part.includes(':')) {
            const [key, value] = part.split(':');
            const normalizedKey = key.toLowerCase();
            if (normalizedKey === 'lem') {
                features.lemma = value;
            } else if (normalizedKey === 'root') {
                features.root = value;
            } else if (normalizedKey === 'pos') {
                features.pos = value;
            } else {
                features[normalizedKey] = value;
            }
        } else {
            if (part === 'STEM' || part === 'PREFIX' || part === 'SUFFIX') {
                features.type = part as 'PREFIX' | 'STEM' | 'SUFFIX';
            } else if (part === 'M' || part === 'F') {
                features.gender = part as 'M' | 'F';
            } else if (part === 'S' || part === 'D' || part === 'P') {
                features.number = part as 'S' | 'D' | 'P';
            } else if (part === 'NOM' || part === 'ACC' || part === 'GEN') {
                features.case = part as 'NOM' | 'ACC' | 'GEN';
            } else if (part === '1' || part === '2' || part === '3') {
                features.person = part as '1' | '2' | '3';
            } else if (part === 'IND' || part === 'SUBJ' || part === 'JUS') {
                features.mood = part as 'IND' | 'SUBJ' | 'JUS';
            } else if (part === 'ACT' || part === 'PASS') {
                features.voice = part as 'ACT' | 'PASS';
            } else if (/^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)$/.test(part)) {
                features.form = part;
            } else {
                features[part.toLowerCase()] = 'true';
            }
        }
    }

    return features;
}

/**
 * Parse a single line from the morphology file
 * Format: LOCATION\tFORM\tTAG\tFEATURES
 */
function parseMorphologyLine(line: string): MorphologySegment | null {
    const parts = line.trim().split('\t');
    if (parts.length < 4) {
        return null; // Skip malformed lines
    }

    const [location, form, tag, featureString] = parts;
    const features = parseFeatures(featureString);

    return {
        location,
        form,
        tag,
        features,
    };
}

/**
 * Download the morphology dataset from Quranic Corpus
 */
export async function downloadMorphologyDataset(): Promise<void> {
    console.log('Downloading Quranic Arabic Corpus morphology dataset...');

    // Create data directory if it doesn't exist
    if (!fs.existsSync(CORPUS_DATA_DIR)) {
        fs.mkdirSync(CORPUS_DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(MORPHOLOGY_FILE_PATH)) {
        const existing = fs.readFileSync(MORPHOLOGY_FILE_PATH, 'utf-8');
        if (isMorphologyDatasetContent(existing)) {
            console.log('Morphology dataset already exists. Skipping download.');
            const stats = fs.statSync(MORPHOLOGY_FILE_PATH);
            console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            return;
        }

        console.warn('Existing morphology file is invalid. Re-downloading a valid dataset.');
    }

    let lastError: unknown = null;

    for (const url of MORPHOLOGY_FILE_URLS) {
        try {
            console.log(`Trying: ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
            }

            const data = await response.text();
            if (!isMorphologyDatasetContent(data)) {
                throw new Error('Downloaded file did not contain Quranic morphology TSV data');
            }

            fs.writeFileSync(MORPHOLOGY_FILE_PATH, data, 'utf-8');

            const stats = fs.statSync(MORPHOLOGY_FILE_PATH);
            console.log(`✓ Downloaded successfully: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            return;
        } catch (error) {
            lastError = error;
            console.warn(`Failed to download from ${url}:`, error);
        }
    }

    console.error('Error downloading morphology dataset:', lastError);
    throw lastError ?? new Error('Unable to download a valid morphology dataset');
}

/**
 * Parse the morphology dataset file
 * Groups segments by word (chapter:verse:word)
 */
export function parseMorphologyDataset(): WordMorphology[] {
    console.log('Parsing morphology dataset...');

    if (!fs.existsSync(MORPHOLOGY_FILE_PATH)) {
        throw new Error('Morphology dataset file not found. Please download it first.');
    }

    const content = fs.readFileSync(MORPHOLOGY_FILE_PATH, 'utf-8');
    if (!isMorphologyDatasetContent(content)) {
        throw new Error(
            'Morphology dataset file is invalid. Delete it and rerun the ingestion command to download a valid TSV file.'
        );
    }
    const lines = content.split('\n');

    // Group segments by word
    const wordMap = new Map<string, MorphologySegment[]>();

    for (const line of lines) {
        if (!line.trim() || line.startsWith('#') || line.startsWith('LOCATION\t')) {
            continue;
        }

        const segment = parseMorphologyLine(line);
        if (!segment) continue;

        const loc = parseLocation(segment.location);
        const wordKey = `${loc.chapter}:${loc.verse}:${loc.word}`;

        if (!wordMap.has(wordKey)) {
            wordMap.set(wordKey, []);
        }
        wordMap.get(wordKey)!.push(segment);
    }

    // Convert map to array of WordMorphology objects
    const words: WordMorphology[] = [];
    for (const [key, segments] of wordMap.entries()) {
        const [chapter, verse, word] = key.split(':').map(Number);
        words.push({
            chapter,
            verse,
            word,
            segments,
        });
    }

    console.log(`✓ Parsed ${words.length} words with morphological data`);
    return words;
}

/**
 * Get morphology for a specific ayah
 */
export function getMorphologyForAyah(chapter: number, verse: number): WordMorphology[] {
    const allWords = parseMorphologyDataset();
    return allWords.filter(w => w.chapter === chapter && w.verse === verse);
}

/**
 * Main function to test the client
 */
async function main() {
    try {
        // Download dataset if needed
        await downloadMorphologyDataset();

        // Parse and test with Surah Al-Fatiha
        console.log('\nTesting with Surah Al-Fatiha (1:1)...');
        const ayahWords = getMorphologyForAyah(1, 1);

        console.log(`\nFound ${ayahWords.length} words in verse 1:1`);
        console.log('\nSample morphology for first word:');
        console.log(JSON.stringify(ayahWords[0], null, 2));
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}
