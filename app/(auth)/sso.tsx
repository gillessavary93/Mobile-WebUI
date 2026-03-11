import { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, Typography } from '../../theme';

// JS injected into WebView to extract the token from localStorage after login
const EXTRACT_TOKEN_JS = `
  (function() {
    const token = localStorage.getItem('token');
    if (token) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'token', token }));
    }
  })();
  true;
`;

export default function SSOScreen() {
  const { serverUrl } = useLocalSearchParams<{ serverUrl: string }>();
  const { signInWithToken } = useAuthStore();
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [captured, setCaptured] = useState(false);

  const loginUrl = `${serverUrl}/auth`;

  const handleNavigationChange = (nav: WebViewNavigation) => {
    // Inject token extractor whenever we land on a page that might have it
    if (!captured && nav.url.includes(serverUrl)) {
      webViewRef.current?.injectJavaScript(EXTRACT_TOKEN_JS);
    }
  };

  const handleMessage = async (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'token' && data.token && !captured) {
        setCaptured(true);
        await signInWithToken(serverUrl, data.token);
        router.replace('/(app)/chat');
      }
    } catch {
      // ignore non-JSON messages
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SSO Login</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={styles.loadingText}>Loading login page…</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: loginUrl }}
        style={styles.webview}
        onLoadEnd={() => setIsLoading(false)}
        onNavigationStateChange={handleNavigationChange}
        onMessage={handleMessage}
        injectedJavaScriptBeforeContentLoaded={`
          // Listen for localStorage changes
          const origSetItem = localStorage.setItem.bind(localStorage);
          localStorage.setItem = function(key, value) {
            origSetItem(key, value);
            if (key === 'token') {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'token', token: value }));
            }
          };
          true;
        `}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 8 },
  headerTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  webview: { flex: 1 },
  loadingOverlay: {
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 80,
    zIndex: 10,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
});
