export class FrameScheduler {
  private targetFps: number;
  private frameInterval: number;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private onFrame: (deltaTime: number, time: number) => void;

  constructor(targetFps: number, onFrame: (deltaTime: number, time: number) => void) {
    this.targetFps = targetFps;
    this.frameInterval = 1000 / targetFps;
    this.onFrame = onFrame;
  }

  setTargetFps(fps: number) {
    this.targetFps = fps;
    this.frameInterval = 1000 / fps;
  }

  start() {
    if (this.animationFrameId !== null) return;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (currentTime: number) => {
    this.animationFrameId = requestAnimationFrame(this.loop);

    const deltaTime = currentTime - this.lastTime;
    
    // If enough time has passed based on target FPS
    if (deltaTime >= this.frameInterval) {
      // Adjust lastTime to prevent drift
      this.lastTime = currentTime - (deltaTime % this.frameInterval);
      this.onFrame(deltaTime, currentTime);
    }
  }
}
