import React, { useEffect, useState, Suspense, lazy, Component, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { usePerformanceStore } from './store/performanceStore';

// Global Error Boundary to catch any runtime crash and show a useful message
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ 
          background: '#0a0a0a', color: '#fff', height: '100vh', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', 
          justifyContent: 'center', fontFamily: 'monospace', padding: '2rem', textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ff4444' }}>⚠ CORE M Error</h1>
          <p style={{ color: '#888', marginBottom: '1rem' }}>Something crashed. Check the console for details.</p>
          <pre style={{ 
            background: '#1a1a1a', padding: '1rem', borderRadius: '8px', 
            maxWidth: '80vw', overflow: 'auto', fontSize: '0.75rem', color: '#ff8888'
          }}>
            {this.state.error.message}
          </pre>
          <button 
            onClick={() => window.location.href = '/'}
            style={{ 
              marginTop: '1.5rem', padding: '0.75rem 2rem', background: '#7c3aed',
              color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem'
            }}
          >
            Go to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy loaded routes
const EditorLayout = lazy(() => import('./layouts/EditorLayout').then(m => ({ default: m.EditorLayout })));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ColorWorkspace = lazy(() => import('./components/color/ColorWorkspace').then(m => ({ default: m.ColorWorkspace })));
const AdminDiagnostics = lazy(() => import('./pages/AdminDiagnostics').then(m => ({ default: m.AdminDiagnostics })));

const RequireAuth = lazy(() => import('./components/auth/RequireAuth').then(m => ({ default: m.RequireAuth })));

const LoadingFallback = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function App() {
  const { detectPerformance } = usePerformanceStore();

  // Theme initialization — respect saved preference, default to dark
  useEffect(() => {
    const saved = localStorage.getItem('corem_theme');
    const isDark = saved ? saved === 'dark' : true;
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    detectPerformance();
  }, [detectPerformance]);

  useEffect(() => {
    // Rehydrate local files from IndexedDB asynchronously
    import('./components/assets/useAssetStore').then(({ useAssetStore }) => {
      useAssetStore.getState().initLocalAssets();
    });
  }, []);

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard/admin/diagnostics" element={
              <RequireAuth>
                <AdminDiagnostics />
              </RequireAuth>
            } />
            <Route path="/dashboard/*" element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            } />
            <Route path="/editor/:projectId" element={
              <RequireAuth>
                <EditorLayout />
              </RequireAuth>
            } />
            <Route path="/editor/:projectId/color" element={
              <RequireAuth>
                <ColorWorkspace />
              </RequireAuth>
            } />
            <Route path="*" element={<div className="h-screen w-screen flex items-center justify-center">404 - Not Found</div>} />
          </Routes>
        </Router>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
