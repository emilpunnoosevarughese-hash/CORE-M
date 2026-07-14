import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore, useAuthStore } from '@corem/cloud';
import { useTimelineStore } from '@corem/timeline';
import { FolderPlus, Clock, MoreVertical, Search, Loader2 } from 'lucide-react';

export function CloudProjectsPanel() {
  const { user } = useAuthStore();
  const { projects, loading, loadProjects, createProject, deleteProject } = useProjectStore();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateNew = async () => {
    setCreating(true);
    try {
      const state = JSON.stringify(useTimelineStore.getState());
      const id = await createProject('Untitled Project', state);
      navigate(`/editor/${id}`);
    } catch (e: any) {
      console.error(e);
      alert(`Failed to create project: ${e.message || 'Check browser console for details'}. Please ensure Firestore is enabled and rules allow writing.`);
    } finally {
      setCreating(false);
    }
  };

  const handleOpen = (id: string, stateStr: string) => {
    try {
      const state = JSON.parse(stateStr);
      useTimelineStore.setState(state);
      navigate(`/editor/${id}`);
    } catch (e) {
      console.error('Failed to parse project state', e);
    }
  };

  const filtered = projects.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  if (!user) {
    return (
      <div className="p-8 text-center text-foreground/50">
        Please sign in to view cloud projects.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Cloud Projects</h2>
          <p className="text-sm text-foreground/50">Collaborate in realtime across devices</p>
        </div>
        <button
          onClick={handleCreateNew}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {creating ? <Loader2 className="animate-spin" size={16} /> : <FolderPlus size={16} />}
          New Project
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-foreground/50">
          No projects found. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
          {filtered.map(p => (
            <div
              key={p.id}
              onClick={() => handleOpen(p.id, p.timelineState)}
              className="bg-surface border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group flex flex-col"
            >
              <div className="aspect-video bg-[#1a1a1a] flex items-center justify-center relative">
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-foreground/20 font-bold text-3xl">CORE M</div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {p.members.slice(0, 3).map((m, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-primary/20 border border-background flex items-center justify-center text-[10px] font-bold" title={m.role}>
                      {m.uid.substring(0, 2).toUpperCase()}
                    </div>
                  ))}
                  {p.members.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-surface border border-background flex items-center justify-center text-[10px] font-bold">
                      +{p.members.length - 3}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium truncate">{p.title}</h3>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (window.confirm('Delete this project forever?')) {
                        deleteProject(p.id);
                      }
                    }}
                    className="p-1 text-foreground/40 hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-foreground/50">
                  <Clock size={12} />
                  <span>Edited {new Date(p.lastSavedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
