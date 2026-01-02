import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const TANZIL_BASE_URL = 'http://tanzil.net/res/text';
const DATA_DIR = path.join(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Download function
async function downloadFile(url: string, filename: string) {
    console.log(`Downloading ${filename}...`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    const text = await response.text();
    fs.writeFileSync(path.join(DATA_DIR, filename), text);
    console.log(`Saved ${filename}`);
}

async function main() {
    try {
        // 1. Fetch Complete Quran JSON (Metadata + Text)
        await downloadFile(`https://raw.githubusercontent.com/risan/quran-json/main/data/quran.json`, 'quran.json');

        // 3. Fetch Translations (Sample: Sahih International)
        // Tanzil translation URL format might differ, checking documentation
        // Using a known mirror or list for this example, or just placeholder URLs
        // For production, we'd iterate over a list of translator IDs
        const translations = [
            { id: 'en.sahih', url: 'http://tanzil.net/trans/en.sahih' },
            { id: 'en.pickthall', url: 'http://tanzil.net/trans/en.pickthall' },
            { id: 'en.yusufali', url: 'http://tanzil.net/trans/en.yusufali' }
        ];

        for (const t of translations) {
            await downloadFile(t.url, `translation-${t.id}.txt`);
        }

        console.log('All downloads complete.');
    } catch (error) {
        console.error('Extraction failed:', error);
        process.exit(1);
    }
}

main();
