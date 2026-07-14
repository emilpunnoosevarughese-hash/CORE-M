import type { Provider, CompletionRequest, CompletionResponse } from './index';

export const OpenAIProvider: Provider = {
  id: 'openai',
  name: 'OpenAI (or Compatible)',
  isLocal: false,
  models: [
    { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, maxOutput: 4096, capabilities: ['chat', 'vision'] },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128000, maxOutput: 4096, capabilities: ['chat', 'vision'] },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16385, maxOutput: 4096, capabilities: ['chat'] }
  ],
  
  async chat(request: CompletionRequest, apiKey?: string, baseUrl = 'https://api.openai.com/v1'): Promise<CompletionResponse> {
    if (!apiKey) throw new Error('API Key is required for OpenAI');
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stream: false
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API Error: ${response.statusText} - ${error?.error?.message || ''}`);
    }
    
    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }
    };
  },
  
  async *chatStream(request: CompletionRequest, apiKey?: string, baseUrl = 'https://api.openai.com/v1'): AsyncGenerator<string, void, unknown> {
    if (!apiKey) throw new Error('API Key is required for OpenAI');
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stream: true
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API Error: ${response.statusText} - ${error?.error?.message || ''}`);
    }
    
    if (!response.body) throw new Error('No response body');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
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
          if (!trimmed.startsWith('data: ')) continue;
          if (trimmed === 'data: [DONE]') return;
          
          try {
            const data = JSON.parse(trimmed.slice(6));
            const delta = data.choices[0]?.delta?.content;
            if (delta) {
              yield delta;
            }
          } catch (e) {
            // Ignore parse errors on partial chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
  
  async testConnection(apiKey?: string, baseUrl = 'https://api.openai.com/v1'): Promise<boolean> {
    try {
      if (!apiKey) return false;
      const res = await fetch(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};
