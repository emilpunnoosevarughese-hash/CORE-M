import { RenderQueue, ExportJob } from './RenderQueue';
import { EncoderManager } from './EncoderManager';

export class ExportEngine {
  private static instance: ExportEngine;
  private queue: RenderQueue;
  private workers: Map<string, Worker> = new Map();
  private cache: Map<string, ImageData> = new Map();

  private constructor() {
    this.queue = RenderQueue.getInstance();
  }

  public static getInstance(): ExportEngine {
    if (!ExportEngine.instance) {
      ExportEngine.instance = new ExportEngine();
    }
    return ExportEngine.instance;
  }

  public getQueue() {
    return this.queue;
  }

  /**
   * Starts a render job using background workers
   */
  public async startRender(jobId: string) {
    const job = this.queue.getJobs().find(j => j.id === jobId);
    if (!job) return;

    this.queue.updateJob(jobId, { status: 'rendering', progress: 0, currentStage: 'Initializing', elapsedTime: 0 });

    const encoderManager = EncoderManager.getInstance();
    const encoderType = encoderManager.selectEncoder(job.format, job.hardwareAcceleration);

    if (encoderType === 'ffmpeg') {
      await encoderManager.initializeFFmpeg();
    }

    // Spawn a worker to ensure the UI is completely unblocked
    const workerCode = `
      self.onmessage = function(e) {
        const { jobId, totalFrames, fps, format, encoderType } = e.data;
        let currentFrame = 0;
        const startTime = Date.now();
        
        function renderLoop() {
          if (currentFrame >= totalFrames) {
            self.postMessage({ type: 'complete', jobId });
            return;
          }
          
          currentFrame += 2; // Simulate processing 2 frames at a time
          const elapsed = (Date.now() - startTime) / 1000;
          const progress = Math.min(100, (currentFrame / totalFrames) * 100);
          const currentFps = currentFrame / elapsed;
          const remaining = (totalFrames - currentFrame) / (currentFps || fps);

          self.postMessage({
            type: 'progress',
            jobId,
            progress,
            currentFrame,
            elapsedTime: elapsed,
            renderFps: currentFps,
            estimatedTimeRemaining: Math.max(0, remaining),
            currentStage: \`Rendering \${format.toUpperCase()} (\${encoderType})\`
          });
          
          setTimeout(renderLoop, 16); // ~60fps simulation
        }
        renderLoop();
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    
    this.workers.set(jobId, worker);

    const totalFrames = Math.ceil((10) * job.fps); // Dummy 10 second duration

    worker.onmessage = (e) => {
      const data = e.data;
      if (data.type === 'progress') {
        const currentJob = this.queue.getJobs().find(j => j.id === jobId);
        if (!currentJob) return;
        if (currentJob.status === 'paused' || currentJob.status === 'cancelled') return;

        this.queue.updateJob(jobId, { 
          progress: data.progress,
          currentFrame: data.currentFrame,
          elapsedTime: data.elapsedTime,
          renderFps: data.renderFps,
          estimatedTimeRemaining: data.estimatedTimeRemaining,
          currentStage: data.currentStage
        });
      } else if (data.type === 'complete') {
        this.completeJob(jobId);
      } else if (data.type === 'error') {
        this.failJob(jobId, data.error);
      }
    };

    worker.postMessage({ 
      jobId, 
      totalFrames, 
      fps: job.fps,
      format: job.format,
      encoderType
    });
  }

  private completeJob(jobId: string) {
    const job = this.queue.getJobs().find(j => j.id === jobId);
    if (!job) return;
    
    this.cleanupWorker(jobId);
    
    // Create a mock dummy output blob depending on format
    const mimeMap: Record<string, string> = {
      'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime',
      'mp3': 'audio/mp3', 'wav': 'audio/wav', 'aac': 'audio/aac',
      'png': 'image/png', 'jpg': 'image/jpeg', 'webp': 'image/webp',
      'gif': 'image/gif', 'png_sequence': 'application/zip', 'jpg_sequence': 'application/zip'
    };
    
    this.queue.updateJob(jobId, { 
      status: 'completed', 
      progress: 100, 
      estimatedTimeRemaining: 0,
      currentStage: 'Completed',
      blob: new Blob([], { type: mimeMap[job.format] || 'application/octet-stream' })
    });
  }

  private failJob(jobId: string, error: string) {
    this.cleanupWorker(jobId);
    this.queue.updateJob(jobId, { status: 'failed', error, currentStage: 'Failed' });
  }

  private cleanupWorker(jobId: string) {
    const worker = this.workers.get(jobId);
    if (worker) {
      worker.terminate();
      this.workers.delete(jobId);
    }
  }

  public pauseRender(jobId: string) {
    // A full implementation would pause the worker execution
    this.queue.updateJob(jobId, { status: 'paused', currentStage: 'Paused' });
  }

  public resumeRender(jobId: string) {
    this.queue.updateJob(jobId, { status: 'rendering', currentStage: 'Resuming...' });
    // In full impl, send resume signal to worker
  }

  public cancelRender(jobId: string) {
    this.cleanupWorker(jobId);
    this.queue.updateJob(jobId, { status: 'cancelled', currentStage: 'Cancelled' });
  }
}
