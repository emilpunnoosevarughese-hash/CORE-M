import React, { useEffect, useRef, useState } from 'react';
import { scopesEventBus } from './scopesBus';
import type { ScopesResult } from '@corem/effects/src/workers/scopes.worker';

export function ScopesPanel() {
  const [scopesData, setScopesData] = useState<ScopesResult['payload'] | null>(null);
  const workerRef = useRef<Worker | null>(null);
  
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);
  const vecCanvasRef = useRef<HTMLCanvasElement>(null);
  const histCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../../workers/scopes.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<ScopesResult>) => {
      if (e.data.type === 'SCOPES_DATA') {
        setScopesData(e.data.payload);
      }
    };

    const handleFrame = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'PROCESS_SCOPES',
          payload: customEvent.detail
        });
      }
    };

    scopesEventBus.addEventListener('scopes-frame', handleFrame);

    return () => {
      scopesEventBus.removeEventListener('scopes-frame', handleFrame);
      worker.terminate();
    };
  }, []);

  // Draw scopes when data updates
  useEffect(() => {
    if (!scopesData) return;
    
    // Draw Waveform (Luma)
    if (waveCanvasRef.current) {
      const ctx = waveCanvasRef.current.getContext('2d');
      if (ctx) {
        const { width, height } = waveCanvasRef.current;
        ctx.clearRect(0, 0, width, height);
        
        const lumaWave = scopesData.waveform.luma;
        const waveCols = lumaWave.length;
        if (waveCols > 0) {
          const waveRows = lumaWave[0].length;
          
          const imgData = ctx.createImageData(waveCols, waveRows);
          for (let x = 0; x < waveCols; x++) {
            for (let y = 0; y < waveRows; y++) {
              const val = lumaWave[x][waveRows - 1 - y]; // Invert Y
              const i = (y * waveCols + x) * 4;
              if (val > 0) {
                const intensity = Math.min(255, val * 10);
                imgData.data[i] = 0;
                imgData.data[i+1] = intensity;
                imgData.data[i+2] = 0;
                imgData.data[i+3] = 255;
              }
            }
          }
          // Put and scale
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = waveCols;
          tempCanvas.height = waveRows;
          tempCanvas.getContext('2d')!.putImageData(imgData, 0, 0);
          ctx.drawImage(tempCanvas, 0, 0, width, height);
        }
      }
    }

    // Draw Vectorscope
    if (vecCanvasRef.current && scopesData.vectorscope) {
      const ctx = vecCanvasRef.current.getContext('2d');
      if (ctx) {
        const { width, height } = vecCanvasRef.current;
        ctx.clearRect(0, 0, width, height);
        const uint8Array = new Uint8ClampedArray(scopesData.vectorscope.buffer);
        const imgData = new ImageData(uint8Array as any, 256, 256);
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 256;
        tempCanvas.height = 256;
        tempCanvas.getContext('2d')!.putImageData(imgData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0, width, height);
        
        // Draw crosshairs
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.moveTo(width/2, 0);
        ctx.lineTo(width/2, height);
        ctx.moveTo(0, height/2);
        ctx.lineTo(width, height/2);
        ctx.stroke();
      }
    }

  }, [scopesData]);

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-lg overflow-hidden">
      <div className="bg-surface-hover p-2 border-b border-border text-xs font-semibold text-foreground/80 flex justify-between">
        <span>Scopes</span>
        <div className="flex space-x-2">
          <button className="hover:text-primary">Waveform</button>
          <button className="hover:text-primary">Vectorscope</button>
        </div>
      </div>
      
      <div className="flex-1 p-2 grid grid-cols-2 gap-2 min-h-0">
        <div className="flex flex-col relative h-full">
          <span className="absolute top-1 left-1 text-[10px] text-foreground/50 z-10">Luma Waveform</span>
          <canvas 
            ref={waveCanvasRef}
            className="w-full h-full bg-black rounded"
          />
        </div>
        
        <div className="flex flex-col relative h-full">
          <span className="absolute top-1 left-1 text-[10px] text-foreground/50 z-10">Vectorscope</span>
          <canvas 
            ref={vecCanvasRef}
            className="w-full h-full bg-black rounded aspect-square self-center"
          />
        </div>
      </div>
    </div>
  );
}
