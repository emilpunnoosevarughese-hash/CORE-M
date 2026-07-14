import { create } from 'zustand';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../auth/authStore';

export interface WorkspaceMember {
  uid: string;
  role: 'owner' | 'admin' | 'member';
  addedAt: number;
}

export interface TeamWorkspace {
  id: string;
  name: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: number;
}

interface WorkspaceStore {
  workspaces: TeamWorkspace[];
  loadWorkspaces: () => Promise<void>;
  createWorkspace: (name: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaces: [],

  loadWorkspaces: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    try {
      const q = query(collection(db, 'workspaces'), where('ownerId', '==', user.uid));
      const snap = await getDocs(q);
      const workspaces = snap.docs.map(d => ({ id: d.id, ...d.data() } as TeamWorkspace));
      set({ workspaces });
    } catch (e) {
      console.error(e);
    }
  },

  createWorkspace: async (name: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    const id = `ws_${Date.now()}`;
    const workspace: TeamWorkspace = {
      id,
      name,
      ownerId: user.uid,
      members: [{ uid: user.uid, role: 'owner', addedAt: Date.now() }],
      createdAt: Date.now()
    };
    
    await setDoc(doc(db, 'workspaces', id), workspace);
    set(s => ({ workspaces: [...s.workspaces, workspace] }));
  }
}));
