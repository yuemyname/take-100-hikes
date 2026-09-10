import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Profile, SocialNotification } from '@/types';

import type { NotificationItem } from './types';

interface NotificationRow extends SocialNotification {
  actor: Profile | Profile[] | null;
}

function localOnly(userId: string): boolean {
  return !isSupabaseConfigured || userId.startsWith('demo:');
}

export async function fetchNotifications(userId: string): Promise<NotificationItem[]> {
  if (localOnly(userId)) return [];

  const { data, error } = await getSupabase()
    .from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;

  return ((data ?? []) as NotificationRow[]).map((row) => ({
    ...row,
    actor: Array.isArray(row.actor) ? (row.actor[0] ?? null) : row.actor,
  }));
}

export async function fetchUnreadNotificationCount(userId: string): Promise<number> {
  if (localOnly(userId)) return 0;

  const { count, error } = await getSupabase()
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);
  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  if (localOnly(userId)) return;

  const { error } = await getSupabase()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .is('read_at', null);
  if (error) throw error;
}
export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (localOnly(userId)) return;

  const { error } = await getSupabase()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
  if (error) throw error;
}
