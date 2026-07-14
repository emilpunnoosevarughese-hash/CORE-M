import React, { useEffect, useRef, useState } from 'react';
import { useTimelineStore } from '@corem/timeline';

interface WaveformCanvasProps {
  clipId: string;
  assetId: string; // Used to fetch the audio later
  duration: number; // in frames
}

export function WaveformCanvas({ clipId, assetId, duration }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { zoomScale } = useTimelineStore();
  const [peaks, setPeaks] = useState<Float32Array | null>(null);

  // In a real implementation, we would spawn our audio-worker here and pass it the ArrayBuffer
  // For now, we mock the worker response with fake peaks just to show the UI running smoothly
  useEffect(() => {
    // Fake worker latency
    const timer = setTimeout(() => {
      // Mock 1 sample per frame
      const fakePeaks = new Float32Array(duration * 2);
      for (let i = 0; i < duration; i++) {
        fakePeaks[i * 2] = -Math.random() * 0.5; // min
        fakePeaks[i * 2 + 1] = Math.random() * 0.8; // max
      }
      setPeaks(fakePeaks);
    }, 500);

    return () => clearTimeout(timer);
  }, [duration]);

  // Render on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = duration * zoomScale;
    const height = canvas.height;
    
    // Resize canvas exactly to pixel width for crisp rendering
    canvas.width = width;
    
    ctx.clearRect(0, 0, width, height);
    
    const centerY = height / 2;
    const amp = height / 2;

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;

    // Draw standard RMS / Peak style waveform
    // In our mock, each 'frame' has 1 peak pair [min, max]
    for (let i = 0; i < duration; i++) {
      const x = i * zoomScale;
      const min = peaks[i * 2] * amp;
      const max = peaks[i * 2 + 1] * amp;

      ctx.moveTo(x, centerY + min);
      ctx.lineTo(x, centerY + max);
    }
    
    ctx.stroke();
  }, [peaks, zoomScale, duration]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50 z-0">
      <canvas 
        ref={canvasRef}
        height={60} // Fixed internal height
        className="h-full"
        style={{ width: `${duration * zoomScale}px` }}
      />
    </div>
  );
}
