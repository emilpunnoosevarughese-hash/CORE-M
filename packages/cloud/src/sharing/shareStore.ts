import { create } from 'zustand';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../auth/authStore';

export interface ShareLink {
  id: string;
  projectId: string;
  createdBy: string;
  isPublic: boolean;
  expiresAt?: number;
  passwordHash?: string;
}

interface ShareStore {
  createShareLink: (projectId: string, isPublic: boolean, expiresAt?: number) => Promise<string>;
  revokeShareLink: (linkId: string) => Promise<void>;
}

export const useShareStore = create<ShareStore>(() => ({
  createShareLink: async (projectId: string, isPublic: boolean, expiresAt?: number) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Not logged in');
    
    const id = `share_${Math.random().toString(36).substring(2, 10)}`;
    const link: ShareLink = {
      id,
      projectId,
      createdBy: user.uid,
      isPublic,
      expiresAt
    };
    
    await setDoc(doc(db, 'shareLinks', id), link);
    return id;
  },

  revokeShareLink: async (linkId: string) => {
    await deleteDoc(doc(db, 'shareLinks', linkId));
  }
}));
