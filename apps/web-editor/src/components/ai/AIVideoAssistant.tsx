import React, { useState, useRef, useEffect } from 'react';
import { Video, Scissors, Crop, Zap, Loader2, AlertTriangle } from 'lucide-react';

export function AIVideoAssistant() {
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../../../../packages/ai/src/workers/ai.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { type, id, error: errMsg } = e.data;
      if (type === 'SERVICE_ERROR' && id === activeTask) {
        setError(errMsg);
        setActiveTask(null);
      } else if (type === 'SERVICE_DONE' && id === activeTask) {
        setActiveTask(null);
      }
    };

    return () => { workerRef.current?.terminate(); };
  }, [activeTask]);

  const runTask = (type: string) => {
    const id = crypto.randomUUID();
    setActiveTask(id);
    setError(null);
    workerRef.current?.postMessage({
      type,
      id,
      payload: { videoBlobId: 'demo-video-1' } // Stubbed ID
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="flex flex-col items-center justify-center text-center space-y-2 mb-6 text-foreground/40 mt-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Video size={24} className="text-primary/60" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/60 mb-1">Video AI</p>
          <p className="text-xs">Automate tedious editing tasks.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-500 text-xs">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={() => runTask('VIDEO_SCENE_DETECT')}
          disabled={activeTask !== null}
          className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg hover:border-primary transition-all text-left disabled:opacity-50"
        >
          {activeTask !== null ? <Loader2 size={16} className="animate-spin text-primary" /> : <Scissors size={16} className="text-primary" />}
          <div>
            <p className="text-xs font-semibold">Scene Detection</p>
            <p className="text-[10px] text-foreground/50">Automatically cut video at scene changes.</p>
          </div>
        </button>

        <button
          onClick={() => runTask('VIDEO_SMART_TRIM')}
          disabled={activeTask !== null}
          className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg hover:border-primary transition-all text-left disabled:opacity-50"
        >
          {activeTask !== null ? <Loader2 size={16} className="animate-spin text-primary" /> : <Zap size={16} className="text-primary" />}
          <div>
            <p className="text-xs font-semibold">Smart Trim</p>
            <p className="text-[10px] text-foreground/50">Remove silent gaps in dialogue.</p>
          </div>
        </button>

        <button
          onClick={() => runTask('VIDEO_AUTO_REFRAME')}
          disabled={activeTask !== null}
          className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg hover:border-primary transition-all text-left disabled:opacity-50"
        >
          {activeTask !== null ? <Loader2 size={16} className="animate-spin text-primary" /> : <Crop size={16} className="text-primary" />}
          <div>
            <p className="text-xs font-semibold">Auto Reframe</p>
            <p className="text-[10px] text-foreground/50">Keep subjects centered for vertical video.</p>
          </div>
        </button>
      </div>
    </div>
  );
}
