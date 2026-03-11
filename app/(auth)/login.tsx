import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

type Tab = 'credentials' | 'token' | 'sso';

export default function LoginScreen() {
  const { signIn, signInWithToken, isLoading, error, clearError } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>('credentials');
  const [serverUrl, setServerUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleCredentialLogin = async () => {
    if (!serverUrl.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    try {
      await signIn(serverUrl.trim(), email.trim(), password);
      router.replace('/(app)/chat');
    } catch {
      // error shown via store
    }
  };

  const handleTokenLogin = async () => {
    if (!serverUrl.trim() || !token.trim()) {
      Alert.alert('Missing fields', 'Please provide server URL and API token.');
      return;
    }
    try {
      await signInWithToken(serverUrl.trim(), token.trim());
      router.replace('/(app)/chat');
    } catch {
      // error shown via store
    }
  };

  const handleSSOLogin = () => {
    if (!serverUrl.trim()) {
      Alert.alert('Missing URL', 'Please enter your Open WebUI server URL.');
      return;
    }
    router.push({ pathname: '/(auth)/sso', params: { serverUrl: serverUrl.trim() } });
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'credentials', label: 'Password', icon: 'lock-closed-outline' },
    { key: 'token', label: 'API Token', icon: 'key-outline' },
    { key: 'sso', label: 'SSO', icon: 'shield-checkmark-outline' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="chatbubble-ellipses" size={36} color={Colors.accent} />
          </View>
          <Text style={styles.title}>Mobile OWUI</Text>
          <Text style={styles.subtitle}>Connect to your Open WebUI instance</Text>
        </View>

        {/* Server URL — shared across all tabs */}
        <View style={styles.card}>
          <Text style={styles.label}>Server URL</Text>
          <TextInput
            style={styles.input}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="https://your-owui.example.com"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => { clearError(); setActiveTab(tab.key); }}
            >
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={activeTab === tab.key ? Colors.accent : Colors.textMuted}
              />
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View style={styles.card}>
          {activeTab === 'credentials' && (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="user@example.com"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Text style={[styles.label, { marginTop: Spacing.md }]}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={styles.btn}
                onPress={handleCredentialLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {activeTab === 'token' && (
            <>
              <Text style={styles.label}>API Token</Text>
              <Text style={styles.hint}>
                Find your token in Open WebUI → Settings → Account → API Keys
              </Text>
              <TextInput
                style={[styles.input, styles.tokenInput]}
                value={token}
                onChangeText={setToken}
                placeholder="sk-..."
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                multiline
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={styles.btn}
                onPress={handleTokenLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Connect with Token</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {activeTab === 'sso' && (
            <>
              <Text style={styles.hint}>
                Sign in via your organisation's SSO provider (Azure AD, OAuth, LDAP…).
                You'll be redirected to your server's login page.
              </Text>
              <TouchableOpacity style={styles.btn} onPress={handleSSOLogin}>
                <Ionicons name="open-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.btnText}>Open SSO Login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.footer}>
          Mobile OWUI — Open source client for Open WebUI
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    flexGrow: 1,
    padding: Spacing.base,
    justifyContent: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  logoContainer: {
    width: 72,
    height: 72,
    backgroundColor: Colors.bgTertiary,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  hint: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tokenInput: { height: 80, textAlignVertical: 'top' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: Spacing.sm },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    gap: 4,
  },
  tabActive: { backgroundColor: Colors.bgTertiary },
  tabLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.medium },
  tabLabelActive: { color: Colors.accent },
  btn: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  btnText: { color: Colors.accent, fontSize: Typography.base, fontWeight: Typography.semibold },
  errorText: {
    color: Colors.error,
    fontSize: Typography.sm,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xl,
  },
});
