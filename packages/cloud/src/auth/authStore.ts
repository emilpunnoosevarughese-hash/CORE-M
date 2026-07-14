import { create } from 'zustand';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isInitializing: false })
}));

// Global listener
getRedirectResult(auth).catch(e => console.error("Redirect error", e));

onAuthStateChanged(auth, (user) => {
  useAuthStore.getState().setUser(user);
});
