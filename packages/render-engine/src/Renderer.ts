import { DeviceProfiler } from './DeviceProfiler';
import { WebGLRenderer } from './WebGLRenderer';
import { WebGPURenderer } from './WebGPURenderer';
import { CanvasFallback } from './CanvasFallback';
import { FrameScheduler } from './FrameScheduler';
import { Compositor } from './Compositor';
import { RenderGraph } from './RenderGraph';
import { RenderQueue } from './RenderQueue';
import { AdaptiveQuality } from './AdaptiveQuality';

export type BackendType = 'webgpu' | 'webgl2' | 'webgl1' | 'canvas' | 'software';

export class Renderer {
  public backendType: BackendType = 'software';
  public backend: WebGLRenderer | WebGPURenderer | CanvasFallback | null = null;
  public compositor: Compositor | null = null;
  public graph: RenderGraph = new RenderGraph();
  public scheduler: FrameScheduler;
  public queue: RenderQueue = new RenderQueue();
  public quality: AdaptiveQuality = new AdaptiveQuality();

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scheduler = new FrameScheduler(60, this.onFrame.bind(this));
  }

  async initialize() {
    const profile = await DeviceProfiler.getProfile();
    
    // Attempt initialization in priority order
    if (profile.webGpuSupported) {
      const gpu = new WebGPURenderer(this.canvas);
      if (await gpu.initialize()) {
        this.backendType = 'webgpu';
        this.backend = gpu;
        // console.log("Backend Selected: WebGPU");
      }
    }

    if (!this.backend && profile.webGl2Supported) {
      try {
        this.backend = new WebGLRenderer(this.canvas);
        this.backendType = 'webgl2';
        this.compositor = new Compositor(this.backend as WebGLRenderer);
        // console.log("Backend Selected: WebGL2");
      } catch (e) {
        console.warn("WebGL2 failed", e);
      }
    }

    if (!this.backend) {
      try {
        this.backend = new CanvasFallback(this.canvas);
        this.backendType = 'canvas';
        // console.log("Backend Selected: Canvas2D (Fallback)");
      } catch (e) {
        console.error("Canvas fallback failed", e);
        this.backendType = 'software'; // True headless or catastrophic failure
      }
    }
  }

  start() {
    this.scheduler.start();
  }

  stop() {
    this.scheduler.stop();
  }

  private onFrame(deltaTime: number, time: number) {
    const start = performance.now();

    // Process highest priority task
    const task = this.queue.dequeue();
    if (task) {
      if (this.compositor) {
         this.compositor.compositeFrame(task.time, task.priority === 'export');
      }
      task.resolve(true);
    } else {
      // Standard viewport render
      if (this.compositor) {
        this.compositor.compositeFrame(time, false);
      }
    }

    const duration = performance.now() - start;
    this.quality.reportFrameTime(duration);
  }

  destroy() {
    this.stop();
    if (this.backend && 'destroy' in this.backend) {
      this.backend.destroy();
    }
  }
}
