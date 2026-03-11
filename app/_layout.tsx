import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useBiometricsStore } from '../store/biometricsStore';
import LockScreen from '../components/shared/LockScreen';

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const { initialize: initBiometrics, isLocked, lock } = useBiometricsStore();

  useEffect(() => {
    initialize();
    initBiometrics();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') lock();
    });
    return () => sub.remove();
  }, [lock]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" backgroundColor="#0f0f0f" />
      {isLocked ? (
        <LockScreen />
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f0f0f' },
});
