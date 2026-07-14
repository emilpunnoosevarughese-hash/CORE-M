import React, { useRef, useState, useEffect } from 'react';

export function CurvesEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState([
    { x: 0, y: 1 }, // bottom left (y is inverted on canvas)
    { x: 0.5, y: 0.5 }, // center
    { x: 1, y: 0 } // top right
  ]);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvasRef.current;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Draw Grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 4; i++) {
      ctx.moveTo(0, height * (i/4));
      ctx.lineTo(width, height * (i/4));
      ctx.moveTo(width * (i/4), 0);
      ctx.lineTo(width * (i/4), height);
    }
    ctx.stroke();

    // Draw Line (very basic linear for now, bezier requires tangents)
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x * width, points[0].y * height);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x * width, points[i].y * height);
    }
    ctx.stroke();

    // Draw Points
    ctx.fillStyle = 'white';
    for (let i = 0; i < points.length; i++) {
      ctx.beginPath();
      ctx.arc(points[i].x * width, points[i].y * height, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [points]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    // Find closest point
    let closestIdx = -1;
    let minDist = 0.05; // 5% radius
    points.forEach((p, i) => {
      const dist = Math.sqrt(Math.pow(p.x - nx, 2) + Math.pow(p.y - ny, 2));
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    });

    if (closestIdx !== -1) {
      setDraggingIdx(closestIdx);
    } else {
      // Add point
      const newPoints = [...points, { x: nx, y: ny }].sort((a, b) => a.x - b.x);
      setPoints(newPoints);
      setDraggingIdx(newPoints.findIndex(p => p.x === nx && p.y === ny));
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIdx === null || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const newPoints = [...points];
    // Don't allow ends to move X
    if (draggingIdx === 0) {
      newPoints[0] = { x: 0, y: ny };
    } else if (draggingIdx === points.length - 1) {
      newPoints[points.length - 1] = { x: 1, y: ny };
    } else {
      newPoints[draggingIdx] = { x: nx, y: ny };
    }
    // Re-sort but we might mess up dragging index. For now just update Y or X carefully.
    // In a real bezier we sort by X.
    newPoints.sort((a,b) => a.x - b.x);
    setPoints(newPoints);
  };

  const handlePointerUp = () => {
    setDraggingIdx(null);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 h-full">
      <div className="flex justify-between w-64 mb-2 text-xs text-foreground/70">
        <span>Master</span>
        <span>Red</span>
        <span>Green</span>
        <span>Blue</span>
      </div>
      <div 
        className="relative w-64 h-64 bg-black rounded border border-border cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <canvas 
          ref={canvasRef}
          width={256}
          height={256}
          className="w-full h-full"
        />
      </div>
      <p className="mt-4 text-[10px] text-foreground/50 text-center max-w-xs">
        Click to add point. Drag to adjust. (Spline conversion to 1D texture for shader lookup pending in next phase).
      </p>
    </div>
  );
}
