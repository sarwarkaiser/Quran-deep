/**
 * RCQI API Routes - Root-Centric Qur'an Interpreter Endpoints
 */

import { FastifyPluginAsync } from 'fastify';
import { db, schema } from '@rcqi/database';
import { eq, and, desc } from 'drizzle-orm';
import { RCQIEngine, WordAnalysisData } from '@rcqi/rcqi-engine';

const rcqiEngine = new RCQIEngine();

interface AnalyzeRequest {
  Body: {
    forceRefresh?: boolean;
  };
  Params: {
    surahNumber: string;
    ayahNumber: string;
  };
}

interface BatchAnalyzeRequest {
  Body: {
    ayahs: Array<{
      surahNumber: number;
      ayahNumber: number;
    }>;
    forceRefresh?: boolean;
  };
}

const rcqiRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /v1/rcqi/analyze/:surahNumber/:ayahNumber
   * Perform RCQI analysis on a specific ayah
   */
  app.post<AnalyzeRequest>('/rcqi/analyze/:surahNumber/:ayahNumber', async (req, reply) => {
    try {
      const surahNumber = parseInt(req.params.surahNumber);
      const ayahNumber = parseInt(req.params.ayahNumber);
      const { forceRefresh = false } = req.body || {};

      if (isNaN(surahNumber) || isNaN(ayahNumber)) {
        return reply.code(400).send({ error: 'Invalid surah or ayah number' });
      }

      // Fetch ayah data
      const ayah = await db.query.ayahs.findFirst({
        where: and(
          eq(schema.ayahs.surahId, surahNumber),
          eq(schema.ayahs.ayahNumber, ayahNumber)
        ),
        with: {
          surah: true,
        },
      });

      if (!ayah) {
        return reply.code(404).send({ error: 'Ayah not found' });
      }

      // Fetch word morphology data
      const wordData = await db.query.wordMorphology.findMany({
        where: eq(schema.wordMorphology.ayahId, ayah.id),
        orderBy: schema.wordMorphology.position,
      });

      // Check cache first
      if (!forceRefresh) {
        const cached = await db.query.rcqiAnalysisCache.findFirst({
          where: and(
            eq(schema.rcqiAnalysisCache.ayahId, ayah.id),
            eq(schema.rcqiAnalysisCache.analysisType, 'full_rcqi'),
            eq(schema.rcqiAnalysisCache.isValid, true)
          ),
          orderBy: desc(schema.rcqiAnalysisCache.createdAt),
        });

        if (cached && cached.expiresAt && new Date(cached.expiresAt) > new Date()) {
          return {
            success: true,
            cached: true,
            analysis: cached.result,
            metadata: {
              ayahId: `${surahNumber}:${ayahNumber}`,
              surahName: ayah.surah?.name,
              generatedAt: cached.createdAt,
              model: cached.model,
            },
          };
        }
      }

      // Prepare word data for RCQI engine
      const wordAnalysisData: WordAnalysisData[] = wordData.map((w) => ({
        token: w.token,
        transliteration: w.transliteration || '',
        lemma: w.lemma || w.token,
        partOfSpeech: w.partOfSpeech || 'unknown',
        root: w.root,
        morphology: w.morphology || undefined,
        translation: w.translation || undefined,
        position: w.position,
      }));

      // Perform analysis
      const startTime = Date.now();
      const result = await rcqiEngine.analyze(
        {
          surahNumber,
          surahName: ayah.surah?.name || `Surah ${surahNumber}`,
          ayahNumber,
          arabicText: ayah.textUthmani || ayah.textIndopak || '',
          wordData: wordAnalysisData,
        },
        { forceRefresh, model: 'claude-3-5-sonnet-20241022', maxTokens: 8000 }
      );

      const processingTime = Date.now() - startTime;

      if (!result.success || !result.analysis) {
        return reply.code(500).send({
          error: 'Analysis failed',
          details: result.error,
        });
      }

      // Store in cache
      await db.insert(schema.rcqiAnalysisCache).values({
        ayahId: ayah.id,
        analysisType: 'full_rcqi',
        analysisVersion: '1.0.0',
        result: result.analysis,
        model: result.analysis.model,
        promptVersion: '1.0.0',
        tokensUsed: result.tokenUsage,
        processingTime,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      return {
        success: true,
        cached: false,
        analysis: result.analysis,
        metadata: {
          ayahId: `${surahNumber}:${ayahNumber}`,
          surahName: ayah.surah?.name,
          generatedAt: result.analysis.generatedAt,
          model: result.analysis.model,
          tokenUsage: result.tokenUsage,
          processingTimeMs: processingTime,
        },
      };
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /v1/rcqi/analysis/:surahNumber/:ayahNumber
   * Get cached RCQI analysis for an ayah
   */
  app.get<{ Params: { surahNumber: string; ayahNumber: string } }>(
    '/rcqi/analysis/:surahNumber/:ayahNumber',
    async (req, reply) => {
      try {
        const surahNumber = parseInt(req.params.surahNumber);
        const ayahNumber = parseInt(req.params.ayahNumber);

        // Fetch ayah
        const ayah = await db.query.ayahs.findFirst({
          where: and(
            eq(schema.ayahs.surahId, surahNumber),
            eq(schema.ayahs.ayahNumber, ayahNumber)
          ),
          with: {
            surah: true,
          },
        });

        if (!ayah) {
          return reply.code(404).send({ error: 'Ayah not found' });
        }

        // Get latest analysis
        const analysis = await db.query.rcqiAnalysisCache.findFirst({
          where: and(
            eq(schema.rcqiAnalysisCache.ayahId, ayah.id),
            eq(schema.rcqiAnalysisCache.isValid, true)
          ),
          orderBy: desc(schema.rcqiAnalysisCache.createdAt),
        });

        if (!analysis) {
          return reply.code(404).send({
            error: 'No analysis found',
            message: 'Use POST /rcqi/analyze to generate analysis',
          });
        }

        return {
          success: true,
          analysis: analysis.result,
          metadata: {
            ayahId: `${surahNumber}:${ayahNumber}`,
            surahName: ayah.surah?.name,
            generatedAt: analysis.createdAt,
            model: analysis.model,
            tokenUsage: analysis.tokensUsed,
          },
        };
      } catch (error) {
        app.log.error(error);
        return reply.code(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * POST /v1/rcqi/analyze/batch
   * Batch analyze multiple ayahs
   */
  app.post<BatchAnalyzeRequest>('/rcqi/analyze/batch', async (req, reply) => {
    try {
      const { ayahs: ayahList, forceRefresh = false } = req.body;

      if (!Array.isArray(ayahList) || ayahList.length === 0) {
        return reply.code(400).send({ error: 'Invalid ayah list' });
      }

      if (ayahList.length > 10) {
        return reply.code(400).send({ error: 'Maximum 10 ayahs per batch' });
      }

      const results = [];

      for (const { surahNumber, ayahNumber } of ayahList) {
        // Fetch ayah
        const ayah = await db.query.ayahs.findFirst({
          where: and(
            eq(schema.ayahs.surahId, surahNumber),
            eq(schema.ayahs.ayahNumber, ayahNumber)
          ),
          with: {
            surah: true,
          },
        });

        if (!ayah) {
          results.push({
            surahNumber,
            ayahNumber,
            success: false,
            error: 'Ayah not found',
          });
          continue;
        }

        // Check cache
        if (!forceRefresh) {
          const cached = await db.query.rcqiAnalysisCache.findFirst({
            where: and(
              eq(schema.rcqiAnalysisCache.ayahId, ayah.id),
              eq(schema.rcqiAnalysisCache.isValid, true)
            ),
            orderBy: desc(schema.rcqiAnalysisCache.createdAt),
          });

          if (cached && cached.expiresAt && new Date(cached.expiresAt) > new Date()) {
            results.push({
              surahNumber,
              ayahNumber,
              success: true,
              cached: true,
              ayahId: `${surahNumber}:${ayahNumber}`,
            });
            continue;
          }
        }

        results.push({
          surahNumber,
          ayahNumber,
          success: true,
          cached: false,
          status: 'queued',
          ayahId: `${surahNumber}:${ayahNumber}`,
        });

        // In production, add to queue for async processing
        // For now, we just return queued status
      }

      return {
        success: true,
        results,
        message: 'Batch analysis queued. Use GET /rcqi/analysis/:surah/:ayah to check status.',
      };
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /v1/rcqi/semantic-search?q=query
   * Semantic search across ayahs
   */
  app.get<{ Querystring: { q: string; limit?: string } }>(
    '/rcqi/semantic-search',
    async (req, reply) => {
      try {
        const { q, limit = '10' } = req.query;

        if (!q) {
          return reply.code(400).send({ error: 'Query parameter q is required' });
        }

        const limitNum = Math.min(parseInt(limit) || 10, 50);

        // TODO: Implement semantic search using embeddings
        // For now, return placeholder
        return {
          success: true,
          query: q,
          results: [],
          message: 'Semantic search implementation pending',
        };
      } catch (error) {
        app.log.error(error);
        return reply.code(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /v1/rcqi/connections/:surahNumber/:ayahNumber
   * Get semantic connections for an ayah
   */
  app.get<{ Params: { surahNumber: string; ayahNumber: string } }>(
    '/rcqi/connections/:surahNumber/:ayahNumber',
    async (req, reply) => {
      try {
        const surahNumber = parseInt(req.params.surahNumber);
        const ayahNumber = parseInt(req.params.ayahNumber);

        // Fetch ayah
        const ayah = await db.query.ayahs.findFirst({
          where: and(
            eq(schema.ayahs.surahId, surahNumber),
            eq(schema.ayahs.ayahNumber, ayahNumber)
          ),
        });

        if (!ayah) {
          return reply.code(404).send({ error: 'Ayah not found' });
        }

        // Get connections
        const connections = await db.query.semanticConnections.findMany({
          where: eq(schema.semanticConnections.sourceAyahId, ayah.id),
          with: {
            targetAyah: {
              with: {
                surah: true,
              },
            },
          },
          orderBy: desc(schema.semanticConnections.strength),
          limit: 20,
        });

        return {
          success: true,
          ayahId: `${surahNumber}:${ayahNumber}`,
          connections: connections.map((c) => ({
            targetAyahId: `${c.targetAyah?.surahId}:${c.targetAyah?.ayahNumber}`,
            targetAyahText: c.targetAyah?.textUthmani,
            connectionType: c.connectionType,
            strength: parseFloat(c.strength.toString()),
            description: c.description,
            metadata: c.metadata,
          })),
        };
      } catch (error) {
        app.log.error(error);
        return reply.code(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
};

export default rcqiRoutes;
