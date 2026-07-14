import { RenderQueue, ExportJob } from './RenderQueue';
import { ExportEngine } from './ExportEngine';

export class JobManager {
  private static instance: JobManager;
  private queue: RenderQueue;
  private history: ExportJob[] = [];

  private constructor() {
    this.queue = RenderQueue.getInstance();
  }

  public static getInstance(): JobManager {
    if (!JobManager.instance) {
      JobManager.instance = new JobManager();
    }
    return JobManager.instance;
  }

  public submitJob(jobConfig: Omit<ExportJob, 'id' | 'status' | 'progress' | 'estimatedTimeRemaining' | 'elapsedTime' | 'renderFps' | 'currentFrame' | 'currentStage' | 'createdAt'>) {
    const jobId = this.queue.addJob(jobConfig);
    // Auto-start if idle
    const engine = ExportEngine.getInstance();
    const activeJobs = this.queue.getJobs().filter(j => j.status === 'rendering');
    
    // Simplistic concurrent limit: 1 job at a time for now
    if (activeJobs.length === 0) {
      engine.startRender(jobId);
    }
    return jobId;
  }

  public pauseJob(jobId: string) {
    ExportEngine.getInstance().pauseRender(jobId);
  }

  public resumeJob(jobId: string) {
    ExportEngine.getInstance().resumeRender(jobId);
  }

  public cancelJob(jobId: string) {
    ExportEngine.getInstance().cancelRender(jobId);
  }

  public retryJob(jobId: string) {
    const job = this.queue.getJobs().find(j => j.id === jobId);
    if (!job) return;
    this.queue.updateJob(jobId, { status: 'idle', progress: 0, error: undefined });
    ExportEngine.getInstance().startRender(jobId);
  }

  public duplicateJob(jobId: string) {
    const job = this.queue.getJobs().find(j => j.id === jobId);
    if (!job) return;
    const { id, status, progress, estimatedTimeRemaining, elapsedTime, renderFps, currentFrame, currentStage, createdAt, error, blob, ...config } = job;
    this.submitJob({ ...config, name: `${config.name} (Copy)` });
  }

  public removeCompletedJob(jobId: string) {
    const job = this.queue.getJobs().find(j => j.id === jobId);
    if (job && job.status === 'completed') {
      this.history.push(job);
      this.queue.removeJob(jobId);
    }
  }

  public getHistory(): ExportJob[] {
    return this.history;
  }
}
