import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useViewerId } from '@/features/social';

import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from './api';

export const notificationKeys = {
  all: (userId: string) => ['notifications', userId] as const,
  unread: (userId: string) => ['notifications', userId, 'unread'] as const,
};

export function useNotifications() {
  const userId = useViewerId();
  return useQuery({
    queryKey: notificationKeys.all(userId),
    queryFn: () => fetchNotifications(userId),
    refetchInterval: 30_000,
  });
}
export function useUnreadNotificationCount() {
  const userId = useViewerId();
  return useQuery({
    queryKey: notificationKeys.unread(userId),
    queryFn: () => fetchUnreadNotificationCount(userId),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const userId = useViewerId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(userId, notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
  });
}

export function useMarkAllNotificationsRead() {
  const userId = useViewerId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
  });
}
