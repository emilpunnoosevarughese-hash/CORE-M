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

// Lazy load diagnostics panel
const DiagnosticsPanel = lazy(() => import('./components/dev/DiagnosticsPanel').then(m => ({ default: m.DiagnosticsPanel })));

const LoadingFallback = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function App() {
  const { detectPerformance } = usePerformanceStore();
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Theme initialization — respect saved preference, default to dark
  useEffect(() => {
    const saved = localStorage.getItem('corem_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : (prefersDark || true); // default dark
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  useEffect(() => {
    detectPerformance();
  }, [detectPerformance]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle diagnostics on Ctrl+Shift+D (or Cmd+Shift+D)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setShowDiagnostics(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        {showDiagnostics && (
          <Suspense fallback={null}>
            <DiagnosticsPanel />
          </Suspense>
        )}
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard/*" element={<DashboardLayout />} />
            <Route path="/editor/:projectId" element={<EditorLayout />} />
            <Route path="/editor/:projectId/color" element={<ColorWorkspace />} />
            <Route path="*" element={<div className="h-screen w-screen flex items-center justify-center">404 - Not Found</div>} />
          </Routes>
        </Router>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
