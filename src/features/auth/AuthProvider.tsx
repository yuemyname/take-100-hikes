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
const EMAIL_CONFIRMATION_REDIRECT_URL = 'hundredpeaks://sign-in';

function getAuthCallbackParams(url: string): URLSearchParams {
  const queryStart = url.indexOf('?');
  const hashStart = url.indexOf('#');
  const query =
    queryStart >= 0
      ? url.slice(queryStart + 1, hashStart >= 0 && hashStart > queryStart ? hashStart : undefined)
      : '';
  const hash = hashStart >= 0 ? url.slice(hashStart + 1) : '';

  const params = new URLSearchParams(query);
  new URLSearchParams(hash).forEach((value, key) => params.set(key, value));
  return params;
}

async function restoreSessionFromAuthCallback(url: string): Promise<Session | null> {
  if (!url.startsWith(EMAIL_CONFIRMATION_REDIRECT_URL)) return null;

  const params = getAuthCallbackParams(url);
  const code = params.get('code');
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const supabase = getSupabase();

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.session;
  }

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return data.session;
  }

  return null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'loading' : 'signedOut');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const supabase = getSupabase();
    let cancelled = false;
    const handledUrls = new Set<string>();

    const handleAuthCallback = async (url: string) => {
      if (handledUrls.has(url)) return;
      handledUrls.add(url);

      try {
        const nextSession = await restoreSessionFromAuthCallback(url);
        if (cancelled || !nextSession) return;
        setSession(nextSession);
        setStatus('signedIn');
      } catch {
        if (cancelled) return;
        setStatus('signedOut');
      }
    };

    const urlListener = Linking.addEventListener('url', ({ url }) => {
      void handleAuthCallback(url);
    });

    void Promise.all([supabase.auth.getSession(), Linking.getInitialURL()])
      .then(async ([{ data }, initialUrl]) => {
        if (cancelled) return;

        if (initialUrl) {
          const callbackSession = await restoreSessionFromAuthCallback(initialUrl);
          if (cancelled) return;
          if (callbackSession) {
            handledUrls.add(initialUrl);
            setSession(callbackSession);
            setStatus('signedIn');
            return;
          }
        }

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
      urlListener.remove();
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
        // Keep email confirmation on the installed app. Linking.createURL()
        // produces an exp:// URL inside Expo Go, which cannot open TestFlight.
        emailRedirectTo: EMAIL_CONFIRMATION_REDIRECT_URL,
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
