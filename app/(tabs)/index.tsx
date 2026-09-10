import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import {
  AppText,
  Avatar,
  CollectionSwitcher,
  InvitationCard,
  MountainCard,
  Screen,
  TopBar,
} from '@/components/ui';
import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';
import { HOME_HERO_CHARACTER, HOME_HERO_LABEL } from '@/data/officialArt';
import { useAuth } from '@/features/auth';
import { useMyInvitations, useRespondToInvitation } from '@/features/certification';
import {
  BAC_PENDING_COUNT,
  mountainsForCollection,
  usePrimaryCollection,
} from '@/features/collections';
import { useCompletedMountainIds, useMountains } from '@/features/mountains';
import { useUnreadNotificationCount } from '@/features/notifications';
import { useProfile, useViewerId } from '@/features/social';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const HOME_HERO_PHOTO = require('../../assets/photos/home-hero.png');

const QUICK_ACTIONS: { label: string; sub: string; icon: IconName; href: Href; tone: string }[] = [
  { label: '명산 도감', sub: '100대 명산', icon: 'image-filter-hdr', href: '/mountains', tone: colors.green },
  { label: '인증하기', sub: '지금 여기서!', icon: 'camera', href: '/verify', tone: colors.red },
  { label: '친구', sub: '함께 오르는 재미', icon: 'account-group', href: '/friends', tone: colors.pink },
  { label: '내 기록', sub: '나의 등산 이야기', icon: 'seal-variant', href: '/profile', tone: colors.blue },
];

