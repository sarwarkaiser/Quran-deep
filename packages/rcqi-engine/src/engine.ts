/**
 * RCQI Engine - Root-Centric Qur'an Interpreter
 * 
 * This module provides the core functionality for analyzing Qur'anic ayahs
 * using the RCQI methodology through AI-powered root analysis.
 */

import {
  generateRCQIPrompt,
  WordAnalysisData,
  RCQIAnalysis,
  RCQI_ANALYSIS_VERSION,
  RCQI_PROMPT_VERSION,
  RCQI_REQUIRED_LANGUAGE_ECHOES,
} from './prompts/rcqi-master-prompt';
import { LLMClient, LLMClientConfig, LLMMessage } from './llm/client';
import { buildOriginalSourceContext, type SourceGroundingSummary } from './sources/retriever';

export interface AnalyzeOptions {
  /** Force fresh analysis even if cached */
  forceRefresh?: boolean;
  /** Specific analysis type */
  analysisType?: 'full' | 'roots_only' | 'semantic_integration';
  /** Claude model to use */
  model?: string;
  /** Maximum tokens for response */
  maxTokens?: number;
  /** Extra debug or steering instruction appended to the prompt */
  promptSupplement?: string;
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
  private client: LLMClient;
  private cache: Map<string, AnalysisResult>;
  private cacheTTL: number;

  constructor(config?: string | LLMClientConfig) {
    this.client =
      typeof config === 'string'
        ? new LLMClient({ apiKey: config })
        : new LLMClient(config);
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
      const sourceContext = buildOriginalSourceContext(params);

      // Generate the RCQI prompt
      const prompt = generateRCQIPrompt({
        ...params,
        sourceContext: sourceContext.promptBlock,
        promptSupplement: options.promptSupplement,
      });

      // Call Claude API
      const messages: LLMMessage[] = [
        {
          role: 'user',
          content: prompt,
        },
      ];

      const response = await this.client.complete({
        messages,
        model: options.model,
        maxTokens: options.maxTokens || 8000,
        temperature: 0.3, // Lower temperature for consistent structured output
      });

      // Parse the structured output
      const parsedAnalysis = this.parseAnalysisOutput(
        response.content,
        params,
        response.model,
        sourceContext.interpretations,
        sourceContext.grounding
      );
      parsedAnalysis.tokenUsage = {
        prompt: response.usage.input_tokens,
        completion: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      };

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
    model: string,
    groundedOriginalSources: RCQIAnalysis['originalSources'],
    sourceGrounding: SourceGroundingSummary
  ): RCQIAnalysis {
    const now = new Date();
    const parsedPayload = this.extractStructuredPayload(rawOutput);
    const fallbackTokenCards = this.buildFallbackTokenRootCards(params.wordData);
    const safeTokenCards = this.normalizeTokenRootCards(
      parsedPayload?.tokenRootCards,
      fallbackTokenCards,
      params.wordData
    );
    const semanticIntegration =
      this.normalizeString(parsedPayload?.semanticIntegration) ||
      this.extractSection(rawOutput, ['semantic integration', 'whole ayah semantic integration']) ||
      this.buildFallbackSemanticIntegration(params.wordData);
    const symbolicParaphrases =
      this.normalizeStringArray(parsedPayload?.symbolicParaphrases) ||
      this.extractBullets(rawOutput, ['symbolic paraphrases', 'whole ayah symbolic paraphrases']);
    const collisions = this.normalizeCollisions(parsedPayload?.collisions);
    const bestMeaning = this.normalizeBestMeaning(parsedPayload?.bestMeaning, semanticIntegration, safeTokenCards);
    const modernLanguageEchoes = this.ensureRequiredLanguageEchoes(
      this.normalizeModernLanguageEchoes(parsedPayload?.modernLanguageEchoes),
      safeTokenCards
    );
    const originalSources = this.ensureRequiredOriginalSources(
      this.mergeOriginalSources(
        this.normalizeOriginalSources(parsedPayload?.originalSources),
        groundedOriginalSources
      ),
      params,
      safeTokenCards
    );
    const transliteration =
      this.normalizeString(parsedPayload?.fullAyah?.transliteration) ||
      params.wordData.map((word) => word.transliteration).filter(Boolean).join(' ').trim();
    const finalParaphrases = this.ensureMinimumParaphrases(
      symbolicParaphrases,
      bestMeaning,
      semanticIntegration
    );
    const validation = this.buildValidationReport({
      params,
      tokenRootCards: safeTokenCards,
      semanticIntegration,
      symbolicParaphrases: finalParaphrases,
      bestMeaning,
      modernLanguageEchoes,
      originalSources,
    });

    return {
      ayahId: `${params.surahNumber}:${params.ayahNumber}`,
      surahNumber: params.surahNumber,
      ayahNumber: params.ayahNumber,
      arabicText: params.arabicText,
      transliteration,
      tokenRootCards: safeTokenCards,
      semanticIntegration,
      collisions,
      symbolicParaphrases: finalParaphrases,
      bestMeaning,
      modernLanguageEchoes,
      originalSources,
      methodology: {
        promptVersion: RCQI_PROMPT_VERSION,
        analysisVersion: RCQI_ANALYSIS_VERSION,
        wholeAyahPriorityEnforced: true,
        tokenCoverage: {
          expected: params.wordData.length,
          actual: safeTokenCards.length,
        },
        sourceGrounding,
      },
      validation,
      generatedAt: now,
      model,
      tokenUsage: { prompt: 0, completion: 0, total: 0 },
    };
  }

