import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePromptsStore, Prompt } from '../../store/promptsStore';
import { Colors, Spacing, Typography, Radius } from '../../theme';

export default function PromptsScreen() {
  const { prompts, load, addPrompt, updatePrompt, deletePrompt, isLoaded } = usePromptsStore();
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!isLoaded) load();
  }, []);

  const openCreate = () => {
    setEditingPrompt(null);
    setTitle('');
    setContent('');
    setModalVisible(true);
  };

  const openEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setTitle(prompt.title);
    setContent(prompt.content);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing fields', 'Please fill in both title and content.');
      return;
    }
    if (editingPrompt) {
      await updatePrompt(editingPrompt.id, title.trim(), content.trim());
    } else {
      await addPrompt(title.trim(), content.trim());
    }
    setModalVisible(false);
  };

  const handleDelete = (prompt: Prompt) => {
    if (prompt.createdAt === 0) {
      Alert.alert('Cannot delete', 'Default prompts cannot be deleted.');
      return;
    }
    Alert.alert('Delete prompt', `Delete "${prompt.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePrompt(prompt.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prompts</Text>
        <TouchableOpacity onPress={openCreate} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </SafeAreaView>

      <FlatList
        data={prompts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.promptItem}>
            <View style={styles.promptIcon}>
              <Ionicons name="flash" size={14} color={Colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.promptTitle}>{item.title}</Text>
              <Text style={styles.promptPreview} numberOfLines={2}>{item.content}</Text>
              {item.createdAt === 0 && (
                <Text style={styles.defaultBadge}>Default</Text>
              )}
            </View>
            <View style={styles.promptActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
                <Ionicons name="pencil-outline" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Edit / Create modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPrompt ? 'Edit Prompt' : 'New Prompt'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Summarize text"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={[styles.label, { marginTop: Spacing.md }]}>Content</Text>
              <TextInput
                style={[styles.input, styles.contentInput]}
                value={content}
                onChangeText={setContent}
                placeholder="e.g. Please summarize the following:\n\n"
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>
                  {editingPrompt ? 'Save changes' : 'Create prompt'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.sm },
  addBtn: { padding: Spacing.sm },
  headerTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  list: { padding: Spacing.sm },
  promptItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  promptIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  promptTitle: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary },
  promptPreview: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2, lineHeight: 16 },
  defaultBadge: {
    fontSize: 10, color: Colors.textMuted,
    backgroundColor: Colors.bgTertiary,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.sm, alignSelf: 'flex-start', marginTop: 4,
  },
  promptActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: Spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  modalBody: { padding: Spacing.base },
  label: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textSecondary, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contentInput: { height: 140, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  saveBtnText: { color: Colors.accent, fontSize: Typography.base, fontWeight: Typography.semibold },
});
