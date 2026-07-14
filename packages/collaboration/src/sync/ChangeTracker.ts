import { DeltaOperation } from './ConflictResolver';

export class ChangeTracker {
  private static instance: ChangeTracker;
  
  private currentRevision: number = 0;
  private pendingChanges: Map<string, DeltaOperation> = new Map();

  private constructor() {}

  public static getInstance(): ChangeTracker {
    if (!ChangeTracker.instance) {
      ChangeTracker.instance = new ChangeTracker();
    }
    return ChangeTracker.instance;
  }

  public setRevision(revision: number) {
    this.currentRevision = revision;
  }

  public getRevision(): number {
    return this.currentRevision;
  }

  /**
   * Records a granular change (e.g. when an effect parameter is dragged).
   */
  public recordChange(targetId: string, path: string, value: any, type: 'insert'|'update'|'delete' = 'update') {
    const opId = `${targetId}_${path}`;
    
    // If there's already a pending change for this exact property, we overwrite it.
    // This provides automatic batching (e.g. 60 FPS slider dragging only sends the final frame value).
    this.pendingChanges.set(opId, {
      id: crypto.randomUUID(),
      targetId,
      type,
      path,
      value,
      revision: this.currentRevision
    });
  }

  public getAndClearPendingChanges(): DeltaOperation[] {
    const changes = Array.from(this.pendingChanges.values());
    this.pendingChanges.clear();
    return changes;
  }
}
