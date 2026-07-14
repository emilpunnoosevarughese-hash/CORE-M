export class WaveformGenerator {
  /**
   * Decodes an ArrayBuffer using OfflineAudioContext or AudioContext.
   */
  public static async decodeAudio(arrayBuffer: ArrayBuffer, sampleRate = 48000): Promise<Float32Array> {
    // If we're on the main thread, we can use the main AudioEngine's context or a new OfflineAudioContext.
    // In a worker, decodeAudioData isn't available in all browsers, but we'll assume modern browsers support it or we use it on main thread first.
    const AudioContextClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    if (!AudioContextClass) {
      throw new Error("OfflineAudioContext not supported");
    }

    // We don't know the exact duration yet, but we need an AudioContext to decode.
    // We can use a minimal context just to decode.
    const ctx = new window.AudioContext();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    
    // We'll just return the first channel for waveform drawing
    const channelData = audioBuffer.getChannelData(0);
    
    // Close context
    ctx.close();
    
    return channelData;
  }

  /**
   * Processes a massive Float32Array of raw PCM data into a smaller array of Min/Max peaks.
   * @param channelData Float32Array of audio samples
   * @param samplesPerPixel How many audio samples represent 1 pixel of width
   */
  public static generatePeaks(channelData: Float32Array, samplesPerPixel: number): Float32Array {
    const numPixels = Math.floor(channelData.length / samplesPerPixel);
    const peaks = new Float32Array(numPixels * 2); // [min, max, min, max...]

    for (let i = 0; i < numPixels; i++) {
      const offset = Math.floor(i * samplesPerPixel);
      let min = 1.0;
      let max = -1.0;

      // Extract min/max from this chunk of samples
      for (let j = 0; j < samplesPerPixel; j++) {
        const sample = channelData[offset + j];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }

      peaks[i * 2] = min;
      peaks[i * 2 + 1] = max;
    }

    return peaks;
  }
}
