export type ExportStatus = 'idle' | 'rendering' | 'paused' | 'completed' | 'failed' | 'cancelled';

export type ExportFormat = 'mp4' | 'webm' | 'mov' | 'mp3' | 'wav' | 'aac' | 'png' | 'jpg' | 'webp' | 'png_sequence' | 'jpg_sequence' | 'gif';
export type VideoCodec = 'h264' | 'hevc' | 'vp9' | 'av1' | 'prores' | 'none';
export type AudioCodec = 'aac' | 'mp3' | 'wav' | 'none';

export interface ExportJob {
  id: string;
  name: string;
  sequenceId: string;
  preset: string; // 'youtube', 'tiktok', 'custom'
  format: ExportFormat;
  resolution: { width: number; height: number };
  fps: number;
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;
  bitrate: number; // bps
  bitrateMode: 'cbr' | 'vbr';
  audioBitrate: number; // bps
  audioSampleRate: number; // hz
  audioChannels: 1 | 2 | 6; // Mono, Stereo, 5.1
  gopSize?: number;
  hardwareAcceleration: boolean;
  priority: number; // 0 is highest
  createdAt: number;
  status: ExportStatus;
  progress: number; // 0 to 100
  estimatedTimeRemaining: number; // seconds
  elapsedTime: number; // seconds
  renderFps: number;
  currentFrame: number;
  totalFrames: number;
  currentStage: string; // e.g., "Rendering Video", "Muxing Audio"
  error?: string;
  blob?: Blob; // final output
}

export class RenderQueue {
  private static instance: RenderQueue;
  private jobs: ExportJob[] = [];
  private listeners: Set<() => void> = new Set();
  
  private constructor() {}

  public static getInstance(): RenderQueue {
    if (!RenderQueue.instance) {
      RenderQueue.instance = new RenderQueue();
    }
    return RenderQueue.instance;
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public addJob(job: Omit<ExportJob, 'id' | 'status' | 'progress' | 'estimatedTimeRemaining' | 'elapsedTime' | 'renderFps' | 'currentFrame' | 'currentStage' | 'createdAt'>) {
    const newJob: ExportJob = {
      ...job,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      status: 'idle',
      progress: 0,
      estimatedTimeRemaining: 0,
      elapsedTime: 0,
      renderFps: 0,
      currentFrame: 0,
      currentStage: 'Queued',
    };
    this.jobs.push(newJob);
    this.sortQueue();
    this.notify();
    return newJob.id;
  }

  private sortQueue() {
    this.jobs.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.createdAt - b.createdAt;
    });
  }

  public reorderJob(id: string, newPriority: number) {
    const job = this.jobs.find(j => j.id === id);
    if (job) {
      job.priority = newPriority;
      this.sortQueue();
      this.notify();
    }
  }

  public getJobs(): ExportJob[] {
    return this.jobs;
  }

  public updateJob(id: string, updates: Partial<ExportJob>) {
    const idx = this.jobs.findIndex(j => j.id === id);
    if (idx !== -1) {
      this.jobs[idx] = { ...this.jobs[idx], ...updates };
      this.notify();
    }
  }

  public removeJob(id: string) {
    this.jobs = this.jobs.filter(j => j.id !== id);
    this.notify();
  }
}
