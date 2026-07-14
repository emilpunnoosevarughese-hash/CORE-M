import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore, useAuthStore } from '@corem/cloud';
import { useTimelineStore } from '@corem/timeline';
import { FolderPlus, Clock, MoreVertical, Search, Loader2, X, Monitor, Smartphone, Square } from 'lucide-react';

function NewProjectModal({ onClose, onSubmit, creating }: { onClose: () => void, onSubmit: (settings: any) => void, creating: boolean }) {
  const [name, setName] = useState('Untitled Project');
  const [aspect, setAspect] = useState('16:9');
  const [resolution, setResolution] = useState('1080p');
  const [fps, setFps] = useState('30');

  const aspectRatios = [
    { id: '16:9', label: 'Widescreen', icon: <Monitor size={24} /> },
    { id: '9:16', label: 'Vertical', icon: <Smartphone size={24} /> },
    { id: '1:1', label: 'Square', icon: <Square size={24} /> },
    { id: '4:5', label: 'Portrait', icon: <Smartphone size={24} /> }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let width = 1920;
    let height = 1080;
    
    const baseW = resolution === '4K' ? 3840 : resolution === '1080p' ? 1920 : 1280;
    const baseH = resolution === '4K' ? 2160 : resolution === '1080p' ? 1080 : 720;

    if (aspect === '16:9') { width = baseW; height = baseH; }
    else if (aspect === '9:16') { width = baseH; height = baseW; }
    else if (aspect === '1:1') { width = baseH; height = baseH; }
    else if (aspect === '4:5') { width = (baseH * 4) / 5; height = baseH; }

    onSubmit({ name, width, height, fps: parseInt(fps, 10) });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">New Project</h2>
          <button onClick={onClose} className="p-1 text-foreground/50 hover:text-foreground rounded transition-colors"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground/70">Project Name</label>
            <input 
              value={name} onChange={e => setName(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary w-full"
              autoFocus required
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-foreground/70">Aspect Ratio</label>
            <div className="grid grid-cols-4 gap-2">
              {aspectRatios.map(ar => (
                <button
                  key={ar.id} type="button"
                  onClick={() => setAspect(ar.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all ${aspect === ar.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:border-foreground/30 text-foreground/70'}`}
                >
                  {ar.icon}
                  <span className="text-xs font-medium">{ar.id}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground/70">Resolution</label>
              <select value={resolution} onChange={e => setResolution(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary">
                <option value="4K">4K (2160p)</option>
                <option value="1080p">HD (1080p)</option>
                <option value="720p">SD (720p)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground/70">Framerate</label>
              <select value={fps} onChange={e => setFps(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary">
                <option value="24">24 fps (Cinematic)</option>
                <option value="30">30 fps (Standard)</option>
                <option value="60">60 fps (Smooth)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-medium text-foreground/70 hover:bg-foreground/5 transition-colors">Cancel</button>
            <button type="submit" disabled={creating} className="px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
              {creating ? <Loader2 size={16} className="animate-spin" /> : null}
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CloudProjectsPanel() {
  const { user } = useAuthStore();
  const { projects, loading, loadProjects, createProject, deleteProject } = useProjectStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateSubmit = async (settings: any) => {
    setCreating(true);
    try {
      const state = useTimelineStore.getState();
      // Inject new sequence settings into the state before saving
      const seqId = `seq_${Date.now()}`;
      const newSequence = {
        id: seqId,
        projectId: 'proj_temp',
        name: settings.name,
        width: settings.width,
        height: settings.height,
        timebase: { fps: settings.fps },
        duration: 10000,
        trackIds: ['v1', 'a1'],
        markers: []
      };
      
      const newState = {
        ...state,
        sequences: { [seqId]: newSequence },
        activeSequenceId: seqId,
        tracks: {
          'v1': { id: 'v1', sequenceId: seqId, type: 'video', name: 'V1', index: 0, locked: false, hidden: false, solo: false, muted: false, height: 96, clipIds: [], transitions: [] },
          'a1': { id: 'a1', sequenceId: seqId, type: 'audio', name: 'A1', index: 1, locked: false, hidden: false, solo: false, muted: false, height: 96, clipIds: [], transitions: [] }
        },
        clips: {}
      };

      const id = await createProject(settings.name, JSON.stringify(newState));
      useTimelineStore.setState(newState);
      navigate(`/editor/${id}`);
    } catch (e: any) {
      console.error(e);
      alert(`Failed to create project: ${e.message || 'Check browser console for details'}. Please ensure Firestore is enabled and rules allow writing.`);
    } finally {
      setCreating(false);
      setShowModal(false);
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
    <div className="flex flex-col h-full bg-background p-6 relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Cloud Projects</h2>
          <p className="text-sm text-foreground/50">Collaborate in realtime across devices</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:opacity-90 transition-opacity"
        >
          <FolderPlus size={16} />
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
      
      {showModal && <NewProjectModal onClose={() => setShowModal(false)} onSubmit={handleCreateSubmit} creating={creating} />}
    </div>
  );
}
