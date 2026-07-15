import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  AuthErrorCodes
} from 'firebase/auth';
import { auth } from '../firebase';

const googleProvider = new GoogleAuthProvider();

export class CoreAuthError extends Error {
  constructor(public code: string, public userMessage: string, public technicalDetails?: string) {
    super(userMessage);
    this.name = 'CoreAuthError';
  }
}

const mapFirebaseError = (error: any): CoreAuthError => {
  const code = error?.code || 'auth/unknown';
  const msg = error?.message || 'Unknown error occurred.';
  
  switch (code) {
    case 'auth/unauthorized-domain':
      return new CoreAuthError(
        code,
        'This domain is not authorized for OAuth operations. Please contact the administrator to add this domain to the Firebase Console Authorized Domains list.',
        msg
      );
    case 'auth/popup-blocked':
      return new CoreAuthError(
        code,
        'Your browser blocked the Google Sign-In popup. Please allow popups for this site and try again.',
        msg
      );
    case 'auth/popup-closed-by-user':
      return new CoreAuthError(
        code,
        'Sign-in was cancelled because the popup was closed.',
        msg
      );
    case 'auth/network-request-failed':
      return new CoreAuthError(
        code,
        'Network error. Please check your internet connection or verify if a firewall/adblocker is blocking the request.',
        msg
      );
    case 'auth/invalid-api-key':
      return new CoreAuthError(
        code,
        'Configuration error: Invalid API key. Please check your environment variables.',
        msg
      );
    case 'auth/user-disabled':
      return new CoreAuthError(
        code,
        'This account has been disabled by an administrator.',
        msg
      );
    case 'auth/too-many-requests':
      return new CoreAuthError(
        code,
        'Too many attempts. Please try again later or reset your password.',
        msg
      );
    case 'auth/operation-not-supported-in-this-environment':
    case 'auth/operation-not-supported':
      return new CoreAuthError(
        code,
        'This authentication method is not supported in this environment (e.g., third-party cookies might be blocked).',
        msg
      );
    default:
      return new CoreAuthError(
        code,
        `Authentication failed: ${msg}`,
        msg
      );
  }
};

const withErrorMapping = async <T,>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    throw mapFirebaseError(error);
  }
};

export const authProviders = {
  loginWithGoogle: () => withErrorMapping(() => signInWithPopup(auth, googleProvider)),
  
  loginWithEmail: (email: string, pass: string) => withErrorMapping(() => signInWithEmailAndPassword(auth, email, pass)),
  
  registerWithEmail: (email: string, pass: string) => withErrorMapping(() => createUserWithEmailAndPassword(auth, email, pass)),
  
  logout: () => withErrorMapping(() => signOut(auth)),
  
  resetPassword: (email: string) => withErrorMapping(() => sendPasswordResetEmail(auth, email))
};
