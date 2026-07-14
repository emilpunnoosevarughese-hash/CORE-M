export class RenderStats {
  public fps: number = 0;
  public frameTime: number = 0;
  public gpuTime: number = 0; // Requires ext_disjoint_timer_query
  public cpuTime: number = 0;
  
  public drawCalls: number = 0;
  public activeLayers: number = 0;
  public shaderCount: number = 0;
  
  public textureCount: number = 0;
  public framebufferCount: number = 0;
  public vramUsageBytes: number = 0;
  
  public droppedFrames: number = 0;
  public workerCount: number = 0;
  public renderQueueLength: number = 0;

  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;

  beginFrame() {
    this.drawCalls = 0;
    this.activeLayers = 0;
  }

  endFrame(frameStartTime: number, renderQueueLength: number) {
    this.cpuTime = performance.now() - frameStartTime;
    this.renderQueueLength = renderQueueLength;
    this.frameCount++;
    
    // Naive 1-second FPS calculation
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameTime = 1000 / this.fps;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      
      this.updateHud();
    }
  }
  
  incrementDrawCalls(count: number = 1) {
    this.drawCalls += count;
  }
  
  updateMemory(textures: number, fbos: number, vramBytes: number) {
    this.textureCount = textures;
    this.framebufferCount = fbos;
    this.vramUsageBytes = vramBytes;
  }

  private updateHud() {
    // In a real implementation, this would dispatch an event to the React store
    // globalEventBus.emit('render.stats.updated', this);
  }
}
