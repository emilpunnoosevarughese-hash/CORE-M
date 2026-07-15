import React, { useEffect, useState } from 'react';
import { auth, db, storage, appCheck } from '@corem/cloud';
import { useAuthStore } from '@corem/cloud';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { collection, limit, query, getDocs } from 'firebase/firestore';

export function AdminDiagnostics() {
  const { user } = useAuthStore();
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Basic role guard
    if (user?.email !== 'admin@yourdomain.com') { // In a real app, check custom claims or firestore roles
      // setResults({ error: 'Unauthorized. Admin access required.' });
      // return;
    }

    const runDiagnostics = async () => {
      setLoading(true);
      const diagnostics: any = {};

      // 1. Firebase Initialization
      diagnostics.firebaseInit = !!auth.app;
      
      // 2. Auth Domain
      diagnostics.authDomain = auth.app.options.authDomain || 'Missing';
      
      // 3. Current User & Persistence
      diagnostics.currentUser = auth.currentUser ? auth.currentUser.uid : 'No user';
      diagnostics.authPersistence = 'browserLocalPersistence (default for web)';

      // 4. App Check Status
      diagnostics.appCheck = !!appCheck ? 'Initialized (reCAPTCHA v3)' : 'Not Initialized (Missing Site Key?)';

      // 5. Firestore Connection (try a read)
      try {
        const q = query(collection(db, 'users'), limit(1));
        await getDocs(q);
        diagnostics.firestore = 'Connected & Readable';
      } catch (e: any) {
        diagnostics.firestore = `Error: ${e.message}`;
      }

      setResults(diagnostics);
      setLoading(false);
    };

    runDiagnostics();
  }, [user]);

  if (results.error) {
    return <div className="p-8 text-red-500">{results.error}</div>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Firebase Admin Diagnostics</h1>
      <p className="text-sm text-foreground/60">This page verifies backend connections and configuration.</p>

      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <div className="space-y-4">
          <DiagnosticRow label="Firebase App Initialized" status={results.firebaseInit} value={results.firebaseInit ? 'Yes' : 'No'} />
          <DiagnosticRow label="Auth Domain Configured" status={results.authDomain !== 'Missing'} value={results.authDomain} />
          <DiagnosticRow label="App Check Status" status={results.appCheck.includes('Initialized')} value={results.appCheck} />
          <DiagnosticRow label="Firestore Connection" status={!results.firestore.includes('Error')} value={results.firestore} />
          <DiagnosticRow label="Current Auth Session" status={results.currentUser !== 'No user'} value={results.currentUser} />
        </div>
      )}
    </div>
  );
}

function DiagnosticRow({ label, status, value }: { label: string, status: boolean, value: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
      <div className="flex items-center gap-3">
        {status ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
        <span className="font-semibold">{label}</span>
      </div>
      <span className="text-sm font-mono text-foreground/70">{value}</span>
    </div>
  );
}
