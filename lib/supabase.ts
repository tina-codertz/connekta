import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { authStorage, AUTH_STORAGE_KEY } from './auth-storage';

const extra = Constants.expoConfig?.extra ?? {};

function getSupabaseConfig() {
  const supabaseUrl =
    (typeof extra.supabaseUrl === 'string' && extra.supabaseUrl) ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    '';
  const supabaseAnonKey =
    (typeof extra.supabaseAnonKey === 'string' && extra.supabaseAnonKey) ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  return { supabaseUrl, supabaseAnonKey };
}

let supabaseClient: SupabaseClient<Database> | null = null;

function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase config. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS env or .env before building.'
    );
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: authStorage,
      storageKey: AUTH_STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return supabaseClient;
}

export const supabase: SupabaseClient<Database> = new Proxy(
  {} as SupabaseClient<Database>,
  {
    get(_target, prop, receiver) {
      const client = getSupabaseClient();
      const value = Reflect.get(client, prop, receiver);
      return typeof value === 'function' ? value.bind(client) : value;
    },
  }
);

let authRefreshRegistered = false;

/**
 * Keeps the session alive while the app is open and refreshes tokens when returning
 * from background (same pattern as Instagram / most mobile apps).
 */
export function setupAuthSessionRefresh() {
  if (authRefreshRegistered || Platform.OS === 'web') return;

  try {
    authRefreshRegistered = true;
    supabase.auth.startAutoRefresh();

    AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
  } catch (error) {
    authRefreshRegistered = false;
    console.warn('Auth session refresh setup failed:', error);
  }
}
