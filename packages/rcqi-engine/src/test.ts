/**
 * RCQI Engine Test Script
 * 
 * Tests the RCQI analysis engine with a sample ayah
 */

import { RCQIEngine, WordAnalysisData } from './index';

// Sample word data for Surah Al-Fatiha, Ayah 2
const sampleWordData: WordAnalysisData[] = [
  {
    token: 'الْحَمْدُ',
    transliteration: 'al-ḥamdu',
    lemma: 'حَمْد',
    partOfSpeech: 'noun',
    root: 'ح م د',
    morphology: 'definite noun, nominative case',
    translation: 'the praise',
    position: 1,
  },
  {
    token: 'لِلَّهِ',
    transliteration: 'lillāhi',
    lemma: 'ٱللَّٰه',
    partOfSpeech: 'proper noun',
    root: 'أ ل ه',
    morphology: 'genitive case, preposition + definite noun',
    translation: 'for Allah',
    position: 2,
  },
  {
    token: 'رَبِّ',
    transliteration: 'rabbi',
    lemma: 'رَبّ',
    partOfSpeech: 'noun',
    root: 'ر ب ب',
    morphology: 'genitive case, construct state',
    translation: 'Lord',
    position: 3,
  },
  {
    token: 'الْعَالَمِينَ',
    transliteration: 'l-ʿālamīna',
    lemma: 'عَالَم',
    partOfSpeech: 'noun',
    root: 'ع ل م',
    morphology: 'definite plural noun, genitive case',
    translation: 'the worlds',
    position: 4,
  },
];

async function testRCQI() {
  console.log('='.repeat(60));
  console.log('RCQI Engine Test');
  console.log('='.repeat(60));

  const engine = new RCQIEngine();

  try {
    console.log('\n📖 Test Ayah: Surah Al-Fatiha (1), Ayah 2');
    console.log('Text: الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ');
    console.log('\nAnalyzing with RCQI methodology...\n');

    const result = await engine.analyze(
      {
        surahNumber: 1,
        surahName: 'Al-Fatiha',
        ayahNumber: 2,
        arabicText: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
        wordData: sampleWordData,
      },
      {
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 8000,
      }
    );

    console.log('Result:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Analysis successful!');
      console.log(`   Tokens used: ${result.tokenUsage.total}`);
      console.log(`   Cached: ${result.cached}`);
    } else {
      console.log('\n❌ Analysis failed:', result.error);
    }
  } catch (error) {
    console.error('\n💥 Test error:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test complete');
  console.log('='.repeat(60));
}

// Run test if executed directly
if (require.main === module) {
  testRCQI().catch(console.error);
}

export { testRCQI };
