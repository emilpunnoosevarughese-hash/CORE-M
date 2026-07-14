export type OperationType = 'insert' | 'update' | 'delete';

export interface DeltaOperation {
  id: string; // Unique ID for the operation
  targetId: string; // ID of the clip, track, or effect
  type: OperationType;
  path: string; // e.g. "transform.position.x" or "clips"
  value: any;
  revision: number; // For Operational Transform sorting
}

export class ConflictResolver {
  private static instance: ConflictResolver;

  private constructor() {}

  public static getInstance(): ConflictResolver {
    if (!ConflictResolver.instance) {
      ConflictResolver.instance = new ConflictResolver();
    }
    return ConflictResolver.instance;
  }

  /**
   * Applies basic Operational Transform (OT) logic to resolve concurrent edits.
   * If two users edit the same target concurrently, the server revision wins,
   * but the local operation is transformed (rebased) to apply cleanly if possible.
   */
  public transform(localOps: DeltaOperation[], remoteOps: DeltaOperation[]): DeltaOperation[] {
    const transformedOps: DeltaOperation[] = [];

    for (const localOp of localOps) {
      let isOverridden = false;

      for (const remoteOp of remoteOps) {
        // If they targeted the exact same property (e.g. both changed opacity of Clip A)
        if (localOp.targetId === remoteOp.targetId && localOp.path === remoteOp.path) {
          if (localOp.type === 'update' && remoteOp.type === 'update') {
            // Remote wins in this basic OT implementation.
            isOverridden = true;
          } else if (remoteOp.type === 'delete') {
            // Target was deleted by remote, local operation is invalid
            isOverridden = true;
          }
        }
      }

      if (!isOverridden) {
        transformedOps.push(localOp);
      }
    }

    return transformedOps;
  }
}
