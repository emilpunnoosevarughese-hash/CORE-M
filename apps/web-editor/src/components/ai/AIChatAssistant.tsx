import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useAIStore, getAllProviders } from '@corem/ai';
import { Bot, User, Trash2, StopCircle, Send } from 'lucide-react';
import AIWorker from '@corem/ai/workers/ai.worker.ts?worker';

interface Props {
  initialInput?: string;
}

export function AIChatAssistant({ initialInput = '' }: Props) {
  const {
    activeProviderId, activeModelId,
    conversations, activeConversationId,
    addMessage, updateMessage, clearConversation,
    configs, getApiKey,
  } = useAIStore();

  const [input, setInput] = useState(initialInput);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const streamMsgId = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const providers = getAllProviders();
  const currentProvider = providers.find(p => p.id === (activeProviderId || providers[0].id)) || providers[0];

  useEffect(() => {
    if (initialInput) {
      setInput(initialInput);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [initialInput]);

  useEffect(() => {
    workerRef.current = new AIWorker();

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { type, id, payload, error } = e.data;
      if (type === 'CHAT_CHUNK' && id === streamMsgId.current) {
        updateMessage(activeConversationId!, id, (prev: string) => prev + payload);
      } else if (type === 'CHAT_DONE') {
        setIsGenerating(false);
        streamMsgId.current = null;
      } else if (type === 'CHAT_ERROR') {
        if (id === streamMsgId.current) {
          updateMessage(activeConversationId!, id, (prev: string) => prev + `\n\n⚠️ Error: ${error}`);
        }
        setIsGenerating(false);
        streamMsgId.current = null;
      }
    };

    return () => { workerRef.current?.terminate(); };
  }, [activeConversationId, updateMessage]);

  const messages = conversations[activeConversationId || 'default'] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
  }, [input]);

  const stopGeneration = useCallback(() => {
    workerRef.current?.terminate();
    setIsGenerating(false);
    streamMsgId.current = null;
    workerRef.current = new AIWorker();
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const userMsg = (typeof e === 'string' ? e : input).trim();
    if (!userMsg || isGenerating || !currentProvider || !activeModelId) return;

    setInput('');
    addMessage(activeConversationId!, { role: 'user', content: userMsg });

    setIsGenerating(true);
    const assistantMsgId = crypto.randomUUID();
    streamMsgId.current = assistantMsgId;
    useAIStore.getState().addMessage(activeConversationId!, { id: assistantMsgId, role: 'assistant', content: '' });

    const systemPrompt = [
      'You are an expert Video Editor AI assistant built into the CORE M Editor.',
      'CORE M is a professional, non-linear video editor.',
      'Keep responses concise and practical. Format code and settings clearly.',
    ].join(' ');

    const historyMessages = messages.map(m => ({ role: m.role, content: m.content }));
    const requestMessages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: userMsg },
    ];

    const apiKey = await getApiKey(currentProvider.id);
    const config = configs[currentProvider.id];

    workerRef.current?.postMessage({
      type: 'CHAT_STREAM',
      id: assistantMsgId,
      payload: {
        providerId: currentProvider.id,
        apiKey,
        baseUrl: config?.baseUrl,
        request: { model: activeModelId, messages: requestMessages },
      },
    });
  }, [input, isGenerating, currentProvider, activeModelId, activeConversationId, addMessage, messages, getApiKey, configs]);

  return (
    <>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-foreground/40 px-4 py-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Bot size={24} className="text-primary/60" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/60 mb-1">AI Chat Assistant</p>
              <p className="text-xs leading-relaxed">Ask me anything about your project.</p>
            </div>
            <div className="grid grid-cols-1 gap-1.5 w-full">
              {[
                'What are the best export settings for YouTube?',
                'Suggest a color grade for a cinematic look',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => handleSubmit(suggestion)}
                  className="text-left text-[11px] px-3 py-2 bg-surface border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary/20' : 'bg-surface border border-border'}`}>
              {msg.role === 'user' ? <User size={14} className="text-primary" /> : <Bot size={14} className="text-foreground/70" />}
            </div>
            <div className={`max-w-[85%] rounded-xl p-2.5 text-[13px] leading-relaxed ${
              msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-surface border border-border rounded-tl-sm'
            }`}>
              {msg.content || (isGenerating && i === messages.length - 1 && msg.role === 'assistant' ? (
                <div className="flex gap-1 items-center py-0.5">
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              ) : <span className="text-foreground/30 italic">Empty</span>)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {messages.length > 0 && (
        <div className="flex items-center justify-end px-3 pb-1 gap-2 shrink-0">
          <button
            onClick={() => clearConversation(activeConversationId!)}
            className="flex items-center gap-1 text-[11px] text-foreground/40 hover:text-red-500 transition-colors"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
      )}

      <div className="p-3 bg-surface border-t border-border shrink-0">
        <div className="relative flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Message AI…"
            className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary resize-none min-h-[38px] max-h-32 overflow-y-auto leading-relaxed"
            rows={1}
          />
          {isGenerating ? (
            <button
              onClick={stopGeneration}
              className="shrink-0 w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
            >
              <StopCircle size={16} />
            </button>
          ) : (
            <button
              onClick={e => handleSubmit(e)}
              disabled={!input.trim()}
              className="shrink-0 w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={15} />
            </button>
          )}
        </div>
        <p className="text-[10px] text-foreground/30 mt-1.5 text-center">
          {currentProvider.isLocal ? '🔒 Local — no data leaves your device' : '🔑 BYO Key — direct to provider'}
        </p>
      </div>
    </>
  );
}
