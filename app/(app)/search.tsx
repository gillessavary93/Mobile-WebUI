import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useChatStore } from '../../store/chatStore';
import { Colors, Spacing, Typography, Radius } from '../../theme';

export default function SearchScreen() {
  const navigation = useNavigation();
  const { chats, loadChat } = useChatStore();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return chats;
    const q = query.toLowerCase();
    return chats.filter((c) => c.title?.toLowerCase().includes(q));
  }, [query, chats]);

  const handleSelect = async (chatId: string) => {
    await loadChat(chatId);
    router.push('/(app)/chat');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={{ marginLeft: 10 }} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search conversations…"
            placeholderTextColor={Colors.textMuted}
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>
      </SafeAreaView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {query ? 'No conversations match your search' : 'Start typing to search'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => handleSelect(item.id)}>
            <Ionicons name="chatbubble-outline" size={16} color={Colors.textMuted} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {/* Highlight query in title */}
                {item.title || 'New conversation'}
              </Text>
              <Text style={styles.itemDate}>
                {formatDistanceToNow(new Date(item.updated_at * 1000), { addSuffix: true })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.sm },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 40,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: Typography.base,
  },
  list: { padding: Spacing.sm },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemTitle: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  itemDate: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