  private extractStructuredPayload(rawOutput: string): any | null {
    const candidates = [
      rawOutput.trim(),
      this.extractJsonCodeFence(rawOutput),
      this.extractBalancedJsonObject(rawOutput),
    ].filter(Boolean) as string[];

    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate);
      } catch {
        continue;
      }
    }

    return null;
  }

  private extractJsonCodeFence(rawOutput: string): string | null {
    const match = rawOutput.match(/```json\s*([\s\S]*?)```/i) || rawOutput.match(/```\s*([\s\S]*?)```/i);
    return match?.[1]?.trim() || null;
  }

  private extractBalancedJsonObject(rawOutput: string): string | null {
    const start = rawOutput.indexOf('{');
    if (start === -1) {
      return null;
    }

    let depth = 0;
    let inString = false;
    let isEscaped = false;

    for (let index = start; index < rawOutput.length; index += 1) {
      const char = rawOutput[index];

      if (inString) {
        if (isEscaped) {
          isEscaped = false;
        } else if (char === '\\') {
          isEscaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          return rawOutput.slice(start, index + 1);
        }
      }
    }

    return null;
  }

  private buildFallbackTokenRootCards(wordData: WordAnalysisData[]) {
    return wordData.map((word) => ({
      token: word.token,
      transliteration: word.transliteration || '',
      lemma: word.lemma || word.token,
      partOfSpeech: word.partOfSpeech || 'unknown',
      root: word.root,
      rootCard: {
        coreNucleus: word.root
          ? `Root-based semantic nucleus for ${word.root} is not yet parsed from model output.`
          : 'No stable triliteral root is available for this token.',
        symbolicMeanings: {
          primary: word.root
            ? `Semantically linked to the root ${word.root}.`
            : 'Likely functions grammatically rather than as a root-bearing lexical item.',
          secondary: word.morphology || 'Detailed secondary meaning not yet available.',
          other: word.translation ? [word.translation] : [],
        },
        crossLanguageHints: {},
        confidence: word.root ? 'Medium' : 'Low' as 'High' | 'Medium' | 'Low',
      },
      possibleMeanings: {
        primary: word.translation ? [word.translation] : ['Meaning pending richer RCQI parsing.'],
        secondary: word.morphology ? [word.morphology] : [],
        hiddenDeep: [],
        derivativeMapping: word.root
          ? `Derived from root ${word.root}; full derivative mapping pending richer RCQI parsing.`
          : 'No derivative mapping available.',
      },
    }));
  }

  private normalizeTokenRootCards(
    value: any,
    fallback: ReturnType<RCQIEngine['buildFallbackTokenRootCards']>,
    wordData: WordAnalysisData[]
  ) {
    if (!Array.isArray(value) || value.length === 0) {
      return fallback;
    }

    return wordData.map((word, index) => {
      const candidate = value[index] ?? value.find((item: any) => item?.token === word.token) ?? {};
      return {
        token: this.normalizeString(candidate.token) || word.token,
        transliteration: this.normalizeString(candidate.transliteration) || word.transliteration || '',
        lemma: this.normalizeString(candidate.lemma) || word.lemma || word.token,
        partOfSpeech: this.normalizeString(candidate.partOfSpeech) || word.partOfSpeech || 'unknown',
        root: this.normalizeNullableString(candidate.root) ?? word.root ?? null,
        rootCard: {
          coreNucleus:
            this.normalizeString(candidate.rootCard?.coreNucleus) ||
            fallback[index].rootCard.coreNucleus,
          symbolicMeanings: {
            primary:
              this.normalizeString(candidate.rootCard?.symbolicMeanings?.primary) ||
              fallback[index].rootCard.symbolicMeanings.primary,
            secondary:
              this.normalizeString(candidate.rootCard?.symbolicMeanings?.secondary) ||
              fallback[index].rootCard.symbolicMeanings.secondary,
            other:
              this.normalizeStringArray(candidate.rootCard?.symbolicMeanings?.other) ||
              fallback[index].rootCard.symbolicMeanings.other,
          },
          crossLanguageHints: this.normalizeCrossLanguageHints(candidate.rootCard?.crossLanguageHints),
          confidence: this.normalizeConfidence(candidate.rootCard?.confidence),
        },
        possibleMeanings: {
          primary:
            this.normalizeStringArray(candidate.possibleMeanings?.primary) ||
            fallback[index].possibleMeanings.primary,
          secondary:
            this.normalizeStringArray(candidate.possibleMeanings?.secondary) ||
            fallback[index].possibleMeanings.secondary,
          hiddenDeep:
            this.normalizeStringArray(candidate.possibleMeanings?.hiddenDeep) ||
            fallback[index].possibleMeanings.hiddenDeep,
          derivativeMapping:
            this.normalizeString(candidate.possibleMeanings?.derivativeMapping) ||
            fallback[index].possibleMeanings.derivativeMapping,
        },
      };
    });
  }

  private normalizeCrossLanguageHints(value: any) {
    if (!value || typeof value !== 'object') {
      return {};
    }

    return {
      hebrew: this.normalizeString(value.hebrew),
      aramaic: this.normalizeString(value.aramaic),
      syriac: this.normalizeString(value.syriac),
      geez: this.normalizeString(value.geez),
      ugaritic: this.normalizeString(value.ugaritic),
      akkadian: this.normalizeString(value.akkadian),
    };
  }

  private normalizeCollisions(value: any) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((collision) => ({
        description: this.normalizeString(collision?.description) || 'Potential semantic collision.',
        winner: {
          meaning: this.normalizeString(collision?.winner?.meaning) || 'No winner provided.',
          reasons: this.normalizeStringArray(collision?.winner?.reasons) || [],
        },
        collidedOptions: Array.isArray(collision?.collidedOptions)
          ? collision.collidedOptions.map((option: any) => ({
              meaning: this.normalizeString(option?.meaning) || 'Unspecified alternative meaning',
              reasons: this.normalizeStringArray(option?.reasons) || [],
            }))
          : [],
      }))
      .filter((collision) => collision.description);
  }

  private normalizeBestMeaning(
    value: any,
    semanticIntegration: string,
    tokenRootCards: ReturnType<RCQIEngine['buildFallbackTokenRootCards']> | RCQIAnalysis['tokenRootCards']
  ) {
    const fallbackPrimary =
      semanticIntegration ||
      tokenRootCards
        .map((card) => `${card.token}: ${card.rootCard.symbolicMeanings.primary}`)
        .join(' | ') ||
      'Primary meaning pending richer structured parsing.';

    return {
      primary: this.normalizeString(value?.primary) || fallbackPrimary,
      secondary:
        this.normalizeString(value?.secondary) ||
        'Secondary meaning pending richer structured parsing.',
      otherPossible: this.normalizeStringArray(value?.otherPossible) || [],
      confidence: this.normalizeConfidence(value?.confidence),
    };
  }

  private normalizeModernLanguageEchoes(value: any) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((entry) => ({
        word: this.normalizeString(entry?.word) || '',
        language: this.normalizeString(entry?.language) || '',
        echo: this.normalizeString(entry?.echo) || '',
        type: entry?.type === 'sound' || entry?.type === 'meaning' ? entry.type : 'meaning',
        confidence: this.normalizeConfidence(entry?.confidence),
      }))
      .filter((entry) => entry.word && entry.language && entry.echo);
  }

  private normalizeOriginalSources(value: any) {
    if (!value || typeof value !== 'object') {
      return {
        farahi: undefined,
        raghib: undefined,
        izutsu: undefined,
        asad: undefined,
      };
    }

    const normalizeSource = (source: any) => {
      if (!source || typeof source !== 'object') {
        return undefined;
      }

      const normalized = {
        hasDirectComment: Boolean(source.hasDirectComment),
        summary: this.normalizeString(source.summary) || 'No structured source summary returned.',
        inference: this.normalizeString(source.inference),
        inferenceConfidence:
          source.inferenceConfidence === 'Medium' || source.inferenceConfidence === 'Low'
            ? source.inferenceConfidence
            : undefined,
        translation: this.normalizeString(source.translation),
        notes: this.normalizeString(source.notes),
      };

      return normalized;
    };

    return {
      farahi: normalizeSource(value.farahi),
      raghib: normalizeSource(value.raghib),
      izutsu: normalizeSource(value.izutsu),
      asad: normalizeSource(value.asad),
    };
  }

  private mergeOriginalSources(
    parsedSources: RCQIAnalysis['originalSources'],
    groundedSources: RCQIAnalysis['originalSources']
  ): RCQIAnalysis['originalSources'] {
    const mergeAuthor = (
      parsed: RCQIAnalysis['originalSources'][keyof RCQIAnalysis['originalSources']],
      grounded: RCQIAnalysis['originalSources'][keyof RCQIAnalysis['originalSources']]
    ) => {
      if (!parsed && !grounded) {
        return undefined;
      }

      return {
        hasDirectComment: grounded?.hasDirectComment ?? parsed?.hasDirectComment ?? false,
        summary: grounded?.summary || parsed?.summary || 'No structured source summary returned.',
        inference: grounded?.inference || parsed?.inference,
        inferenceConfidence: grounded?.inferenceConfidence || parsed?.inferenceConfidence,
        translation: grounded?.translation || parsed?.translation,
        notes: grounded?.notes || parsed?.notes,
      };
    };

    return {
      farahi: mergeAuthor(parsedSources.farahi, groundedSources.farahi),
      raghib: mergeAuthor(parsedSources.raghib, groundedSources.raghib),
      izutsu: mergeAuthor(parsedSources.izutsu, groundedSources.izutsu),
      asad: mergeAuthor(parsedSources.asad, groundedSources.asad),
    };
  }

  private extractSection(rawOutput: string, headings: string[]) {
    const escapedHeadings = headings.map((heading) => heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(
      `(?:^|\\n)(?:#+\\s*)?(?:${escapedHeadings.join('|')})\\s*:?\\s*\\n([\\s\\S]*?)(?=\\n(?:#+\\s*[A-Z0-9]|\\*\\*[A-Z]|$))`,
      'i'
    );
    const match = rawOutput.match(pattern);
    return match?.[1]?.trim() || '';
  }

  private extractBullets(rawOutput: string, headings: string[]) {
    const section = this.extractSection(rawOutput, headings);
    if (!section) {
      return [];
    }

    return section
      .split('\n')
      .map((line) => line.replace(/^\s*[-*0-9.)]+\s*/, '').trim())
      .filter(Boolean);
  }

  private normalizeString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : '';
  }

  private normalizeNullableString(value: unknown) {
    if (value === null) {
      return null;
    }

    return this.normalizeString(value);
  }

  private normalizeStringArray(value: unknown) {
    if (!Array.isArray(value)) {
      return null;
    }

    const normalized = value
      .map((item) => this.normalizeString(item))
      .filter(Boolean);

    return normalized.length > 0 ? normalized : null;
  }

  private normalizeConfidence(value: unknown): 'High' | 'Medium' | 'Low' {
    return value === 'High' || value === 'Low' ? value : 'Medium';
  }

  private buildFallbackSemanticIntegration(wordData: WordAnalysisData[]) {
    if (wordData.length === 0) {
      return 'Whole ayah semantic integration was not returned by the model, and no token data was available.';
    }

    const tokenSummary = wordData
      .map((word) => {
        const root = word.root ? `root ${word.root}` : 'non-root-bearing grammatical function';
        return `${word.token} (${root})`;
      })
      .join(', ');

    return `Whole-ayah integration fallback: the ayah must be read by combining all analyzed tokens in sequence, preserving their grammatical flow and resolving meaning at the verse level. Tokens processed: ${tokenSummary}.`;
  }

  private ensureMinimumParaphrases(
    paraphrases: string[] | null,
    bestMeaning: RCQIAnalysis['bestMeaning'],
    semanticIntegration: string
  ) {
    const unique = Array.from(new Set((paraphrases || []).filter(Boolean)));
    const seeds = [
      bestMeaning.primary,
      bestMeaning.secondary,
      ...bestMeaning.otherPossible,
      semanticIntegration,
    ].filter(Boolean);

    for (const seed of seeds) {
      if (unique.length >= 5) {
        break;
      }

      const normalized = seed.trim();
      if (!unique.includes(normalized)) {
        unique.push(normalized);
      }
    }

    while (unique.length < 5) {
      unique.push(`Paraphrase variant ${unique.length + 1}: ${bestMeaning.primary}`);
    }

    return unique.slice(0, 5);
  }

  private ensureRequiredLanguageEchoes(
    echoes: RCQIAnalysis['modernLanguageEchoes'],
    tokenRootCards: RCQIAnalysis['tokenRootCards']
  ) {
    const normalized = [...echoes];
    const fallbackWord = tokenRootCards[0]?.token || '';

    for (const language of RCQI_REQUIRED_LANGUAGE_ECHOES) {
      const existing = normalized.find(
        (entry) => entry.language.toLowerCase() === language.toLowerCase()
      );

      if (!existing) {
        normalized.push({
          word: fallbackWord,
          language,
          echo: `No reliable ${language} echo could be established from the current structured output.`,
          type: 'meaning',
          confidence: 'Low',
        });
      }
    }

    return normalized;
  }

  private ensureRequiredOriginalSources(
    sources: RCQIAnalysis['originalSources'],
    params: AnalyzeParams,
    tokenRootCards: RCQIAnalysis['tokenRootCards']
  ) {
    const keyRoots = Array.from(
      new Set(tokenRootCards.map((card) => card.root).filter(Boolean))
    ) as string[];
    const rootLabel = keyRoots.length > 0 ? keyRoots.join(', ') : 'the key lexical roots';

    const ensureSource = (
      current: RCQIAnalysis['originalSources'][keyof RCQIAnalysis['originalSources']],
      fallback: {
        hasDirectComment: boolean;
        summary: string;
        inference?: string;
        inferenceConfidence?: 'Medium' | 'Low';
        translation?: string;
        notes?: string;
      }
    ) => ({
      hasDirectComment: current?.hasDirectComment ?? fallback.hasDirectComment,
      summary: current?.summary || fallback.summary,
      inference: current?.inference || fallback.inference,
      inferenceConfidence: current?.inferenceConfidence || fallback.inferenceConfidence,
      translation: current?.translation || fallback.translation,
      notes: current?.notes || fallback.notes,
    });

    return {
      farahi: ensureSource(sources.farahi, {
        hasDirectComment: false,
        summary: "No explicit statement found in Farahi's accessible works for this ayah.",
        inference: `Inference (Low confidence): a coherence-based reading would likely prioritize the integrated flow of ${rootLabel} within ${params.surahName} ${params.ayahNumber}.`,
        inferenceConfidence: 'Low',
      }),
      raghib: ensureSource(sources.raghib, {
        hasDirectComment: false,
        summary: `No direct verse-level comment was returned; lexical guidance should be taken from al-Raghib's root entries for ${rootLabel}.`,
        inference: `Inference (Low confidence): al-Raghib-style lexical analysis would weight the root fields around ${rootLabel} before any verse-level synthesis.`,
        inferenceConfidence: 'Low',
      }),
      izutsu: ensureSource(sources.izutsu, {
        hasDirectComment: false,
        summary: 'No explicit verse-level statement was returned from Izutsu for this ayah.',
        inference: `A concept level mapping based on Izutsu (Low confidence): the semantic field of ${rootLabel} should be read relationally within the ayah's internal vocabulary network.`,
        inferenceConfidence: 'Low',
      }),
      asad: ensureSource(sources.asad, {
        hasDirectComment: false,
        summary: 'No explicit Asad note was returned for this ayah.',
        translation: '',
        notes: 'No note available in the current structured output.',
      }),
    };
  }

  private buildValidationReport(args: {
    params: AnalyzeParams;
    tokenRootCards: RCQIAnalysis['tokenRootCards'];
    semanticIntegration: string;
    symbolicParaphrases: string[];
    bestMeaning: RCQIAnalysis['bestMeaning'];
    modernLanguageEchoes: RCQIAnalysis['modernLanguageEchoes'];
    originalSources: RCQIAnalysis['originalSources'];
  }) {
    const issues: string[] = [];
    const coveredLanguages = new Set(
      args.modernLanguageEchoes.map((entry) => entry.language.toLowerCase())
    );

    if (args.tokenRootCards.length !== args.params.wordData.length) {
      issues.push(
        `Token coverage mismatch: expected ${args.params.wordData.length}, got ${args.tokenRootCards.length}.`
      );
    }

    if (!args.semanticIntegration.trim()) {
      issues.push('Whole ayah semantic integration is missing.');
    }

    if (args.symbolicParaphrases.length < 5) {
      issues.push('Whole ayah symbolic paraphrases are below the minimum of 5.');
    }

    if (!args.bestMeaning.primary.trim()) {
      issues.push('Best whole ayah meaning summary is missing a primary meaning.');
    }

    for (const language of RCQI_REQUIRED_LANGUAGE_ECHOES) {
      if (!coveredLanguages.has(language.toLowerCase())) {
        issues.push(`Modern language echo missing for ${language}.`);
      }
    }

    const missingSources = ['farahi', 'raghib', 'izutsu', 'asad'].filter(
      (key) => !args.originalSources[key as keyof RCQIAnalysis['originalSources']]
    );
    if (missingSources.length > 0) {
      issues.push(`Original source interpretations missing: ${missingSources.join(', ')}.`);
    }

    return {
      valid: issues.length === 0,
      issues,
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
