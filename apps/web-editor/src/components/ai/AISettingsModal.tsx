import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAIStore, getAllProviders } from '@corem/ai';
import { X, CheckCircle, AlertTriangle, Loader2, Key, Globe, Info } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const PROVIDER_DOCS: Record<string, string> = {
  openai:     'https://platform.openai.com/api-keys',
  anthropic:  'https://console.anthropic.com/settings/keys',
  gemini:     'https://aistudio.google.com/apikey',
  grok:       'https://console.x.ai/',
  deepseek:   'https://platform.deepseek.com/api_keys',
  openrouter: 'https://openrouter.ai/keys',
  ollama:     'https://ollama.com',
  lmstudio:   'https://lmstudio.ai',
};

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

export function AISettingsModal({ onClose }: Props) {
  const providers = getAllProviders();
  const { configs, setProviderConfig, getApiKey } = useAIStore();

  const [selectedId, setSelectedId]   = useState(providers[0].id);
  const [apiKey, setApiKey]           = useState('');
  const [baseUrl, setBaseUrl]         = useState('');
  const [testStatus, setTestStatus]   = useState<TestStatus>('idle');
  const [errorMsg, setErrorMsg]       = useState('');

  const provider = providers.find(p => p.id === selectedId) || providers[0];

  // Load existing saved config when provider changes
  useEffect(() => {
    let active = true;
    (async () => {
      const savedUrl = configs[selectedId]?.baseUrl || '';
      const savedKey = await getApiKey(selectedId);
      if (!active) return;
      setBaseUrl(savedUrl);
      setApiKey(savedKey);
      setTestStatus('idle');
      setErrorMsg('');
    })();
    return () => { active = false; };
  }, [selectedId, configs, getApiKey]);

  const handleSave = async () => {
    setTestStatus('testing');
    setErrorMsg('');
    try {
      await setProviderConfig(selectedId, apiKey, baseUrl || undefined);

      const ok = await provider.testConnection(apiKey || undefined, baseUrl || undefined);
      setTestStatus(ok ? 'success' : 'error');
      if (!ok) setErrorMsg('Connection failed. Check your API key and/or Base URL.');
    } catch (err: unknown) {
      setTestStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const groupedProviders = {
    Cloud: providers.filter(p => !p.isLocal),
    Local: providers.filter(p => p.isLocal),
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center shrink-0 bg-surface">
          <div>
            <h2 className="text-base font-semibold">AI Studio Settings</h2>
            <p className="text-xs text-foreground/50 mt-0.5">Connect your AI provider. Keys are encrypted locally.</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-hover rounded-lg text-foreground/60 hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar provider list */}
          <div className="w-48 border-r border-border flex flex-col overflow-y-auto shrink-0 bg-background">
            {Object.entries(groupedProviders).map(([group, list]) => (
              <div key={group}>
                <div className="px-3 py-2 text-[10px] uppercase tracking-widest font-semibold text-foreground/40 bg-surface border-b border-border">
                  {group}
                </div>
                {list.map(p => {
                  const hasKey = !!configs[p.id]?.isConfigured;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`w-full text-left px-3 py-2.5 text-xs flex items-center gap-2 transition-colors border-b border-border/50 ${
                        selectedId === p.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-surface-hover text-foreground/80'
                      }`}
                    >
                      <span className="flex-1 font-medium">{p.name}</span>
                      {hasKey && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" title="Key saved" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Config form */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{provider.name}</h3>
              <a
                href={PROVIDER_DOCS[provider.id] || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                <Info size={12} /> Get API Key
              </a>
            </div>

            {/* API Key */}
            {!provider.isLocal && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium">
                  <Key size={12} /> API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Enter your API key…"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary"
                />
                <p className="text-[10px] text-foreground/40">
                  🛡️ Encrypted with AES-GCM before storage. Never sent to CORE M servers.
                </p>
              </div>
            )}

            {/* Base URL */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium">
                <Globe size={12} /> Base URL {!provider.isLocal && '(Optional)'}
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder={
                  provider.id === 'ollama'   ? 'http://localhost:11434/api' :
                  provider.id === 'lmstudio' ? 'http://localhost:1234/v1' :
                  provider.id === 'openai'   ? 'https://api.openai.com/v1' :
                  'Leave blank for default'
                }
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary"
              />
              {provider.id === 'openai' && (
                <p className="text-[10px] text-foreground/40">
                  Override to connect to LM Studio, Together AI, or any OpenAI-compatible endpoint.
                </p>
              )}
              {provider.isLocal && (
                <p className="text-[10px] text-foreground/40">
                  Make sure {provider.name} is running locally before testing.
                </p>
              )}
            </div>

            {/* Models list */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Available Models</label>
              <div className="bg-background border border-border rounded-lg overflow-hidden divide-y divide-border">
                {provider.models.map(m => (
                  <div key={m.id} className="px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">{m.name}</p>
                      <p className="text-[10px] text-foreground/50">
                        {(m.contextWindow / 1000).toFixed(0)}K ctx · {m.capabilities.join(', ')}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-foreground/40">{m.id}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            {testStatus === 'success' && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-500">
                <CheckCircle size={15} />
                <span className="text-xs font-medium">Connected successfully!</span>
              </div>
            )}
            {testStatus === 'error' && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-500">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span className="text-xs">{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface flex justify-between items-center shrink-0">
          <div className="flex gap-2">
            <button 
              onClick={async () => {
                if (confirm('Are you sure you want to reset all AI configurations? This will delete all saved API keys.')) {
                  await useAIStore.getState().resetAll();
                  onClose();
                }
              }} 
              className="px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent"
            >
              Reset All
            </button>
            {configs[selectedId]?.isConfigured && (
              <button 
                onClick={async () => {
                  await useAIStore.getState().removeProviderConfig(selectedId);
                  setApiKey('');
                  setBaseUrl('');
                }} 
                className="px-3 py-2 text-xs text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors border border-transparent"
              >
                Delete Key
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm hover:bg-surface-hover rounded-lg transition-colors border border-transparent">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={testStatus === 'testing'}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {testStatus === 'testing' && <Loader2 size={14} className="animate-spin" />}
              {testStatus === 'testing' ? 'Testing…' : 'Save & Test'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
