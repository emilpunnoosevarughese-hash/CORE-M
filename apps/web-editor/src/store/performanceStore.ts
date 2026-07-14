import { create } from 'zustand';

interface PerformanceState {
  memory: number; // GB
  cpuCores: number;
  gpu: string;
  isTouch: boolean;
  performanceMode: 'light' | 'balanced' | 'performance';
  detectPerformance: () => void;
}

export const usePerformanceStore = create<PerformanceState>((set) => ({
  memory: 4,
  cpuCores: 4,
  gpu: 'Unknown',
  isTouch: false,
  performanceMode: 'balanced',

  detectPerformance: () => {
    // 1. RAM Detection
    const nav = navigator as any;
    const memory = nav.deviceMemory || 4;

    // 2. CPU Detection
    const cpuCores = navigator.hardwareConcurrency || 4;

    // 3. GPU Detection
    let gpu = 'Unknown';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          gpu = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
      }
    } catch (e) {
      console.warn('Could not detect GPU', e);
    }

    // 4. Touch Support
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // 5. Determine Mode
    let mode: 'light' | 'balanced' | 'performance' = 'balanced';
    if (memory <= 4 || cpuCores <= 4) {
      mode = 'light';
    } else if (memory >= 16 && cpuCores >= 8) {
      mode = 'performance';
    }

    set({ memory, cpuCores, gpu, isTouch, performanceMode: mode });
    
    console.log(`[Performance] Detected mode: ${mode}`, { memory, cpuCores, gpu, isTouch });
  },
}));
