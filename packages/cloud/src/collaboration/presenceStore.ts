import { create } from 'zustand';
import { ref, onValue, set as firebaseSet, onDisconnect, remove } from 'firebase/database';
import { rtdb } from '../firebase';
import { useAuthStore } from '../auth/authStore';

export interface Collaborator {
  uid: string;
  displayName: string;
  photoURL?: string;
  color: string;
  lastActive: number;
}

interface PresenceStore {
  collaborators: Record<string, Collaborator>;
  
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

export const usePresenceStore = create<PresenceStore>((set) => {
  let currentProjectRef: any = null;

  return {
    collaborators: {},

    joinProject: (projectId: string) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const projectPresenceRef = ref(rtdb, `presence/${projectId}`);
      const myPresenceRef = ref(rtdb, `presence/${projectId}/${user.uid}`);
      
      currentProjectRef = myPresenceRef;

      // Set myself as online - Firebase RTDB does not allow undefined values, use null
      const me: Collaborator = {
        uid: user.uid,
        displayName: user.displayName || user.email || 'Anonymous',
        photoURL: user.photoURL || null,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        lastActive: Date.now()
      };

      // Strip out any null/undefined values to be safe with Firebase RTDB
      const meClean = Object.fromEntries(
        Object.entries(me).filter(([, v]) => v !== undefined && v !== null || typeof v === 'number' || typeof v === 'string' && v.length > 0)
      );
      
      // Write presence — silently ignore permission_denied (user not authenticated or rules not set)
      firebaseSet(myPresenceRef, meClean).catch(() => {});
      onDisconnect(myPresenceRef).remove().catch(() => {});

      // Listen for others — silently ignore permission errors
      try {
        onValue(projectPresenceRef, (snapshot) => {
          const val = snapshot.val();
          if (val) {
            set({ collaborators: val });
          } else {
            set({ collaborators: {} });
          }
        });
      } catch (e) {
        // Permission denied — collaboration features unavailable, silently degrade
      }
    },

    leaveProject: (_projectId: string) => {
      if (currentProjectRef) {
        remove(currentProjectRef).catch(() => {});
        currentProjectRef = null;
      }
      set({ collaborators: {} });
    }
  };
});
