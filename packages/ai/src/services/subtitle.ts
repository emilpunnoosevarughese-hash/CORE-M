export interface SubtitleCue {
  startTime: number;
  endTime: number;
  text: string;
}

export interface AISubtitleService {
  transcribe(audioBlobId: string, language?: string, onProgress?: (p: number) => void): Promise<SubtitleCue[]>;
  translate(cues: SubtitleCue[], targetLanguage: string, onProgress?: (p: number) => void): Promise<SubtitleCue[]>;
}

export class DefaultSubtitleService implements AISubtitleService {
  async transcribe(audioBlobId: string, language?: string, onProgress?: (p: number) => void): Promise<SubtitleCue[]> {
    throw new Error('Not Implemented Yet: Transcription requires Whisper WebAssembly or Cloud API access.');
  }

  async translate(cues: SubtitleCue[], targetLanguage: string, onProgress?: (p: number) => void): Promise<SubtitleCue[]> {
    throw new Error('Not Implemented Yet: Translation requires Cloud AI Provider setup.');
  }
}
