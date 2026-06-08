import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Determine storage based on platform
let storage: any = null;

// For web environment, use localStorage
if (Platform.OS === 'web' || typeof window !== 'undefined') {
  storage = {
    getItem: async (key: string) => {
      try {
        return window.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        window.localStorage?.setItem(key, value);
      } catch {
        // Storage might be unavailable, silently fail
      }
    },
    removeItem: async (key: string) => {
      try {
        window.localStorage?.removeItem(key);
      } catch {
        // Storage might be unavailable, silently fail
      }
    },
  };
} else {
  // For native platforms, try to use AsyncStorage
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    storage = AsyncStorage;
  } catch {
    // Fallback if AsyncStorage is not available
    storage = {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    };
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
