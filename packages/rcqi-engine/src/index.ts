export { ClaudeClient, claudeClient } from './claude/client';
export { RootAnalyzer, rootAnalyzer } from './analyzers/root-analyzer';

// Main RCQI engine interface
export class RCQIEngine {
    async analyze(request: import('@rcqi/shared').AnalysisRequest) {
        const { rootAnalyzer } = await import('./analyzers/root-analyzer');

        switch (request.analysisType) {
            case 'root':
                return rootAnalyzer.analyze(request);
            case 'semantic':
                // Implement semantic analyzer
                throw new Error('Semantic analysis not yet implemented');
            case 'thematic':
                // Implement thematic analyzer
                throw new Error('Thematic analysis not yet implemented');
            case 'cross_reference':
                // Implement cross-reference analyzer
                throw new Error('Cross-reference analysis not yet implemented');
            default:
                throw new Error(`Unknown analysis type: ${request.analysisType}`);
        }
    }
}

export const rcqiEngine = new RCQIEngine();
