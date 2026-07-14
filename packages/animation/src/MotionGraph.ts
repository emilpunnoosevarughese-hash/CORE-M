import { PropertyTrack, AnimationKeyframe } from './models';
import { BezierSolver } from './EasingLibrary';

export interface GraphPoint {
  x: number; // Pixels
  y: number; // Pixels
  keyframe: AnimationKeyframe;
  trackId: string;
}

export class MotionGraph {
  
  /**
   * Renders the value graph for a given property track onto a 2D Context.
   */
  public static drawValueGraph(
    ctx: CanvasRenderingContext2D,
    track: PropertyTrack,
    width: number,
    height: number,
    scrollX: number,
    zoomScale: number,
    minVal: number,
    maxVal: number
  ) {
    if (!track || track.keyframes.length === 0) return;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6'; // primary blue
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const valRange = maxVal - minVal || 1;
    
    // Time to Pixel
    const t2x = (time: number) => (time * zoomScale) - scrollX;
    
    // Value to Pixel (inverted Y so higher values are up)
    const v2y = (val: number) => height - ((val - minVal) / valRange) * height;

    const keyframes = track.keyframes;

    for (let i = 0; i < keyframes.length; i++) {
      const kf = keyframes[i];
      const startX = t2x(kf.time);
      const startY = v2y(kf.value as number);

      if (i === 0) {
        ctx.moveTo(startX, startY);
      }

      if (i < keyframes.length - 1) {
        const nextKf = keyframes[i + 1];
        const endX = t2x(nextKf.time);
        const endY = v2y(nextKf.value as number);

        if (kf.easing === 'linear') {
          ctx.lineTo(endX, endY);
        } else if (kf.easing === 'hold') {
          ctx.lineTo(endX, startY);
          ctx.lineTo(endX, endY);
        } else if (kf.easing === 'bezier' || kf.easing === 'customBezier' || kf.easing === 'autoBezier') {
          // Sample the bezier curve to draw it smoothly on canvas
          // Alternatively, if it perfectly matches a standard CSS cubic bezier, we could use bezierCurveTo,
          // but our BezierSolver maps Time (X) to Time (T) and then Value (Y).
          // We'll sample 20 points between the keyframes for drawing.
          const samples = 20;
          const dt = nextKf.time - kf.time;
          for (let j = 1; j <= samples; j++) {
            const normalizedTime = j / samples;
            
            // Standardize handles for drawing
            let outX = 0.33, outY = 0.33, inX = 0.66, inY = 0.66;
            if (kf.easing === 'autoBezier') {
              outX = 0.25; outY = 0.1; inX = 0.25; inY = 1.0;
            } else if (kf.outTangent && nextKf.inTangent) {
              outX = kf.outTangent.x; outY = kf.outTangent.y;
              inX = nextKf.inTangent.x; inY = nextKf.inTangent.y;
            }

            const eased = BezierSolver.solve(normalizedTime, outX, outY, inX, inY);
            
            const pointX = t2x(kf.time + (normalizedTime * dt));
            const pointY = v2y(kf.value + (eased * (nextKf.value - kf.value)));
            
            ctx.lineTo(pointX, pointY);
          }
        } else {
          // Standard easings (easeIn, bounce, elastic, etc) sampled
          const samples = 20;
          const dt = nextKf.time - kf.time;
          
          for (let j = 1; j <= samples; j++) {
            const normalizedTime = j / samples;
            // Hacky import of EasingLibrary to keep it self-contained for drawing
            // In full app we'd inject this dependency or map it
            // For now just draw a straight line if it's complex, or we can use Interpolator.
            ctx.lineTo(t2x(kf.time + normalizedTime * dt), endY); // simplistic fallback
          }
        }
      }
    }

    ctx.stroke();

    // Draw handles / points
    ctx.fillStyle = '#ffffff';
    for (const kf of keyframes) {
      const x = t2x(kf.time);
      const y = v2y(kf.value as number);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Draw bezier handles if selected/visible
      if ((kf.easing === 'bezier' || kf.easing === 'customBezier') && kf.outTangent && kf.time < keyframes[keyframes.length-1].time) {
        const nextKf = keyframes[keyframes.indexOf(kf)+1];
        const dt = nextKf.time - kf.time;
        const dv = nextKf.value - kf.value;
        
        const hx = t2x(kf.time + (kf.outTangent.x * dt));
        const hy = v2y(kf.value + (kf.outTangent.y * dv));
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(hx, hy);
        ctx.strokeStyle = '#8b5cf6'; // purple tangent line
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(hx, hy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#8b5cf6';
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
