export class WebGPURenderer {
  public device: GPUDevice | null = null;
  public context: GPUCanvasContext | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    if (!navigator.gpu) {
      console.warn("WebGPU is not supported on this device.");
      return;
    }
    this.context = canvas.getContext('webgpu') as any;
  }

  async initialize() {
    if (!navigator.gpu || !this.context) return false;
    try {
      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance'
      });
      if (!adapter) return false;
      this.device = await adapter.requestDevice();
      
      const format = navigator.gpu.getPreferredCanvasFormat();
      this.context.configure({
        device: this.device,
        format: format,
        alphaMode: 'premultiplied'
      });
      return true;
    } catch (e) {
      console.error('WebGPU Init Error', e);
      return false;
    }
  }

  destroy() {
    if (this.device) {
      this.device.destroy();
      this.device = null;
    }
    this.context = null;
  }
}
