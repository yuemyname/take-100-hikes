import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, type AppStateStatus } from 'react-native';

import { env, isSupabaseConfigured } from './env';

let client: SupabaseClient | null = null;

/**
 * Lazily created Supabase client using only the public anon key.
 * Throws when the environment is not configured; check `isSupabaseConfigured`
 * before calling from UI code.
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  // Keep the session fresh only while the app is in the foreground.
  const handleAppState = (state: AppStateStatus) => {
    if (!client) return;
    if (state === 'active') {
      client.auth.startAutoRefresh();
    } else {
      client.auth.stopAutoRefresh();
    }
  };
  AppState.addEventListener('change', handleAppState);
  handleAppState(AppState.currentState);

  return client;
}

export { isSupabaseConfigured };
