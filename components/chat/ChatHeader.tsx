import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../store/chatStore';
import { Colors, Spacing, Typography, Radius } from '../../theme';

export default function ChatHeader() {
  const navigation = useNavigation();
  const { selectedModel, availableModels, setModel, newChat } = useChatStore();
  const [modelPickerVisible, setModelPickerVisible] = useState(false);

  const currentModelName =
    availableModels.find((m) => m.id === selectedModel)?.name ?? selectedModel ?? 'Select model';

  return (
    <>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          {/* Sidebar toggle */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Ionicons name="menu-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Model selector */}
          <TouchableOpacity
            style={styles.modelBtn}
            onPress={() => setModelPickerVisible(true)}
          >
            <Text style={styles.modelBtnText} numberOfLines={1}>
              {currentModelName}
            </Text>
            <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* New chat */}
          <TouchableOpacity style={styles.iconBtn} onPress={newChat}>
            <Ionicons name="create-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Model picker modal */}
      <Modal
        visible={modelPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModelPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModelPickerVisible(false)}
        >
          <View style={styles.picker}>
            <Text style={styles.pickerTitle}>Select Model</Text>
            <FlatList
              data={availableModels}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    item.id === selectedModel && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setModel(item.id);
                    setModelPickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      item.id === selectedModel && styles.pickerItemTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.id === selectedModel && (
                    <Ionicons name="checkmark" size={16} color={Colors.accent} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconBtn: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  modelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
  },
  modelBtnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    maxWidth: 200,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-start',
    paddingTop: 110,
    paddingHorizontal: Spacing.xl,
  },
  picker: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 400,
    overflow: 'hidden',
  },
  pickerTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerItemActive: { backgroundColor: Colors.bgHover },
  pickerItemText: { fontSize: Typography.sm, color: Colors.textSecondary },
  pickerItemTextActive: { color: Colors.textPrimary, fontWeight: Typography.medium },
});
