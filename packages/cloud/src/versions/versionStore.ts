import { create } from 'zustand';
import { collection, doc, setDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../auth/authStore';
import type { ProjectVersion } from './versionTypes';
import { useTimelineStore } from '@corem/timeline';

interface VersionStore {
  versions: ProjectVersion[];
  
  loadVersions: (projectId: string) => Promise<void>;
  createVersion: (projectId: string, label?: string) => Promise<void>;
  restoreVersion: (versionId: string) => Promise<void>;
}

export const useVersionStore = create<VersionStore>((set, get) => ({
  versions: [],

  loadVersions: async (projectId: string) => {
    try {
      const q = query(collection(db, `projects/${projectId}/versions`), orderBy('savedAt', 'desc'));
      const snap = await getDocs(q);
      const versions = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectVersion));
      set({ versions });
    } catch (e) {
      console.error('Failed to load versions', e);
    }
  },

  createVersion: async (projectId: string, label?: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    // Get full current timeline state
    const timelineState = JSON.stringify(useTimelineStore.getState());
    
    const id = `ver_${Date.now()}`;
    const version: ProjectVersion = {
      id,
      projectId,
      snapshot: timelineState,
      savedAt: Date.now(),
      label,
      authorId: user.uid
    };
    
    await setDoc(doc(db, `projects/${projectId}/versions`, id), version);
    set(s => ({ versions: [version, ...s.versions] }));
  },

  restoreVersion: async (versionId: string) => {
    const version = get().versions.find(v => v.id === versionId);
    if (!version) return;
    
    try {
      const stateObj = JSON.parse(version.snapshot);
      // Restore timeline state
      useTimelineStore.setState(stateObj);
    } catch (e) {
      console.error('Failed to parse version snapshot', e);
    }
  }
}));
