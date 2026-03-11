import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../theme';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg }}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(app)/chat' : '/(auth)/login'} />;
}
