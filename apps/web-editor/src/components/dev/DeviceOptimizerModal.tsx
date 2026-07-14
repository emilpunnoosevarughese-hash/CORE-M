import React, { useEffect, useState } from 'react';
import { X, Cpu, HardDrive, MonitorPlay, Zap, ShieldAlert } from 'lucide-react';
import { usePlaybackStore } from '@corem/playback';

export function DeviceOptimizerModal({ onClose }: { onClose: () => void }) {
  const [specs, setSpecs] = useState<any>(null);
  const setQuality = usePlaybackStore(s => s.setQuality);

  useEffect(() => {
    // Collect hardware specs
    const cores = navigator.hardwareConcurrency || 4;
    // @ts-ignore
    const ram = navigator.deviceMemory || 8;
    const os = navigator.userAgent.includes('Windows') ? 'Windows' : navigator.userAgent.includes('Mac') ? 'macOS' : 'Linux/Other';
    
    // Evaluate performance tier
    const isHighEnd = cores >= 8 && ram >= 16;
    const isLowEnd = cores <= 4 || ram <= 4;
    
    setSpecs({
      cores,
      ram,
      os,
      tier: isHighEnd ? 'High-End' : isLowEnd ? 'Low-End' : 'Mid-Range'
    });
  }, []);

  const handleOptimize = (tier: 'low' | 'high') => {
    if (tier === 'low') {
      setQuality('proxy');
    } else {
      setQuality('original');
    }
    onClose();
  };

  if (!specs) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[500px] bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="h-14 border-b border-border flex items-center justify-between px-5 bg-surface">
          <div className="flex items-center gap-2 font-semibold">
            <Zap className="w-5 h-5 text-yellow-500" />
            Performance Optimizer
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-hover rounded-full transition-colors text-foreground/60 hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 p-4 bg-surface rounded-lg border border-border mb-6">
            <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center shrink-0">
              <MonitorPlay size={24} />
            </div>
            <div>
              <div className="font-semibold text-lg">{specs.os} Workstation</div>
              <div className="text-sm text-foreground/60">
                {specs.cores} CPU Cores • {specs.ram}GB+ RAM detected
              </div>
            </div>
            <div className="ml-auto">
              <span className={`text-xs px-2 py-1 rounded font-semibold uppercase tracking-wider ${
                specs.tier === 'High-End' ? 'bg-green-500/20 text-green-500' :
                specs.tier === 'Low-End' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'
              }`}>
                {specs.tier}
              </span>
            </div>
          </div>

          <p className="text-sm text-foreground/70 mb-6 leading-relaxed">
            Choose a performance profile. Optimizing for older or lower-spec devices will reduce preview resolution and disable heavy real-time effects during playback to prevent stuttering. Export quality is never affected.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleOptimize('low')}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-primary/50 transition-all group"
            >
              <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </div>
              <div className="text-center">
                <div className="font-semibold mb-1">Optimize for Speed</div>
                <div className="text-xs text-foreground/50">Uses Proxies & 360p Preview</div>
              </div>
            </button>

            <button 
              onClick={() => handleOptimize('high')}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-primary/50 transition-all group"
            >
              <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-center">
                <div className="font-semibold mb-1">High Quality</div>
                <div className="text-xs text-foreground/50">Uses Original Media & 1080p+</div>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
