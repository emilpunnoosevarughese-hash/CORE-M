// This script runs entirely in a background thread

self.onmessage = async (e: MessageEvent) => {
  const { type, audioUrl, clipId, samplesPerPixel } = e.data;

  if (type === 'generate') {
    try {
      // Fetch audio data
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();

      // We use OfflineAudioContext in the worker to decode the audio natively without UI blocking
      const offlineContext = new OfflineAudioContext(2, 1, 48000);
      const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer);

      // Extract raw PCM
      const channelData = audioBuffer.getChannelData(0); // Using Left channel for visual waveform usually
      const totalSamples = channelData.length;
      const numPeaks = Math.ceil(totalSamples / samplesPerPixel);
      const peaks = new Float32Array(numPeaks);

      // Downsample by capturing max peak per window
      for (let i = 0; i < numPeaks; i++) {
        const start = i * samplesPerPixel;
        const end = Math.min(start + samplesPerPixel, totalSamples);
        let max = 0;
        
        for (let j = start; j < end; j++) {
          const val = Math.abs(channelData[j]);
          if (val > max) max = val;
        }
        peaks[i] = max;
      }

      // Transfer Float32Array back to main thread efficiently
      self.postMessage({ clipId, peaks }, { transfer: [peaks.buffer] });
    } catch (err: any) {
      self.postMessage({ clipId, error: err.message || 'Decoding failed' });
    }
  }
};
