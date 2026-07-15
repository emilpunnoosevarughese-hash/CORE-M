import { create } from 'zustand';
import { onAuthStateChanged, getRedirectResult, setPersistence, browserLocalPersistence } from 'firebase/auth';
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

// Enforce explicit local persistence for security and reliable session restore
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Silent fail in production
});

// Idle Session Timeout & Token Revocation checking
const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes
let idleTimeoutTimer: ReturnType<typeof setTimeout>;

function resetIdleTimeout() {
  if (idleTimeoutTimer) clearTimeout(idleTimeoutTimer);
  idleTimeoutTimer = setTimeout(async () => {
    console.warn("Session expired due to inactivity.");
    await auth.signOut();
  }, IDLE_TIMEOUT_MS);
}

// Setup activity listeners to reset timeout
if (typeof window !== 'undefined') {
  ['mousemove', 'keydown', 'scroll', 'click'].forEach(evt => 
    window.addEventListener(evt, resetIdleTimeout, { passive: true })
  );
  resetIdleTimeout();
}

// Global listener
getRedirectResult(auth).catch(() => {
  // Diagnostic logs removed for production safety
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // Force token refresh on load to verify it hasn't been revoked
      await user.getIdToken(true);
      resetIdleTimeout();
    } catch (error) {
      // Token was revoked or invalid
      await auth.signOut();
      useAuthStore.getState().setUser(null);
      return;
    }
  }
  useAuthStore.getState().setUser(user);
});
