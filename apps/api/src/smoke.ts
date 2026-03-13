/**
 * API smoke test for a running RCQI server.
 *
 * Usage:
 *   pnpm --filter api smoke
 *   pnpm --filter api smoke -- --base http://localhost:3011 --raw
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

interface SmokeOptions {
  baseUrl: string;
  showRawOutput: boolean;
}

function parseArgs(argv: string[]): SmokeOptions {
  let baseUrl = process.env.API_URL || `http://localhost:${process.env.API_PORT || '3011'}`;
  let showRawOutput = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--base' && next) {
      baseUrl = next;
      index += 1;
    } else if (arg === '--raw') {
      showRawOutput = true;
    }
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    showRawOutput,
  };
}

async function getJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload: any = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.message ||
      `HTTP ${response.status} for ${url}`;
    throw new Error(message);
  }

  return payload;
}

async function runSmokeTest(options: SmokeOptions) {
  const startedAt = Date.now();
  const ayahPath = '/v1/ayahs/1/2';
  const wordsPath = '/v1/ayahs/1/2/words';
  const analyzePath = '/v1/rcqi/analyze/1/2';

  try {
    console.log('='.repeat(72));
    console.log('RCQI API Smoke Test');
    console.log('='.repeat(72));
    console.log(`Base URL: ${options.baseUrl}`);
    console.log('-'.repeat(72));

    const health = await getJson<{ status: string; app: string }>(`${options.baseUrl}/`);
    console.log(`Health: ${health.status} (${health.app})`);

    const ayah = await getJson<{ surahId: number; ayahNumber: number }>(`${options.baseUrl}${ayahPath}`);
    console.log(`Ayah fetch: success (${ayah.surahId}:${ayah.ayahNumber})`);

    const words = await getJson<any[]>(`${options.baseUrl}${wordsPath}`);
    console.log(`Words fetch: ${Array.isArray(words) ? words.length : 0} words`);

    const analysis = await getJson<{
      cached?: boolean;
      metadata?: { model?: string };
      analysis?: {
        tokenRootCards?: any[];
        symbolicParaphrases?: string[];
      };
    }>(`${options.baseUrl}${analyzePath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ forceRefresh: false }),
    });

    console.log(`Analyze: success (cached=${analysis.cached ? 'yes' : 'no'})`);
    console.log(`Model: ${analysis.metadata?.model || 'unknown'}`);
    console.log(
      `Token cards: ${analysis.analysis?.tokenRootCards?.length ?? 0}, paraphrases: ${analysis.analysis?.symbolicParaphrases?.length ?? 0}`
    );

    if (options.showRawOutput) {
      console.log('-'.repeat(72));
      console.log('Analysis payload:');
      console.log(JSON.stringify(analysis, null, 2));
    }

    console.log('-'.repeat(72));
    console.log(`Latency: ${Date.now() - startedAt} ms`);
    console.log('Smoke test passed');
    console.log('='.repeat(72));
  } catch (error) {
    console.error('Smoke test failed');
    console.error(error instanceof Error ? error.message : error);
    console.error('Make sure the API server is running and the database/LLM settings are valid.');
    console.log('='.repeat(72));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  const options = parseArgs(process.argv.slice(2));
  void runSmokeTest(options);
}

export { runSmokeTest };
