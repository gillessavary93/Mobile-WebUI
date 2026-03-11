import { useEffect, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useChatStore } from '../../store/chatStore';
import MessageBubble from './MessageBubble';
import { Colors, Spacing } from '../../theme';

export default function MessageList() {
  const { currentMessages, isStreaming } = useChatStore();
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    if (currentMessages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [currentMessages.length, isStreaming]);

  return (
    <FlatList
      ref={flatRef}
      data={currentMessages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MessageBubble message={item} />}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
});
