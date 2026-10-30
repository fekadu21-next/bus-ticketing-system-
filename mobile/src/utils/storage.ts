import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

async function canUseSecureStore(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return globalThis.localStorage?.getItem(key) ?? null;
    }

    try {
      if (await canUseSecureStore()) {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.warn('SecureStore getItem failed, using AsyncStorage', error);
    }

    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn('AsyncStorage getItem failed', error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return;
    }

    try {
      if (await canUseSecureStore()) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
    } catch (error) {
      console.warn('SecureStore setItem failed, using AsyncStorage', error);
    }

    await AsyncStorage.setItem(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return;
    }

    try {
      if (await canUseSecureStore()) {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.warn('SecureStore removeItem failed', error);
    }

    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('AsyncStorage removeItem failed', error);
    }
  },
};
