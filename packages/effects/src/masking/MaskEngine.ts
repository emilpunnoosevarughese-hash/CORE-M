export interface MaskPoint {
  x: number;
  y: number;
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
}

export interface Mask {
  id: string;
  name: string;
  type: 'bezier' | 'ellipse' | 'rectangle';
  points: MaskPoint[];
  feather: number;
  expansion: number;
  opacity: number;
  inverted: boolean;
}

export class MaskEngine {
  static renderMask(ctx: CanvasRenderingContext2D, mask: Mask, width: number, height: number) {
    if (mask.points.length < 3 && mask.type === 'bezier') return;

    ctx.save();
    ctx.beginPath();

    if (mask.type === 'rectangle') {
      const p1 = mask.points[0];
      const p2 = mask.points[1] || p1;
      ctx.rect(p1.x * width, p1.y * height, (p2.x - p1.x) * width, (p2.y - p1.y) * height);
    } else if (mask.type === 'ellipse') {
      const center = mask.points[0];
      const radius = mask.points[1] || center;
      const rx = Math.abs((radius.x - center.x) * width);
      const ry = Math.abs((radius.y - center.y) * height);
      ctx.ellipse(center.x * width, center.y * height, rx, ry, 0, 0, Math.PI * 2);
    } else if (mask.type === 'bezier') {
      const start = mask.points[0];
      ctx.moveTo(start.x * width, start.y * height);

      for (let i = 1; i < mask.points.length; i++) {
        const p = mask.points[i];
        const prev = mask.points[i - 1];
        
        if (p.handleIn && prev.handleOut) {
          ctx.bezierCurveTo(
            prev.handleOut.x * width, prev.handleOut.y * height,
            p.handleIn.x * width, p.handleIn.y * height,
            p.x * width, p.y * height
          );
        } else {
          ctx.lineTo(p.x * width, p.y * height);
        }
      }
      ctx.closePath();
    }

    if (mask.feather > 0) {
      ctx.filter = `blur(${mask.feather}px)`;
    }

    ctx.fillStyle = `rgba(255, 255, 255, ${mask.opacity})`;
    ctx.fill();
    ctx.restore();
  }
}
