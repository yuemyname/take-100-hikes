import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getSupabase } from '@/lib/supabase';

import type { PushPermissionState } from './types';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function permissionGranted(permission: Notifications.NotificationPermissionsStatus): boolean {
  if (permission.granted) return true;
  const iosStatus = permission.ios?.status;
  return (
    iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

export async function getPushPermissionState(): Promise<PushPermissionState> {
  if (Platform.OS === 'web') return 'unavailable';
  const permission = await Notifications.getPermissionsAsync();
  if (permissionGranted(permission)) return 'granted';
  if (
    permission.status === 'denied' ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.DENIED
  ) {
    return 'denied';
  }
  return 'undetermined';
}

async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('social', {
    name: '친구 알림',
    description: '새 팔로워와 맞팔 친구 알림',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#245BFF',
  });
}

async function currentExpoPushToken(): Promise<string> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (typeof projectId !== 'string' || projectId.length === 0) {
    throw new Error('EAS 프로젝트 정보를 찾을 수 없어요.');
  }

  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

async function saveCurrentPushToken(): Promise<string> {
  const expoPushToken = await currentExpoPushToken();
  const platform = Platform.OS === 'android' ? 'android' : 'ios';
  const { error } = await getSupabase().rpc('register_push_token', {
    push_token: expoPushToken,
    device_platform: platform,
  });
  if (error) throw error;
  return expoPushToken;
}

export async function enablePushNotifications(): Promise<void> {
  if (Platform.OS === 'web') throw new Error('푸시 알림은 모바일 앱에서만 사용할 수 있어요.');
  await configureAndroidChannel();

  let permission = await Notifications.getPermissionsAsync();
  if (!permissionGranted(permission)) {
    permission = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
  }
  if (!permissionGranted(permission)) {
    throw new Error('아이폰 설정에서 100PEAKS 알림을 허용해주세요.');
  }

  await saveCurrentPushToken();
}

export async function refreshRegisteredPushToken(): Promise<void> {
  if (Platform.OS === 'web') return;
  await configureAndroidChannel();
  const permission = await Notifications.getPermissionsAsync();
  if (!permissionGranted(permission)) return;
  await saveCurrentPushToken();
}

export async function unregisterCurrentPushToken(): Promise<void> {
  if (Platform.OS === 'web') return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permissionGranted(permission)) return;

  const expoPushToken = await currentExpoPushToken();
  const { error } = await getSupabase()
    .from('push_tokens')
    .delete()
    .eq('expo_push_token', expoPushToken);
  if (error) throw error;
  await Notifications.setBadgeCountAsync(0).catch(() => false);
}
