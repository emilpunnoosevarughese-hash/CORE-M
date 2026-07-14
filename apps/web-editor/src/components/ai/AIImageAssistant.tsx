import React, { useState, useRef, useEffect } from 'react';
import { Image, Wand2, Maximize, Eraser, Loader2, AlertTriangle } from 'lucide-react';

export function AIImageAssistant() {
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
      payload: { imageBlobId: 'demo-image-1' } // Stubbed ID
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="flex flex-col items-center justify-center text-center space-y-2 mb-6 text-foreground/40 mt-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Image size={24} className="text-primary/60" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/60 mb-1">Image AI</p>
          <p className="text-xs">Manipulate images with generative tools.</p>
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
          onClick={() => runTask('IMAGE_BG_REMOVE')}
          disabled={activeTask !== null}
          className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg hover:border-primary transition-all text-left disabled:opacity-50"
        >
          {activeTask !== null ? <Loader2 size={16} className="animate-spin text-primary" /> : <Eraser size={16} className="text-primary" />}
          <div>
            <p className="text-xs font-semibold">Background Removal</p>
            <p className="text-[10px] text-foreground/50">Isolate subjects instantly.</p>
          </div>
        </button>

        <button
          onClick={() => runTask('IMAGE_UPSCALE')}
          disabled={activeTask !== null}
          className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg hover:border-primary transition-all text-left disabled:opacity-50"
        >
          {activeTask !== null ? <Loader2 size={16} className="animate-spin text-primary" /> : <Maximize size={16} className="text-primary" />}
          <div>
            <p className="text-xs font-semibold">Upscale</p>
            <p className="text-[10px] text-foreground/50">Enhance low-resolution images.</p>
          </div>
        </button>
      </div>
    </div>
  );
}
