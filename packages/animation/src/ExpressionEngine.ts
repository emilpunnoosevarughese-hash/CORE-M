// A lightweight, sandboxed expression evaluator
export class ExpressionEngine {
  private static instance: ExpressionEngine;

  private constructor() {}

  public static getInstance(): ExpressionEngine {
    if (!ExpressionEngine.instance) {
      ExpressionEngine.instance = new ExpressionEngine();
    }
    return ExpressionEngine.instance;
  }

  /**
   * Evaluates an expression with a safe context.
   * In a true production environment, this might use an AST parser (like Acorn) or a Web Worker
   * to guarantee no infinite loops or prototype pollution.
   */
  public evaluate(code: string, context: { time: number; value: any; frame: number }): any {
    // Sandbox context
    const sandbox = {
      time: context.time,
      value: context.value,
      frame: context.frame,
      
      // Math utilities common in expressions
      Math,
      random: Math.random,
      sin: Math.sin,
      cos: Math.cos,
      
      // Wiggle implementation: wiggle(freq, amp)
      wiggle: (freq: number, amp: number) => {
        // Simplified procedural noise based on time
        const noise = Math.sin(context.time * freq * Math.PI * 2) * amp;
        
        if (typeof context.value === 'number') {
          return context.value + noise;
        } else if (Array.isArray(context.value)) {
          return context.value.map(v => v + noise);
        } else if (typeof context.value === 'object' && context.value !== null) {
          return {
            x: (context.value.x || 0) + noise,
            y: (context.value.y || 0) + Math.cos(context.time * freq * Math.PI * 2) * amp,
          };
        }
        return context.value;
      },
      
      clamp: (val: number, min: number, max: number) => Math.min(Math.max(val, min), max),
      linear: (t: number, tMin: number, tMax: number, value1: number, value2: number) => {
        if (t <= tMin) return value1;
        if (t >= tMax) return value2;
        return value1 + (value2 - value1) * ((t - tMin) / (tMax - tMin));
      },
      ease: (t: number, tMin: number, tMax: number, value1: number, value2: number) => {
        if (t <= tMin) return value1;
        if (t >= tMax) return value2;
        const normalized = (t - tMin) / (tMax - tMin);
        const eased = normalized * normalized * (3 - 2 * normalized); // Smoothstep
        return value1 + (value2 - value1) * eased;
      }
    };

    // Use Function constructor safely for math eval
    try {
      const keys = Object.keys(sandbox);
      const values = Object.values(sandbox);
      
      // We wrap the code to return its evaluation implicitly or explicitly
      let wrappedCode = code;
      if (!code.includes('return')) {
        wrappedCode = `return ${code};`;
      }
      
      const fn = new Function(...keys, wrappedCode);
      return fn(...values);
    } catch (e) {
      console.warn('Expression evaluation failed:', e);
      return context.value;
    }
  }
}
