export type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'commenter';

export interface ProjectMember {
  uid: string;
  role: ProjectRole;
  addedAt: number;
}

export interface CloudProject {
  id: string;
  title: string;
  ownerId: string;
  workspaceId?: string;
  thumbnail?: string;
  members: ProjectMember[];
  timelineState: string; // JSON stringified state
  lastSavedAt: number;
  createdAt: number;
  isArchived: boolean;
  tags: string[];
}
