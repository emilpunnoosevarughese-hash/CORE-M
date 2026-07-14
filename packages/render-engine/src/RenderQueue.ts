export type RenderTaskPriority = 'viewport' | 'thumbnail' | 'background' | 'export';

export interface RenderTask {
  id: string;
  time: number;
  priority: RenderTaskPriority;
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

export class RenderQueue {
  private queue: RenderTask[] = [];

  enqueue(task: Omit<RenderTask, 'id' | 'resolve' | 'reject'>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        ...task,
        id: Math.random().toString(36).substring(7),
        resolve,
        reject
      });
      // Sort immediately so highest priority runs next
      this.sort();
    });
  }

  private sort() {
    const priorityWeight: Record<RenderTaskPriority, number> = {
      'viewport': 100,
      'export': 80,
      'thumbnail': 50,
      'background': 10
    };

    this.queue.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  }

  dequeue(): RenderTask | undefined {
    return this.queue.shift();
  }

  get length() {
    return this.queue.length;
  }
}
