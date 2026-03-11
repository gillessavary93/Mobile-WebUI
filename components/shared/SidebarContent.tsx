import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Switch } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useBiometricsStore } from '../../store/biometricsStore';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { formatDistanceToNow } from 'date-fns';

export default function SidebarContent(props: any) {
  const navigation = useNavigation();
  const { chats, currentChat, loadChat, newChat, deleteChat, isLoadingChats } = useChatStore();
  const { signOut, serverUrl } = useAuthStore();
  const { isEnabled, isSupported, enable, disable } = useBiometricsStore();

  const handleSelectChat = async (chatId: string) => {
    await loadChat(chatId);
    navigation.dispatch(DrawerActions.closeDrawer());
  };

  const handleNewChat = () => {
    newChat();
    navigation.dispatch(DrawerActions.closeDrawer());
  };

  const handleSearch = () => {
    navigation.dispatch(DrawerActions.closeDrawer());
    router.push('/(app)/search');
  };

  const handlePrompts = () => {
    navigation.dispatch(DrawerActions.closeDrawer());
    router.push('/(app)/prompts');
  };

  const handleDeleteChat = (chatId: string, title: string) => {
    Alert.alert('Delete chat', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteChat(chatId) },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleBiometricsToggle = async (value: boolean) => {
    if (value) await enable();
    else await disable();
  };

  const serverHost = serverUrl.replace(/https?:\/\//, '');

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.logoArea}>
            <Ionicons name="chatbubble-ellipses" size={20} color={Colors.accent} />
            <Text style={styles.appName}>Mobile OWUI</Text>
          </View>
          <TouchableOpacity onPress={handleNewChat} style={styles.iconBtn}>
            <Ionicons name="create-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        {serverHost ? (
          <Text style={styles.serverHost} numberOfLines={1}>{serverHost}</Text>
        ) : null}

        {/* Search bar */}
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Ionicons name="search-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.searchBtnText}>Search conversations…</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Chat list */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={{ padding: Spacing.sm }}
        ListHeaderComponent={
          chats.length === 0 && !isLoadingChats ? (
            <Text style={styles.emptyText}>No conversations yet</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chatItem, currentChat?.id === item.id && styles.chatItemActive]}
            onPress={() => handleSelectChat(item.id)}
            onLongPress={() => handleDeleteChat(item.id, item.title)}
          >
            <Ionicons name="chatbubble-outline" size={14} color={Colors.textMuted} style={{ marginTop: 2, flexShrink: 0 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.chatTitle} numberOfLines={2}>
                {item.title || 'New conversation'}
              </Text>
              <Text style={styles.chatDate}>
                {formatDistanceToNow(new Date(item.updated_at * 1000), { addSuffix: true })}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        {/* Prompts */}
        <TouchableOpacity style={styles.footerBtn} onPress={handlePrompts}>
          <Ionicons name="flash-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.footerBtnText}>Manage Prompts</Text>
        </TouchableOpacity>

        {/* Biometrics toggle */}
        {isSupported && (
          <View style={styles.biometricsRow}>
            <Ionicons name="finger-print-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.footerBtnText}>Face ID / Touch ID</Text>
            <Switch
              value={isEnabled}
              onValueChange={handleBiometricsToggle}
              trackColor={{ false: Colors.bgTertiary, true: Colors.accent }}
              thumbColor="#fff"
              style={{ marginLeft: 'auto' }}
            />
          </View>
        )}

        {/* Sign out */}
        <TouchableOpacity style={styles.footerBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.footerBtnText}>Sign out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
  },
  logoArea: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appName: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  iconBtn: { padding: Spacing.sm },
  serverHost: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2, marginBottom: Spacing.sm },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.sm,
  },
  searchBtnText: { fontSize: Typography.sm, color: Colors.textMuted },
  list: { flex: 1 },
  emptyText: { color: Colors.textMuted, fontSize: Typography.sm, textAlign: 'center', marginTop: Spacing.xl },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: 2,
  },
  chatItemActive: { backgroundColor: Colors.bgHover },
  chatTitle: { fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 18 },
  chatDate: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  footer: { borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.md, gap: 4 },
  footerBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm },
  footerBtnText: { fontSize: Typography.sm, color: Colors.textSecondary },
  biometricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
  },
});
