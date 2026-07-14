import type { Provider, CompletionRequest, CompletionResponse } from './index';

export const OllamaProvider: Provider = {
  id: 'ollama',
  name: 'Ollama (Local)',
  isLocal: true,
  models: [
    { id: 'llama3', name: 'Llama 3 (8B)', contextWindow: 8192, maxOutput: 4096, capabilities: ['chat'] },
    { id: 'phi3', name: 'Phi-3 Mini', contextWindow: 4096, maxOutput: 4096, capabilities: ['chat'] },
    { id: 'llava', name: 'LLaVA (Vision)', contextWindow: 4096, maxOutput: 4096, capabilities: ['chat', 'vision'] }
  ],
  
  async chat(request: CompletionRequest, apiKey?: string, baseUrl = 'http://localhost:11434/api'): Promise<CompletionResponse> {
    const response = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        options: {
          temperature: request.temperature ?? 0.7,
        },
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      content: data.message?.content || '',
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      }
    };
  },
  
  async *chatStream(request: CompletionRequest, apiKey?: string, baseUrl = 'http://localhost:11434/api'): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        options: {
          temperature: request.temperature ?? 0.7,
        },
        stream: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.statusText}`);
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
          if (!trimmed) continue;
          
          try {
            const data = JSON.parse(trimmed);
            const delta = data.message?.content;
            if (delta) {
              yield delta;
            }
            if (data.done) return;
          } catch (e) {
            // Ignore parse errors on partial chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
  
  async testConnection(apiKey?: string, baseUrl = 'http://localhost:11434/api'): Promise<boolean> {
    try {
      const res = await fetch(`${baseUrl}/tags`);
      return res.ok;
    } catch {
      return false;
    }
  }
};
