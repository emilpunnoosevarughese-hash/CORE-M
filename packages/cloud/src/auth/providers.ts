import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

const googleProvider = new GoogleAuthProvider();

export const authProviders = {
  loginWithGoogle: () => signInWithPopup(auth, googleProvider),
  
  loginWithEmail: (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass),
  
  registerWithEmail: (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass),
  
  loginAnonymously: () => signInAnonymously(auth),
  
  logout: () => signOut(auth),
  
  resetPassword: (email: string) => sendPasswordResetEmail(auth, email)
};
