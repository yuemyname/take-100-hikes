import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, EmptyState, LoadingSkeleton, MountainPhoto, ProgressCounter, formatCertifiedDate } from '@/components/ui';
import { colors, radii, spacing } from '@/constants';
import { OFFICIAL_STICKERS } from '@/data/officialArt';
import { countByRegion, useMountains } from '@/features/mountains';
import { useCompletedMountains, useProfileStats } from '@/features/social';
import type { Profile } from '@/types';

export interface ProfileBodyProps {
  user: Profile;
  action?: ReactNode;
  showCaption?: boolean;
}

/**
 * Profile content shared by MY and friend pages.
 * Mountains and shared memories are the collection. Brand characters are not
 * unlocked per mountain and are intentionally absent from mountain history.
 */
export function ProfileBody({ user, action, showCaption = false }: ProfileBodyProps) {
  const router = useRouter();
  const name = user.display_name ?? user.username;
  const mountains = useMountains();
  const completed = useCompletedMountains(user.id);
  const stats = useProfileStats(user.id);

  const mountainById = useMemo(() => new Map((mountains.data ?? []).map((m) => [m.id, m])), [mountains.data]);
  const completedIds = useMemo(() => new Set((completed.data ?? []).map((c) => c.mountainId)), [completed.data]);
  const regions = useMemo(() => countByRegion(mountains.data ?? [], completedIds), [mountains.data, completedIds]);
  const count = completed.data?.length ?? 0;

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Avatar uri={user.avatar_url} name={name} size="xl" />
          {count > 0 ? <Image source={OFFICIAL_STICKERS.summitToday} contentFit="contain" style={styles.headerSticker} accessibilityLabel="오늘도 완등 스티커" /> : null}
        </View>
        <AppText variant="heading2" style={styles.name}>{name}</AppText>
        <AppText variant="bodySmall" color="inkMuted">@{user.username}</AppText>
        {user.bio ? <AppText variant="bodySmall" align="center" style={styles.bio}>{user.bio}</AppText> : null}
        <View style={styles.counts}>
          <Count label="팔로워" value={stats.data?.followerCount} />
          <View style={styles.countDivider} />
          <Count label="팔로잉" value={stats.data?.followingCount} />
          <View style={styles.countDivider} />
          <Count label="완등" value={stats.data?.completedCount} />
        </View>
        {action}
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressCopy}>
          {completed.isLoading ? (
            <LoadingSkeleton height={38} width="70%" />
          ) : (
            <ProgressCounter
              completed={count}
              size="md"
              caption={showCaption ? (count === 0 ? '첫 번째 산은 어디로 갈 건데?' : `아직 ${100 - count}개나 남았는데?`) : undefined}
            />
          )}
        </View>
        <Image source={count >= 100 ? OFFICIAL_STICKERS.summitSuccess : OFFICIAL_STICKERS.mountain} contentFit="contain" style={styles.progressSticker} accessibilityLabel="100PEAKS 진행 스티커" />
      </View>

      <AppText variant="heading3" style={styles.sectionTitle}>지역별 진행</AppText>
      <View style={styles.card}>
        {mountains.isLoading ? (
          <LoadingSkeleton lines={4} height={20} />
        ) : (
          regions.map((r, index) => (
            <View key={r.region} style={styles.regionRow}>
              <AppText variant="body">{r.region}</AppText>
              <View style={styles.regionRight}>
                <View style={styles.regionTrack}>
                  <View style={[styles.regionFill, { width: `${r.total ? Math.round((r.done / r.total) * 100) : 0}%`, backgroundColor: [colors.blue, colors.red, colors.green, colors.pink][index % 4] }]} />
                </View>
                <AppText variant="body" weight="700">{r.done}<AppText variant="bodySmall" color="inkMuted"> / {r.total}</AppText></AppText>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.historyTitle}>
        <View>
          <AppText variant="heading2">내가 모은 산</AppText>
          <AppText variant="caption" color="inkMuted">사진과 함께 남은 {count}개의 정상 기록</AppText>
        </View>
        {count > 0 ? <Image source={OFFICIAL_STICKERS.didIt} contentFit="contain" style={styles.didIt} accessibilityLabel="내가 해냄 스티커" /> : null}
      </View>

      {completed.isLoading ? (
        <LoadingSkeleton lines={3} height={80} radius={12} />
      ) : completed.isError ? (
        <EmptyState title="잠깐 연결이 끊겼어요." description="다시 시도해주세요." actionLabel="다시 시도" onAction={() => completed.refetch()} mascot={false} />
      ) : count === 0 ? (
        <View style={styles.card}><AppText variant="bodySmall" color="inkMuted">아직 인증한 산이 없어요. 첫 산은 어디로 갈 건데?</AppText></View>
      ) : (
        <View style={styles.history}>
          {(completed.data ?? []).map((c) => {
            const m = mountainById.get(c.mountainId);
            if (!m) return null;
            return (
              <Pressable
                key={c.mountainId}
                onPress={() => c.partySize > 1 ? router.push({ pathname: '/certification/session/[id]', params: { id: c.sessionId } }) : router.push({ pathname: '/mountain/[id]', params: { id: m.id } })}
                accessibilityRole="button"
                accessibilityLabel={`${m.name_ko}, ${formatCertifiedDate(c.certifiedAt)} 인증${c.partySize > 1 ? ', 함께 인증 보기' : ''}`}
                style={({ pressed }) => [styles.historyRow, pressed ? styles.pressed : null]}
              >
                <MountainPhoto uri={m.image_url} seed={m.display_order ?? 1} radius={radii.card} style={styles.historyThumb} accessibilityLabel={`${m.name_ko} 사진`} />
                <View style={styles.historyText}>
                  <AppText variant="heading3">{m.name_ko}</AppText>
                  <AppText variant="caption" color="inkMuted">
                    {formatCertifiedDate(c.certifiedAt)} · {m.altitude_m?.toLocaleString('ko-KR')}m{c.partySize > 1 ? ` · ${c.partySize}명 함께` : ''}
                  </AppText>
                </View>
                {c.partySize > 1 ? <View style={styles.party}><AppText variant="caption" weight="700">같이</AppText></View> : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function Count({ label, value }: { label: string; value?: number }) {
  return (
    <View style={styles.count} accessible accessibilityLabel={`${label} ${value ?? 0}`}>
      <AppText variant="heading3">{value ?? '-'}</AppText>
      <AppText variant="caption" color="inkMuted">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.lg },
  avatarWrap: { position: 'relative' },
  headerSticker: { position: 'absolute', width: 82, height: 48, right: -68, top: -12, transform: [{ rotate: '7deg' }] },
  name: { marginTop: spacing.md },
  bio: { marginTop: spacing.sm, paddingHorizontal: spacing.xl },
  counts: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, gap: spacing.lg },
  count: { alignItems: 'center', minWidth: 56 },
  countDivider: { width: 1, height: 24, backgroundColor: colors.border },
  progressCard: { position: 'relative', minHeight: 132, marginVertical: spacing.xxl, backgroundColor: colors.yellow, borderRadius: radii.cardLarge, padding: spacing.xl, overflow: 'hidden', justifyContent: 'center' },
  progressCopy: { width: '72%', zIndex: 2 },
  progressSticker: { position: 'absolute', width: 110, height: 90, right: spacing.sm, bottom: -4, transform: [{ rotate: '-6deg' }] },
  sectionTitle: { marginTop: spacing.lg, marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.card, padding: spacing.lg, gap: spacing.md },
  regionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  regionRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  regionTrack: { width: 96, height: 8, borderRadius: radii.pill, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  regionFill: { height: '100%' },
  historyTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xxxl, marginBottom: spacing.md },
  didIt: { width: 92, height: 54, transform: [{ rotate: '5deg' }] },
  history: { gap: spacing.sm },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1.5, borderBottomColor: colors.border, paddingVertical: spacing.md },
  pressed: { opacity: 0.7 },
  historyThumb: { width: 78, height: 78 },
  historyText: { flex: 1, gap: spacing.xxs },
  party: { backgroundColor: colors.pink, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
});
