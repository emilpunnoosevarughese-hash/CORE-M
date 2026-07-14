export interface AIAudioService {
  removeNoise(audioBlobId: string, onProgress?: (p: number) => void): Promise<string>;
  autoLevel(audioBlobId: string, targetLUFS?: number, onProgress?: (p: number) => void): Promise<string>;
  detectSilence(audioBlobId: string, onProgress?: (p: number) => void): Promise<{ startTime: number; endTime: number }[]>;
}

export class DefaultAudioService implements AIAudioService {
  async removeNoise(audioBlobId: string, onProgress?: (p: number) => void): Promise<string> {
    throw new Error('Not Implemented Yet: Noise Removal requires a dedicated DSP WebWorker.');
  }

  async autoLevel(audioBlobId: string, targetLUFS?: number, onProgress?: (p: number) => void): Promise<string> {
    throw new Error('Not Implemented Yet: Auto Leveling is pending Loudness estimation integration.');
  }

  async detectSilence(audioBlobId: string, onProgress?: (p: number) => void): Promise<{ startTime: number; endTime: number }[]> {
    throw new Error('Not Implemented Yet: Silence Detection requires audio buffer scanning.');
  }
}
