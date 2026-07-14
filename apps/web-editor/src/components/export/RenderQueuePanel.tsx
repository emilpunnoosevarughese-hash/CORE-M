import React, { useEffect, useState } from 'react';
import { JobManager, RenderQueue } from '@corem/export';
import type { ExportJob } from '@corem/export';
import { Play, Pause, XCircle, RotateCcw, Copy, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

export function RenderQueuePanel() {
  const [jobs, setJobs] = useState<ExportJob[]>([]);

  useEffect(() => {
    const queue = RenderQueue.getInstance();
    setJobs([...queue.getJobs()]);

    const unsubscribe = queue.subscribe(() => {
      setJobs([...queue.getJobs()]);
    });

    return () => { unsubscribe(); };
  }, []);

  if (jobs.length === 0) return null;

  return (
    <div className="absolute top-16 right-4 w-[450px] bg-surface border border-border shadow-2xl rounded-xl overflow-hidden z-40 flex flex-col max-h-[70vh]">
      <div className="h-10 border-b border-border bg-surface-hover flex items-center px-4 shrink-0 font-semibold text-sm">
        Render Queue ({jobs.filter(j => j.status === 'rendering').length} active)
      </div>
      
      <div className="overflow-y-auto p-3 space-y-3">
        {jobs.map((job, idx) => (
          <RenderJobCard key={job.id} job={job} isFirst={idx === 0} isLast={idx === jobs.length - 1} />
        ))}
      </div>
    </div>
  );
}

function RenderJobCard({ job, isFirst, isLast }: { job: ExportJob, isFirst: boolean, isLast: boolean }) {
  const manager = JobManager.getInstance();
  const queue = RenderQueue.getInstance();
  const isComplete = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isCancelled = job.status === 'cancelled';
  const isPaused = job.status === 'paused';
  const isRendering = job.status === 'rendering';
  const isIdle = job.status === 'idle';

  const handleDownload = () => {
    if (job.blob) {
      const url = URL.createObjectURL(job.blob);
      const a = document.createElement('a');
      a.href = url;
      // Get extension from mime type or format
      const ext = job.format.includes('sequence') ? 'zip' : job.format;
      a.download = `${job.name}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handlePriorityUp = () => {
    queue.reorderJob(job.id, Math.max(0, job.priority - 1));
  };
  
  const handlePriorityDown = () => {
    queue.reorderJob(job.id, job.priority + 1);
  };

  return (
    <div className={`bg-background border rounded-lg p-4 flex flex-col space-y-3 ${isRendering ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'}`}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="font-semibold text-sm truncate w-64">{job.name}</span>
          <span className="text-[10px] text-foreground/50 uppercase mt-1 flex flex-wrap gap-1">
            <span className="bg-surface px-1.5 py-0.5 rounded">{job.format}</span>
            <span className="bg-surface px-1.5 py-0.5 rounded">{job.resolution.width}x{job.resolution.height}</span>
            <span className="bg-surface px-1.5 py-0.5 rounded">{job.fps}fps</span>
            <span className="bg-surface px-1.5 py-0.5 rounded">{job.videoCodec}</span>
            <span className="bg-surface px-1.5 py-0.5 rounded">PRIORITY: {job.priority}</span>
          </span>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
            isComplete ? 'bg-green-500/20 text-green-500' :
            isFailed ? 'bg-red-500/20 text-red-500' :
            isCancelled ? 'bg-gray-500/20 text-gray-500' :
            isIdle ? 'bg-blue-500/20 text-blue-500' :
            'bg-primary/20 text-primary animate-pulse'
          }`}>
            {job.status}
          </div>
          <span className="text-[9px] text-foreground/50">{job.currentStage}</span>
        </div>
      </div>

      {/* Progress Data Grid */}
      {(!isComplete && !isCancelled && !isIdle && !isFailed) && (
        <div className="grid grid-cols-4 gap-2 text-[9px] text-foreground/70 font-mono bg-surface-hover/50 p-2 rounded">
          <div className="flex flex-col"><span className="text-foreground/40">FRAME</span><span>{job.currentFrame}/{job.totalFrames}</span></div>
          <div className="flex flex-col"><span className="text-foreground/40">FPS</span><span>{job.renderFps.toFixed(1)}</span></div>
          <div className="flex flex-col"><span className="text-foreground/40">ELAPSED</span><span>{job.elapsedTime.toFixed(1)}s</span></div>
          <div className="flex flex-col"><span className="text-foreground/40">REMAINING</span><span>{job.estimatedTimeRemaining}s</span></div>
        </div>
      )}

      {/* Progress Bar */}
      {(!isComplete && !isCancelled && !isFailed && !isIdle) && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-foreground/70 font-mono">
            <span>{Math.round(job.progress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-between items-center pt-2 border-t border-border/50">
        <div className="flex space-x-1">
          {(isIdle || isPaused) && (
            <>
              <button onClick={handlePriorityUp} disabled={isFirst} className="p-1 hover:bg-surface-hover rounded text-foreground/50 disabled:opacity-30" title="Increase Priority">
                <ChevronUp size={14} />
              </button>
              <button onClick={handlePriorityDown} disabled={isLast} className="p-1 hover:bg-surface-hover rounded text-foreground/50 disabled:opacity-30" title="Decrease Priority">
                <ChevronDown size={14} />
              </button>
            </>
          )}
        </div>
        <div className="flex space-x-2">
          {isRendering && (
            <>
              <button onClick={() => manager.pauseJob(job.id)} className="p-1.5 bg-surface-hover hover:bg-surface rounded text-foreground/70" title="Pause">
                <Pause size={14} />
              </button>
              <button onClick={() => manager.cancelJob(job.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded text-red-500" title="Cancel">
                <XCircle size={14} />
              </button>
            </>
          )}

          {isPaused && (
            <button onClick={() => manager.resumeJob(job.id)} className="p-1.5 bg-green-500/10 hover:bg-green-500/20 rounded text-green-500" title="Resume">
              <Play size={14} />
            </button>
          )}

          {isComplete && job.blob && (
            <button onClick={handleDownload} className="text-xs bg-primary text-primary-foreground px-4 py-1.5 rounded font-medium hover:opacity-90 transition-opacity">
              Download File
            </button>
          )}

          {(isFailed || isCancelled) && (
            <button onClick={() => manager.retryJob(job.id)} className="p-1.5 bg-surface-hover hover:bg-surface rounded text-foreground/70 flex items-center gap-1 text-[10px]" title="Retry">
              <RotateCcw size={14} /> Retry
            </button>
          )}

          <button onClick={() => manager.duplicateJob(job.id)} className="p-1.5 bg-surface-hover hover:bg-surface rounded text-foreground/70" title="Duplicate Job">
            <Copy size={14} />
          </button>
          
          {(isComplete || isFailed || isCancelled) && (
            <button onClick={() => manager.removeCompletedJob(job.id)} className="p-1.5 bg-surface-hover hover:bg-surface rounded text-foreground/70" title="Remove from Queue">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
