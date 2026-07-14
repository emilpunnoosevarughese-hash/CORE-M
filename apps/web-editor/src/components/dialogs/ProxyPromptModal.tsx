import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function ProxyPromptModal() {
  const [errorEvent, setErrorEvent] = useState<{ assetId: string; sourceUrl: string } | null>(null);

  useEffect(() => {
    const handleMediaError = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && !errorEvent) {
        setErrorEvent(customEvent.detail);
      }
    };

    window.addEventListener('corem-media-error', handleMediaError);
    return () => window.removeEventListener('corem-media-error', handleMediaError);
  }, [errorEvent]);

  if (!errorEvent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-hover/30">
          <div className="flex items-center gap-2 text-yellow-500 font-semibold text-sm">
            <AlertTriangle size={18} />
            Unsupported Media Format
          </div>
          <button 
            onClick={() => setErrorEvent(null)}
            className="text-foreground/50 hover:text-foreground hover:bg-surface p-1 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
            The browser cannot decode this media file format natively. To use this clip in your timeline, CORE M needs to generate a web-friendly proxy version.
          </p>
          
          <div className="text-[11px] font-mono text-foreground/50 bg-background/50 p-2 rounded mb-6 truncate border border-border/50">
            {errorEvent.sourceUrl}
          </div>
          
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setErrorEvent(null)}
              className="px-4 py-2 rounded bg-surface hover:bg-surface-hover text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                alert('Proxy generation task queued (Backend integration pending)');
                setErrorEvent(null);
              }}
              className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Generate Proxy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
