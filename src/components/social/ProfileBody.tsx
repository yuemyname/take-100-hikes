import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, EmptyState, LoadingSkeleton, Mascot, MountainPhoto, OFFICIAL_ART, ProgressCounter, formatCertifiedDate } from '@/components/ui';
import { colors, radii, spacing } from '@/constants';
import { getMascotLook, hasOfficialMascot, PLACEHOLDER_MASCOT } from '@/data/mascots';
import { countByRegion, useMountains } from '@/features/mountains';
import { useCompletedMountains, useProfileStats } from '@/features/social';
import type { Profile } from '@/types';

export interface ProfileBodyProps {
  user: Profile;
  /** Follow button (friend) or nothing (me). Rendered under the name. */
  action?: ReactNode;
  /** Show the playful remaining-count caption (MY page). */
  showCaption?: boolean;
}

/**
 * Profile content shared by MY and friend pages — spec §7.3, §8:
 * avatar, names, bio, follow counts, X / 100, region progress, mountain
 * history, and collected characters.
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
        <Avatar uri={user.avatar_url} name={name} size="xl" />
        <AppText variant="heading2" style={styles.name}>
          {name}
        </AppText>
        <AppText variant="bodySmall" color="inkMuted">
          @{user.username}
        </AppText>
        {user.bio ? (
          <AppText variant="bodySmall" align="center" style={styles.bio}>
            {user.bio}
          </AppText>
        ) : null}
        <View style={styles.counts}>
          <Count label="팔로워" value={stats.data?.followerCount} />
          <View style={styles.countDivider} />
          <Count label="팔로잉" value={stats.data?.followingCount} />
          <View style={styles.countDivider} />
          <Count label="산" value={stats.data?.completedCount} />
        </View>
        {action}
      </View>

      <View style={styles.progress}>
        {completed.isLoading ? (
          <LoadingSkeleton height={38} width="45%" />
        ) : (
          <ProgressCounter
            completed={count}
            size="md"
            caption={showCaption ? (count === 0 ? '첫 번째 산은 어디로 갈 건데?' : `아직 ${100 - count}개나 남았는데?`) : undefined}
          />
        )}
      </View>

      <AppText variant="heading3" style={styles.sectionTitle}>
        지역별 진행
      </AppText>
      <View style={styles.card}>
        {mountains.isLoading ? (
          <LoadingSkeleton lines={4} height={20} />
        ) : (
          regions.map((r) => (
            <View key={r.region} style={styles.regionRow}>
              <AppText variant="body">{r.region}</AppText>
              <View style={styles.regionRight}>
                <View style={styles.regionTrack}>
                  <View style={[styles.regionFill, { width: `${r.total ? Math.round((r.done / r.total) * 100) : 0}%` }]} />
                </View>
                <AppText variant="body" weight="700">
                  {r.done}
                  <AppText variant="bodySmall" color="inkMuted">
                    {' '}
                    / {r.total}
                  </AppText>
                </AppText>
              </View>
            </View>
          ))
        )}
      </View>

      <AppText variant="heading3" style={styles.sectionTitle}>
        산 기록 {count}
      </AppText>
      {completed.isLoading ? (
        <LoadingSkeleton lines={3} height={64} radius={12} />
      ) : completed.isError ? (
        <EmptyState title="잠깐 연결이 끊겼어요." description="다시 시도해주세요." actionLabel="다시 시도" onAction={() => completed.refetch()} mascot={false} />
      ) : count === 0 ? (
        <View style={styles.card}>
          <AppText variant="bodySmall" color="inkMuted">
            아직 인증한 산이 없어요. 첫 산은 어디로 갈 건데?
          </AppText>
        </View>
      ) : (
        <View style={styles.history}>
          {(completed.data ?? []).map((c) => {
            const m = mountainById.get(c.mountainId);
            if (!m) return null;
            return (
              <Pressable
                key={c.mountainId}
                onPress={() => router.push({ pathname: '/mountain/[id]', params: { id: m.id } })}
                accessibilityRole="button"
                accessibilityLabel={`${m.name_ko}, ${formatCertifiedDate(c.certifiedAt)} 인증`}
                style={({ pressed }) => [styles.historyRow, pressed ? styles.pressed : null]}
              >
                <MountainPhoto uri={m.image_url} seed={m.display_order ?? 1} radius={radii.chip} style={styles.historyThumb} accessibilityLabel={`${m.name_ko} 사진`} />
                <View style={styles.historyText}>
                  <AppText variant="body" weight="700">
                    {m.name_ko}
                  </AppText>
                  <AppText variant="caption" color="inkMuted">
                    {formatCertifiedDate(c.certifiedAt)} · {m.altitude_m?.toLocaleString('ko-KR')}m
                    {c.partySize > 1 ? ` · ${c.partySize}명 함께` : ''}
                  </AppText>
                </View>
                <Mascot
                  look={hasOfficialMascot(m.mascot_key) ? getMascotLook(m.mascot_key) : PLACEHOLDER_MASCOT}
                  silhouette={!hasOfficialMascot(m.mascot_key)}
                  size={OFFICIAL_ART.boxFor(60)}
                  accessibilityLabel={hasOfficialMascot(m.mascot_key) ? `${m.name_ko} 캐릭터` : '캐릭터 준비 중'}
                />
              </Pressable>
            );
          })}
        </View>
      )}

      <AppText variant="heading3" style={styles.sectionTitle}>
        모은 캐릭터 {count}
      </AppText>
      {count === 0 ? (
        <View style={styles.card}>
          <AppText variant="bodySmall" color="inkMuted">
            산을 인증하면 그 산의 캐릭터가 여기에 모여요.
          </AppText>
        </View>
      ) : (
        <View style={styles.mascots}>
          {(completed.data ?? []).map((c) => {
            const m = mountainById.get(c.mountainId);
            if (!m) return null;
            return (
              <View key={c.mountainId} style={styles.mascotCell}>
                <Mascot
                  look={hasOfficialMascot(m.mascot_key) ? getMascotLook(m.mascot_key) : PLACEHOLDER_MASCOT}
                  silhouette={!hasOfficialMascot(m.mascot_key)}
                  size={OFFICIAL_ART.boxFor(80)}
                  accessibilityLabel={hasOfficialMascot(m.mascot_key) ? `${m.name_ko} 캐릭터` : '캐릭터 준비 중'}
                />
                <AppText variant="caption" numberOfLines={1}>
                  {m.name_ko}
                </AppText>
              </View>
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
      <AppText variant="caption" color="inkMuted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.lg },
  name: { marginTop: spacing.md },
  bio: { marginTop: spacing.sm, paddingHorizontal: spacing.xl },
  counts: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, gap: spacing.lg },
  count: { alignItems: 'center', minWidth: 56 },
  countDivider: { width: 1, height: 24, backgroundColor: colors.border },
  progress: { marginVertical: spacing.xxl },
  sectionTitle: { marginTop: spacing.lg, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  regionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  regionRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  regionTrack: { width: 96, height: 8, borderRadius: radii.pill, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  regionFill: { height: '100%', backgroundColor: colors.success },
  history: { gap: spacing.sm },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.md,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  historyThumb: { width: 56, height: 56 },
  historyText: { flex: 1, gap: spacing.xxs },
  mascots: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  mascotCell: { width: '30%', alignItems: 'center', gap: spacing.xs },
});
