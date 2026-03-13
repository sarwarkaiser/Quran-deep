/**
 * RCQI Engine - Root-Centric Qur'an Interpreter
 * 
 * A comprehensive Qur'anic analysis engine that uses root-driven semantics
 * and morphology to extract meaning from ayahs.
 */

// Core Engine
export { RCQIEngine, rcqiEngine } from './engine';
export type { AnalyzeParams, AnalyzeOptions, AnalysisResult } from './engine';
export { buildOriginalSourceContext } from './sources/retriever';
export type { SourceGroundingSummary, OriginalSourceContext } from './sources/retriever';

// Prompts
export {
  RCQI_MASTER_PROMPT,
  RCQI_PROMPT_VERSION,
  RCQI_ANALYSIS_VERSION,
  RCQI_REQUIRED_LANGUAGE_ECHOES,
  generateRCQIPrompt,
  type WordAnalysisData,
  type RCQIAnalysis,
  type TokenRootCard,
  type Collision,
  type LanguageEcho,
  type AuthorInterpretation,
} from './prompts/rcqi-master-prompt';
export { starterSourceCorpus } from './sources/starter-corpus';
export type { SourceAuthor, SourceCorpusEntry } from './sources/starter-corpus';

// LLM Clients
export { LLMClient, llmClient, ClaudeClient, claudeClient } from './llm/client';
export type {
  LLMClientConfig,
  LLMProvider,
  LLMMessage,
  LLMCompleteOptions,
  LLMCompleteResponse,
  ClaudeMessage,
  ClaudeCompleteOptions,
  ClaudeCompleteResponse,
} from './llm/client';
