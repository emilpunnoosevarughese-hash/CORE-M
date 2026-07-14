import type { Provider, CompletionRequest, CompletionResponse } from './index';

export const AnthropicProvider: Provider = {
  id: 'anthropic',
  name: 'Anthropic Claude',
  isLocal: false,
  models: [
    { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', contextWindow: 200000, maxOutput: 8192, capabilities: ['chat', 'vision'] },
    { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', contextWindow: 200000, maxOutput: 8192, capabilities: ['chat', 'vision'] },
    { id: 'claude-haiku-3-5', name: 'Claude Haiku 3.5', contextWindow: 200000, maxOutput: 8192, capabilities: ['chat'] },
  ],

  async chat(request: CompletionRequest, apiKey?: string, baseUrl = 'https://api.anthropic.com/v1'): Promise<CompletionResponse> {
    if (!apiKey) throw new Error('API Key is required for Anthropic');

    // Separate system messages from conversation
    const systemMessages = request.messages.filter(m => m.role === 'system');
    const chatMessages = request.messages.filter(m => m.role !== 'system');

    const body: Record<string, unknown> = {
      model: request.model,
      max_tokens: request.maxTokens ?? 4096,
      messages: chatMessages,
    };
    if (systemMessages.length > 0) {
      body.system = systemMessages.map(m => m.content).join('\n');
    }

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API Error: ${response.statusText} – ${(error as any)?.error?.message || ''}`);
    }

    const data = await response.json();
    return {
      content: data.content?.[0]?.text || '',
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    };
  },

  async *chatStream(request: CompletionRequest, apiKey?: string, baseUrl = 'https://api.anthropic.com/v1'): AsyncGenerator<string, void, unknown> {
    if (!apiKey) throw new Error('API Key is required for Anthropic');

    const systemMessages = request.messages.filter(m => m.role === 'system');
    const chatMessages = request.messages.filter(m => m.role !== 'system');

    const body: Record<string, unknown> = {
      model: request.model,
      max_tokens: request.maxTokens ?? 4096,
      messages: chatMessages,
      stream: true,
    };
    if (systemMessages.length > 0) {
      body.system = systemMessages.map(m => m.content).join('\n');
    }

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API Error: ${response.statusText} – ${(error as any)?.error?.message || ''}`);
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
            if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
              yield data.delta.text;
            }
          } catch {
            // Ignore partial chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  async testConnection(apiKey?: string, baseUrl = 'https://api.anthropic.com/v1'): Promise<boolean> {
    try {
      if (!apiKey) return false;
      // Anthropic doesn't have a free "ping" endpoint; we do a minimal message to verify key
      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-3-5',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      return res.ok || res.status === 400; // 400 is acceptable (bad request shape but key is valid)
    } catch {
      return false;
    }
  },
};
