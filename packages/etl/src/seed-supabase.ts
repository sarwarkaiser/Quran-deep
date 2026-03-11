/**
 * Seed Quran data to Supabase
 * 
 * This script seeds the complete Quran (114 surahs, 6,236 ayahs) to Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { surahMetadata } from './surah-metadata';

dotenv.config({ path: '../../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    console.error('Please check your .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_DIR = path.join(__dirname, '../data');

async function seed() {
    try {
        console.log('🚀 Seeding Quran data to Supabase...\n');
        console.log(`   URL: ${supabaseUrl}\n`);

        // 1. Read Quran JSON
        console.log('📖 Reading Quran data...');
        const quranJson = fs.readFileSync(path.join(DATA_DIR, 'quran.json'), 'utf-8');
        const data = JSON.parse(quranJson) as Record<string, any[]>;
        const surahIds = Object.keys(data).map(Number).sort((a, b) => a - b);
        console.log(`   ✅ Found ${surahIds.length} surahs`);

        // 2. Insert Surahs
        console.log('\n📚 Inserting surahs...');
        const surahsToInsert = surahIds.map(id => {
            const verses = data[id.toString()];
            const meta = surahMetadata[id];
            return {
                id: id,
                name_arabic: meta.arabic,
                name_transliterated: meta.transliteration,
                name_english: meta.english,
                ayah_count: verses.length,
                revelation_period: meta.type,
            };
        });

        const { error: surahError } = await supabase
            .from('surahs')
            .upsert(surahsToInsert, { onConflict: 'id' });

        if (surahError) {
            console.error('❌ Error inserting surahs:', surahError);
            throw surahError;
        }
        console.log(`   ✅ Inserted ${surahsToInsert.length} surahs`);

        // 3. Insert Ayahs in batches
        console.log('\n📝 Inserting ayahs...');
        const ayahsToInsert: any[] = [];
        
        for (const id of surahIds) {
            const verses = data[id.toString()];
            verses.forEach((v: any) => {
                ayahsToInsert.push({
                    surah_id: v.chapter,
                    ayah_number: v.verse,
                    text_arabic: v.text,
                    text_uthmani: v.text,
                    text_simplified: v.text,
                });
            });
        }

        // Insert in batches of 1000
        const BATCH_SIZE = 1000;
        let insertedCount = 0;
        for (let i = 0; i < ayahsToInsert.length; i += BATCH_SIZE) {
            const batch = ayahsToInsert.slice(i, i + BATCH_SIZE);
            const { error: ayahError } = await supabase
                .from('ayahs')
                .upsert(batch, { onConflict: 'surah_id,ayah_number' });
            
            if (ayahError) {
                console.error(`❌ Error inserting ayahs batch ${i}:`, ayahError);
                throw ayahError;
            }
            insertedCount += batch.length;
            process.stdout.write(`\r   ✅ Inserted ${insertedCount}/${ayahsToInsert.length} ayahs`);
        }
        console.log('\n');

        console.log(`\n✨ Seeding complete!`);
        console.log(`   📊 ${surahsToInsert.length} surahs`);
        console.log(`   📊 ${ayahsToInsert.length} ayahs`);
        console.log(`\n🎯 Your Quran database is ready on Supabase!`);
        console.log(`\n🔗 You can now connect your app to:`);
        console.log(`   ${supabaseUrl}`);

    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

// Run immediately
seed();
