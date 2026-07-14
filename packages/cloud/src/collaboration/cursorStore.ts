import { create } from 'zustand';
import { ref, onValue, set as firebaseSet, onDisconnect } from 'firebase/database';
import { rtdb } from '../firebase';
import { useAuthStore } from '../auth/authStore';

export interface CursorPosition {
  x: number;
  y: number;
  timestamp: number;
}

interface CursorStore {
  cursors: Record<string, CursorPosition>;
  updateCursor: (projectId: string, x: number, y: number) => void;
  listenToCursors: (projectId: string) => void;
}

export const useCursorStore = create<CursorStore>((set) => ({
  cursors: {},

  updateCursor: (projectId: string, x: number, y: number) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    // Throttle this in practice, but for Phase 15 we send direct to RTDB
    const myCursorRef = ref(rtdb, `cursors/${projectId}/${user.uid}`);
    firebaseSet(myCursorRef, { x, y, timestamp: Date.now() });
    onDisconnect(myCursorRef).remove();
  },

  listenToCursors: (projectId: string) => {
    const cursorsRef = ref(rtdb, `cursors/${projectId}`);
    onValue(cursorsRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        set({ cursors: val });
      } else {
        set({ cursors: {} });
      }
    });
  }
}));
