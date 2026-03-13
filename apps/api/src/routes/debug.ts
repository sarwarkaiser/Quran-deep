import { FastifyPluginAsync } from 'fastify';
import { RCQIEngine, WordAnalysisData, LLMProvider } from '@rcqi/engine';

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

const debugRoutes: FastifyPluginAsync = async (app) => {
  const getResolvedProvider = () =>
    process.env.LLM_PROVIDER ||
    (process.env.OPENAI_API_KEY && 'openai') ||
    (process.env.OPENROUTER_API_KEY && 'openrouter') ||
    (process.env.GEMINI_API_KEY && 'gemini') ||
    (process.env.OLLAMA_BASE_URL && 'ollama') ||
    'anthropic';

  const getResolvedModel = () =>
    process.env.LLM_MODEL ||
    process.env.ANTHROPIC_MODEL ||
    process.env.OPENAI_MODEL ||
    process.env.OPENROUTER_MODEL ||
    process.env.GEMINI_MODEL ||
    process.env.OLLAMA_MODEL ||
    '(provider default)';

  const isValidProvider = (value: string | undefined): value is LLMProvider =>
    value === 'anthropic' ||
    value === 'openai' ||
    value === 'openrouter' ||
    value === 'gemini' ||
    value === 'ollama' ||
    value === 'openai-compatible';

  app.get('/debug/provider', async () => {
    return {
      provider: getResolvedProvider(),
      model: getResolvedModel(),
    };
  });

  app.post<{
    Body:
      | {
          raw?: boolean;
          forceRefresh?: boolean;
          provider?: string;
          model?: string;
          promptSupplement?: string;
        }
      | undefined;
  }>(
    '/debug/llm',
    async (req, reply) => {
      const startedAt = Date.now();

      try {
        const provider = isValidProvider(req.body?.provider)
          ? req.body.provider
          : undefined;
        const model = req.body?.model?.trim() || process.env.LLM_MODEL;
        const engine = new RCQIEngine({
          provider,
          model: model || undefined,
        });

        const result = await engine.analyze(
          SAMPLE_AYAH,
          {
            forceRefresh: req.body?.forceRefresh ?? false,
            model: model || undefined,
            maxTokens: 5000,
            promptSupplement: req.body?.promptSupplement,
          }
        );

        if (!result.success || !result.analysis) {
          return reply.code(500).send({
            success: false,
            error: result.error || 'Unknown debug LLM failure',
          });
        }

        return {
          success: true,
          provider: provider || getResolvedProvider(),
          model: result.analysis.model,
          latencyMs: Date.now() - startedAt,
          cached: result.cached,
          sampleAyah: {
            surahNumber: SAMPLE_AYAH.surahNumber,
            ayahNumber: SAMPLE_AYAH.ayahNumber,
            arabicText: SAMPLE_AYAH.arabicText,
          },
          summary: {
            tokenCards: result.analysis.tokenRootCards.length,
            paraphrases: result.analysis.symbolicParaphrases.length,
            collisions: result.analysis.collisions.length,
            bestMeaning: result.analysis.bestMeaning,
            promptVersion: result.analysis.methodology.promptVersion,
            analysisVersion: result.analysis.methodology.analysisVersion,
            wholeAyahPriorityEnforced: result.analysis.methodology.wholeAyahPriorityEnforced,
            sourceGrounding: result.analysis.methodology.sourceGrounding,
            validation: result.analysis.validation,
          },
          analysis: req.body?.raw ? result.analysis : undefined,
          rawOutput: req.body?.raw ? result.rawOutput : undefined,
          promptSupplement: req.body?.promptSupplement || undefined,
        };
      } catch (error) {
        app.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown debug LLM error',
        });
      }
    }
  );
};

export default debugRoutes;
