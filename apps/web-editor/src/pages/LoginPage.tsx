import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, authProviders } from '@corem/cloud';
import { Loader2 } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, isInitializing } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to dashboard in useEffect
  React.useEffect(() => {
    if (!isInitializing && user) {
      navigate('/dashboard');
    }
  }, [isInitializing, user, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await authProviders.loginWithGoogle();
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await authProviders.loginAnonymously();
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBypass = () => {
    // For development, mock a user
    useAuthStore.setState({ 
      user: { uid: 'dev-user-123', email: 'dev@local' } as any,
      isAuthenticated: true,
      isInitializing: false 
    });
    navigate('/dashboard');
  };

  // Fallback timeout: if loading takes more than 4 seconds, force-disable initializing so user can see errors or retry
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isInitializing) {
        console.warn('Firebase auth initialization timed out. Forcing UI load.');
        useAuthStore.setState({ isInitializing: false });
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [isInitializing]);

  if (isInitializing) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-xs text-foreground/40">Initializing Firebase Auth...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md p-8 bg-surface rounded-xl border border-border shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">CORE M Cloud</h1>
          <p className="text-foreground/60 text-sm">Professional video editing, anywhere.</p>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded text-sm">{error}</div>}

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Continue with Google
          </button>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-foreground/40 text-xs">or</span>
            <div className="flex-grow border-t border-border"></div>
          </div>
          
          <button
            onClick={handleAnonLogin}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-surface-hover text-foreground font-semibold rounded-lg hover:bg-surface-hover/80 transition-colors border border-border disabled:opacity-50"
          >
            Continue as Guest
          </button>
          
          <button
            onClick={handleBypass}
            className="w-full mt-4 flex items-center justify-center px-4 py-2.5 bg-red-500/10 text-red-500 font-semibold rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20"
          >
            Skip Login (Dev Mode)
          </button>
        </div>
      </div>
    </div>
  );
}
