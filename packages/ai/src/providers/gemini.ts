import type { Provider, CompletionRequest, CompletionResponse } from './index';

export const GeminiProvider: Provider = {
  id: 'gemini',
  name: 'Google Gemini',
  isLocal: false,
  models: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', contextWindow: 1000000, maxOutput: 8192, capabilities: ['chat', 'vision'] },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', contextWindow: 1000000, maxOutput: 8192, capabilities: ['chat', 'vision'] },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', contextWindow: 1000000, maxOutput: 8192, capabilities: ['chat', 'vision'] },
  ],

  _buildBody(request: CompletionRequest): Record<string, unknown> {
    const systemMessages = request.messages.filter(m => m.role === 'system');
    const chatMessages = request.messages.filter(m => m.role !== 'system');

    const contents = chatMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 4096,
      },
    };

    if (systemMessages.length > 0) {
      body.systemInstruction = {
        parts: [{ text: systemMessages.map(m => m.content).join('\n') }],
      };
    }

    return body;
  },

  async chat(request: CompletionRequest, apiKey?: string): Promise<CompletionResponse> {
    if (!apiKey) throw new Error('API Key is required for Gemini');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this._buildBody!(request)),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Gemini API Error: ${response.statusText} – ${(error as any)?.error?.message || ''}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return {
      content: text,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
    };
  },

  async *chatStream(request: CompletionRequest, apiKey?: string): AsyncGenerator<string, void, unknown> {
    if (!apiKey) throw new Error('API Key is required for Gemini');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:streamGenerateContent?alt=sse&key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this._buildBody!(request)),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Gemini API Error: ${response.statusText} – ${(error as any)?.error?.message || ''}`);
    }

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          try {
            const data = JSON.parse(trimmed.slice(5).trim());
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) yield text;
          } catch {
            // Ignore partial chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  async testConnection(apiKey?: string): Promise<boolean> {
    try {
      if (!apiKey) return false;
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const res = await fetch(url);
      return res.ok;
    } catch {
      return false;
    }
  },
} as Provider & { _buildBody?: (r: CompletionRequest) => Record<string, unknown> };
