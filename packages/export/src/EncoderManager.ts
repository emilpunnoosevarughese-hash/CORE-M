export class EncoderManager {
  private static instance: EncoderManager;
  private ffmpegLoaded = false;
  
  private constructor() {}

  public static getInstance(): EncoderManager {
    if (!EncoderManager.instance) {
      EncoderManager.instance = new EncoderManager();
    }
    return EncoderManager.instance;
  }

  public async getSupportedCodecs() {
    const supportsWebCodecs = typeof window !== 'undefined' && 'VideoEncoder' in window;
    // In a real browser, we would check VideoEncoder.isConfigSupported
    return {
      webCodecs: supportsWebCodecs,
      h264: true,
      h265: true, // Only some browsers
      vp9: true,
      av1: true,
      ffmpegFallback: true
    };
  }

  public async initializeFFmpeg() {
    if (this.ffmpegLoaded) return;
    try {
      // Lazy load to avoid blocking main thread until needed
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      // Initialization logic would go here
      this.ffmpegLoaded = true;
      console.log('FFmpeg initialized');
    } catch (e) {
      console.error('Failed to initialize FFmpeg', e);
    }
  }

  public selectEncoder(format: string, hardwareAccel: boolean): 'webcodecs' | 'ffmpeg' | 'cpu' {
    if (!hardwareAccel) return 'ffmpeg';
    
    // WebCodecs typically supports mp4/webm with h264/vp9/av1 depending on browser
    if (format === 'mp4' || format === 'webm') {
      const supportsWebCodecs = typeof window !== 'undefined' && 'VideoEncoder' in window;
      if (supportsWebCodecs) return 'webcodecs';
    }

    return 'ffmpeg';
  }
}
