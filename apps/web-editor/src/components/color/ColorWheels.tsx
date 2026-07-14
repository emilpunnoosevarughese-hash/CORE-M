import React, { useRef, useState, useEffect } from 'react';
import { useColorStore } from './store';
import { useTimelineStore } from '@corem/timeline';

interface WheelProps {
  id: 'lift' | 'gamma' | 'gain' | 'offset';
  label: string;
  value: [number, number, number]; // RGB
  onChange: (val: [number, number, number]) => void;
}

function Wheel({ id, label, value, onChange }: WheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  
  // Calculate handle position from RGB value (very simplified projection)
  // For a real app, you'd convert RGB to HSL/HSV, map H to angle, S to radius, and L to the side slider.
  const r = value[0];
  const g = value[1];
  const b = value[2];
  
  // simplified mapping
  const master = (r + g + b) / 3;
  const cr = r - master; // Color diff red
  const cb = b - master; // Color diff blue
  // map cr, cb to x, y for the handle
  const handleX = Math.max(-1, Math.min(1, cr * 2));
  const handleY = Math.max(-1, Math.min(1, cb * 2));
  
  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    updateFromEvent(e);
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    updateFromEvent(e);
  };
  
  const handlePointerUp = () => {
    setDragging(false);
  };
  
  useEffect(() => {
    if (dragging) {
      window.addEventListener('pointerup', handlePointerUp);
      return () => window.removeEventListener('pointerup', handlePointerUp);
    }
  }, [dragging]);

  const updateFromEvent = (e: React.PointerEvent | React.MouseEvent) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    
    // -1 to 1 space
    let nx = (e.clientX - rect.left - cx) / cx;
    let ny = (e.clientY - rect.top - cy) / cy;
    
    // Clamp to circle
    const dist = Math.sqrt(nx*nx + ny*ny);
    if (dist > 1) {
      nx /= dist;
      ny /= dist;
    }
    
    // Convert back to RGB diff
    const newCr = nx / 2;
    const newCb = ny / 2;
    const newCg = -(newCr + newCb); // rough approximation
    
    // Depending on wheel type, base value varies.
    // For offset it's 0, for gain/gamma it's 1
    const base = (id === 'offset' || id === 'lift') ? 0 : 1;
    // Maintain current master level
    const currentMaster = master === 0 && base !== 0 ? base : master;
    
    onChange([
      currentMaster + newCr,
      currentMaster + newCg,
      currentMaster + newCb
    ]);
  };

  const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    const mDiff = v - master;
    onChange([r + mDiff, g + mDiff, b + mDiff]);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-xs font-semibold text-foreground/80">{label}</div>
      <div className="flex items-center space-x-4">
        {/* The Color Wheel */}
        <div 
          ref={wheelRef}
          className="relative w-32 h-32 rounded-full cursor-crosshair shadow-inner"
          style={{ 
            background: 'conic-gradient(from 90deg, red, yellow, lime, cyan, blue, magenta, red)',
            opacity: 0.8
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          {/* Inner cutout */}
          <div className="absolute inset-4 bg-background rounded-full pointer-events-none" />
          
          {/* Handle */}
          <div 
            className="absolute w-3 h-3 bg-white border border-black rounded-full pointer-events-none shadow"
            style={{
              left: `calc(50% + ${handleX * 50}% - 6px)`,
              top: `calc(50% + ${handleY * 50}% - 6px)`
            }}
          />
        </div>
        
        {/* Master Slider */}
        <div className="flex flex-col h-32 py-2">
          <input 
            type="range"
            min={id === 'offset' || id === 'lift' ? -1 : 0}
            max={id === 'offset' || id === 'lift' ? 1 : 2}
            step={0.01}
            value={master}
            onChange={handleMasterChange}
            className="h-full w-4 accent-primary"
            style={{ writingMode: 'vertical-lr', direction: 'rtl' } as any}
          />
        </div>
      </div>
      <button 
        onClick={() => onChange(id === 'offset' || id === 'lift' ? [0,0,0] : [1,1,1])}
        className="text-[10px] text-foreground/50 hover:text-foreground"
      >
        Reset {label}
      </button>
    </div>
  );
}

export function ColorWheels() {
  const { updatePrimaryParams } = useColorStore();
  const timeline = useTimelineStore();
  const clipId = timeline.selection.clipIds[0];
  const clip = clipId ? timeline.clips[clipId] : null;
  const primaryEffect = clip?.effects?.find(e => e.effectId === 'primary_color');
  const params = primaryEffect?.parameters || {};

  if (!clip) return <div className="p-4 text-center">Select a clip</div>;

  return (
    <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
      <Wheel 
        id="lift" 
        label="Lift (Shadows)" 
        value={params.lift || [0,0,0]} 
        onChange={v => updatePrimaryParams({ lift: v })} 
      />
      <Wheel 
        id="gamma" 
        label="Gamma (Midtones)" 
        value={params.gamma || [1,1,1]} 
        onChange={v => updatePrimaryParams({ gamma: v })} 
      />
      <Wheel 
        id="gain" 
        label="Gain (Highlights)" 
        value={params.gain || [1,1,1]} 
        onChange={v => updatePrimaryParams({ gain: v })} 
      />
      <Wheel 
        id="offset" 
        label="Offset (Global)" 
        value={params.offset || [0,0,0]} 
        onChange={v => updatePrimaryParams({ offset: v })} 
      />
    </div>
  );
}
