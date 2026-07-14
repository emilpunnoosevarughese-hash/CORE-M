import type { Provider, CompletionRequest, CompletionResponse } from './index';

// xAI Grok – OpenAI-compatible endpoint
export const GrokProvider: Provider = {
  id: 'grok',
  name: 'xAI Grok',
  isLocal: false,
  models: [
    { id: 'grok-3', name: 'Grok 3', contextWindow: 131072, maxOutput: 8192, capabilities: ['chat'] },
    { id: 'grok-3-mini', name: 'Grok 3 Mini', contextWindow: 131072, maxOutput: 8192, capabilities: ['chat'] },
  ],

  async chat(request: CompletionRequest, apiKey?: string, baseUrl = 'https://api.x.ai/v1'): Promise<CompletionResponse> {
    if (!apiKey) throw new Error('API Key is required for xAI Grok');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: request.model, messages: request.messages, temperature: request.temperature ?? 0.7, max_tokens: request.maxTokens, stream: false }),
    });
    if (!response.ok) throw new Error(`Grok API Error: ${response.statusText}`);
    const data = await response.json();
    return { content: data.choices[0]?.message?.content || '', usage: { promptTokens: data.usage?.prompt_tokens || 0, completionTokens: data.usage?.completion_tokens || 0, totalTokens: data.usage?.total_tokens || 0 } };
  },

  async *chatStream(request: CompletionRequest, apiKey?: string, baseUrl = 'https://api.x.ai/v1'): AsyncGenerator<string, void, unknown> {
    if (!apiKey) throw new Error('API Key is required for xAI Grok');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: request.model, messages: request.messages, temperature: request.temperature ?? 0.7, stream: true }),
    });
    if (!response.ok) throw new Error(`Grok API Error: ${response.statusText}`);
    if (!response.body) throw new Error('No response body');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data: ') || t === 'data: [DONE]') continue;
          try { const d = JSON.parse(t.slice(6)); const chunk = d.choices[0]?.delta?.content; if (chunk) yield chunk; } catch { /* skip */ }
        }
      }
    } finally { reader.releaseLock(); }
  },

  async testConnection(apiKey?: string, baseUrl = 'https://api.x.ai/v1'): Promise<boolean> {
    try { if (!apiKey) return false; const res = await fetch(`${baseUrl}/models`, { headers: { 'Authorization': `Bearer ${apiKey}` } }); return res.ok; } catch { return false; }
  },
};

// DeepSeek – OpenAI-compatible endpoint
export const DeepSeekProvider: Provider = {
  id: 'deepseek',
  name: 'DeepSeek',
  isLocal: false,
  models: [
    { id: 'deepseek-chat', name: 'DeepSeek V3', contextWindow: 64000, maxOutput: 8192, capabilities: ['chat'] },
    { id: 'deepseek-reasoner', name: 'DeepSeek R1', contextWindow: 64000, maxOutput: 8192, capabilities: ['chat'] },
  ],

  async chat(request: CompletionRequest, apiKey?: string, baseUrl = 'https://api.deepseek.com/v1'): Promise<CompletionResponse> {
    if (!apiKey) throw new Error('API Key is required for DeepSeek');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: request.model, messages: request.messages, temperature: request.temperature ?? 0.7, max_tokens: request.maxTokens, stream: false }),
    });
    if (!response.ok) throw new Error(`DeepSeek API Error: ${response.statusText}`);
    const data = await response.json();
    return { content: data.choices[0]?.message?.content || '', usage: { promptTokens: data.usage?.prompt_tokens || 0, completionTokens: data.usage?.completion_tokens || 0, totalTokens: data.usage?.total_tokens || 0 } };
  },

  async *chatStream(request: CompletionRequest, apiKey?: string, baseUrl = 'https://api.deepseek.com/v1'): AsyncGenerator<string, void, unknown> {
    if (!apiKey) throw new Error('API Key is required for DeepSeek');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: request.model, messages: request.messages, temperature: request.temperature ?? 0.7, stream: true }),
    });
    if (!response.ok) throw new Error(`DeepSeek API Error: ${response.statusText}`);
    if (!response.body) throw new Error('No response body');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data: ') || t === 'data: [DONE]') continue;
          try { const d = JSON.parse(t.slice(6)); const chunk = d.choices[0]?.delta?.content; if (chunk) yield chunk; } catch { /* skip */ }
        }
      }
    } finally { reader.releaseLock(); }
  },

  async testConnection(apiKey?: string, baseUrl = 'https://api.deepseek.com/v1'): Promise<boolean> {
    try { if (!apiKey) return false; const res = await fetch(`${baseUrl}/models`, { headers: { 'Authorization': `Bearer ${apiKey}` } }); return res.ok; } catch { return false; }
  },
};

