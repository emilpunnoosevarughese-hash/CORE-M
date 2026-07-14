import React from 'react';
import { PreviewWindow } from '../preview/PreviewWindow';
import { TimelineContainer } from '../timeline/TimelineContainer';
import { ScopesPanel } from './ScopesPanel';
import { ColorWheels } from './ColorWheels';
import { PrimaryControls } from './PrimaryControls';
import { CurvesEditor } from './CurvesEditor';
import { LutBrowser } from './LutBrowser';
import { useColorStore } from './store';
import { Palette, Sliders, Activity, Image as ImageIcon } from 'lucide-react';

export function ColorWorkspace() {
  const { activeMode, setActiveMode } = useColorStore();
  
  // A real app would get this from router params
  const projectId = '123'; 

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      
      {/* Header */}
      <header className="h-12 border-b border-border bg-surface flex items-center px-4 shrink-0">
        <a href={`/editor/${projectId}`} className="text-sm font-medium hover:text-primary transition-colors flex items-center">
          <span className="mr-2">←</span> Back to Editor
        </a>
        <div className="mx-auto font-semibold text-sm">Color Grading Studio</div>
      </header>

      {/* Top Half: Preview & Scopes */}
      <div className="flex-1 flex min-h-[40vh] border-b border-border">
        {/* Left: Preview */}
        <div className="flex-[2] flex flex-col border-r border-border">
          <PreviewWindow />
        </div>
        
        {/* Right: Scopes */}
        <div className="flex-1 flex flex-col p-2 bg-surface">
          <ScopesPanel />
        </div>
      </div>

      {/* Middle Half: Color Controls */}
      <div className="h-64 flex bg-surface border-b border-border">
        {/* Left Sidebar: Modes */}
        <div className="w-16 flex flex-col items-center py-4 space-y-4 border-r border-border bg-background">
          <button 
            onClick={() => setActiveMode('primary')}
            className={`p-2 rounded-lg transition-colors \${activeMode === 'primary' ? 'bg-primary text-primary-foreground' : 'text-foreground/50 hover:text-foreground hover:bg-surface-hover'}`}
            title="Primary Wheels"
          >
            <Palette size={20} />
          </button>
          <button 
            onClick={() => setActiveMode('curves')}
            className={`p-2 rounded-lg transition-colors \${activeMode === 'curves' ? 'bg-primary text-primary-foreground' : 'text-foreground/50 hover:text-foreground hover:bg-surface-hover'}`}
            title="Curves"
          >
            <Activity size={20} />
          </button>
          <button 
            onClick={() => setActiveMode('lut')}
            className={`p-2 rounded-lg transition-colors \${activeMode === 'lut' ? 'bg-primary text-primary-foreground' : 'text-foreground/50 hover:text-foreground hover:bg-surface-hover'}`}
            title="LUTs"
          >
            <ImageIcon size={20} />
          </button>
        </div>

        {/* Center: Controls */}
        <div className="flex-1 flex overflow-hidden">
          {activeMode === 'primary' && (
            <div className="flex-1 flex">
              <div className="w-64 border-r border-border overflow-y-auto">
                <PrimaryControls />
              </div>
              <div className="flex-1 overflow-y-auto">
                <ColorWheels />
              </div>
            </div>
          )}
          {activeMode === 'curves' && (
            <div className="flex-1 flex overflow-hidden">
              <CurvesEditor />
            </div>
          )}
          {activeMode === 'lut' && (
            <div className="flex-1 flex overflow-y-auto">
              <LutBrowser />
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Timeline */}
      <div className="h-64 bg-background">
        <TimelineContainer />
      </div>

    </div>
  );
}
