import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@corem/cloud';
import { Loader2 } from 'lucide-react';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isInitializing } = useAuthStore();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-xs text-foreground/40">Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login, but save the intended location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