export default function HomeScreen() {
  const router = useRouter();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const { user, status } = useAuth();
  const viewerId = useViewerId();
  const profile = useProfile(viewerId);
  const mountains = useMountains();
  const completedQuery = useCompletedMountainIds();
  const invitations = useMyInvitations();
  const unreadNotifications = useUnreadNotificationCount();
  const respond = useRespondToInvitation();
  const { id: collectionId, collection } = usePrimaryCollection();

  const completed = useMemo(() => completedQuery.data ?? new Set<string>(), [completedQuery.data]);
  const collectionMountains = useMemo(
    () => mountainsForCollection(mountains.data ?? [], collectionId),
    [mountains.data, collectionId],
  );
  const displayName =
    profile.data?.display_name ??
    profile.data?.username ??
    (user?.user_metadata as { display_name?: string } | undefined)?.display_name ??
    (status === 'guest' ? '게스트' : null);
  const heroPhotoSource = profile.data?.home_background_url
    ? { uri: profile.data.home_background_url }
    : HOME_HERO_PHOTO;

  const hero = useMemo(
    () => collectionMountains.find((mountain) => completed.has(mountain.id)) ?? collectionMountains[0] ?? null,
    [collectionMountains, completed],
  );

  const nextTargets = useMemo(
    () => collectionMountains.filter((mountain) => !completed.has(mountain.id)).slice(0, 2),
    [collectionMountains, completed],
  );

  const heroHeight = Math.max(620, windowHeight - 64);
  const characterHeight = Math.min(180, heroHeight * 0.24) * 2.25;
  const characterWidth = characterHeight * (4580 / 7687);
  const labelWidth = Math.min(190, windowWidth * 0.48) * 1.6;
  const labelHeight = labelWidth * (131 / 401);

  const openHeroMountain = () => {
    if (hero) {
      router.push({ pathname: '/mountain/[id]', params: { id: hero.id } });
      return;
    }
    router.push('/mountains');
  };

  return (
    <Screen padded={false} contentContainerStyle={styles.screenContent}>
      <View style={styles.titleHeader}>
        <TopBar
          wordmark
          right={
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push('/notifications' as Href)}
                accessibilityRole="button"
                accessibilityLabel={`알림${(unreadNotifications.data ?? 0) > 0 ? `, 읽지 않은 알림 ${unreadNotifications.data}개` : ''}`}
                style={styles.notificationButton}
              >
                <MaterialCommunityIcons name="bell-outline" size={25} color={colors.ink} />
                {(unreadNotifications.data ?? 0) > 0 ? (
                  <View style={styles.notificationBadge}>
                    <AppText variant="caption" color="surface" weight="700">
                      {(unreadNotifications.data ?? 0) > 99 ? '99+' : unreadNotifications.data}
                    </AppText>
                  </View>
                ) : null}
              </Pressable>
              <Pressable onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel="내 프로필" hitSlop={8}>
                <Avatar uri={profile.data?.avatar_url} name={displayName} size="md" />
              </Pressable>
            </View>
          }
        />
      </View>

      <View style={[styles.heroStage, { height: heroHeight }]}>
        <Pressable
          onPress={openHeroMountain}
          accessibilityRole="button"
          accessibilityLabel={hero ? `${hero.name_ko} 상세 보기` : '명산 도감 보기'}
          style={StyleSheet.absoluteFill}
        >
          <Image source={heroPhotoSource} contentFit="cover" contentPosition="center" style={StyleSheet.absoluteFill} />
        </Pressable>
        <View style={styles.heroWash} pointerEvents="none" />

        <Image
          source={HOME_HERO_CHARACTER}
          contentFit="contain"
          style={[styles.heroCharacter, { width: characterWidth, height: characterHeight }]}
          accessibilityLabel="100PEAKS 공식 노란 캐릭터"
        />
        <Image
          source={HOME_HERO_LABEL}
          contentFit="contain"
          style={[styles.heroLabel, { width: labelWidth, height: labelHeight }]}
          accessibilityLabel="이 맛에 등산함"
        />
      </View>

      <View style={styles.afterHero}>
        <View style={styles.actions}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => router.push(action.href)}
              accessibilityRole="button"
              accessibilityLabel={`${action.label}, ${action.sub}`}
              style={({ pressed }) => [styles.action, pressed ? styles.actionPressed : null]}
            >
              <MaterialCommunityIcons name={action.icon} size={28} color={action.tone} style={styles.actionIcon} />
              <View style={styles.actionCopy}>
                <AppText variant="heading3">{action.label}</AppText>
                <AppText variant="caption" color="inkMuted">{action.sub}</AppText>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.collectionPanel}>
          <View style={styles.collectionHeading}>
            <AppText variant="heading3">도전 컬렉션</AppText>
            <AppText variant="caption" color="inkMuted">{collection.name}</AppText>
          </View>
          <CollectionSwitcher showDescription />
          {collectionId === 'bac_100' ? (
            <AppText variant="caption" color="inkMuted">
              BAC 전용 {BAC_PENDING_COUNT}개 산은 인증지 좌표 검증 후 순차 연결돼요. 기존 등산 기록은 자동 반영돼요.
            </AppText>
          ) : null}
        </View>

        {(invitations.data ?? []).length > 0 ? (
          <View style={styles.invitations}>
            <AppText variant="heading2">공동 인증 요청 {invitations.data?.length}</AppText>
            {(invitations.data ?? []).map((invitation) => (
              <InvitationCard
                key={invitation.sessionId}
                creator={invitation.creator}
                mountainName={invitation.mountain.name_ko}
                expiresAt={invitation.expiresAt}
                onAccept={() => router.push({ pathname: '/certification/join', params: { sessionId: invitation.sessionId } })}
                onDecline={() => respond.mutate({ sessionId: invitation.sessionId, accept: false })}
                declining={respond.isPending && respond.variables?.sessionId === invitation.sessionId}
              />
            ))}
          </View>
        ) : null}

        {nextTargets.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <AppText variant="heading2">이번엔 어디 갈 건데?</AppText>
              <Pressable onPress={() => router.push('/mountains')} accessibilityRole="button" accessibilityLabel="도감 전체 보기" hitSlop={8}>
                <AppText variant="bodySmall" weight="700" color="blue">전체 보기</AppText>
              </Pressable>
            </View>
            <View style={styles.targets}>
              {nextTargets.map((mountain) => (
                <View key={mountain.id} style={styles.targetCell}>
                  <MountainCard
                    mountain={mountain}
                    index={mountain.display_order ?? 0}
                    completed={false}
                    fallbackPhotoSource={HOME_HERO_PHOTO}
                    onPress={() => router.push({ pathname: '/mountain/[id]', params: { id: mountain.id } })}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingBottom: 0 },
  titleHeader: { paddingHorizontal: spacing.xl, backgroundColor: colors.background },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  notificationButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 1,
    right: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStage: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.ink,
  },
  heroWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,249,237,0.04)',
  },
  heroCharacter: { position: 'absolute', left: spacing.lg, bottom: spacing.xl, zIndex: 2 },
  heroLabel: { position: 'absolute', right: spacing.md, top: spacing.xl, zIndex: 3 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  action: {
    width: '47%',
    flexGrow: 1,
    minHeight: MIN_TOUCH_TARGET + 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionPressed: { backgroundColor: colors.surfaceMuted, transform: [{ scale: 0.98 }] },
  actionIcon: { width: 30 },
  actionCopy: { flex: 1, gap: spacing.xxs },
  afterHero: { padding: spacing.xl, paddingBottom: spacing.huge, gap: spacing.xxl },
  collectionPanel: {
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
    borderColor: colors.border,
  },
  collectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  invitations: { gap: spacing.md },
  section: { gap: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  targets: { flexDirection: 'row', gap: spacing.md },
  targetCell: { flex: 1 },
});
