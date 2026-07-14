import React, { useState } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { PreviewWindow } from '../preview/PreviewWindow';
import { TimelineContainer } from '../timeline/TimelineContainer';
import { ScopesPanel } from './ScopesPanel';
import { ColorWheels } from './ColorWheels';
import { PrimaryControls } from './PrimaryControls';
import { CurvesEditor } from './CurvesEditor';
import { LutBrowser } from './LutBrowser';
import { useColorStore } from './store';
import { Palette, Activity, Image as ImageIcon, ChevronLeft } from 'lucide-react';
import { AudioEngine } from '@corem/audio';
import { DeviceProfiler } from '@corem/render-engine';
import { useParams, Link } from 'react-router-dom';

export function ColorWorkspace() {
  const { activeMode, setActiveMode } = useColorStore();
  const { projectId } = useParams<{ projectId: string }>();

  const handleTimelineInteraction = () => {
    AudioEngine.getInstance().initialize();
    try { DeviceProfiler.getProfile(); } catch(e) {}
  };

  return (
    <div 
      className="flex flex-col h-screen bg-background overflow-hidden"
      onClickCapture={handleTimelineInteraction}
    >
      {/* Header */}
      <header className="h-11 border-b border-border bg-surface flex items-center px-3 shrink-0 gap-3">
        <Link 
          to={`/editor/${projectId}`}
          className="flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Back to Editor</span>
        </Link>
        <div className="w-px h-4 bg-border mx-1" />
        <div className="font-semibold text-sm text-foreground">Color Grading Studio</div>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-foreground/40">
          <span className="bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full font-medium">HDR Ready</span>
        </div>
      </header>

      {/* Main Workspace */}
      <PanelGroup direction="vertical" className="flex-1 overflow-hidden">

        {/* Top: Preview + Scopes */}
        <Panel defaultSize={52} minSize={25} className="flex min-h-0">
          <PanelGroup direction="horizontal" className="w-full h-full">
            {/* Preview */}
            <Panel defaultSize={68} minSize={30} className="flex flex-col min-w-0 h-full">
              <PreviewWindow />
            </Panel>
            <PanelResizeHandle className="w-1 bg-border/50 hover:bg-primary/60 transition-colors cursor-col-resize" />
            {/* Scopes */}
            <Panel defaultSize={32} minSize={20} className="flex flex-col p-2 bg-[#0d0d0f] min-w-0 h-full">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-foreground/40 mb-2 px-1">Video Scopes</div>
              <ScopesPanel />
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="h-1 bg-border/50 hover:bg-primary/60 transition-colors cursor-row-resize" />

        {/* Middle: Color Controls */}
        <Panel defaultSize={26} minSize={15} className="flex min-h-0 bg-[#111114] border-b border-border">
          {/* Mode Sidebar */}
          <div className="w-14 flex flex-col items-center py-3 gap-1 border-r border-border bg-[#0d0d0f] shrink-0">
            <ModeButton icon={<Palette size={17} />} label="Primary" active={activeMode === 'primary'} onClick={() => setActiveMode('primary')} />
            <ModeButton icon={<Activity size={17} />} label="Curves" active={activeMode === 'curves'} onClick={() => setActiveMode('curves')} />
            <ModeButton icon={<ImageIcon size={17} />} label="LUT" active={activeMode === 'lut'} onClick={() => setActiveMode('lut')} />
          </div>

          {/* Content area */}
          <div className="flex-1 flex overflow-hidden min-w-0">
            {activeMode === 'primary' && (
              <div className="flex-1 flex overflow-hidden">
                {/* Sliders */}
                <div className="w-72 border-r border-border overflow-y-auto bg-[#111114]">
                  <PrimaryControls />
                </div>
                {/* Color Wheels */}
                <div className="flex-1 overflow-y-auto bg-[#111114]">
                  <ColorWheels />
                </div>
              </div>
            )}
            {activeMode === 'curves' && (
              <div className="flex-1 overflow-hidden bg-[#111114]">
                <CurvesEditor />
              </div>
            )}
            {activeMode === 'lut' && (
              <div className="flex-1 overflow-y-auto bg-[#111114]">
                <LutBrowser />
              </div>
            )}
          </div>
        </Panel>

        <PanelResizeHandle className="h-1 bg-border/50 hover:bg-primary/60 transition-colors cursor-row-resize" />

        {/* Bottom: Timeline */}
        <Panel defaultSize={22} minSize={12} className="flex flex-col bg-surface overflow-hidden">
          <TimelineContainer />
        </Panel>

      </PanelGroup>
    </div>
  );
}

function ModeButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all ${
        active 
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
          : 'text-foreground/40 hover:text-foreground hover:bg-surface-hover'
      }`}
    >
      {icon}
      <span className="text-[8px] font-medium leading-none">{label}</span>
    </button>
  );
}
