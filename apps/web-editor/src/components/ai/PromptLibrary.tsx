import React, { useState, useCallback } from 'react';
import { BUILT_IN_PROMPTS, applyVariables } from '@corem/ai';
import type { PromptTemplate, PromptCategory, PromptVariable } from '@corem/ai';
import { Star, Search, ChevronRight, X, Copy, ArrowRight } from 'lucide-react';

const CATEGORY_LABELS: Record<PromptCategory, string> = {
  video:    '🎬 Video',
  text:     '📝 Text',
  audio:    '🎙 Audio',
  image:    '🖼 Image',
  workflow: '⚡ Workflow',
  custom:   '✏️ Custom',
};

interface Props {
  onUsePrompt?: (prompt: string) => void;
}

export function PromptLibrary({ onUsePrompt }: Props) {
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState<PromptCategory | 'all'>('all');
  const [selected, setSelected]   = useState<PromptTemplate | null>(null);
  const [vars, setVars]           = useState<Record<string, string>>({});
  const [copied, setCopied]       = useState(false);

  const categories: Array<PromptCategory | 'all'> = ['all', 'video', 'text', 'audio', 'workflow', 'custom'];

  const filtered = BUILT_IN_PROMPTS.filter(p => {
    const matchCat  = category === 'all' || p.category === category;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openPrompt = useCallback((p: PromptTemplate) => {
    setSelected(p);
    const defaults: Record<string, string> = {};
    p.variables.forEach(v => { defaults[v.key] = v.defaultValue ?? ''; });
    setVars(defaults);
    setCopied(false);
  }, []);

  const rendered = selected ? applyVariables(selected.template, vars) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(rendered);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUse = () => {
    if (onUsePrompt) onUsePrompt(rendered);
    setSelected(null);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-3 border-b border-border bg-surface shrink-0">
        <h3 className="text-sm font-semibold mb-2">Prompt Library</h3>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search prompts…"
            className="w-full bg-background border border-border rounded-md pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                category === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-hover text-foreground/70 hover:bg-surface-hover/80'
              }`}
            >
              {cat === 'all' ? '✦ All' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-foreground/40">
            <p className="text-sm">No prompts found</p>
          </div>
        )}

        {filtered.map(p => (
          <button
            key={p.id}
            onClick={() => openPrompt(p)}
            className="w-full text-left p-3 bg-surface border border-border rounded-lg hover:border-primary transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {p.isPinned && <Star size={11} className="text-yellow-500 fill-yellow-500 shrink-0" />}
                  <span className="text-xs font-semibold truncate">{p.name}</span>
                </div>
                <p className="text-[11px] text-foreground/60 leading-snug">{p.description}</p>
                <span className="inline-block mt-1 text-[10px] text-foreground/40 bg-surface-hover px-1.5 py-0.5 rounded">
                  {CATEGORY_LABELS[p.category]}
                </span>
              </div>
              <ChevronRight size={14} className="shrink-0 text-foreground/30 group-hover:text-primary mt-0.5 transition-colors" />
            </div>
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="absolute inset-0 z-30 flex flex-col bg-background border-l border-border animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-3 border-b border-border bg-surface flex items-center justify-between shrink-0">
            <div>
              <h4 className="text-sm font-semibold">{selected.name}</h4>
              <p className="text-[11px] text-foreground/50">{selected.description}</p>
            </div>
            <button onClick={() => setSelected(null)} className="p-1 hover:bg-surface-hover rounded text-foreground/70">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Variables */}
            {selected.variables.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">Variables</p>
                {selected.variables.map((v: PromptVariable) => (
                  <div key={v.key}>
                    <label className="block text-xs font-medium mb-1">{v.label}</label>
                    {v.type === 'select' ? (
                      <select
                        value={vars[v.key] || ''}
                        onChange={e => setVars(prev => ({ ...prev, [v.key]: e.target.value }))}
                        className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                      >
                        {(v.options || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={vars[v.key] || ''}
                        onChange={e => setVars(prev => ({ ...prev, [v.key]: e.target.value }))}
                        placeholder={v.defaultValue}
                        className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Preview */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50 mb-1.5">Preview</p>
              <div className="bg-surface border border-border rounded-md p-3 text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap">
                {rendered}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-3 border-t border-border bg-surface flex gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-surface-hover border border-border rounded-md text-xs font-medium hover:bg-surface-hover/80 transition-colors"
            >
              <Copy size={13} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleUse}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <ArrowRight size={13} />
              Use in Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
