import { create } from 'zustand';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../auth/authStore';
import type { TimelineComment, CommentReply } from './commentTypes';

interface CommentStore {
  comments: TimelineComment[];
  subscribeToComments: (projectId: string) => () => void;
  addComment: (projectId: string, frame: number, text: string, clipId?: string) => Promise<void>;
  addReply: (projectId: string, commentId: string, text: string) => Promise<void>;
  resolveComment: (projectId: string, commentId: string) => Promise<void>;
  deleteComment: (projectId: string, commentId: string) => Promise<void>;
}

export const useCommentStore = create<CommentStore>((set) => ({
  comments: [],

  subscribeToComments: (projectId: string) => {
    const q = query(collection(db, `projects/${projectId}/comments`), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const comments = snap.docs.map(d => ({ id: d.id, ...d.data() } as TimelineComment));
      set({ comments });
    });
    return unsubscribe;
  },

  addComment: async (projectId, frame, text, clipId) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    const id = `comment_${Date.now()}`;
    const comment: TimelineComment = {
      id,
      projectId,
      frame,
      clipId,
      text,
      authorId: user.uid,
      authorName: user.displayName || user.email || 'Anonymous',
      timestamp: Date.now(),
      replies: []
    };
    
    await setDoc(doc(db, `projects/${projectId}/comments`, id), comment);
  },

  addReply: async (projectId, commentId, text) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    const reply: CommentReply = {
      id: `reply_${Date.now()}`,
      authorId: user.uid,
      authorName: user.displayName || user.email || 'Anonymous',
      text,
      timestamp: Date.now()
    };
    
    // In a real app we'd use Firestore arrayUnion or subcollections for better concurrency
    // For Phase 15 we fetch and append
    useCommentStore.setState(s => {
      const comment = s.comments.find(c => c.id === commentId);
      if (comment) {
        const updatedReplies = [...comment.replies, reply];
        updateDoc(doc(db, `projects/${projectId}/comments`, commentId), { replies: updatedReplies });
        return {
          comments: s.comments.map(c => c.id === commentId ? { ...c, replies: updatedReplies } : c)
        };
      }
      return s;
    });
  },

  resolveComment: async (projectId, commentId) => {
    await updateDoc(doc(db, `projects/${projectId}/comments`, commentId), { resolvedAt: Date.now() });
  },

  deleteComment: async (projectId, commentId) => {
    await deleteDoc(doc(db, `projects/${projectId}/comments`, commentId));
  }
}));
