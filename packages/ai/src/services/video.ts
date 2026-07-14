export interface AIVideoService {
  detectScenes(videoBlobId: string, onProgress?: (p: number) => void): Promise<{ startTime: number; endTime: number }[]>;
  smartTrim(videoBlobId: string, onProgress?: (p: number) => void): Promise<{ startTime: number; endTime: number }[]>;
  autoReframe(videoBlobId: string, targetAspectRatio: string, onProgress?: (p: number) => void): Promise<any>;
}

export class DefaultVideoService implements AIVideoService {
  async detectScenes(videoBlobId: string, onProgress?: (p: number) => void): Promise<{ startTime: number; endTime: number }[]> {
    throw new Error('Not Implemented Yet: Scene Detection is pending WebAssembly CV integration.');
  }

  async smartTrim(videoBlobId: string, onProgress?: (p: number) => void): Promise<{ startTime: number; endTime: number }[]> {
    throw new Error('Not Implemented Yet: Smart Trim requires Audio VAD which is currently unavailable.');
  }

  async autoReframe(videoBlobId: string, targetAspectRatio: string, onProgress?: (p: number) => void): Promise<any> {
    throw new Error('Not Implemented Yet: Auto Reframe requires subject tracking ML models.');
  }
}
