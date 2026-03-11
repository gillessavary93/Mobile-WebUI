import { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Share, Platform, ActionSheetIOS, Alert } from 'react-native';
import Markdown from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { OWUIMessage } from '../../services/owuiApi';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { useChatStore } from '../../store/chatStore';
import { voiceService } from '../../services/voiceService';

interface Props {
  message: OWUIMessage;
}

export default function MessageBubble({ message }: Props) {
  const { isStreaming, currentMessages } = useChatStore();
  const isUser = message.role === 'user';
  const isLastMessage = currentMessages[currentMessages.length - 1]?.id === message.id;
  const showCursor = !isUser && isLastMessage && isStreaming && message.content.length > 0;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message.content);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleShare = async () => {
    await Share.share({ message: message.content });
  };

  const handleSpeak = async () => {
    if (isSpeaking) {
      await voiceService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      await voiceService.speak(message.content, () => setIsSpeaking(false));
    }
  };

  const handleLongPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Copy', 'Share', isSpeaking ? 'Stop speaking' : 'Read aloud'],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) handleCopy();
          else if (idx === 2) handleShare();
          else if (idx === 3) handleSpeak();
        }
      );
    } else {
      setShowActions(true);
    }
  };

  if (isUser) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={handleLongPress}
        style={styles.userRow}
      >
        <View style={styles.userBubble}>
          {message.images?.map((img, i) => (
            <Image key={i} source={{ uri: img }} style={styles.attachedImage} />
          ))}
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={handleLongPress}
        style={styles.assistantRow}
      >
        <View style={styles.avatarDot} />
        <View style={styles.assistantContent}>
          {message.content ? (
            <Markdown style={markdownStyles}>
              {message.content + (showCursor ? '▌' : '')}
            </Markdown>
          ) : isStreaming && isLastMessage ? (
            <Text style={styles.cursorText}>▌</Text>
          ) : null}
        </View>
      </TouchableOpacity>

      {/* Action bar for completed assistant messages */}
      {!isUser && !isStreaming && message.content.length > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
            <Ionicons name="copy-outline" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleSpeak}>
            <Ionicons
              name={isSpeaking ? 'stop-circle-outline' : 'volume-medium-outline'}
              size={14}
              color={isSpeaking ? Colors.warning : Colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Android action sheet fallback */}
      {showActions && (
        <View style={styles.androidSheet}>
          {[
            { label: 'Copy', icon: 'copy-outline', action: handleCopy },
            { label: 'Share', icon: 'share-outline', action: handleShare },
            { label: isSpeaking ? 'Stop speaking' : 'Read aloud', icon: isSpeaking ? 'stop-circle-outline' : 'volume-medium-outline', action: handleSpeak },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.androidSheetItem}
              onPress={() => { setShowActions(false); item.action(); }}
            >
              <Ionicons name={item.icon as any} size={16} color={Colors.textSecondary} />
              <Text style={styles.androidSheetLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.androidSheetCancel} onPress={() => setShowActions(false)}>
            <Text style={styles.androidSheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: { alignItems: 'flex-end', marginLeft: 60 },
  userBubble: {
    backgroundColor: Colors.userBubble,
    borderRadius: Radius.lg,
    borderBottomRightRadius: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    maxWidth: '100%',
  },
  userText: { color: Colors.userBubbleText, fontSize: Typography.base, lineHeight: 22 },
  attachedImage: { width: 200, height: 150, borderRadius: Radius.md, marginBottom: Spacing.sm },
  assistantRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginRight: 20 },
  avatarDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.textMuted, marginTop: 8, flexShrink: 0,
  },
  assistantContent: { flex: 1 },
  cursorText: { color: Colors.textPrimary, fontSize: Typography.base },
  actionBar: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 20,
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  actionBtn: {
    padding: 6,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  androidSheet: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  androidSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  androidSheetLabel: { fontSize: Typography.sm, color: Colors.textPrimary },
  androidSheetCancel: { padding: Spacing.md, alignItems: 'center' },
  androidSheetCancelText: { fontSize: Typography.sm, color: Colors.textMuted },
});

const markdownStyles = {
  body: { color: Colors.assistantText, fontSize: Typography.base, lineHeight: 24 },
  code_inline: {
    backgroundColor: Colors.bgTertiary, color: '#e2a553',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
    fontFamily: 'Courier New', fontSize: Typography.sm,
  },
  fence: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    padding: Spacing.md, marginVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  code_block: { color: Colors.textPrimary, fontFamily: 'Courier New', fontSize: Typography.sm },
  strong: { color: Colors.textPrimary, fontWeight: '600' as const },
  em: { color: Colors.textSecondary, fontStyle: 'italic' as const },
  link: { color: '#3b82f6' },
  blockquote: { borderLeftWidth: 3, borderLeftColor: Colors.border, paddingLeft: Spacing.md, marginVertical: Spacing.sm },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
  hr: { borderColor: Colors.border, marginVertical: Spacing.md },
  heading1: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: '700' as const, marginVertical: Spacing.sm },
  heading2: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: '600' as const, marginVertical: Spacing.sm },
  heading3: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: '600' as const, marginVertical: Spacing.xs },
  table: { borderWidth: 1, borderColor: Colors.border, marginVertical: Spacing.sm },
  th: { backgroundColor: Colors.bgTertiary, padding: Spacing.sm },
  td: { padding: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  th_content: { color: Colors.textPrimary, fontWeight: '600' as const, fontSize: Typography.sm },
  td_content: { color: Colors.textSecondary, fontSize: Typography.sm },
};
