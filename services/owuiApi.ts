import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'owui_token';
const SERVER_URL_KEY = 'owui_server_url';

export interface OWUIModel {
  id: string;
  name: string;
  owned_by?: string;
  size?: number;
}

export interface OWUIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  images?: string[];
}

export interface OWUIChat {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  messages: OWUIMessage[];
  models?: string[];
  chat?: { messages: OWUIMessage[] };
}

export interface OWUIChatSummary {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

class OWUIApiService {
  private client: AxiosInstance | null = null;
  private baseUrl: string = '';
  private token: string = '';

  async initialize(): Promise<boolean> {
    try {
      const [url, token] = await Promise.all([
        SecureStore.getItemAsync(SERVER_URL_KEY),
        SecureStore.getItemAsync(TOKEN_KEY),
      ]);

      if (url && token) {
        this.baseUrl = url;
        this.token = token;
        this.createClient();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private createClient() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async saveCredentials(url: string, token: string): Promise<void> {
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    await Promise.all([
      SecureStore.setItemAsync(SERVER_URL_KEY, cleanUrl),
      SecureStore.setItemAsync(TOKEN_KEY, token),
    ]);
    this.baseUrl = cleanUrl;
    this.token = token;
    this.createClient();
  }

  async clearCredentials(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(SERVER_URL_KEY),
      SecureStore.deleteItemAsync(TOKEN_KEY),
    ]);
    this.client = null;
    this.baseUrl = '';
    this.token = '';
  }

  getServerUrl(): string {
    return this.baseUrl;
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  async signIn(serverUrl: string, email: string, password: string): Promise<string> {
    const cleanUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;

    const response = await axios.post(
      `${cleanUrl}/api/v1/auths/signin`,
      { email, password },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const token = response.data?.token;
    if (!token) throw new Error('No token received');

    await this.saveCredentials(cleanUrl, token);
    return token;
  }

  async verifyToken(serverUrl: string, token: string): Promise<boolean> {
    try {
      const cleanUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
      const response = await axios.get(`${cleanUrl}/api/v1/auths/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async signOut(): Promise<void> {
    await this.clearCredentials();
  }

  // ─── Models ────────────────────────────────────────────────────────────────

  async getModels(): Promise<OWUIModel[]> {
    if (!this.client) throw new Error('Not authenticated');
    const response = await this.client.get('/api/models');
    return response.data?.data ?? response.data ?? [];
  }

  // ─── Chats ─────────────────────────────────────────────────────────────────

  async getChats(): Promise<OWUIChatSummary[]> {
    if (!this.client) throw new Error('Not authenticated');
    const response = await this.client.get('/api/v1/chats/');
    return response.data ?? [];
  }

  async getChat(chatId: string): Promise<OWUIChat> {
    if (!this.client) throw new Error('Not authenticated');
    const response = await this.client.get(`/api/v1/chats/${chatId}`);
    return response.data;
  }

  async deleteChat(chatId: string): Promise<void> {
    if (!this.client) throw new Error('Not authenticated');
    await this.client.delete(`/api/v1/chats/${chatId}`);
  }

  async deleteAllChats(): Promise<void> {
    if (!this.client) throw new Error('Not authenticated');
    await this.client.delete('/api/v1/chats/');
  }

  // ─── Streaming Chat ────────────────────────────────────────────────────────

  async *streamChat(
    model: string,
    messages: OWUIMessage[],
    chatId?: string,
    onChatId?: (id: string) => void
  ): AsyncGenerator<string> {
    if (!this.client) throw new Error('Not authenticated');

    const payload = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.images?.length
          ? [
              ...m.images.map((img) => ({ type: 'image_url', image_url: { url: img } })),
              { type: 'text', text: m.content },
            ]
          : m.content,
      })),
      stream: true,
      chat_id: chatId,
    };

    const response = await fetch(`${this.baseUrl}/api/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Chat error: ${response.status} ${err}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);

          // Capture chat ID if returned
          if (parsed.id && onChatId) {
            onChatId(parsed.id);
          }

          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // malformed SSE chunk, skip
        }
      }
    }
  }

  // ─── File Upload ───────────────────────────────────────────────────────────

  async uploadFile(
    uri: string,
    name: string,
    mimeType: string
  ): Promise<{ id: string; url: string }> {
    if (!this.client) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('file', {
      uri,
      name,
      type: mimeType,
    } as unknown as Blob);

    const response = await this.client.post('/api/v1/files/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  }
}

export const owuiApi = new OWUIApiService();
