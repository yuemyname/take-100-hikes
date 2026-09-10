import { useFonts } from 'expo-font';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/constants';
import { AuthProvider, useAuth } from '@/features/auth';
import { NotificationBridge } from '@/features/notifications';
import { appFonts } from '@/lib/fonts';
import { queryClient } from '@/lib/queryClient';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* already hidden */
});

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { status } = useAuth();
  const isReady = status !== 'loading' && fontsReady;
  const isAuthenticated = status === 'signedIn' || status === 'guest';

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {
        /* already hidden */
      });
    }
  }, [isReady]);

  if (!isReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="mountain/[id]" />
        <Stack.Screen name="user/[id]" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="certification/capture" />
        <Stack.Screen name="certification/review" />
        <Stack.Screen name="certification/success" />
        <Stack.Screen name="certification/invite" />
        <Stack.Screen name="certification/join" />
        <Stack.Screen name="certification/session/[id]" />
        <Stack.Screen name="notifications" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  // A font failure must not block the app: fall back to system fonts.
  const fontsReady = fontsLoaded || Boolean(fontError);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="dark" />
            <NotificationBridge />
            <RootNavigator fontsReady={fontsReady} />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
