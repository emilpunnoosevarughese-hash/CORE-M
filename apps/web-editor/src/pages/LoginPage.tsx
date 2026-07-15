import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, authProviders } from '@corem/cloud';
import { Loader2, AlertTriangle, Info } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, isInitializing } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  // Store both simple message and diagnostic detail
  const [errorInfo, setErrorInfo] = useState<{ message: string, code?: string, detail?: string } | null>(null);

  // If already logged in, redirect to dashboard in useEffect
  React.useEffect(() => {
    if (!isInitializing && user) {
      navigate('/dashboard');
    }
  }, [isInitializing, user, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorInfo(null);
    try {
      await authProviders.loginWithGoogle();
      navigate('/dashboard');
    } catch (e: any) {
      setErrorInfo({ 
        message: e.message || 'Login failed.', 
        code: e.code, 
        detail: e.technicalDetails 
      });
    } finally {
      setLoading(false);
    }
  };

  // Fallback timeout: if loading takes more than 5 seconds, force-disable initializing so user can see errors or retry
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isInitializing) {
        console.warn('Firebase auth initialization timed out. Forcing UI load.');
        useAuthStore.setState({ isInitializing: false });
        setErrorInfo({
          message: 'Firebase Initialization Timeout.',
          code: 'timeout',
          detail: 'The authentication service took too long to respond. This might be due to a blocked network request or an incorrect configuration.'
        });
      }
    }, 5000);
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
        
        {errorInfo && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg space-y-2">
            <div className="flex items-start gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{errorInfo.message}</div>
            </div>
            
            {/* Advanced Diagnostics Toggle/Display for admins troubleshooting */}
            {(errorInfo.code || errorInfo.detail) && (
              <details className="mt-2 text-xs text-red-400/80 cursor-pointer group">
                <summary className="font-semibold select-none group-hover:text-red-400 transition-colors">
                  View Technical Diagnostics
                </summary>
                <div className="mt-2 p-2 bg-black/20 rounded border border-red-500/10 space-y-1 font-mono break-all">
                  {errorInfo.code && <div><span className="opacity-50">Error Code:</span> {errorInfo.code}</div>}
                  {errorInfo.detail && <div><span className="opacity-50">Details:</span> {errorInfo.detail}</div>}
                  
                  {/* Actionable advice based on code */}
                  {errorInfo.code === 'auth/unauthorized-domain' && (
                    <div className="mt-2 pt-2 border-t border-red-500/10 text-amber-500/90 flex items-start gap-1.5">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>Action: Add {window.location.hostname} to the Authorized Domains list in your Firebase Console (Authentication &gt; Settings &gt; Authorized domains).</span>
                    </div>
                  )}
                  {errorInfo.code === 'auth/invalid-api-key' && (
                    <div className="mt-2 pt-2 border-t border-red-500/10 text-amber-500/90 flex items-start gap-1.5">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>Action: Verify your VITE_FIREBASE_API_KEY environment variable.</span>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Continue with Google
          </button>
          
          {/* Skip Login (Dev Mode) and Guest Login have been permanently removed for production security */}
        </div>
      </div>
    </div>
  );
}
