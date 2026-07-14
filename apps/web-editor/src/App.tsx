import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { usePerformanceStore } from './store/performanceStore';

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
  );
}

export default App;
