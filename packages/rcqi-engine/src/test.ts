/**
 * RCQI provider smoke test.
 *
 * Usage:
 *   pnpm --filter @rcqi/engine smoke
 *   pnpm --filter @rcqi/engine smoke -- --raw
 */

import dotenv from 'dotenv';
import path from 'path';
import { RCQIEngine } from './engine';
import {
  RCQI_ANALYSIS_VERSION,
  RCQI_PROMPT_VERSION,
  type WordAnalysisData,
} from './prompts/rcqi-master-prompt';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

interface SmokeTestOptions {
  showRawOutput: boolean;
}

const SAMPLE_AYAH = {
  surahNumber: 1,
  surahName: 'Al-Fatiha',
  ayahNumber: 2,
  arabicText: 'ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ',
  wordData: [
    {
      token: 'ٱلۡحَمۡدُ',
      transliteration: 'al-hamdu',
      lemma: 'حمد',
      partOfSpeech: 'noun',
      root: 'ح م د',
      morphology: 'definite noun, nominative',
      translation: 'the praise',
      position: 1,
    },
    {
      token: 'لِلَّهِ',
      transliteration: 'lillahi',
      lemma: 'الله',
      partOfSpeech: 'proper noun',
      root: 'أ ل ه',
      morphology: 'preposition + proper noun, genitive',
      translation: 'for Allah',
      position: 2,
    },
    {
      token: 'رَبِّ',
      transliteration: 'rabbi',
      lemma: 'رب',
      partOfSpeech: 'noun',
      root: 'ر ب ب',
      morphology: 'construct noun, genitive',
      translation: 'Lord',
      position: 3,
    },
    {
      token: 'ٱلۡعَٰلَمِينَ',
      transliteration: 'al-alamina',
      lemma: 'عالم',
      partOfSpeech: 'noun',
      root: 'ع ل م',
      morphology: 'definite plural noun, genitive',
      translation: 'the worlds',
      position: 4,
    },
  ] satisfies WordAnalysisData[],
};

function parseArgs(argv: string[]): SmokeTestOptions {
  return {
    showRawOutput: argv.includes('--raw'),
  };
}

function getActiveProviderSummary() {
  const provider =
    process.env.LLM_PROVIDER ||
    (process.env.OPENAI_API_KEY && 'openai') ||
    (process.env.OPENROUTER_API_KEY && 'openrouter') ||
    (process.env.GEMINI_API_KEY && 'gemini') ||
    (process.env.OLLAMA_BASE_URL && 'ollama') ||
    'anthropic';

  const model =
    process.env.LLM_MODEL ||
    process.env.ANTHROPIC_MODEL ||
    process.env.OPENAI_MODEL ||
    process.env.OPENROUTER_MODEL ||
    process.env.GEMINI_MODEL ||
    process.env.OLLAMA_MODEL ||
    '(provider default)';

  return { provider, model };
}

function getProviderHint(provider: string) {
  switch (provider) {
    case 'anthropic':
      return 'Set ANTHROPIC_API_KEY or LLM_API_KEY.';
    case 'openai':
      return 'Set OPENAI_API_KEY or LLM_API_KEY.';
    case 'openrouter':
      return 'Set OPENROUTER_API_KEY or LLM_API_KEY.';
    case 'gemini':
      return 'Set GEMINI_API_KEY or LLM_API_KEY.';
    case 'ollama':
      return 'Ensure OLLAMA_BASE_URL points to a running Ollama server.';
    case 'openai-compatible':
      return 'Set LLM_API_KEY and LLM_BASE_URL for your compatible endpoint.';
    default:
      return 'Check your LLM_PROVIDER and related environment variables.';
  }
}

async function testRCQI(options: SmokeTestOptions) {
  const { provider, model } = getActiveProviderSummary();

  console.log('='.repeat(72));
  console.log('RCQI Provider Smoke Test');
  console.log('='.repeat(72));
  console.log(`Prompt version: ${RCQI_PROMPT_VERSION}`);
  console.log(`Analysis version: ${RCQI_ANALYSIS_VERSION}`);
  console.log(`Provider: ${provider}`);
  console.log(`Model: ${model}`);
  console.log(`Ayah: ${SAMPLE_AYAH.surahNumber}:${SAMPLE_AYAH.ayahNumber} (${SAMPLE_AYAH.surahName})`);
  console.log(`Arabic: ${SAMPLE_AYAH.arabicText}`);
  console.log('-'.repeat(72));

  const engine = new RCQIEngine();
  const startedAt = Date.now();

  try {
    const result = await engine.analyze(
      {
        surahNumber: SAMPLE_AYAH.surahNumber,
        surahName: SAMPLE_AYAH.surahName,
        ayahNumber: SAMPLE_AYAH.ayahNumber,
        arabicText: SAMPLE_AYAH.arabicText,
        wordData: SAMPLE_AYAH.wordData,
      },
      {
        model: process.env.LLM_MODEL,
        maxTokens: 5000,
      }
    );

    const elapsedMs = Date.now() - startedAt;

    if (!result.success || !result.analysis) {
      throw new Error(result.error || 'Unknown analysis failure');
    }

    console.log('Result: success');
    console.log(`Latency: ${elapsedMs} ms`);
    console.log(`Cached: ${result.cached ? 'yes' : 'no'}`);
    console.log(`Model used: ${result.analysis.model}`);
    console.log(
      `Token usage: prompt=${result.tokenUsage.prompt}, completion=${result.tokenUsage.completion}, total=${result.tokenUsage.total}`
    );
    console.log(`Token cards parsed: ${result.analysis.tokenRootCards.length}`);
    console.log(
      `Paraphrases: ${result.analysis.symbolicParaphrases.length}, collisions: ${result.analysis.collisions.length}`
    );
    console.log(`Validation: ${result.analysis.validation.valid ? 'valid' : 'issues detected'}`);
    console.log(
      `Source grounding: hits=${result.analysis.methodology.sourceGrounding.totalHits}, authors=${result.analysis.methodology.sourceGrounding.authorsWithHits}/4`
    );
    console.log('-'.repeat(72));

    result.analysis.tokenRootCards.forEach((card, index) => {
      console.log(
        `${index + 1}. ${card.token} | root=${card.root ?? 'null'} | pos=${card.partOfSpeech} | confidence=${card.rootCard.confidence}`
      );
      console.log(`   nucleus: ${card.rootCard.coreNucleus}`);
    });

    console.log('-'.repeat(72));
    console.log('Best meaning summary:');
    console.log(`Primary: ${result.analysis.bestMeaning.primary}`);
    console.log(`Secondary: ${result.analysis.bestMeaning.secondary}`);
    if (result.analysis.validation.issues.length > 0) {
      console.log(`Validation issues: ${result.analysis.validation.issues.join(' | ')}`);
    }
    if (result.analysis.methodology.sourceGrounding.citations.length > 0) {
      console.log(
        `Grounded citations: ${result.analysis.methodology.sourceGrounding.citations.join(' | ')}`
      );
    }

    if (options.showRawOutput && result.rawOutput) {
      console.log('-'.repeat(72));
      console.log('Raw provider output:');
      console.log(result.rawOutput);
    }

    console.log('='.repeat(72));
    console.log('Smoke test passed');
    console.log('='.repeat(72));
  } catch (error) {
    console.error('Smoke test failed');
    console.error(error instanceof Error ? error.message : error);
    console.error(getProviderHint(provider));
    console.log('='.repeat(72));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  const options = parseArgs(process.argv.slice(2));
  void testRCQI(options);
}

export { testRCQI };
