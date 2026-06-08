import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { authStorage, AUTH_STORAGE_KEY } from './auth-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    storageKey: AUTH_STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

let authRefreshRegistered = false;

/**
 * Keeps the session alive while the app is open and refreshes tokens when returning
 * from background (same pattern as Instagram / most mobile apps).
 */
export function setupAuthSessionRefresh() {
  if (authRefreshRegistered || Platform.OS === 'web') return;
  authRefreshRegistered = true;

  supabase.auth.startAutoRefresh();

  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
