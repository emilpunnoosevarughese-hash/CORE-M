export type Role = 'system' | 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export interface Model {
  id: string;
  name: string;
  contextWindow: number;
  maxOutput: number;
  capabilities: ('chat' | 'vision' | 'audio' | 'video')[];
  costPer1kTokensIn?: number;
  costPer1kTokensOut?: number;
}

export interface CompletionRequest {
  messages: Omit<Message, 'id' | 'timestamp'>[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface Provider {
  id: string;
  name: string;
  models: Model[];
  isLocal: boolean;
  
  // Methods
  chat(request: CompletionRequest, apiKey?: string, baseUrl?: string): Promise<CompletionResponse>;
  chatStream(request: CompletionRequest, apiKey?: string, baseUrl?: string): AsyncGenerator<string, void, unknown>;
  
  testConnection(apiKey?: string, baseUrl?: string): Promise<boolean>;
}
