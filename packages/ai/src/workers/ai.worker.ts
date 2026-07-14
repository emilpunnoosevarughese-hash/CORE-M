import { ProviderRegistry } from '../providers/registry';
import { CompletionRequest } from '../providers';
import { DefaultVideoService, DefaultAudioService, DefaultImageService, DefaultSubtitleService } from '../services';

const videoService = new DefaultVideoService();
const audioService = new DefaultAudioService();
const imageService = new DefaultImageService();
const subtitleService = new DefaultSubtitleService();

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
    } catch (err: any) {
      self.postMessage({ type: 'CHAT_ERROR', id, error: err.message });
    }
  } else if (type === 'VIDEO_SCENE_DETECT') {
    try {
      await videoService.detectScenes(payload.videoBlobId);
      self.postMessage({ type: 'SERVICE_DONE', id });
    } catch (err: any) {
      self.postMessage({ type: 'SERVICE_ERROR', id, error: err.message });
    }
  } else if (type === 'VIDEO_SMART_TRIM') {
    try {
      await videoService.smartTrim(payload.videoBlobId);
      self.postMessage({ type: 'SERVICE_DONE', id });
    } catch (err: any) {
      self.postMessage({ type: 'SERVICE_ERROR', id, error: err.message });
    }
  } else if (type === 'AUDIO_NOISE_REMOVAL') {
    try {
      await audioService.removeNoise(payload.audioBlobId);
      self.postMessage({ type: 'SERVICE_DONE', id });
    } catch (err: any) {
      self.postMessage({ type: 'SERVICE_ERROR', id, error: err.message });
    }
  } else if (type === 'IMAGE_BG_REMOVE') {
    try {
      await imageService.removeBackground(payload.imageBlobId);
      self.postMessage({ type: 'SERVICE_DONE', id });
    } catch (err: any) {
      self.postMessage({ type: 'SERVICE_ERROR', id, error: err.message });
    }
  } else if (type === 'SUBTITLE_TRANSCRIBE') {
    try {
      await subtitleService.transcribe(payload.audioBlobId, payload.language);
      self.postMessage({ type: 'SERVICE_DONE', id });
    } catch (err: any) {
      self.postMessage({ type: 'SERVICE_ERROR', id, error: err.message });
    }
  }
};
