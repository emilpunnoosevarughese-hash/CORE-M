/// <reference lib="webworker" />
import { RenderGraph, EffectInstance } from '../engine/RenderGraph';

let graph: RenderGraph | null = null;
let offscreen: OffscreenCanvas | null = null;

// Fake a video source since WebCodecs VideoFrame decode is complex for this mockup
// In production, we'd use VideoDecoder and VideoFrame
let mockSource: ImageBitmap | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'INIT') {
    offscreen = payload.canvas;
    if (offscreen) {
      graph = new RenderGraph(offscreen);
    }
    
    // Create a mock frame (e.g. 1920x1080 solid color) to render if no actual video frame is given
    // Create a second mock frame for transitions (e.g. 1920x1080 green color)
    if (!mockSource) {
      const c = new OffscreenCanvas(1920, 1080);
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#0a2342'; // Dark blue mock frame
      ctx.fillRect(0, 0, 1920, 1080);
      
      // Draw some text to make it obvious
      ctx.fillStyle = 'white';
      ctx.font = '100px sans-serif';
      ctx.fillText('Clip A', 800, 540);
      
      mockSource = c.transferToImageBitmap();
    }
    
    // Add mockSourceB to global scope
    if (!(self as any).mockSourceB) {
      const c2 = new OffscreenCanvas(1920, 1080);
      const ctx2 = c2.getContext('2d')!;
      ctx2.fillStyle = '#420a23'; // Dark red mock frame
      ctx2.fillRect(0, 0, 1920, 1080);
      ctx2.fillStyle = 'white';
      ctx2.font = '100px sans-serif';
      ctx2.fillText('Clip B', 800, 540);
      (self as any).mockSourceB = c2.transferToImageBitmap();
    }
  } 
  else if (type === 'RESIZE') {
    if (graph) {
      graph.resize(payload.width, payload.height);
      if (offscreen) {
        offscreen.width = payload.width;
        offscreen.height = payload.height;
      }
    }
  }
  else if (type === 'RENDER') {
    if (graph && mockSource) {
      const effects: EffectInstance[] = payload.effects || [];
      const transition = payload.transition; // { id, progress, parameters }
      
      if (transition) {
        graph.renderTransition(mockSource, (self as any).mockSourceB, transition.id, transition.progress, transition.parameters);
      } else {
        graph.renderStack(mockSource, effects);
      }
      
      // If scopes are requested, read pixels and send back
      if (payload.requestScopes) {
        const { width, height } = offscreen!;
        const pixels = graph.getPixelData(width, height);
        self.postMessage({
          type: 'SCOPES_FRAME',
          payload: { pixels, width, height }
        }, [pixels.buffer]); // Transfer buffer for performance
      }
      
      // Notify main thread that render is complete if needed
      self.postMessage({ type: 'RENDER_COMPLETE' });
    }
  }
};
