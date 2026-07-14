import { ProviderRegistry } from '@corem/ai';
import type { CompletionRequest } from '@corem/ai';

self.onmessage = async (e: MessageEvent) => {
  const { type, payload, id } = e.data;

  if (type === 'CHAT_STREAM') {
    const { providerId, request, apiKey, baseUrl } = payload;

    try {
      const provider = ProviderRegistry[providerId];
      if (!provider) throw new Error(`Unknown provider: ${providerId}`);

      const stream = provider.chatStream(request as CompletionRequest, apiKey, baseUrl);

      for await (const chunk of stream) {
        self.postMessage({ type: 'CHAT_CHUNK', id, payload: chunk });
      }

      self.postMessage({ type: 'CHAT_DONE', id });
    } catch (err: unknown) {
      self.postMessage({ type: 'CHAT_ERROR', id, error: err instanceof Error ? err.message : String(err) });
    }
  }
};
