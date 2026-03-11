import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useDrawerStatus } from '@react-navigation/drawer';
import ChatHeader from '../../components/chat/ChatHeader';
import MessageList from '../../components/chat/MessageList';
import ChatInput from '../../components/chat/ChatInput';
import EmptyChat from '../../components/chat/EmptyChat';
import { useChatStore } from '../../store/chatStore';
import { Colors } from '../../theme';

export default function ChatScreen() {
  const { currentMessages } = useChatStore();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ChatHeader />
      <View style={styles.body}>
        {currentMessages.length === 0 ? <EmptyChat /> : <MessageList />}
      </View>
      <ChatInput />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  body: { flex: 1 },
});
