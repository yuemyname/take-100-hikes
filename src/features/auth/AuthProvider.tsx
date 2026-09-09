import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'guest';

export interface SignUpInput {
  email: string;
  password: string;
  username: string;
  displayName?: string;
}

export interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  /** False when EXPO_PUBLIC_SUPABASE_* is missing; the sign-in screen explains this. */
  isConfigured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  /** Development-only: browse the app without a backend session. */
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'loading' : 'signedOut');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const supabase = getSupabase();
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setSession(data.session);
        setStatus(data.session ? 'signedIn' : 'signedOut');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('signedOut');
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? 'signedIn' : 'signedOut');
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async ({ email, password, username, displayName }: SignUpInput) => {
    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: displayName ?? username },
        emailRedirectTo: Linking.createURL('/sign-in'),
      },
    });
    if (error) throw error;
    return { needsEmailConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      const { error } = await getSupabase().auth.signOut();
      if (error) throw error;
    }
    setSession(null);
    setStatus('signedOut');
  }, []);

  const continueAsGuest = useCallback(() => {
    if (!__DEV__) return;
    setSession(null);
    setStatus('guest');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      isConfigured: isSupabaseConfigured,
      signInWithPassword,
      signUp,
      signOut,
      continueAsGuest,
    }),
    [status, session, signInWithPassword, signUp, signOut, continueAsGuest],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
