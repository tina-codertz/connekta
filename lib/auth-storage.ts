import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_STORAGE_KEY = 'locatemate-auth';

const memoryStore = new Map<string, string>();

const webStorage = {
  getItem: async (key: string) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },
  removeItem: async (key: string) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      memoryStore.delete(key);
    }
  },
};

function createSafeNativeStorage() {
  return {
    getItem: async (key: string) => {
      try {
        return await AsyncStorage.getItem(key);
      } catch (error) {
        console.warn('Auth storage read failed, using memory fallback:', error);
        return memoryStore.get(key) ?? null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await AsyncStorage.setItem(key, value);
        memoryStore.set(key, value);
      } catch (error) {
        console.warn('Auth storage write failed, using memory fallback:', error);
        memoryStore.set(key, value);
      }
    },
    removeItem: async (key: string) => {
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.warn('Auth storage remove failed:', error);
      }
      memoryStore.delete(key);
    },
  };
}

/** Persistent auth storage — AsyncStorage on native, localStorage on web. */
export const authStorage =
  Platform.OS === 'web' ? webStorage : createSafeNativeStorage();
