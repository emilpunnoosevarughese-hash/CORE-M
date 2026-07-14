import { MessageQueue } from '../network/MessageQueue';
import { PacketType } from '../network/PacketSerializer';
import { ChangeTracker } from './ChangeTracker';
import { ConflictResolver, DeltaOperation } from './ConflictResolver';

export class SyncEngine {
  private static instance: SyncEngine;
  
  private messageQueue = MessageQueue.getInstance();
  private tracker = ChangeTracker.getInstance();
  private resolver = ConflictResolver.getInstance();

  private constructor() {}

  public static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  /**
   * Triggers a delta synchronization. Called by the SyncScheduler.
   */
  public performDeltaSync() {
    const changes = this.tracker.getAndClearPendingChanges();
    if (changes.length === 0) return;

    this.messageQueue.enqueue({
      type: PacketType.SYNC_DELTA,
      timestamp: Date.now(),
      payload: {
        revision: this.tracker.getRevision(),
        operations: changes
      }
    });
  }

  /**
   * Handles incoming operations from the server.
   */
  public handleRemoteDelta(remoteOps: DeltaOperation[], remoteRevision: number) {
    // 1. Get currently un-synced local changes
    const localOps = this.tracker.getAndClearPendingChanges();
    
    // 2. Resolve conflicts (OT)
    const transformedLocalOps = this.resolver.transform(localOps, remoteOps);
    
    // 3. Apply remote ops to local timeline/effects engines
    this.applyOperations(remoteOps);

    // 4. Update revision
    this.tracker.setRevision(remoteRevision);

    // 5. Restore transformed local ops to pending
    for (const op of transformedLocalOps) {
      this.tracker.recordChange(op.targetId, op.path, op.value, op.type);
    }
  }

  private applyOperations(ops: DeltaOperation[]) {
    // This is where we dispatch events that the decoupled Editor packages listen to.
    // e.g. EventBus.emit('remote_clip_update', op)
  }
}
