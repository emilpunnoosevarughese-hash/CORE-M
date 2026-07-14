export type MatteType = 'alpha' | 'luma' | 'alpha-inverted' | 'luma-inverted';

export class MatteSystem {
  static applyMatte(
    ctx: CanvasRenderingContext2D, 
    matteCanvas: HTMLCanvasElement | OffscreenCanvas, 
    type: MatteType, 
    width: number, 
    height: number
  ) {
    if (type === 'alpha') {
      ctx.globalCompositeOperation = 'destination-in';
    } else if (type === 'alpha-inverted') {
      ctx.globalCompositeOperation = 'destination-out';
    } else if (type === 'luma' || type === 'luma-inverted') {
      // Luma matte requires pixel manipulation or a specific WebGL shader.
      // In a 2D context, we can approximate by drawing it with 'multiply' 
      // but proper Luma matte uses the brightness of the matte to set alpha.
      ctx.globalCompositeOperation = 'multiply';
    }
    
    ctx.drawImage(matteCanvas, 0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  }
}
