export class CanvasFallback {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error("Canvas2D context creation failed");
    this.ctx = context;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  // Very basic fallback layer rendering
  renderImage(image: CanvasImageSource, x: number, y: number, width: number, height: number, opacity: number = 1.0) {
    const prevAlpha = this.ctx.globalAlpha;
    this.ctx.globalAlpha = opacity;
    this.ctx.drawImage(image, x, y, width, height);
    this.ctx.globalAlpha = prevAlpha;
  }
}
