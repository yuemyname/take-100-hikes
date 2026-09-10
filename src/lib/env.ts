import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.url().optional(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  EXPO_PUBLIC_ENABLE_LOCATION_TEST_MODE: z.enum(['true', 'false']).optional(),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_ENABLE_LOCATION_TEST_MODE: process.env.EXPO_PUBLIC_ENABLE_LOCATION_TEST_MODE,
});

if (!parsed.success) {
  console.warn('[100PEAKS] Invalid environment configuration', parsed.error.issues);
}

const data = parsed.success ? parsed.data : {};

export const env = {
  supabaseUrl: data.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: data.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  locationTestModeEnabled: data.EXPO_PUBLIC_ENABLE_LOCATION_TEST_MODE === 'true',
} as const;

/** True when both public Supabase values are present. */
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
