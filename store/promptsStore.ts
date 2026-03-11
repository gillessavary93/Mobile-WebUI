import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Prompt {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

const STORAGE_KEY = 'owui_prompts';

const DEFAULT_PROMPTS: Prompt[] = [
  {
    id: 'default-1',
    title: 'Summarize',
    content: 'Please summarize the following text concisely:\n\n',
    createdAt: 0,
  },
  {
    id: 'default-2',
    title: 'Translate to French',
    content: 'Translate the following text to French:\n\n',
    createdAt: 0,
  },
  {
    id: 'default-3',
    title: 'Fix code',
    content: 'Review and fix any bugs in the following code. Explain the changes:\n\n```\n\n```',
    createdAt: 0,
  },
  {
    id: 'default-4',
    title: 'Write email',
    content: 'Write a professional email about the following topic:\n\n',
    createdAt: 0,
  },
];

interface PromptsState {
  prompts: Prompt[];
  isLoaded: boolean;

  load: () => Promise<void>;
  addPrompt: (title: string, content: string) => Promise<void>;
  updatePrompt: (id: string, title: string, content: string) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
}

export const usePromptsStore = create<PromptsState>((set, get) => ({
  prompts: [],
  isLoaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const saved: Prompt[] = raw ? JSON.parse(raw) : [];
      // Merge defaults + user prompts, defaults first
      const userIds = new Set(saved.map((p) => p.id));
      const merged = [
        ...DEFAULT_PROMPTS.filter((p) => !userIds.has(p.id)),
        ...saved,
      ];
      set({ prompts: merged, isLoaded: true });
    } catch {
      set({ prompts: DEFAULT_PROMPTS, isLoaded: true });
    }
  },

  addPrompt: async (title, content) => {
    const newPrompt: Prompt = {
      id: `prompt-${Date.now()}`,
      title,
      content,
      createdAt: Date.now(),
    };
    const updated = [...get().prompts, newPrompt];
    set({ prompts: updated });
    const userPrompts = updated.filter((p) => p.createdAt > 0);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userPrompts));
  },

  updatePrompt: async (id, title, content) => {
    const updated = get().prompts.map((p) =>
      p.id === id ? { ...p, title, content } : p
    );
    set({ prompts: updated });
    const userPrompts = updated.filter((p) => p.createdAt > 0);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userPrompts));
  },

  deletePrompt: async (id) => {
    const updated = get().prompts.filter((p) => p.id !== id);
    set({ prompts: updated });
    const userPrompts = updated.filter((p) => p.createdAt > 0);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userPrompts));
  },
}));
