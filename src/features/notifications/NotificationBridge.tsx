import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth';

import { markNotificationRead } from './api';
import { refreshRegisteredPushToken } from './push';

function safeNotificationRoute(value: unknown): Href | null {
  if (typeof value !== 'string') return null;
  if (/^\/user\/[0-9a-f-]{36}$/i.test(value)) return value as Href;
  return null;
}
export function NotificationBridge() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status, user } = useAuth();

  const handleResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      if (status !== 'signedIn' || !user) return;
      const data = response.notification.request.content.data;
      const notificationId = data?.notificationId;
      const route = safeNotificationRoute(data?.url);

      if (typeof notificationId === 'string') {
        void markNotificationRead(user.id, notificationId).finally(() => {
          void queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        });
      }
      Notifications.clearLastNotificationResponse();
      if (route) router.push(route);
    },
    [queryClient, router, status, user],
  );

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const received = Notifications.addNotificationReceivedListener(() => {
      if (user) void queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    });
    const responded = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => {
      received.remove();
      responded.remove();
    };
  }, [handleResponse, queryClient, user]);

  useEffect(() => {
    if (Platform.OS === 'web' || status !== 'signedIn' || !user) return;
    void refreshRegisteredPushToken().catch(() => {
      // Permission may be denied or the device may be offline. The notification
      // screen provides an explicit retry without blocking the rest of the app.
    });

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) handleResponse(lastResponse);
  }, [handleResponse, status, user]);

  return null;
}
