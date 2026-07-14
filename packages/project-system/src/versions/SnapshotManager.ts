import { ProjectManager } from '../project/ProjectManager';
import { ProjectSerializer } from '../project/ProjectSerializer';

export interface ProjectSnapshot {
  id: string;
  name: string;
  timestamp: number;
  blob: Blob;
  format: 'json' | 'binary';
}

/**
 * Manages Named Snapshots (e.g. "Before Color Grade") which are entirely independent
 * of the linear Timeline Undo/Redo history.
 */
export class SnapshotManager {
  private static instance: SnapshotManager;
  private snapshots: ProjectSnapshot[] = [];

  private constructor() {}

  public static getInstance(): SnapshotManager {
    if (!SnapshotManager.instance) {
      SnapshotManager.instance = new SnapshotManager();
    }
    return SnapshotManager.instance;
  }

  public async createSnapshot(name: string): Promise<ProjectSnapshot> {
    const pm = ProjectManager.getInstance();
    
    // Use binary for minimal memory footprint when keeping snapshots in RAM/Cache
    const blob = await pm.saveProject(); 
    
    const snapshot: ProjectSnapshot = {
      id: crypto.randomUUID(),
      name,
      timestamp: Date.now(),
      blob,
      format: 'binary' // Snapshots are always stored in binary to conserve memory
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  public async restoreSnapshot(id: string): Promise<void> {
    const snapshot = this.snapshots.find(s => s.id === id);
    if (!snapshot) throw new Error('Snapshot not found');

    const pm = ProjectManager.getInstance();
    await pm.loadProject(snapshot.blob, snapshot.format);
  }

  public getSnapshots(): ProjectSnapshot[] {
    return this.snapshots;
  }
}

export class VersionManager {
  // Manages linear Undo/Redo for the project state.
  // We can push small delta payloads here instead of full blobs for performance.
}
