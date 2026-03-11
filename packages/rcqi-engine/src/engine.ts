/**
 * RCQI Engine - Root-Centric Qur'an Interpreter
 * 
 * This module provides the core functionality for analyzing Qur'anic ayahs
 * using the RCQI methodology through AI-powered root analysis.
 */

import { generateRCQIPrompt, WordAnalysisData, RCQIAnalysis } from './prompts/rcqi-master-prompt';
import { ClaudeClient, ClaudeMessage } from './claude/client';

export interface AnalyzeOptions {
  /** Force fresh analysis even if cached */
  forceRefresh?: boolean;
  /** Specific analysis type */
  analysisType?: 'full' | 'roots_only' | 'semantic_integration';
  /** Claude model to use */
  model?: string;
  /** Maximum tokens for response */
  maxTokens?: number;
}

export interface AnalyzeParams {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  arabicText: string;
  wordData: WordAnalysisData[];
}

export interface AnalysisResult {
  success: boolean;
  analysis?: RCQIAnalysis;
  rawOutput?: string;
  error?: string;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  cached: boolean;
}

/**
 * RCQI Engine class for performing root-centric Qur'anic analysis
 */
export class RCQIEngine {
  private client: ClaudeClient;
  private cache: Map<string, AnalysisResult>;
  private cacheTTL: number;

  constructor(apiKey?: string) {
    this.client = new ClaudeClient(apiKey);
    this.cache = new Map();
    // Default 30 days cache TTL
    this.cacheTTL = 30 * 24 * 60 * 60 * 1000;
  }

  /**
   * Generate a cache key for an ayah analysis
   */
  private getCacheKey(params: AnalyzeParams): string {
    return `rcqi:${params.surahNumber}:${params.ayahNumber}`;
  }

  /**
   * Check if cached result is still valid
   */
  private isCacheValid(cachedResult: AnalysisResult): boolean {
    if (!cachedResult || !cachedResult.analysis) return false;
    const age = Date.now() - new Date(cachedResult.analysis.generatedAt).getTime();
    return age < this.cacheTTL;
  }

  /**
   * Analyze an ayah using the RCQI methodology
   */
  async analyze(params: AnalyzeParams, options: AnalyzeOptions = {}): Promise<AnalysisResult> {
    const cacheKey = this.getCacheKey(params);

    // Check cache unless force refresh
    if (!options.forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cached)) {
        return { ...cached, cached: true };
      }
    }

    try {
      // Generate the RCQI prompt
      const prompt = generateRCQIPrompt(params);

      // Call Claude API
      const messages: ClaudeMessage[] = [
        {
          role: 'user',
          content: prompt,
        },
      ];

      const response = await this.client.complete({
        messages,
        model: options.model || 'claude-3-5-sonnet-20241022',
        maxTokens: options.maxTokens || 8000,
        temperature: 0.3, // Lower temperature for consistent structured output
      });

      // Parse the structured output
      const parsedAnalysis = this.parseAnalysisOutput(
        response.content,
        params,
        response.model
      );

      const result: AnalysisResult = {
        success: true,
        analysis: parsedAnalysis,
        rawOutput: response.content,
        tokenUsage: {
          prompt: response.usage.input_tokens,
          completion: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens,
        },
        cached: false,
      };

      // Cache the result
      this.cache.set(cacheKey, result);

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        tokenUsage: { prompt: 0, completion: 0, total: 0 },
        cached: false,
      };
    }
  }

  /**
   * Parse the AI output into structured RCQI analysis
   * This is a best-effort parser that handles the structured text output
   */
  private parseAnalysisOutput(
    rawOutput: string,
    params: AnalyzeParams,
    model: string
  ): RCQIAnalysis {
    const now = new Date();

    // TODO: Implement more sophisticated parsing
    // For now, return a structure with the raw content stored
    // A production implementation would parse the sections more thoroughly

    return {
      ayahId: `${params.surahNumber}:${params.ayahNumber}`,
      surahNumber: params.surahNumber,
      ayahNumber: params.ayahNumber,
      arabicText: params.arabicText,
      transliteration: '', // Would be extracted from output
      tokenRootCards: [], // Would be parsed from Token Root Cards section
      semanticIntegration: rawOutput, // Store full output for now
      collisions: [],
      symbolicParaphrases: [],
      bestMeaning: {
        primary: '',
        secondary: '',
        otherPossible: [],
        confidence: 'Medium',
      },
      modernLanguageEchoes: [],
      originalSources: {},
      generatedAt: now,
      model,
      tokenUsage: { prompt: 0, completion: 0, total: 0 },
    };
  }

  /**
   * Get analysis for multiple ayahs (batch processing)
   */
  async analyzeBatch(
    params: AnalyzeParams[],
    options: AnalyzeOptions = {}
  ): Promise<AnalysisResult[]> {
    // Process sequentially to avoid rate limits
    const results: AnalysisResult[] = [];
    for (const param of params) {
      const result = await this.analyze(param, options);
      results.push(result);
      // Small delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return results;
  }

  /**
   * Clear the analysis cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance for convenience
export const rcqiEngine = new RCQIEngine();
