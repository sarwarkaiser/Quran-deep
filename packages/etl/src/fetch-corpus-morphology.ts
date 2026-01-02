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
const MORPHOLOGY_FILE_URL = 'https://corpus.quran.com/download/morphology-0.4.txt';
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
            features[key.toLowerCase()] = value;
        } else {
            // Handle simple tags like "STEM", "PREFIX", "SUFFIX"
            if (part === 'STEM' || part === 'PREFIX' || part === 'SUFFIX') {
                features.type = part as 'PREFIX' | 'STEM' | 'SUFFIX';
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
    console.log(`URL: ${MORPHOLOGY_FILE_URL}`);

    // Create data directory if it doesn't exist
    if (!fs.existsSync(CORPUS_DATA_DIR)) {
        fs.mkdirSync(CORPUS_DATA_DIR, { recursive: true });
    }

    // Check if file already exists
    if (fs.existsSync(MORPHOLOGY_FILE_PATH)) {
        console.log('Morphology dataset already exists. Skipping download.');
        const stats = fs.statSync(MORPHOLOGY_FILE_PATH);
        console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        return;
    }

    try {
        const response = await fetch(MORPHOLOGY_FILE_URL);
        if (!response.ok) {
            throw new Error(`Failed to download: ${response.statusText}`);
        }

        const data = await response.text();
        fs.writeFileSync(MORPHOLOGY_FILE_PATH, data, 'utf-8');

        const stats = fs.statSync(MORPHOLOGY_FILE_PATH);
        console.log(`✓ Downloaded successfully: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
        console.error('Error downloading morphology dataset:', error);
        throw error;
    }
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
    const lines = content.split('\n');

    // Group segments by word
    const wordMap = new Map<string, MorphologySegment[]>();

    for (const line of lines) {
        if (!line.trim() || line.startsWith('#')) continue; // Skip empty lines and comments

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
