export interface ProjectVersion {
  id: string;
  projectId: string;
  snapshot: string; // JSON timeline state
  savedAt: number;
  label?: string; // Optional user label
  authorId: string;
}

export interface Branch {
  id: string;
  projectId: string;
  name: string;
  baseVersionId: string;
  createdAt: number;
}
