import { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Text,
  Alert,
  Platform,
  Modal,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useChatStore } from '../../store/chatStore';
import { usePromptsStore } from '../../store/promptsStore';
import { useAuthStore } from '../../store/authStore';
import { voiceService } from '../../services/voiceService';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Attachment {
  uri: string;
  type: 'image' | 'file';
  name: string;
  mimeType?: string;
}

type VoiceState = 'idle' | 'recording' | 'transcribing';

export default function ChatInput() {
  const { sendMessage, isStreaming, selectedModel } = useChatStore();
  const { prompts, load: loadPrompts, isLoaded } = usePromptsStore();
  const { serverUrl } = useAuthStore();

  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [showPrompts, setShowPrompts] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !isStreaming && !!selectedModel;

  useEffect(() => {
    if (!isLoaded) loadPrompts();
  }, []);

  // Pulsing animation while recording
  useEffect(() => {
    if (voiceState === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [voiceState]);

  const handleSend = async () => {
    if (!canSend) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const content = text.trim();
    const images = attachments.filter((a) => a.type === 'image').map((a) => a.uri);
    setText('');
    setAttachments([]);
    await sendMessage(content || ' ', images.length > 0 ? images : undefined);
  };

  // ─── Voice ─────────────────────────────────────────────────────────────────

  const handleVoicePress = async () => {
    if (voiceState === 'idle') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await voiceService.startRecording();
        setVoiceState('recording');
      } catch {
        Alert.alert('Microphone error', 'Could not access the microphone.');
      }
    } else if (voiceState === 'recording') {
      setVoiceState('transcribing');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const uri = await voiceService.stopRecording();
      if (!uri) { setVoiceState('idle'); return; }

      try {
        // Try OWUI Whisper endpoint; fall back to showing the audio icon
        const transcript = await voiceService.transcribe(uri, serverUrl, '');
        if (transcript) {
          setText((prev) => prev ? `${prev} ${transcript}` : transcript);
        }
      } catch {
        // Whisper not available on this instance — just clear
        Alert.alert('Transcription unavailable', 'Your Open WebUI instance may not have Whisper enabled.');
      } finally {
        setVoiceState('idle');
      }
    }
  };

  const handleVoiceLongPress = async () => {
    if (voiceState === 'recording') {
      await voiceService.cancelRecording();
      setVoiceState('idle');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  // ─── Attachments ───────────────────────────────────────────────────────────

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setAttachments((prev) => [
        ...prev,
        ...result.assets.map((a) => ({
          uri: a.uri,
          type: 'image' as const,
          name: a.fileName ?? 'image.jpg',
          mimeType: a.mimeType ?? 'image/jpeg',
        })),
      ]);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true });
    if (!result.canceled) {
      setAttachments((prev) => [
        ...prev,
        ...result.assets.map((a) => ({
          uri: a.uri,
          type: 'file' as const,
          name: a.name,
          mimeType: a.mimeType ?? 'application/octet-stream',
        })),
      ]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Prompt picker ─────────────────────────────────────────────────────────

  const applyPrompt = (content: string) => {
    setText(content);
    setShowPrompts(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const voiceIconName = voiceState === 'recording' ? 'stop-circle' : voiceState === 'transcribing' ? 'hourglass' : 'mic-outline';
  const voiceColor = voiceState === 'recording' ? Colors.error : voiceState === 'transcribing' ? Colors.warning : Colors.textSecondary;

  return (
    <>
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.container}>
          {/* Attachments */}
          {attachments.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.attachmentsRow}
              contentContainerStyle={{ gap: 8, paddingHorizontal: Spacing.sm }}
            >
              {attachments.map((att, i) => (
                <View key={i} style={styles.attachmentThumb}>
                  {att.type === 'image' ? (
                    <Image source={{ uri: att.uri }} style={styles.thumbImage} />
                  ) : (
                    <View style={styles.thumbFile}>
                      <Ionicons name="document-outline" size={20} color={Colors.textSecondary} />
                    </View>
                  )}
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeAttachment(i)}>
                    <Ionicons name="close-circle" size={16} color={Colors.error} />
                  </TouchableOpacity>
                  <Text style={styles.thumbName} numberOfLines={1}>{att.name}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Input row */}
          <View style={styles.inputRow}>
            {/* Left actions */}
            <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
              <Ionicons name="image-outline" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachBtn} onPress={pickDocument}>
              <Ionicons name="attach-outline" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachBtn} onPress={() => setShowPrompts(true)}>
              <Ionicons name="flash-outline" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder={selectedModel ? 'Message…' : 'Select a model first'}
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={8000}
              returnKeyType="default"
            />

            {/* Voice button */}
            {!text.trim() && (
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={handleVoicePress}
                onLongPress={handleVoiceLongPress}
                delayLongPress={600}
              >
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Ionicons name={voiceIconName as any} size={22} color={voiceColor} />
                </Animated.View>
              </TouchableOpacity>
            )}

            {/* Send button */}
            <TouchableOpacity
              style={[styles.sendBtn, canSend && styles.sendBtnActive]}
              onPress={handleSend}
              disabled={!canSend}
            >
              {isStreaming ? (
                <Ionicons name="stop" size={16} color={Colors.textPrimary} />
              ) : (
                <Ionicons name="arrow-up" size={18} color={canSend ? Colors.bg : Colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          {/* Recording indicator */}
          {voiceState === 'recording' && (
            <View style={styles.recordingBanner}>
              <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.recordingText}>Recording… long-press mic to cancel</Text>
            </View>
          )}
          {voiceState === 'transcribing' && (
            <View style={styles.recordingBanner}>
              <Text style={styles.recordingText}>Transcribing…</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Prompt picker modal */}
      <Modal
        visible={showPrompts}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrompts(false)}
      >
        <View style={styles.promptOverlay}>
          <View style={styles.promptSheet}>
            <View style={styles.promptHeader}>
              <Text style={styles.promptTitle}>Quick Prompts</Text>
              <TouchableOpacity onPress={() => setShowPrompts(false)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={prompts}
              keyExtractor={(p) => p.id}
              contentContainerStyle={{ padding: Spacing.sm }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.promptItem}
                  onPress={() => applyPrompt(item.content)}
                >
                  <Ionicons name="flash" size={14} color={Colors.warning} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.promptItemTitle}>{item.title}</Text>
                    <Text style={styles.promptItemPreview} numberOfLines={1}>
                      {item.content}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Colors.surface },
  container: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingTop: Spacing.sm,
  },
  attachmentsRow: { maxHeight: 90, marginBottom: Spacing.sm },
  attachmentThumb: { width: 64, alignItems: 'center' },
  thumbImage: { width: 56, height: 56, borderRadius: Radius.md, backgroundColor: Colors.bgTertiary },
  thumbFile: {
    width: 56, height: 56, borderRadius: Radius.md,
    backgroundColor: Colors.bgTertiary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  removeBtn: { position: 'absolute', top: -4, right: 0 },
  thumbName: { fontSize: 9, color: Colors.textMuted, marginTop: 2, textAlign: 'center', width: 60 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    gap: 4,
  },
  attachBtn: { padding: Spacing.sm, borderRadius: Radius.full },
  input: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  sendBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error },
  recordingText: { fontSize: Typography.xs, color: Colors.textSecondary },
  promptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  promptSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '60%',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  promptTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  promptItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  promptItemTitle: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary },
  promptItemPreview: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
});
