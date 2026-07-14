export interface CommentReply {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  timestamp: number;
}

export interface TimelineComment {
  id: string;
  projectId: string;
  frame: number;
  clipId?: string; // Optional: attached to a specific clip
  text: string;
  authorId: string;
  authorName: string;
  timestamp: number;
  resolvedAt?: number;
  replies: CommentReply[];
}
