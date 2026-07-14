export type ScopesRequest = {
  type: 'PROCESS_SCOPES';
  payload: {
    pixels: Uint8Array;
    width: number;
    height: number;
  };
};

export type ScopesResult = {
  type: 'SCOPES_DATA';
  payload: {
    histogram: { r: number[]; g: number[]; b: number[]; luma: number[] };
    waveform: { r: number[][]; g: number[][]; b: number[][]; luma: number[][] }; // [x][y] intensity
    vectorscope: Uint8ClampedArray; // 256x256 image data
  };
};

self.onmessage = (e: MessageEvent<ScopesRequest>) => {
  if (e.data.type === 'PROCESS_SCOPES') {
    const { pixels, width, height } = e.data.payload;
    
    // Initialize buckets
    const hist = {
      r: new Array(256).fill(0),
      g: new Array(256).fill(0),
      b: new Array(256).fill(0),
      luma: new Array(256).fill(0)
    };
    
    // For waveform, we bucket by X coordinate (downsampled to ~256 columns for speed)
    const waveColumns = 256;
    const waveRows = 256;
    
    const wave = {
      r: Array.from({ length: waveColumns }, () => new Array(waveRows).fill(0)),
      g: Array.from({ length: waveColumns }, () => new Array(waveRows).fill(0)),
      b: Array.from({ length: waveColumns }, () => new Array(waveRows).fill(0)),
      luma: Array.from({ length: waveColumns }, () => new Array(waveRows).fill(0)),
    };
    
    const vecSize = 256;
    const vectorscope = new Uint8ClampedArray(vecSize * vecSize * 4); // RGBA canvas

    const xRatio = waveColumns / width;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      const luma = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

      // Histogram
      hist.r[r]++;
      hist.g[g]++;
      hist.b[b]++;
      hist.luma[luma]++;

      // Waveform
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const waveX = Math.floor(x * xRatio);
      
      wave.r[waveX][r]++;
      wave.g[waveX][g]++;
      wave.b[waveX][b]++;
      wave.luma[waveX][luma]++;

      // Vectorscope (U, V mapping)
      // Standard BT.709 conversion to UV
      // U = -0.09991 * R - 0.33609 * G + 0.436 * B
      // V =  0.615 * R - 0.55861 * G - 0.05639 * B
      const u = -0.09991 * r - 0.33609 * g + 0.436 * b;
      const v = 0.615 * r - 0.55861 * g - 0.05639 * b;
      
      // Map to 0-255 range for the 2D grid
      const vecX = Math.floor(u + 128);
      const vecY = Math.floor(-v + 128); // Invert Y
      
      if (vecX >= 0 && vecX < vecSize && vecY >= 0 && vecY < vecSize) {
        const vecIdx = (vecY * vecSize + vecX) * 4;
        vectorscope[vecIdx] += 1; // R
        vectorscope[vecIdx+1] += 1; // G
        vectorscope[vecIdx+2] += 1; // B
        vectorscope[vecIdx+3] = 255; // Alpha
      }
    }

    self.postMessage({
      type: 'SCOPES_DATA',
      payload: {
        histogram: hist,
        waveform: wave,
        vectorscope
      }
    } as ScopesResult);
  }
};
