import type { Provider } from './index';
import { OpenAIProvider } from './openai';
import { OllamaProvider } from './ollama';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { GrokProvider, DeepSeekProvider, OpenRouterProvider, LMStudioProvider } from './extra';

export const ProviderRegistry: Record<string, Provider> = {
  [OpenAIProvider.id]:       OpenAIProvider,
  [AnthropicProvider.id]:    AnthropicProvider,
  [GeminiProvider.id]:       GeminiProvider,
  [GrokProvider.id]:         GrokProvider,
  [DeepSeekProvider.id]:     DeepSeekProvider,
  [OpenRouterProvider.id]:   OpenRouterProvider,
  [OllamaProvider.id]:       OllamaProvider,
  [LMStudioProvider.id]:     LMStudioProvider,
};

export const getProvider = (id: string): Provider | undefined => ProviderRegistry[id];
export const getAllProviders = (): Provider[] => Object.values(ProviderRegistry);

export * from './index';
