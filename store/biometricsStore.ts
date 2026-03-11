import { create } from 'zustand';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRICS_ENABLED_KEY = 'owui_biometrics_enabled';

interface BiometricsState {
  isLocked: boolean;
  isEnabled: boolean;
  biometryType: LocalAuthentication.AuthenticationType | null;
  isSupported: boolean;

  initialize: () => Promise<void>;
  authenticate: () => Promise<boolean>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  lock: () => void;
}

export const useBiometricsStore = create<BiometricsState>((set, get) => ({
  isLocked: false,
  isEnabled: false,
  biometryType: null,
  isSupported: false,

  initialize: async () => {
    const supported = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const biometryType = types[0] ?? null;

    const enabledRaw = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
    const isEnabled = enabledRaw === 'true' && supported && enrolled;

    set({
      isSupported: supported && enrolled,
      biometryType,
      isEnabled,
      isLocked: isEnabled, // lock on app start if enabled
    });
  },

  authenticate: async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Mobile OWUI',
      fallbackLabel: 'Use passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      set({ isLocked: false });
      return true;
    }
    return false;
  },

  enable: async () => {
    const ok = await get().authenticate();
    if (ok) {
      await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'true');
      set({ isEnabled: true });
    }
  },

  disable: async () => {
    await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'false');
    set({ isEnabled: false, isLocked: false });
  },

  lock: () => {
    if (get().isEnabled) set({ isLocked: true });
  },
}));
