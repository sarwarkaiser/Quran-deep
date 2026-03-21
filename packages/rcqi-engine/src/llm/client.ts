/**
 * Multi-provider LLM client for RCQI analysis.
 *
 * Supports Anthropic, OpenAI-compatible APIs, OpenRouter, Gemini, and Ollama.
 */

import Anthropic from '@anthropic-ai/sdk';

export type LLMProvider =
  | 'anthropic'
  | 'openai'
  | 'openrouter'
  | 'gemini'
  | 'ollama'
  | 'openai-compatible';

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMCompleteOptions {
  messages: LLMMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMCompleteResponse {
  content: string;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface ProviderSettings {
  provider: LLMProvider;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  appUrl?: string;
  appName?: string;
}

export interface LLMClientConfig {
  provider?: LLMProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  appUrl?: string;
  appName?: string;
}

export class LLMClient {
  private anthropicClient?: Anthropic;
  private readonly settings: ProviderSettings;

  constructor(config?: LLMClientConfig) {
    this.settings = this.resolveSettings(config);
  }

  async complete(options: LLMCompleteOptions): Promise<LLMCompleteResponse> {
    switch (this.settings.provider) {
      case 'anthropic':
        return this.completeWithAnthropic(options);
      case 'openai':
      case 'openrouter':
      case 'openai-compatible':
        return this.completeWithOpenAICompatible(options);
      case 'gemini':
        return this.completeWithGemini(options);
      case 'ollama':
        return this.completeWithOllama(options);
      default:
        throw new Error(`Unsupported LLM provider: ${this.settings.provider satisfies never}`);
    }
  }

  /**
   * Analyze ayah for root words and linguistic insights
   * @deprecated Use RCQIEngine.analyze() instead.
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

    const response = await this.complete({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2000,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content);

    return {
      ...result,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  /**
   * Find thematic connections between ayahs.
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

    const response = await this.complete({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 3000,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content);

    return {
      ...result,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  private resolveSettings(config?: LLMClientConfig): ProviderSettings {
    const provider = (config?.provider ||
      process.env.LLM_PROVIDER ||
      (process.env.OPENAI_API_KEY && 'openai') ||
      (process.env.OPENROUTER_API_KEY && 'openrouter') ||
      (process.env.GEMINI_API_KEY && 'gemini') ||
      (process.env.OLLAMA_BASE_URL && 'ollama') ||
      'anthropic') as LLMProvider;

    switch (provider) {
      case 'anthropic':
        return {
          provider,
          apiKey: config?.apiKey || process.env.ANTHROPIC_API_KEY || process.env.LLM_API_KEY,
          baseUrl: config?.baseUrl || process.env.ANTHROPIC_BASE_URL,
          model:
            config?.model ||
            process.env.LLM_MODEL ||
            process.env.ANTHROPIC_MODEL ||
            'claude-3-5-sonnet-20241022',
        };
      case 'openai':
        return {
          provider,
          apiKey: config?.apiKey || process.env.OPENAI_API_KEY || process.env.LLM_API_KEY,
          baseUrl:
            config?.baseUrl ||
            process.env.OPENAI_BASE_URL ||
            process.env.LLM_BASE_URL ||
            'https://api.openai.com/v1',
          model:
            config?.model ||
            process.env.LLM_MODEL ||
            process.env.OPENAI_MODEL ||
            'gpt-4o-mini',
        };
      case 'openrouter':
        return {
          provider,
          apiKey: config?.apiKey || process.env.OPENROUTER_API_KEY || process.env.LLM_API_KEY,
          baseUrl:
            config?.baseUrl ||
            process.env.OPENROUTER_BASE_URL ||
            process.env.LLM_BASE_URL ||
            'https://openrouter.ai/api/v1',
          model:
            config?.model ||
            process.env.LLM_MODEL ||
            process.env.OPENROUTER_MODEL ||
            'openai/gpt-4o-mini',
          appUrl: process.env.OPENROUTER_APP_URL,
          appName: process.env.OPENROUTER_APP_NAME || 'quran-deep',
        };
      case 'gemini':
        return {
          provider,
          apiKey: config?.apiKey || process.env.GEMINI_API_KEY || process.env.LLM_API_KEY,
          baseUrl:
            config?.baseUrl ||
            process.env.GEMINI_BASE_URL ||
            process.env.LLM_BASE_URL ||
            'https://generativelanguage.googleapis.com/v1beta',
          model:
            config?.model ||
            process.env.LLM_MODEL ||
            process.env.GEMINI_MODEL ||
            'gemini-1.5-flash',
        };
      case 'ollama':
        return {
          provider,
          baseUrl:
            config?.baseUrl ||
            process.env.OLLAMA_BASE_URL ||
            process.env.LLM_BASE_URL ||
            'http://localhost:11434',
          model:
            config?.model ||
            process.env.LLM_MODEL ||
            process.env.OLLAMA_MODEL ||
            'llama3.1:8b',
        };
      case 'openai-compatible':
        return {
          provider,
          apiKey: config?.apiKey || process.env.LLM_API_KEY,
          baseUrl: config?.baseUrl || process.env.LLM_BASE_URL,
          model: config?.model || process.env.LLM_MODEL || 'gpt-4o-mini',
        };
      default:
        throw new Error(`Unsupported LLM provider: ${provider satisfies never}`);
    }
  }

  private async completeWithAnthropic(options: LLMCompleteOptions): Promise<LLMCompleteResponse> {
    if (!this.settings.apiKey) {
      throw new Error('ANTHROPIC_API_KEY or LLM_API_KEY environment variable is not set');
    }

    if (!this.anthropicClient) {
      this.anthropicClient = new Anthropic({
        apiKey: this.settings.apiKey,
        baseURL: this.settings.baseUrl,
      });
    }

    const message = await this.anthropicClient.messages.create({
      model: options.model || this.settings.model,
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature ?? 0.7,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const content = message.content.find((c) => c.type === 'text');
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
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

  private async completeWithOpenAICompatible(
    options: LLMCompleteOptions
  ): Promise<LLMCompleteResponse> {
    if (!this.settings.baseUrl) {
      throw new Error('LLM base URL is not configured for the selected provider');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.settings.apiKey) {
      headers.Authorization = `Bearer ${this.settings.apiKey}`;
    }

    if (this.settings.provider === 'openrouter') {
      if (this.settings.appUrl) {
        headers['HTTP-Referer'] = this.settings.appUrl;
      }
      if (this.settings.appName) {
        headers['X-Title'] = this.settings.appName;
      }
    }

    const response = await fetch(`${this.settings.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: options.model || this.settings.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 4000,
      }),
    });

    const payload = await this.parseJsonResponse(response);
    const content = this.extractOpenAIContent(payload);

    return {
      content,
      model: payload.model || options.model || this.settings.model,
      usage: {
        input_tokens: payload.usage?.prompt_tokens || 0,
        output_tokens: payload.usage?.completion_tokens || 0,
      },
    };
  }

  private async completeWithGemini(options: LLMCompleteOptions): Promise<LLMCompleteResponse> {
    if (!this.settings.apiKey) {
      throw new Error('GEMINI_API_KEY or LLM_API_KEY environment variable is not set');
    }
    if (!this.settings.baseUrl) {
      throw new Error('GEMINI_BASE_URL or LLM_BASE_URL environment variable is not set');
    }

    const response = await fetch(
      `${this.settings.baseUrl.replace(/\/$/, '')}/models/${encodeURIComponent(
        options.model || this.settings.model
      )}:generateContent?key=${encodeURIComponent(this.settings.apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: options.messages.map((message) => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }],
          })),
          generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxTokens || 4000,
          },
        }),
      }
    );

    const payload = await this.parseJsonResponse(response);
    const candidate = payload.candidates?.[0];
    const content = Array.isArray(candidate?.content?.parts)
      ? candidate.content.parts
          .map((part: { text?: string }) => part.text || '')
          .join('\n')
          .trim()
      : '';

    if (!content) {
      throw new Error('Gemini response did not contain text content');
    }

    return {
      content,
      model: options.model || this.settings.model,
      usage: {
        input_tokens: payload.usageMetadata?.promptTokenCount || 0,
        output_tokens: payload.usageMetadata?.candidatesTokenCount || 0,
      },
    };
  }

  private async completeWithOllama(options: LLMCompleteOptions): Promise<LLMCompleteResponse> {
    if (!this.settings.baseUrl) {
      throw new Error('OLLAMA_BASE_URL or LLM_BASE_URL environment variable is not set');
    }

    const response = await fetch(`${this.settings.baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || this.settings.model,
        messages: options.messages,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens || 4000,
        },
      }),
    });

    const payload = await this.parseJsonResponse(response);
    const content = payload.message?.content?.trim();

    if (!content) {
      throw new Error('Ollama response did not contain message content');
    }

    return {
      content,
      model: payload.model || options.model || this.settings.model,
      usage: {
        input_tokens: payload.prompt_eval_count || 0,
        output_tokens: payload.eval_count || 0,
      },
    };
  }

  private async parseJsonResponse(response: Response): Promise<any> {
    const payload: any = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        payload?.error?.message ||
        payload?.error ||
        payload?.message ||
        `HTTP ${response.status}`;
      throw new Error(message);
    }

    return payload;
  }

  private extractOpenAIContent(payload: any): string {
    const messageContent = payload?.choices?.[0]?.message?.content;

    if (typeof messageContent === 'string' && messageContent.trim()) {
      return messageContent.trim();
    }

    if (Array.isArray(messageContent)) {
      const text = messageContent
        .map((part: any) => {
          if (typeof part === 'string') {
            return part;
          }
          if (part?.type === 'text') {
            return part.text || '';
          }
          return '';
        })
        .join('\n')
        .trim();

      if (text) {
        return text;
      }
    }

    throw new Error('OpenAI-compatible response did not contain message content');
  }
}

export class ClaudeClient extends LLMClient {
  constructor(apiKey?: string) {
    super({ provider: 'anthropic', apiKey });
  }
}

export const llmClient = new LLMClient();
export const claudeClient = new ClaudeClient();

export type ClaudeMessage = LLMMessage;
export type ClaudeCompleteOptions = LLMCompleteOptions;
export type ClaudeCompleteResponse = LLMCompleteResponse;
