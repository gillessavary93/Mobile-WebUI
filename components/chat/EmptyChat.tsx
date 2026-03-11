import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { useChatStore } from '../../store/chatStore';

const SUGGESTIONS = [
  'Explain quantum computing simply',
  'Write a Python script to sort a list',
  'Summarize best practices for REST APIs',
  'Draft a professional email declining a meeting',
];

export default function EmptyChat() {
  const { selectedModel, availableModels, sendMessage } = useChatStore();
  const modelName = availableModels.find((m) => m.id === selectedModel)?.name ?? selectedModel;

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Ionicons name="chatbubble-ellipses-outline" size={40} color={Colors.textMuted} />
      </View>
      <Text style={styles.title}>How can I help you?</Text>
      {modelName && (
        <Text style={styles.modelHint}>
          Model: <Text style={styles.modelName}>{modelName}</Text>
        </Text>
      )}

      <View style={styles.suggestions}>
        {SUGGESTIONS.map((s) => (
          <View
            key={s}
            style={styles.suggestion}
          >
            <Text style={styles.suggestionText}>{s}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  logo: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  modelHint: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginBottom: Spacing['2xl'],
  },
  modelName: {
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  suggestions: {
    width: '100%',
    gap: Spacing.sm,
  },
  suggestion: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
});
