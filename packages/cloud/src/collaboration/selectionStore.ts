import { create } from 'zustand';
import { ref, onValue, set as firebaseSet, onDisconnect } from 'firebase/database';
import { rtdb } from '../firebase';
import { useAuthStore } from '../auth/authStore';

export interface SelectionState {
  selectedIds: string[];
  timestamp: number;
}

interface RemoteSelectionStore {
  selections: Record<string, SelectionState>;
  updateSelection: (projectId: string, selectedIds: string[]) => void;
  listenToSelections: (projectId: string) => void;
}

export const useRemoteSelectionStore = create<RemoteSelectionStore>((set) => ({
  selections: {},

  updateSelection: (projectId: string, selectedIds: string[]) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    const mySelRef = ref(rtdb, `selections/${projectId}/${user.uid}`);
    firebaseSet(mySelRef, { selectedIds, timestamp: Date.now() });
    onDisconnect(mySelRef).remove();
  },

  listenToSelections: (projectId: string) => {
    const selRef = ref(rtdb, `selections/${projectId}`);
    onValue(selRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        set({ selections: val });
      } else {
        set({ selections: {} });
      }
    });
  }
}));
