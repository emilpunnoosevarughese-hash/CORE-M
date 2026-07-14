import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { encryptKey, decryptKey, storeEncryptedProviderKey, getEncryptedProviderKey, deleteProviderKey, clearSecureStorage } from './security';
import type { Message } from './providers';

interface ProviderConfig {
  id: string;
  isConfigured: boolean;
  baseUrl?: string;
}

interface AIState {
  configs: Record<string, ProviderConfig>; // ProviderId -> Config
  activeProviderId: string | null;
  activeModelId: string | null;
  
  conversations: Record<string, Message[]>;
  activeConversationId: string | null;
  
  // Actions
  setProviderConfig: (providerId: string, apiKey: string, baseUrl?: string) => Promise<void>;
  removeProviderConfig: (providerId: string) => Promise<void>;
  getApiKey: (providerId: string) => Promise<string>;
  setActiveModel: (providerId: string, modelId: string) => void;
  
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'> & { id?: string }) => void;
  updateMessage: (conversationId: string, messageId: string, content: string | ((prev: string) => string)) => void;
  clearConversation: (conversationId: string) => void;
  resetAll: () => Promise<void>;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      configs: {},
      activeProviderId: null,
      activeModelId: null,
      
      conversations: {
        'default': []
      },
      activeConversationId: 'default',
      
      setProviderConfig: async (providerId, apiKey, baseUrl) => {
        const encryptedKey = await encryptKey(apiKey);
        await storeEncryptedProviderKey(providerId, encryptedKey);
        
        set((state) => ({
          configs: {
            ...state.configs,
            [providerId]: { id: providerId, isConfigured: true, baseUrl }
          },
          activeProviderId: providerId
        }));
      },

      removeProviderConfig: async (providerId) => {
        await deleteProviderKey(providerId);
        set((state) => {
          const newConfigs = { ...state.configs };
          delete newConfigs[providerId];
          return { configs: newConfigs };
        });
      },
      
      getApiKey: async (providerId) => {
        const encryptedKey = await getEncryptedProviderKey(providerId);
        if (!encryptedKey) return '';
        return await decryptKey(encryptedKey);
      },
      
      setActiveModel: (providerId, modelId) => {
        set({ activeProviderId: providerId, activeModelId: modelId });
      },
      
      addMessage: (conversationId, msg) => {
        const newMessage: Message = {
          ...msg,
          id: msg.id || crypto.randomUUID(),
          timestamp: Date.now()
        };
        
        set((state) => {
          const conv = state.conversations[conversationId] || [];
          return {
            conversations: {
              ...state.conversations,
              [conversationId]: [...conv, newMessage]
            }
          };
        });
      },
      
      updateMessage: (conversationId, messageId, content) => {
        set((state) => {
          const conv = state.conversations[conversationId] || [];
          return {
            conversations: {
              ...state.conversations,
              [conversationId]: conv.map(m => m.id === messageId ? { 
                ...m, 
                content: typeof content === 'function' ? content(m.content) : content 
              } : m)
            }
          };
        });
      },
      
      clearConversation: (conversationId) => {
        set((state) => ({
          conversations: {
            ...state.conversations,
            [conversationId]: []
          }
        }));
      },

      resetAll: async () => {
        await clearSecureStorage();
        set({
          configs: {},
          activeProviderId: null,
          activeModelId: null,
          conversations: { 'default': [] },
          activeConversationId: 'default'
        });
      }
    }),
    {
      name: 'corem-ai-store',
      partialize: (state) => ({ 
        configs: state.configs, 
        activeProviderId: state.activeProviderId,
        activeModelId: state.activeModelId,
        conversations: state.conversations
      })
    }
  )
);
