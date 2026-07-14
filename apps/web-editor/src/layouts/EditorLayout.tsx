import React, { useState, useCallback, Suspense, lazy } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTimelineStore } from '@corem/timeline';
import { Users, Video, Music, Type, Check, X, LogOut, Loader2, Link as LinkIcon, Download, Clock, MessageSquare, Plus, FolderPlus, Folder, Settings, Layers, Menu, ArrowLeft, SlidersHorizontal, Mic, FolderOpen, Save, Share2, MousePointer2, Scissors, Copy, Hand, Search, Undo2, Redo2, Maximize2, MonitorPlay, Zap, Package, Box, History } from 'lucide-react';
import { usePluginStore } from '@corem/plugins';
import { DeviceProfiler } from '@corem/render-engine';

// Core modules (Not Lazy)
import { TrackingPanel } from '../components/tracking/TrackingPanel';
import { MaskEditor } from '../components/masking/MaskEditor';
import { ChromaKeyControls } from '../components/effects/ChromaKeyControls';
import { MediaPanel } from '../components/MediaPanel';
import { TimelineContainer } from '../components/timeline/TimelineContainer';
import { PreviewWindow } from '../components/preview/PreviewWindow';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { AudioEngine } from '@corem/audio';
import { AudioMixerPanel } from '../components/audio/AudioMixer';
import { VoiceRecorderDialog } from '../components/audio/VoiceRecorderDialog';
import { EffectInspector } from '../components/effects/EffectInspector';
import { GraphEditor } from '../components/animation/GraphEditor';
import { useSaveProject } from '../hooks/useSaveProject';
import { CollaboratorsBar } from '../components/cloud/CollaboratorsBar';
import { CommentPanel } from '../components/cloud/CommentPanel';
import { VersionHistoryPanel } from '../components/cloud/VersionHistoryPanel';
import { ShareModal } from '../components/cloud/ShareModal';
import { ProxyPromptModal } from '../components/dialogs/ProxyPromptModal';
import { DeviceOptimizerModal } from '../components/dev/DeviceOptimizerModal';

// Heavy modules (Lazy Loaded)
const PluginMarketplace = lazy(() => import('../components/plugins/PluginMarketplace').then(m => ({ default: m.PluginMarketplace })));
const PluginManager = lazy(() => import('../components/plugins/PluginManager').then(m => ({ default: m.PluginManager })));
const ExportDialog = lazy(() => import('../components/export/ExportDialog').then(m => ({ default: m.ExportDialog })));
const RenderQueuePanel = lazy(() => import('../components/export/RenderQueuePanel').then(m => ({ default: m.RenderQueuePanel })));
const EffectsLibraryPanel = lazy(() => import('../components/effects/EffectsLibraryPanel').then(m => ({ default: m.EffectsLibraryPanel })));
const TransitionLibrary = lazy(() => import('../components/transitions/TransitionLibrary').then(m => ({ default: m.TransitionLibrary })));
const AIAssistantPanel = lazy(() => import('../components/ai/AIAssistantPanel').then(m => ({ default: m.AIAssistantPanel })));
const AssetLibraryPanel = lazy(() => import('../components/assets/AssetLibraryPanel').then(m => ({ default: m.AssetLibraryPanel })));
const SettingsModal = lazy(() => import('../components/settings/SettingsModal').then(m => ({ default: m.SettingsModal })));
const TutorialOverlay = lazy(() => import('../components/tutorial/TutorialOverlay').then(m => ({ default: m.TutorialOverlay })));

const LazyFallback = () => <div className="p-4 text-xs text-foreground/40 animate-pulse">Loading module...</div>;

