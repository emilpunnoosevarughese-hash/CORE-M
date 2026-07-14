import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuthStore, authProviders } from '@corem/cloud';
import { CloudProjectsPanel } from '../components/cloud/CloudProjectsPanel';
import { DashboardSettings } from '../pages/DashboardSettings';
import { DashboardProfile } from '../pages/DashboardProfile';

export function DashboardLayout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-surface flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold">CORE M</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/dashboard/projects" className="block px-4 py-2 rounded-md hover:bg-surface-hover">Projects</Link>
          <Link to="/dashboard/settings" className="block px-4 py-2 rounded-md hover:bg-surface-hover">Settings</Link>
          <Link to="/dashboard/profile" className="block px-4 py-2 rounded-md hover:bg-surface-hover">Profile</Link>
        </nav>
        <div className="p-4 border-t border-border">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="text-xs truncate">
                  <div className="font-semibold truncate">{user.displayName || 'User'}</div>
                  <div className="text-foreground/50 truncate">{user.email || 'Guest'}</div>
                </div>
              </div>
              <button onClick={() => authProviders.logout()} className="text-xs text-red-500 hover:underline">Log Out</button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
              Sign In
            </button>
          )}
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<CloudProjectsPanel />} />
          <Route path="/projects" element={<CloudProjectsPanel />} />
          <Route path="/settings" element={<DashboardSettings />} />
          <Route path="/profile" element={<DashboardProfile />} />
        </Routes>
      </main>
    </div>
  );
}
