export class AdaptiveQuality {
  private currentScale: number = 1.0;
  private consecutiveDroppedFrames: number = 0;
  private consecutiveSmoothFrames: number = 0;

  private readonly DROP_THRESHOLD = 5;
  private readonly SMOOTH_THRESHOLD = 60;
  private readonly MIN_SCALE = 0.5;

  /**
   * Called every frame with the frame time in milliseconds.
   */
  reportFrameTime(ms: number, targetMs: number = 16.6) {
    if (ms > targetMs * 1.5) {
      this.consecutiveDroppedFrames++;
      this.consecutiveSmoothFrames = 0;
    } else {
      this.consecutiveSmoothFrames++;
      this.consecutiveDroppedFrames = 0;
    }

    if (this.consecutiveDroppedFrames >= this.DROP_THRESHOLD) {
      this.reduceQuality();
      this.consecutiveDroppedFrames = 0;
    } else if (this.consecutiveSmoothFrames >= this.SMOOTH_THRESHOLD) {
      this.increaseQuality();
      this.consecutiveSmoothFrames = 0;
    }
  }

  private reduceQuality() {
    if (this.currentScale > this.MIN_SCALE) {
      this.currentScale = Math.max(this.MIN_SCALE, this.currentScale - 0.1);
      // console.log(`[AdaptiveQuality] Performance drop detected. Reducing resolution scale to ${Math.round(this.currentScale * 100)}%`);
    }
  }

  private increaseQuality() {
    if (this.currentScale < 1.0) {
      this.currentScale = Math.min(1.0, this.currentScale + 0.1);
      // console.log(`[AdaptiveQuality] Performance stable. Restoring resolution scale to ${Math.round(this.currentScale * 100)}%`);
    }
  }

  getResolutionScale(): number {
    return this.currentScale;
  }
  
  getMotionBlurSamples(): number {
    return Math.max(4, Math.floor(16 * this.currentScale));
  }
}
