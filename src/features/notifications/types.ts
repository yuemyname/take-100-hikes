import type { Profile, SocialNotification } from '@/types';

export interface NotificationItem extends SocialNotification {
  actor: Profile | null;
}

export type PushPermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';