// OpenRouter – aggregates hundreds of models under one OpenAI-compatible API
export const OpenRouterProvider: Provider = {
  id: 'openrouter',
  name: 'OpenRouter',
  isLocal: false,
  models: [
    { id: 'openai/gpt-4o', name: 'GPT-4o (via OpenRouter)', contextWindow: 128000, maxOutput: 4096, capabilities: ['chat', 'vision'] },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (via OpenRouter)', contextWindow: 200000, maxOutput: 8192, capabilities: ['chat', 'vision'] },
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (via OpenRouter)', contextWindow: 1000000, maxOutput: 8192, capabilities: ['chat', 'vision'] },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (via OpenRouter)', contextWindow: 131072, maxOutput: 8192, capabilities: ['chat'] },
  ],

  async chat(request: CompletionRequest, apiKey?: string, baseUrl = 'https://openrouter.ai/api/v1'): Promise<CompletionResponse> {
    if (!apiKey) throw new Error('API Key is required for OpenRouter');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'HTTP-Referer': 'https://corem.app', 'X-Title': 'coreM Editor' },
      body: JSON.stringify({ model: request.model, messages: request.messages, temperature: request.temperature ?? 0.7, max_tokens: request.maxTokens, stream: false }),
    });
    if (!response.ok) throw new Error(`OpenRouter API Error: ${response.statusText}`);
    const data = await response.json();
    return { content: data.choices[0]?.message?.content || '', usage: { promptTokens: data.usage?.prompt_tokens || 0, completionTokens: data.usage?.completion_tokens || 0, totalTokens: data.usage?.total_tokens || 0 } };
  },

  async *chatStream(request: CompletionRequest, apiKey?: string, baseUrl = 'https://openrouter.ai/api/v1'): AsyncGenerator<string, void, unknown> {
    if (!apiKey) throw new Error('API Key is required for OpenRouter');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'HTTP-Referer': 'https://corem.app', 'X-Title': 'coreM Editor' },
      body: JSON.stringify({ model: request.model, messages: request.messages, temperature: request.temperature ?? 0.7, stream: true }),
    });
    if (!response.ok) throw new Error(`OpenRouter API Error: ${response.statusText}`);
    if (!response.body) throw new Error('No response body');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data: ') || t === 'data: [DONE]') continue;
          try { const d = JSON.parse(t.slice(6)); const chunk = d.choices[0]?.delta?.content; if (chunk) yield chunk; } catch { /* skip */ }
        }
      }
    } finally { reader.releaseLock(); }
  },

  async testConnection(apiKey?: string, baseUrl = 'https://openrouter.ai/api/v1'): Promise<boolean> {
    try { if (!apiKey) return false; const res = await fetch(`${baseUrl}/models`, { headers: { 'Authorization': `Bearer ${apiKey}` } }); return res.ok; } catch { return false; }
  },
};

// LM Studio – runs locally, OpenAI-compatible
export const LMStudioProvider: Provider = {
  id: 'lmstudio',
  name: 'LM Studio (Local)',
  isLocal: true,
  models: [
    { id: 'local-model', name: 'Active LM Studio Model', contextWindow: 4096, maxOutput: 4096, capabilities: ['chat'] },
  ],

  async chat(request: CompletionRequest, _apiKey?: string, baseUrl = 'http://localhost:1234/v1'): Promise<CompletionResponse> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: request.model, messages: request.messages, temperature: request.temperature ?? 0.7, max_tokens: request.maxTokens, stream: false }),
    });
    if (!response.ok) throw new Error(`LM Studio Error: ${response.statusText}`);
    const data = await response.json();
    return { content: data.choices[0]?.message?.content || '' };
  },

  async *chatStream(request: CompletionRequest, _apiKey?: string, baseUrl = 'http://localhost:1234/v1'): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: request.model, messages: request.messages, temperature: request.temperature ?? 0.7, stream: true }),
    });
    if (!response.ok) throw new Error(`LM Studio Error: ${response.statusText}`);
    if (!response.body) throw new Error('No response body');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data: ') || t === 'data: [DONE]') continue;
          try { const d = JSON.parse(t.slice(6)); const chunk = d.choices[0]?.delta?.content; if (chunk) yield chunk; } catch { /* skip */ }
        }
      }
    } finally { reader.releaseLock(); }
  },

  async testConnection(_apiKey?: string, baseUrl = 'http://localhost:1234/v1'): Promise<boolean> {
    try { const res = await fetch(`${baseUrl}/models`); return res.ok; } catch { return false; }
  },
};
