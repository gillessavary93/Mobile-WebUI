import { create } from 'zustand';
import { owuiApi, OWUIChat, OWUIChatSummary, OWUIMessage } from '../services/owuiApi';

interface ChatState {
  chats: OWUIChatSummary[];
  currentChat: OWUIChat | null;
  currentMessages: OWUIMessage[];
  selectedModel: string;
  availableModels: { id: string; name: string }[];
  isStreaming: boolean;
  isLoadingChats: boolean;
  error: string | null;

  loadChats: () => Promise<void>;
  loadChat: (chatId: string) => Promise<void>;
  newChat: () => void;
  sendMessage: (content: string, images?: string[]) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  loadModels: () => Promise<void>;
  setModel: (modelId: string) => void;
  clearError: () => void;
}

let streamAbortController: AbortController | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChat: null,
  currentMessages: [],
  selectedModel: '',
  availableModels: [],
  isStreaming: false,
  isLoadingChats: false,
  error: null,

  loadModels: async () => {
    try {
      const models = await owuiApi.getModels();
      const mapped = models.map((m) => ({ id: m.id, name: m.name ?? m.id }));
      set({ availableModels: mapped });
      if (!get().selectedModel && mapped.length > 0) {
        set({ selectedModel: mapped[0].id });
      }
    } catch (err) {
      console.error('Failed to load models', err);
    }
  },

  setModel: (modelId) => set({ selectedModel: modelId }),

  loadChats: async () => {
    set({ isLoadingChats: true, error: null });
    try {
      const chats = await owuiApi.getChats();
      set({ chats, isLoadingChats: false });
    } catch (err) {
      set({ error: 'Failed to load chats', isLoadingChats: false });
    }
  },

  loadChat: async (chatId) => {
    try {
      const chat = await owuiApi.getChat(chatId);
      const messages = chat.chat?.messages ?? chat.messages ?? [];
      set({ currentChat: chat, currentMessages: messages });
    } catch (err) {
      set({ error: 'Failed to load chat' });
    }
  },

  newChat: () => {
    if (streamAbortController) {
      streamAbortController.abort();
      streamAbortController = null;
    }
    set({ currentChat: null, currentMessages: [], isStreaming: false });
  },

  sendMessage: async (content, images) => {
    const { selectedModel, currentMessages, currentChat } = get();
    if (!selectedModel || !content.trim()) return;

    const userMsg: OWUIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      images,
      timestamp: Date.now(),
    };

    const assistantMsg: OWUIMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    const updatedMessages = [...currentMessages, userMsg, assistantMsg];
    set({ currentMessages: updatedMessages, isStreaming: true, error: null });

    try {
      let assistantContent = '';
      let chatId = currentChat?.id;

      const stream = owuiApi.streamChat(
        selectedModel,
        [...currentMessages, userMsg],
        chatId,
        (id) => {
          chatId = id;
        }
      );

      for await (const chunk of stream) {
        assistantContent += chunk;
        set((state) => ({
          currentMessages: state.currentMessages.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: assistantContent } : m
          ),
        }));
      }

      set({ isStreaming: false });

      // Reload chat list to reflect new/updated chat title
      setTimeout(() => get().loadChats(), 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Stream failed';
      set({
        isStreaming: false,
        error: msg,
        currentMessages: get().currentMessages.filter(
          (m) => m.id !== assistantMsg.id
        ),
      });
    }
  },

  deleteChat: async (chatId) => {
    try {
      await owuiApi.deleteChat(chatId);
      set((state) => ({
        chats: state.chats.filter((c) => c.id !== chatId),
        currentChat:
          state.currentChat?.id === chatId ? null : state.currentChat,
        currentMessages:
          state.currentChat?.id === chatId ? [] : state.currentMessages,
      }));
    } catch {
      set({ error: 'Failed to delete chat' });
    }
  },

  clearError: () => set({ error: null }),
}));
