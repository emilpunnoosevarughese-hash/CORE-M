import { create } from 'zustand';
import { collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../auth/authStore';
import type { CloudProject } from './projectTypes';

interface ProjectStore {
  projects: CloudProject[];
  loading: boolean;
  
  loadProjects: () => Promise<void>;
  createProject: (title: string, timelineState: string) => Promise<string>;
  updateProject: (projectId: string, updates: Partial<CloudProject>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  loading: false,

  loadProjects: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ loading: true });
    
    try {
      const q = query(collection(db, 'projects'), where('ownerId', '==', user.uid));
      const snap = await getDocs(q);
      const projects = snap.docs.map(d => ({ id: d.id, ...d.data() } as CloudProject));
      
      // Check for projects where user is a member but not owner
      const memQ = query(collection(db, 'projects'), where('members', 'array-contains', { uid: user.uid })); // Note: array-contains with objects is tricky in Firestore, usually need a separate array for quick query
      // For now, let's keep it simple with ownerId. Production needs a flat members array for queries.
      
      set({ projects, loading: false });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  createProject: async (title, timelineState) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Not logged in');
    
    const id = `proj_${Date.now()}`;
    const project: CloudProject = {
      id,
      title,
      ownerId: user.uid,
      members: [{ uid: user.uid, role: 'owner', addedAt: Date.now() }],
      timelineState,
      lastSavedAt: Date.now(),
      createdAt: Date.now(),
      isArchived: false,
      tags: []
    };
    
    await setDoc(doc(db, 'projects', id), project);
    set(s => ({ projects: [...s.projects, project] }));
    return id;
  },

  updateProject: async (projectId, updates) => {
    await updateDoc(doc(db, 'projects', projectId), updates);
    set(s => ({
      projects: s.projects.map(p => p.id === projectId ? { ...p, ...updates } : p)
    }));
  },

  deleteProject: async (projectId) => {
    await deleteDoc(doc(db, 'projects', projectId));
    set(s => ({
      projects: s.projects.filter(p => p.id !== projectId)
    }));
  }
}));
