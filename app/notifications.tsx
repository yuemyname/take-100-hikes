import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import {
  AppText,
  Avatar,
  EmptyState,
  LoadingSkeleton,
  PrimaryButton,
  Screen,
  SecondaryButton,
  TopBar,
} from '@/components/ui';
import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';
import { useAuth } from '@/features/auth';
import {
  enablePushNotifications,
  getPushPermissionState,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
  type NotificationItem,
  type PushPermissionState,
} from '@/features/notifications';

function formattedDate(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { status } = useAuth();
  const notifications = useNotifications();
  const unread = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [permission, setPermission] = useState<PushPermissionState>('undetermined');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    if (status !== 'signedIn') return;
    void getPushPermissionState()
      .then(setPermission)
      .catch(() => setPermission('unavailable'));
  }, [status]);

  const enablePush = async () => {
    setEnabling(true);
    setPermissionError(null);
    try {
      await enablePushNotifications();
      setPermission('granted');
    } catch (error) {
      const nextPermission = await getPushPermissionState().catch(
        (): PushPermissionState => 'unavailable',
      );
      setPermission(nextPermission);
      setPermissionError(error instanceof Error ? error.message : '알림을 켜지 못했어요.');
    } finally {
      setEnabling(false);
    }
  };

  const openNotification = (item: NotificationItem) => {
    if (!item.read_at) markRead.mutate(item.id);
    if (item.actor_id) {
      router.push({ pathname: '/user/[id]', params: { id: item.actor_id } });
    }
  };

  const markEverythingRead = async () => {
    await markAllRead.mutateAsync();
    await Notifications.setBadgeCountAsync(0).catch(() => false);
  };

  const rows = notifications.data ?? [];
  const unreadCount = unread.data ?? 0;

  return (
    <Screen
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={notifications.isRefetching || unread.isRefetching}
          onRefresh={() => {
            void notifications.refetch();
            void unread.refetch();
          }}
          tintColor={colors.ink}
        />
      }
    >
      <TopBar
        title="알림"
        onBack={() => router.back()}
        right={
          unreadCount > 0 ? (
            <Pressable onPress={() => void markEverythingRead()} accessibilityRole="button" accessibilityLabel="모든 알림 읽음 처리" hitSlop={8}>
              <AppText variant="caption" weight="700" color="blue">모두 읽기</AppText>
            </Pressable>
          ) : null
        }
      />

      <View style={styles.permissionCard}>
        <View style={styles.permissionCopy}>
          <View style={[styles.permissionIcon, permission === 'granted' ? styles.permissionIconOn : null]}>
            <MaterialCommunityIcons
              name={permission === 'granted' ? 'bell-check' : 'bell-ring'}
              size={24}
              color={permission === 'granted' ? colors.surface : colors.ink}
            />
          </View>
          <View style={styles.permissionText}>
            <AppText variant="heading3">
              {permission === 'granted' ? '아이폰 알림이 켜졌어요' : '친구 소식을 바로 받아보세요'}
            </AppText>
            <AppText variant="caption" color="inkMuted">
              새 팔로워와 맞팔 친구 소식을 알려드려요.
            </AppText>
          </View>
        </View>
        {status === 'signedIn' && permission !== 'granted' ? (
          permission === 'denied' ? (
            <SecondaryButton label="아이폰 설정 열기" onPress={() => void Linking.openSettings()} />
          ) : (
            <PrimaryButton label="푸시 알림 켜기" onPress={() => void enablePush()} loading={enabling} />
          )
        ) : null}
        {permissionError ? <AppText variant="caption" color="danger">{permissionError}</AppText> : null}
      </View>

      <View style={styles.listHeading}>
        <AppText variant="heading2">친구 소식</AppText>
        {unreadCount > 0 ? <AppText variant="caption" color="blue">새 알림 {unreadCount}개</AppText> : null}
      </View>

      {notifications.isLoading ? (
        <View style={styles.loading}><LoadingSkeleton height={76} lines={3} radius={radii.card} /></View>
      ) : notifications.isError ? (
        <EmptyState
          title="알림을 불러오지 못했어요"
          description="네트워크를 확인하고 다시 시도해주세요."
          actionLabel="다시 시도"
          onAction={() => void notifications.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="아직 새 소식이 없어요"
          description="누군가 나를 팔로우하거나 맞팔 친구가 되면 여기에 알려드릴게요."
        />
      ) : (
        <View style={styles.list}>
          {rows.map((item) => {
            const actorName = item.actor?.display_name ?? item.actor?.username ?? '친구';
            return (
              <Pressable
                key={item.id}
                onPress={() => openNotification(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item.body}, ${item.read_at ? '읽음' : '읽지 않음'}`}
                style={({ pressed }) => [
                  styles.row,
                  !item.read_at ? styles.rowUnread : null,
                  pressed ? styles.rowPressed : null,
                ]}
              >
                <View style={styles.avatarWrap}>
                  <Avatar uri={item.actor?.avatar_url} name={actorName} size="lg" />
                  {!item.read_at ? <View style={styles.unreadDot} /> : null}
                </View>
                <View style={styles.rowCopy}>
                  <AppText variant="body" weight="700">{item.title}</AppText>
                  <AppText variant="bodySmall" color="inkMuted">{item.body}</AppText>
                  <AppText variant="caption" color="inkMuted">{formattedDate(item.created_at)}</AppText>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.inkMuted} />
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge },
  permissionCard: {
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.yellow,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radii.cardLarge,
    marginBottom: spacing.xxl,
  },
  permissionCopy: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  permissionIcon: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionIconOn: { backgroundColor: colors.green },
  permissionText: { flex: 1, gap: spacing.xxs },
  listHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  loading: { gap: spacing.sm },
  list: { borderTopWidth: 2, borderTopColor: colors.ink },
  row: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowUnread: { backgroundColor: 'rgba(255,217,40,0.13)' },
  rowPressed: { opacity: 0.7 },
  avatarWrap: { position: 'relative' },
  unreadDot: {
    position: 'absolute',
    right: -1,
    top: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.background,
    backgroundColor: colors.red,
  },
  rowCopy: { flex: 1, gap: spacing.xxs },
});
