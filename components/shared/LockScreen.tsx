import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBiometricsStore } from '../../store/biometricsStore';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import * as LocalAuthentication from 'expo-local-authentication';

export default function LockScreen() {
  const { authenticate, biometryType } = useBiometricsStore();

  useEffect(() => {
    // Auto-trigger biometrics on mount
    authenticate();
  }, []);

  const isFaceID =
    biometryType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconRing}>
          <Ionicons
            name={isFaceID ? 'scan-outline' : 'finger-print-outline'}
            size={48}
            color={Colors.textPrimary}
          />
        </View>

        <Text style={styles.title}>Mobile OWUI</Text>
        <Text style={styles.subtitle}>
          {isFaceID ? 'Unlock with Face ID' : 'Unlock with Touch ID'}
        </Text>

        <TouchableOpacity style={styles.btn} onPress={authenticate}>
          <Ionicons
            name={isFaceID ? 'scan' : 'finger-print'}
            size={18}
            color={Colors.bg}
          />
          <Text style={styles.btnText}>
            {isFaceID ? 'Use Face ID' : 'Use Touch ID'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { alignItems: 'center', gap: Spacing.lg },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  btnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.bg,
  },
});
