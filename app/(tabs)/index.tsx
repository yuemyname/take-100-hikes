import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Avatar,
  CollectionSwitcher,
  InvitationCard,
  LoadingSkeleton,
  MountainCard,
  MountainPhoto,
  ProgressCounter,
  Screen,
  SignPost,
  SpeechBubble,
  TopBar,
} from '@/components/ui';
import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';
import { HOME_HERO_CHARACTER, OFFICIAL_STICKERS } from '@/data/officialArt';
import { useAuth } from '@/features/auth';
import { useMyInvitations, useRespondToInvitation } from '@/features/certification';
import {
  BAC_PENDING_COUNT,
  completedCountForCollection,
  mountainsForCollection,
  usePrimaryCollection,
} from '@/features/collections';
import { useCompletedMountainIds, useMountains } from '@/features/mountains';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const QUICK_ACTIONS: { label: string; sub: string; icon: IconName; href: Href; tone: string }[] = [
  { label: '명산 도감', sub: '100대 명산', icon: 'image-filter-hdr', href: '/mountains', tone: colors.green },
  { label: '인증하기', sub: '지금 여기서!', icon: 'camera', href: '/verify', tone: colors.red },
  { label: '친구', sub: '함께 오르는 재미', icon: 'account-group', href: '/friends', tone: colors.pink },
  { label: '내 기록', sub: '나의 등산 이야기', icon: 'notebook', href: '/profile', tone: colors.blue },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, status } = useAuth();
  const mountains = useMountains();
  const completedQuery = useCompletedMountainIds();
  const invitations = useMyInvitations();
  const respond = useRespondToInvitation();
  const { id: collectionId, collection } = usePrimaryCollection();

  const completed = useMemo(() => completedQuery.data ?? new Set<string>(), [completedQuery.data]);
  const collectionMountains = useMemo(
    () => mountainsForCollection(mountains.data ?? [], collectionId),
    [mountains.data, collectionId],
  );
  const count = useMemo(
    () => completedCountForCollection(mountains.data ?? [], completed, collectionId),
    [mountains.data, completed, collectionId],
  );
  const remaining = collection.targetCount - count;

  const displayName =
    (user?.user_metadata as { display_name?: string } | undefined)?.display_name ??
    (status === 'guest' ? '게스트' : null);

  const hero = useMemo(
    () => collectionMountains.find((m) => completed.has(m.id)) ?? collectionMountains[0] ?? null,
    [collectionMountains, completed],
  );

  const nextTargets = useMemo(
    () => collectionMountains.filter((m) => !completed.has(m.id)).slice(0, 2),
    [collectionMountains, completed],
  );

  const bubble = count === 0 ? '첫 산은 어디로 갈 건데?' : `아직 ${remaining}개나 남았는데?`;

  return (
    <Screen>
      <TopBar
        wordmark
        right={
          <Pressable onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel="내 프로필" hitSlop={8}>
            <Avatar name={displayName} size="md" />
          </Pressable>
        }
      />

      {(invitations.data ?? []).length > 0 ? (
        <View style={styles.invitations}>
          <AppText variant="heading3">공동 인증 요청 {invitations.data?.length}</AppText>
          {(invitations.data ?? []).map((inv) => (
            <InvitationCard
              key={inv.sessionId}
              creator={inv.creator}
              mountainName={inv.mountain.name_ko}
              expiresAt={inv.expiresAt}
              onAccept={() => router.push({ pathname: '/certification/join', params: { sessionId: inv.sessionId } })}
              onDecline={() => respond.mutate({ sessionId: inv.sessionId, accept: false })}
              declining={respond.isPending && respond.variables?.sessionId === inv.sessionId}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.challenge}>
        <CollectionSwitcher showDescription />
      </View>

      <View style={styles.progressWrap}>
        <AppText variant="caption" weight="700" color="inkMuted">{collection.name.toUpperCase()}</AppText>
        <View style={styles.progress}>
          {completedQuery.isLoading || mountains.isLoading ? (
            <LoadingSkeleton height={52} width="45%" />
          ) : (
            <ProgressCounter completed={count} />
          )}
        </View>
        {collectionId === 'bac_100' ? (
          <AppText variant="caption" color="inkMuted">
            BAC 전용 {BAC_PENDING_COUNT}개 산은 인증지 좌표 검증 후 순차 연결돼요. 기존 등산 기록은 자동 반영돼요.
          </AppText>
        ) : null}
      </View>

      <View style={styles.hero}>
        <MountainPhoto
          uri={hero?.image_url}
          seed={hero?.display_order ?? 3}
          radius={radii.cardLarge}
          style={styles.heroPhoto}
          accessibilityLabel={hero ? `${hero.name_ko} 사진` : '산 사진'}
        />
        <View style={styles.heroScrim} pointerEvents="none" />
        {hero ? (
          <Pressable
            onPress={() => router.push({ pathname: '/mountain/[id]', params: { id: hero.id } })}
            accessibilityRole="button"
            accessibilityLabel={`${hero.name_ko} 상세 보기`}
            style={styles.heroTag}
          >
            <AppText variant="caption" weight="700" color="surface">
              {hero.name_ko} · {hero.altitude_m?.toLocaleString('ko-KR')}m
            </AppText>
          </Pressable>
        ) : null}
        <Image source={OFFICIAL_STICKERS.mountain} contentFit="contain" style={styles.mountainSticker} accessibilityLabel="산 그래픽 스티커" />
        <View style={styles.bubble} pointerEvents="none">
          <SpeechBubble text={bubble} tone="surface" tailPosition="left" />
        </View>
        <Image source={HOME_HERO_CHARACTER} contentFit="contain" style={styles.heroCharacter} accessibilityLabel="100PEAKS 공식 캐릭터" />
        <View style={styles.sign} pointerEvents="none">
          <SignPost lines={['산은 왜 하는 건데?', '— 그냥 좋으니까!']} tilt={-2} />
        </View>
      </View>

      <View style={styles.actions}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => router.push(action.href)}
            accessibilityRole="button"
            accessibilityLabel={`${action.label}, ${action.sub}`}
            style={({ pressed }) => [styles.action, pressed ? styles.actionPressed : null]}
          >
            <MaterialCommunityIcons name={action.icon} size={38} color={action.tone} style={styles.actionIcon} />
            <AppText variant="heading3">{action.label}</AppText>
            <AppText variant="caption" color="inkMuted">{action.sub}</AppText>
          </Pressable>
        ))}
      </View>

      {nextTargets.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <AppText variant="heading2">이번엔 어디 갈 건데?</AppText>
            <Pressable onPress={() => router.push('/mountains')} accessibilityRole="button" accessibilityLabel="도감 전체 보기" hitSlop={8}>
              <AppText variant="bodySmall" weight="700" color="blue">전체 보기</AppText>
            </Pressable>
          </View>
          <View style={styles.targets}>
            {nextTargets.map((m) => (
              <View key={m.id} style={styles.targetCell}>
                <MountainCard
                  mountain={m}
                  index={m.display_order ?? 0}
                  completed={false}
                  onPress={() => router.push({ pathname: '/mountain/[id]', params: { id: m.id } })}
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  invitations: { marginTop: spacing.sm, marginBottom: spacing.lg, gap: spacing.md },
  challenge: { marginTop: spacing.md },
  progressWrap: { marginTop: spacing.lg, gap: spacing.xxs },
  progress: { marginTop: 2 },
  hero: { marginTop: spacing.lg, marginBottom: spacing.huge + spacing.xl, minHeight: 410 },
  heroPhoto: { height: 390 },
  heroScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 20, borderRadius: radii.cardLarge, backgroundColor: 'rgba(0,0,0,0.05)' },
  heroTag: { position: 'absolute', top: spacing.md, right: spacing.md, backgroundColor: colors.ink, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 32, justifyContent: 'center' },
  mountainSticker: { position: 'absolute', width: 78, height: 78, left: spacing.md, top: spacing.md, transform: [{ rotate: '-7deg' }] },
  bubble: { position: 'absolute', right: spacing.md, top: 72, maxWidth: 190 },
  heroCharacter: { position: 'absolute', width: 250, height: 300, left: -20, bottom: -54 },
  sign: { position: 'absolute', right: spacing.sm, bottom: -spacing.huge },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  action: { width: '47%', flexGrow: 1, minHeight: MIN_TOUCH_TARGET + 64, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.cardLarge, padding: spacing.lg, gap: spacing.xxs, transform: [{ rotate: '-0.4deg' }] },
  actionPressed: { backgroundColor: colors.surfaceMuted, transform: [{ rotate: '0deg' }, { scale: 0.99 }] },
  actionIcon: { marginBottom: spacing.xs },
  section: { marginTop: spacing.xxxl },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  targets: { flexDirection: 'row', gap: spacing.md },
  targetCell: { flex: 1 },
});
