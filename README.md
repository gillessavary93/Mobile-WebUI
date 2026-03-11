# Mobile OWUI

A native mobile client for [Open WebUI](https://github.com/open-webui/open-webui), built with React Native + Expo. Works on **iOS** and **Android**.

---

## Features

- 🔐 **Multiple auth methods** — email/password, API token, or SSO via WebView (Azure AD, OAuth, LDAP)
- 💬 **Full chat interface** — streaming responses with markdown rendering
- 🖼️ **File & image upload** — attach images and documents directly from your device
- 📚 **Conversation history** — browse, continue, and delete past chats
- 🤖 **Model selection** — switch between any model available on your Open WebUI instance
- 🌙 **Dark theme** — faithful to Open WebUI's aesthetics

---

## Screenshots

_Coming soon_

---

## Requirements

- **Open WebUI** instance (self-hosted or cloud) — v0.3.0+
- Node.js 18+
- Expo CLI: `npm install -g expo`
- iOS: Xcode 15+ (for native builds) or Expo Go
- Android: Android Studio or Expo Go

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-org/mobile-owui.git
cd mobile-owui
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npx expo start
```

Then scan the QR code with **Expo Go** (iOS/Android) or press `i` for iOS simulator / `a` for Android emulator.

---

## Configuration

No config file needed. When you first open the app, enter:

1. **Server URL** — your Open WebUI instance (e.g. `https://ai.yourcompany.com`)
2. **Credentials** — email/password, API token, or SSO

Your credentials are stored securely using `expo-secure-store` (iOS Keychain / Android Keystore).

---

## Authentication Methods

| Method | How it works |
|--------|-------------|
| **Email / Password** | Native form, calls `/api/v1/auths/signin` |
| **API Token** | Paste a token from Open WebUI → Settings → Account → API Keys |
| **SSO (WebView)** | Opens your OWUI login page in an embedded browser, captures the session token automatically after login |

---

## Building for production

### EAS Build (recommended)

```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
```

### Local build

```bash
# iOS
npx expo run:ios --configuration Release

# Android
npx expo run:android --variant release
```

---

## Project Structure

```
mobile-owui/
├── app/
│   ├── _layout.tsx          # Root layout
│   ├── index.tsx            # Auth redirect
│   ├── (auth)/
│   │   ├── login.tsx        # Login screen
│   │   └── sso.tsx          # SSO WebView
│   └── (app)/
│       ├── _layout.tsx      # Drawer layout
│       └── chat.tsx         # Main chat screen
├── components/
│   ├── chat/
│   │   ├── ChatHeader.tsx   # Header + model picker
│   │   ├── ChatInput.tsx    # Input bar + attachments
│   │   ├── EmptyChat.tsx    # Welcome screen
│   │   ├── MessageBubble.tsx
│   │   └── MessageList.tsx
│   └── shared/
│       └── SidebarContent.tsx  # Conversation history drawer
├── services/
│   └── owuiApi.ts           # Open WebUI API client (streaming)
├── store/
│   ├── authStore.ts         # Zustand auth state
│   └── chatStore.ts         # Zustand chat/model state
└── theme/
    └── index.ts             # Colors, typography, spacing
```

---

## API Compatibility

This app uses the Open WebUI REST API:

| Endpoint | Usage |
|----------|-------|
| `POST /api/v1/auths/signin` | Email/password login |
| `GET /api/v1/auths/` | Token verification |
| `GET /api/models` | List available models |
| `GET /api/v1/chats/` | List conversations |
| `GET /api/v1/chats/:id` | Load a conversation |
| `DELETE /api/v1/chats/:id` | Delete a conversation |
| `POST /api/chat/completions` | Streaming chat (SSE) |
| `POST /api/v1/files/` | File upload |

---

## Contributing

PRs welcome! Please open an issue first for major changes.

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit your changes
4. Open a pull request

---

## License

MIT — see [LICENSE](LICENSE)

---

## Acknowledgements

- [Open WebUI](https://github.com/open-webui/open-webui) — the server this client connects to
- [Expo](https://expo.dev) — React Native toolchain
- [Zustand](https://github.com/pmndrs/zustand) — state management
