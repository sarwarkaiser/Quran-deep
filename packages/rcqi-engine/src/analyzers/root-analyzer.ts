/**
 * Root word analyzer
 */

import { claudeClient } from '../claude/client';
import { db, schema } from '@rcqi/database';
import type { AnalysisRequest, RCQIAnalysis } from '@rcqi/shared';
import { eq } from 'drizzle-orm';

export class RootAnalyzer {
    /**
     * Analyze ayah for root words
     */
    async analyze(request: AnalysisRequest): Promise<RCQIAnalysis> {
        const startTime = Date.now();

        // Get ayah from database
        const ayah = await db.query.ayahs.findFirst({
            where: eq(schema.ayahs.id, parseInt(request.ayahId)),
        });

        if (!ayah) {
            throw new Error(`Ayah not found: ${request.ayahId}`);
        }

        // Check cache first (unless force refresh)
        if (!request.options?.forceRefresh) {
            const cached = await this.getCachedAnalysis(request.ayahId);
            if (cached) {
                return cached;
            }
        }

        // Perform analysis using Claude
        const analysis = await claudeClient.analyzeRoots(ayah.textArabic);

        // Store in cache
        const result: RCQIAnalysis = {
            id: '', // Will be set by database
            ayahId: request.ayahId,
            analysisType: 'root',
            analysisVersion: '1.0.0',
            result: {
                roots: analysis.roots.map(r => ({
                    rootId: '', // Would need to look up or create root
                    word: r.word,
                    derivatives: r.derivatives,
                    semanticField: r.semanticField,
                    contextualMeaning: r.contextualMeaning,
                })),
                linguisticInsights: analysis.linguisticInsights,
                confidence: 0.9, // Claude is generally high confidence
            },
            tokensUsed: analysis.tokensUsed,
            processingTime: Date.now() - startTime,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        };

        await this.cacheAnalysis(result);

        return result;
    }

    /**
     * Get cached analysis
     */
    private async getCachedAnalysis(ayahId: string): Promise<RCQIAnalysis | null> {
        const cached = await db.query.rcqiAnalysisCache.findFirst({
            where: (cache, { eq, and, gt }) =>
                and(
                    eq(cache.ayahId, parseInt(ayahId)),
                    eq(cache.analysisType, 'root'),
                    gt(cache.expiresAt, new Date())
                ),
        });

        if (!cached) return null;

        return {
            id: cached.id.toString(),
            ayahId: cached.ayahId.toString(),
            analysisType: 'root',
            analysisVersion: cached.analysisVersion,
            result: cached.result as any,
            tokensUsed: cached.tokensUsed || 0,
            processingTime: cached.processingTime || 0,
            createdAt: cached.createdAt,
            expiresAt: cached.expiresAt || undefined,
        };
    }

    /**
     * Cache analysis result
     */
    private async cacheAnalysis(analysis: RCQIAnalysis): Promise<void> {
        await db.insert(schema.rcqiAnalysisCache).values({
            ayahId: parseInt(analysis.ayahId),
            analysisType: 'root',
            analysisVersion: analysis.analysisVersion,
            result: analysis.result as any,
            tokensUsed: analysis.tokensUsed,
            processingTime: analysis.processingTime,
            expiresAt: analysis.expiresAt,
        });
    }
}

export const rootAnalyzer = new RootAnalyzer();
