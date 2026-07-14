import React, { useState, useEffect } from 'react';
import { useAIStore, getAllProviders } from '@corem/ai';
import { Settings, Bot, Video, Music, Image, Type, BookOpen } from 'lucide-react';
import { AISettingsModal } from './AISettingsModal';
import { PromptLibrary } from './PromptLibrary';
import { AIChatAssistant } from './AIChatAssistant';
import { AIVideoAssistant } from './AIVideoAssistant';
import { AIAudioAssistant } from './AIAudioAssistant';
import { AIImageAssistant } from './AIImageAssistant';
import { AISubtitleAssistant } from './AISubtitleAssistant';

type Tab = 'chat' | 'video' | 'audio' | 'image' | 'subtitle' | 'prompts';

export function AIAssistantPanel() {
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab]       = useState<Tab>('chat');
  const [chatInput, setChatInput]       = useState('');
  
  const {
    activeProviderId, activeModelId, setActiveModel,
  } = useAIStore();

  const providers = getAllProviders();
  const currentProvider = providers.find(p => p.id === (activeProviderId || providers[0].id)) || providers[0];
  const availableModels = currentProvider?.models || [];

  // Set default model
  useEffect(() => {
    if (currentProvider && availableModels.length > 0 && (!activeModelId || !availableModels.find(m => m.id === activeModelId))) {
      setActiveModel(currentProvider.id, availableModels[0].id);
    }
  }, [currentProvider, availableModels, activeModelId, setActiveModel]);

  const handlePromptUse = (prompt: string) => {
    setChatInput(prompt);
    setActiveTab('chat');
  };

  const tabs = [
    { id: 'chat', icon: <Bot size={12} />, label: 'Chat' },
    { id: 'video', icon: <Video size={12} />, label: 'Video' },
    { id: 'audio', icon: <Music size={12} />, label: 'Audio' },
    { id: 'image', icon: <Image size={12} />, label: 'Image' },
    { id: 'subtitle', icon: <Type size={12} />, label: 'Captions' },
    { id: 'prompts', icon: <BookOpen size={12} />, label: 'Prompts' },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border bg-surface shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-primary" />
            <span className="text-sm font-semibold">AI Studio</span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 hover:bg-surface-hover rounded transition-colors text-foreground/60 hover:text-foreground"
            title="AI Settings"
          >
            <Settings size={15} />
          </button>
        </div>

        {/* Provider + Model */}
        <div className="flex gap-2 items-center">
          <select
            value={currentProvider.id}
            onChange={e => {
              const p = providers.find(x => x.id === e.target.value);
              if (p && p.models[0]) setActiveModel(p.id, p.models[0].id);
            }}
            className="flex-1 min-w-0 bg-background border border-border rounded px-2 py-1 text-[11px] focus:outline-none focus:border-primary"
          >
            {providers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={activeModelId || ''}
            onChange={e => setActiveModel(currentProvider.id, e.target.value)}
            className="flex-1 min-w-0 bg-background border border-border rounded px-2 py-1 text-[11px] focus:outline-none focus:border-primary"
          >
            {availableModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-2 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-foreground/60 hover:bg-surface-hover'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'chat' && <AIChatAssistant initialInput={chatInput} />}
      {activeTab === 'video' && <AIVideoAssistant />}
      {activeTab === 'audio' && <AIAudioAssistant />}
      {activeTab === 'image' && <AIImageAssistant />}
      {activeTab === 'subtitle' && <AISubtitleAssistant />}
      
      {activeTab === 'prompts' && (
        <div className="flex-1 overflow-hidden relative">
          <PromptLibrary onUsePrompt={handlePromptUse} />
        </div>
      )}

      {showSettings && <AISettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
