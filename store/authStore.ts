import { create } from 'zustand';
import { owuiApi } from '../services/owuiApi';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  serverUrl: string;
  error: string | null;

  initialize: () => Promise<void>;
  signIn: (serverUrl: string, email: string, password: string) => Promise<void>;
  signInWithToken: (serverUrl: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  serverUrl: '',
  error: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const ok = await owuiApi.initialize();
      set({
        isAuthenticated: ok,
        serverUrl: ok ? owuiApi.getServerUrl() : '',
        isLoading: false,
      });
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  signIn: async (serverUrl, email, password) => {
    set({ isLoading: true, error: null });
    try {
      await owuiApi.signIn(serverUrl, email, password);
      set({
        isAuthenticated: true,
        serverUrl: owuiApi.getServerUrl(),
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Authentication failed';
      set({ isLoading: false, error: msg, isAuthenticated: false });
      throw err;
    }
  },

  signInWithToken: async (serverUrl, token) => {
    set({ isLoading: true, error: null });
    try {
      const valid = await owuiApi.verifyToken(serverUrl, token);
      if (!valid) throw new Error('Invalid token');
      await owuiApi.saveCredentials(serverUrl, token);
      set({
        isAuthenticated: true,
        serverUrl: owuiApi.getServerUrl(),
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Token validation failed';
      set({ isLoading: false, error: msg, isAuthenticated: false });
      throw err;
    }
  },

  signOut: async () => {
    await owuiApi.signOut();
    set({ isAuthenticated: false, serverUrl: '', error: null });
  },

  clearError: () => set({ error: null }),
}));
