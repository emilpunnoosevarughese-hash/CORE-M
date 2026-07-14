export const EasingLibrary = {
  linear: (t: number) => t,
  
  easeIn: (t: number) => t * t * t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  
  bounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  
  elastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  
  hold: (t: number) => 0
};

// Newton-Raphson solver for Cubic Bezier
// Used for custom curves where handles determine easing velocity
export class BezierSolver {
  private static A(aA1: number, aA2: number) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
  private static B(aA1: number, aA2: number) { return 3.0 * aA2 - 6.0 * aA1; }
  private static C(aA1: number) { return 3.0 * aA1; }

  // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
  private static calcBezier(aT: number, aA1: number, aA2: number) {
    return ((this.A(aA1, aA2) * aT + this.B(aA1, aA2)) * aT + this.C(aA1)) * aT;
  }

  // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
  private static getSlope(aT: number, aA1: number, aA2: number) {
    return 3.0 * this.A(aA1, aA2) * aT * aT + 2.0 * this.B(aA1, aA2) * aT + this.C(aA1);
  }

  private static getTForX(aX: number, mX1: number, mX2: number): number {
    let aGuessT = aX;
    // Newton Raphson Iteration
    for (let i = 0; i < 8; ++i) {
      const currentSlope = this.getSlope(aGuessT, mX1, mX2);
      if (currentSlope === 0.0) {
        return aGuessT;
      }
      const currentX = this.calcBezier(aGuessT, mX1, mX2) - aX;
      aGuessT -= currentX / currentSlope;
    }
    
    // Binary Subdivision fallback if Newton-Raphson fails to converge
    let aT0 = 0.0;
    let aT1 = 1.0;
    aGuessT = aX;
    
    let currentX = 0;
    let i = 0;
    while (Math.abs(currentX) > 0.0001 && ++i < 20) {
      aGuessT = aT0 + (aT1 - aT0) / 2.0;
      currentX = this.calcBezier(aGuessT, mX1, mX2) - aX;
      if (currentX > 0.0) {
        aT1 = aGuessT;
      } else {
        aT0 = aGuessT;
      }
    }
    
    return aGuessT;
  }

  public static solve(x: number, mX1: number, mY1: number, mX2: number, mY2: number): number {
    if (mX1 === mY1 && mX2 === mY2) return x; // linear fallback
    const t = this.getTForX(x, mX1, mX2);
    return this.calcBezier(t, mY1, mY2);
  }
}
