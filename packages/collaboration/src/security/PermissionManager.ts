export enum CollaborationRole {
  VIEWER = 'viewer',
  REVIEWER = 'reviewer',
  EDITOR = 'editor',
  ADMIN = 'admin',
  OWNER = 'owner'
}

export class PermissionManager {
  private static instance: PermissionManager;
  private currentRole: CollaborationRole = CollaborationRole.VIEWER;

  private constructor() {}

  public static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  public setRole(role: CollaborationRole) {
    this.currentRole = role;
  }

  public getRole(): CollaborationRole {
    return this.currentRole;
  }

  public canEditTimeline(): boolean {
    return [CollaborationRole.EDITOR, CollaborationRole.ADMIN, CollaborationRole.OWNER].includes(this.currentRole);
  }

  public canExport(): boolean {
    return [CollaborationRole.REVIEWER, CollaborationRole.EDITOR, CollaborationRole.ADMIN, CollaborationRole.OWNER].includes(this.currentRole);
  }

  public canManageUsers(): boolean {
    return [CollaborationRole.ADMIN, CollaborationRole.OWNER].includes(this.currentRole);
  }
}
