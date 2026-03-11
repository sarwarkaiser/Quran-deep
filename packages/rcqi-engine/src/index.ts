/**
 * RCQI Engine - Root-Centric Qur'an Interpreter
 * 
 * A comprehensive Qur'anic analysis engine that uses root-driven semantics
 * and morphology to extract meaning from ayahs.
 */

// Core Engine
export { RCQIEngine, rcqiEngine } from './engine';
export type { AnalyzeParams, AnalyzeOptions, AnalysisResult } from './engine';

// Prompts
export {
  RCQI_MASTER_PROMPT,
  generateRCQIPrompt,
  type WordAnalysisData,
  type RCQIAnalysis,
  type TokenRootCard,
  type Collision,
  type LanguageEcho,
  type AuthorInterpretation,
} from './prompts/rcqi-master-prompt';

// Claude Client
export { ClaudeClient, claudeClient } from './claude/client';
export type { ClaudeMessage, ClaudeCompleteOptions, ClaudeCompleteResponse } from './claude/client';

// Legacy analyzers (for backward compatibility)
export { RootAnalyzer } from './analyzers/root-analyzer';
