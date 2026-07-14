export type ShapeType = 'rectangle' | 'rounded_rectangle' | 'ellipse' | 'polygon' | 'star' | 'line' | 'bezier_path';
export type BooleanOperation = 'merge' | 'subtract' | 'intersect' | 'exclude';

export interface ShapeDefinition {
  id: string;
  type: ShapeType;
  booleanOp: BooleanOperation;
  properties: {
    // Evaluated property values (already interpolated by AnimationEngine)
    position: { x: number, y: number };
    scale: { x: number, y: number };
    rotation: number;
    
    // Type specific
    size?: { width: number, height: number }; // rectangle, ellipse
    cornerRadius?: number; // rounded rect
    points?: number; // polygon, star
    innerRadius?: number; // star
    path?: { x: number, y: number, in?: {x: number, y: number}, out?: {x: number, y: number} }[]; // bezier path
    
    // Style
    fillColor?: [number, number, number, number];
    strokeColor?: [number, number, number, number];
    strokeWidth?: number;
    trimStart?: number;
    trimEnd?: number;
  }
}

export class ShapeLayerEngine {
  
  /**
   * Generates rendering instructions or a 2D path based on the evaluated shape definitions.
   * This bridges the gap between Animation properties and the WebGL Renderer.
   */
  public static generateRenderPath(shapes: ShapeDefinition[], canvasWidth: number, canvasHeight: number) {
    // In a WebGL2 pipeline, shapes are often converted into SDFs (Signed Distance Fields),
    // stencil buffer instructions, or triangulated paths (e.g. using earcut).
    
    // This is the architecture scaffolding where the renderer will request the geometry 
    // of the shape layer for the current frame.
    
    const renderInstructions = shapes.map(shape => {
      // 1. Generate local geometry based on type (rectangle, star, etc)
      // 2. Apply local transforms (position, scale, rotation)
      // 3. Mark the boolean operation for the stencil buffer
      return {
        id: shape.id,
        geometryInfo: this.buildGeometry(shape),
        booleanOp: shape.booleanOp,
        style: {
          fill: shape.properties.fillColor,
          stroke: shape.properties.strokeColor,
          strokeWidth: shape.properties.strokeWidth,
          trim: [shape.properties.trimStart ?? 0, shape.properties.trimEnd ?? 1]
        }
      };
    });

    return renderInstructions;
  }

  private static buildGeometry(shape: ShapeDefinition): any {
    switch(shape.type) {
      case 'rectangle': return { type: 'rect', size: shape.properties.size };
      case 'rounded_rectangle': return { type: 'roundRect', size: shape.properties.size, radius: shape.properties.cornerRadius };
      case 'ellipse': return { type: 'ellipse', size: shape.properties.size };
      case 'polygon': return { type: 'polygon', points: shape.properties.points };
      case 'star': return { type: 'star', points: shape.properties.points, innerRadius: shape.properties.innerRadius };
      case 'bezier_path': return { type: 'path', segments: shape.properties.path };
      default: return null;
    }
  }
}
