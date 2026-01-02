import { db, schema } from '@rcqi/database';
import { parseStringPromise } from 'xml2js';
import fs from 'fs';
import path from 'path';
import { TanzilQuran } from './types';
import { getSurahMetadata } from './metadata';

const DATA_DIR = path.join(__dirname, '../data');

async function seed() {
    try {
        console.log('Starting seed process...');

        // 1. Read JSON file
        const quranJson = fs.readFileSync(path.join(DATA_DIR, 'quran.json'), 'utf-8');
        const data = JSON.parse(quranJson) as Record<string, any[]>;

        const surahIds = Object.keys(data).map(Number).sort((a, b) => a - b);
        console.log(`Parsed ${surahIds.length} surahs.`);

        // 2. Insert Surahs & Collect Ayahs
        console.log('Seeding Surahs and Ayahs...');
        const ayahsToInsert: typeof schema.ayahs.$inferInsert[] = [];

        for (const id of surahIds) {
            const verses = data[id.toString()];
            const count = verses.length;
            const meta = getSurahMetadata(id); // Use local metadata as JSON lacks it

            await db.insert(schema.surahs).values({
                id: id,
                nameArabic: meta.english, // Placeholder as JSON lacks Arabic name
                nameTransliterated: meta.transliteration,
                nameEnglish: meta.english,
                ayahCount: count,
                revelationPeriod: meta.type as any,
            }).onConflictDoNothing();

            verses.forEach((v: any) => {
                ayahsToInsert.push({
                    surahId: v.chapter,
                    ayahNumber: v.verse,
                    textArabic: v.text,
                    textUthmani: v.text,
                    textSimplified: v.text, // Same for now
                    textIndopak: null,
                });
            });
        }

        // Batch insert
        const CHUNK_SIZE = 1000;
        for (let i = 0; i < ayahsToInsert.length; i += CHUNK_SIZE) {
            await db.insert(schema.ayahs).values(ayahsToInsert.slice(i, i + CHUNK_SIZE)).onConflictDoNothing();
            console.log(`Inserted ayahs ${i} to ${i + CHUNK_SIZE}`);
        }

        console.log('Seeding complete.');
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seed();