export function EditorLayout() {
  const { projectId } = useParams();
  const { activeSequenceId } = useTimelineStore();
  const [activeTab, setActiveTab] = useState<'media' | 'effects' | 'audio' | 'transitions' | 'ai' | 'assets' | 'comments' | 'versions' | 'tracking' | 'masking'>('media');
  const [showMixer, setShowMixer] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeviceOptimizer, setShowDeviceOptimizer] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('corem_tutorial_seen'));
  const { isMarketplaceOpen, isPluginManagerOpen, toggleMarketplace, togglePluginManager } = usePluginStore();
  const { saveProject, isSaving, savedPath } = useSaveProject(projectId || 'untitled');

  useKeyboardShortcuts();

  const handleTimelineInteraction = () => {
    // Initialize Web Audio API on first user gesture
    AudioEngine.getInstance().initialize();
    
    // Initialize Device Profiler on first interaction
    try {
      DeviceProfiler.getProfile();
    } catch(e) {}
  };

  // Prefetch logic
  const prefetchExport = useCallback(() => {
    import('../components/export/ExportDialog');
  }, []);
  
  const prefetchEffects = useCallback(() => {
    import('../components/effects/EffectsLibraryPanel');
  }, []);
  
  const prefetchAI = useCallback(() => {
    import('../components/ai/AIAssistantPanel');
  }, []);

  return (
    <div 
      className="flex flex-col h-screen bg-background text-foreground overflow-hidden"
      onClickCapture={handleTimelineInteraction}
    >
      {/* Top Toolbar */}
      <header className="h-12 border-b border-border bg-surface flex items-center justify-between px-3 shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/dashboard" className="p-1.5 hover:bg-surface-hover rounded-md transition-colors shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <span className="font-semibold text-sm truncate hidden md:block">{projectId ? `Project – ${projectId}` : 'Untitled Project'}</span>
          {savedPath && <span className="text-[10px] text-foreground/40 truncate hidden lg:block">📁 {savedPath}</span>}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {projectId && <CollaboratorsBar projectId={projectId} onShareClick={() => setShowShare(true)} />}
          <Link to={`/editor/${projectId}/color`} className="px-3 py-1.5 text-xs font-medium hover:bg-surface-hover rounded-md transition-colors hidden md:block">
            Color
          </Link>
          <button
            onClick={saveProject}
            disabled={isSaving}
            title="Save Project"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium hover:bg-surface-hover rounded-md transition-colors border border-border disabled:opacity-50"
          >
            <Save size={13} />
            <span className="hidden sm:inline">{isSaving ? 'Saving…' : 'Save'}</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 hover:bg-surface-hover rounded-md text-foreground/70 hover:text-foreground transition-colors"
            title="Settings (Dark Theme & more)"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={() => setShowDeviceOptimizer(true)}
            className="p-1.5 hover:bg-surface-hover rounded-md text-yellow-500/80 hover:text-yellow-500 transition-colors"
            title="Optimize Performance"
          >
            <Zap size={16} />
          </button>
          <button
            onClick={() => setShowTutorial(true)}
            className="p-1.5 hover:bg-surface-hover rounded-md text-foreground/70 hover:text-foreground transition-colors"
            title="Help / Tutorial"
          >
            <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">?</div>
          </button>
          <button
            onClick={() => setShowRecorder(true)}
            className="p-1.5 hover:bg-surface-hover rounded-md text-red-500 hover:text-red-400 transition-colors"
            title="Voice Record"
          >
            <Mic size={16} />
          </button>
          <button
            onClick={() => setShowExport(true)}
            onMouseEnter={prefetchExport}
            className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:opacity-90 transition-opacity"
          >
            Export
          </button>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* Left Icon Rail */}
        <aside className="w-14 border-r border-border bg-surface flex-shrink-0 hidden md:flex flex-col items-center py-2 gap-1 z-20 overflow-y-auto overflow-x-hidden">
          {([
            { id: 'media',       icon: <Layers size={20} />,         title: 'Media' },
            { id: 'assets',      icon: <FolderOpen size={20} />,     title: 'Assets' },
            { id: 'effects',     icon: <Settings size={20} />,       title: 'Effects', onHover: prefetchEffects },
            { id: 'masking',     icon: <Scissors size={20} />,       title: 'Masking' },
            { id: 'tracking',    icon: <MousePointer2 size={20} />,  title: 'Motion Tracking' },
            { id: 'transitions', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>, title: 'Transitions' },
            { id: 'ai',          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>, title: 'AI Studio', onHover: prefetchAI },
          ] as { id: string; icon: React.ReactNode; title: string; onHover?: () => void }[]).map(({ id, icon, title, onHover }) => (
            <button
              key={id}
              title={title}
              onClick={() => setActiveTab(id as any)}
              onMouseEnter={onHover}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors shrink-0 ${
                activeTab === id ? 'bg-primary/15 text-primary' : 'text-foreground/50 hover:bg-surface-hover hover:text-foreground'
              }`}
            >
              {icon}
            </button>
          ))}
          
          {/* Cloud Tools */}
          <div className="flex flex-col items-center gap-4 py-4 border-b border-border w-full">
            <button 
              onClick={() => setActiveTab('comments')}
              className={`p-3 rounded-xl transition-all relative ${activeTab === 'comments' ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-foreground/60 hover:text-foreground hover:bg-surface-hover'}`}
              title="Comments (C)"
            >
              <MessageSquare size={22} />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-surface"></div>
            </button>
            <button 
              onClick={() => setActiveTab('versions')}
              className={`p-3 rounded-xl transition-all ${activeTab === 'versions' ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-foreground/60 hover:text-foreground hover:bg-surface-hover'}`}
              title="Version History (H)"
            >
              <Clock size={22} />
            </button>
          </div>

          {/* Plugin Tools */}
          <div className="flex flex-col items-center gap-4 py-4 border-b border-border w-full">
            <button 
              onClick={toggleMarketplace}
              className="p-3 rounded-xl transition-all text-foreground/60 hover:text-foreground hover:bg-surface-hover"
              title="Plugin Marketplace"
            >
              <Package size={22} />
            </button>
            <button 
              onClick={togglePluginManager}
              className="p-3 rounded-xl transition-all text-foreground/60 hover:text-foreground hover:bg-surface-hover"
              title="Manage Plugins"
            >
              <Box size={22} />
            </button>
          </div>

          <div className="flex-1" />
          <button
            title="Audio Mixer"
            onClick={() => setShowMixer(m => !m)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors mb-2 shrink-0 ${
              showMixer ? 'bg-primary/15 text-primary' : 'text-foreground/50 hover:bg-surface-hover hover:text-foreground'
            }`}
          >
            <SlidersHorizontal size={20} />
          </button>
        </aside>

        {/* Sidebar Content Panel */}
        <aside className="w-72 border-r border-border bg-surface flex-shrink-0 hidden md:flex flex-col z-10">
          <Suspense fallback={<LazyFallback />}>
            {activeTab === 'media'       && <MediaPanel />}
            {activeTab === 'effects'     && (
              <div className="flex flex-col h-full bg-surface">
                <div className="p-3 border-b border-border font-semibold text-sm flex items-center justify-between shrink-0">
                  Effects Library
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                  <EffectsLibraryPanel />
                  <div className="p-4 bg-background border border-border rounded-lg m-4 mt-0">
                    <h4 className="text-sm font-semibold mb-4 text-green-500">Chroma Key</h4>
                    <ChromaKeyControls />
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'masking'     && <MaskEditor />}
            {activeTab === 'tracking'    && <TrackingPanel />}
            {activeTab === 'transitions' && <TransitionLibrary />}
            {activeTab === 'ai'          && <AIAssistantPanel />}
            {activeTab === 'assets'      && <AssetLibraryPanel />}
            {activeTab === 'comments'    && projectId && <CommentPanel projectId={projectId} />}
            {activeTab === 'versions'    && projectId && <VersionHistoryPanel projectId={projectId} />}
          </Suspense>
          
          {/* Audio Mixer anchored at the bottom of the sidebar */}
          {showMixer && (
            <div className="mt-auto h-40 shrink-0 border-t border-border bg-background shadow-[0_-5px_15px_rgba(0,0,0,0.2)]">
              <AudioMixerPanel />
            </div>
          )}
        </aside>

        {/* Center: Preview + Timeline stacked, fills remaining space */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <PreviewWindow />
          <TimelineContainer />
        </main>

        {/* Inspector Panel */}
        <aside className="w-64 flex flex-col border-l border-border bg-surface shrink-0 hidden xl:flex overflow-hidden">
          <div className="h-10 flex items-center px-4 border-b border-border text-xs font-semibold text-foreground/60 uppercase tracking-wider bg-surface-hover/30 shrink-0">
            Inspector
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <EffectInspector />
          </div>
          <div className="h-48 flex flex-col shrink-0 border-t border-border">
            <GraphEditor />
          </div>
        </aside>
      </div>

      {/* Status Bar */}
      <footer className="h-5 bg-surface border-t border-border flex items-center px-4 text-[10px] text-foreground/40 hidden md:flex shrink-0 gap-4">
        <span>CORE M v1.0</span>
        {savedPath && <span>📁 {savedPath}</span>}
        <span className="ml-auto">Ready</span>
      </footer>

      <Suspense fallback={null}>
        <RenderQueuePanel />

        {isMarketplaceOpen && <PluginMarketplace onClose={() => toggleMarketplace()} />}
        {isPluginManagerOpen && <PluginManager onClose={() => togglePluginManager()} />}
        {showExport && <ExportDialog isOpen={showExport} onClose={() => setShowExport(false)} sequenceId={activeSequenceId!} />}
        {showShare && <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} projectId={projectId!} />}
        {showRecorder && <VoiceRecorderDialog isOpen={showRecorder} onClose={() => setShowRecorder(false)} />}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        {showTutorial && <TutorialOverlay onClose={() => { setShowTutorial(false); localStorage.setItem('corem_tutorial_seen', 'true'); }} />}
        {showDeviceOptimizer && <DeviceOptimizerModal onClose={() => setShowDeviceOptimizer(false)} />}
      </Suspense>

      <ProxyPromptModal />
    </div>
  );
}
