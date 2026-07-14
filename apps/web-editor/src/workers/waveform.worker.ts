// Web Worker for extracting waveform peaks from raw Float32Array PCM data.
// Note: We cannot pass an AudioContext to a worker, so the decoding must happen
// via an OfflineAudioContext (which IS available in workers in some modern browsers)
// OR the main thread must decode first and pass the Float32Array to this worker.
// Given cross-browser issues with OfflineAudioContext inside workers, the safest
// production approach is: Main Thread decodes via AudioContext -> Worker processes Peaks.

self.onmessage = (e: MessageEvent) => {
  const { channelData, samplesPerPixel, id } = e.data;

  try {
    const numPixels = Math.floor(channelData.length / samplesPerPixel);
    const peaks = new Float32Array(numPixels * 2); // [min, max, min, max...]

    for (let i = 0; i < numPixels; i++) {
      const offset = Math.floor(i * samplesPerPixel);
      let min = 1.0;
      let max = -1.0;

      for (let j = 0; j < samplesPerPixel; j++) {
        const sample = channelData[offset + j];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }

      peaks[i * 2] = min;
      peaks[i * 2 + 1] = max;
    }

    // Send back the computed peaks array, transferring ownership for speed
    self.postMessage({ id, peaks }, { transfer: [peaks.buffer] });
  } catch (error: any) {
    self.postMessage({ id, error: error.message });
  }
};
