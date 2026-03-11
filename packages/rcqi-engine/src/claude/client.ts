/**
 * Claude API client for RCQI analysis
 */

import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeCompleteOptions {
  messages: ClaudeMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ClaudeCompleteResponse {
  content: string;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeClient {
  private client: Anthropic;
  private defaultModel: string;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    this.client = new Anthropic({ apiKey: key });
    this.defaultModel = 'claude-3-5-sonnet-20241022';
  }

  /**
   * Send a completion request to Claude
   */
  async complete(options: ClaudeCompleteOptions): Promise<ClaudeCompleteResponse> {
    const message = await this.client.messages.create({
      model: options.model || this.defaultModel,
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature ?? 0.7,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return {
      content: content.text,
      model: message.model,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    };
  }

  /**
   * Analyze ayah for root words and linguistic insights
   * @deprecated Use RCQIEngine.analyze() instead
   */
  async analyzeRoots(ayahText: string, context?: string): Promise<{
    roots: Array<{
      word: string;
      root: string;
      derivatives: string[];
      semanticField: string;
      contextualMeaning: string;
    }>;
    linguisticInsights: string;
    tokensUsed: number;
  }> {
    const prompt = `Analyze the following Quranic ayah for its root words and linguistic features:

Ayah: ${ayahText}
${context ? `Context: ${context}` : ''}

Provide a detailed analysis including:
1. Identify each significant word and its trilateral/quadrilateral root
2. List derivatives and related words from the same root
3. Explain the semantic field of each root
4. Provide contextual meaning within this ayah
5. Overall linguistic insights

Format your response as JSON with this structure:
{
  "roots": [
    {
      "word": "الحمد",
      "root": "ح م د",
      "derivatives": ["حامد", "محمود", "أحمد"],
      "semanticField": "praise, gratitude, commendation",
      "contextualMeaning": "The praise and gratitude directed to Allah"
    }
  ],
  "linguisticInsights": "Overall analysis of the ayah's linguistic features..."
}`;

    const message = await this.client.messages.create({
      model: this.defaultModel,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const result = JSON.parse(content.text);

    return {
      ...result,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
    };
  }

  /**
   * Find thematic connections between ayahs
   */
  async findThematicConnections(
    sourceAyah: string,
    candidateAyahs: Array<{ id: string; text: string }>
  ): Promise<{
    connections: Array<{
      ayahId: string;
      themes: string[];
      strength: number;
      explanation: string;
    }>;
    tokensUsed: number;
  }> {
    const prompt = `Analyze thematic connections between the source ayah and candidate ayahs:

Source Ayah: ${sourceAyah}

Candidate Ayahs:
${candidateAyahs.map((a, i) => `${i + 1}. [ID: ${a.id}] ${a.text}`).join('\n')}

For each candidate ayah, identify:
1. Shared themes and concepts
2. Connection strength (0.0 to 1.0)
3. Brief explanation of the connection

Format as JSON:
{
  "connections": [
    {
      "ayahId": "123",
      "themes": ["divine mercy", "forgiveness"],
      "strength": 0.85,
      "explanation": "Both ayahs discuss Allah's mercy..."
    }
  ]
}`;

    const message = await this.client.messages.create({
      model: this.defaultModel,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const result = JSON.parse(content.text);

    return {
      ...result,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
    };
  }
}

// Legacy singleton for backward compatibility
export const claudeClient = new ClaudeClient();
