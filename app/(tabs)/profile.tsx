import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, LoadingSkeleton, Mascot, ProgressCounter, Screen, SecondaryButton, TopBar } from '@/components/ui';
import { colors, radii, spacing } from '@/constants';
import { getMascotLook } from '@/data/mascots';
import { useAuth } from '@/features/auth';
import { authErrorMessage } from '@/features/auth/messages';
import { countByRegion, useCompletedMountainIds, useMountains } from '@/features/mountains';
import { TOTAL_MOUNTAINS } from '@/types';

/** MY — spec §8: progress, region progress, collected characters. History and shared hikes land in Phases 4–5. */
export default function ProfileScreen() {
  const { user, status, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountains = useMountains();
  const completedQuery = useCompletedMountainIds();
  const completed = useMemo(() => completedQuery.data ?? new Set<string>(), [completedQuery.data]);
  const regions = useMemo(() => countByRegion(mountains.data ?? [], completed), [mountains.data, completed]);
  const collected = useMemo(() => (mountains.data ?? []).filter((m) => completed.has(m.id)), [mountains.data, completed]);

  const metadata = user?.user_metadata as { display_name?: string; username?: string } | undefined;
  const displayName = metadata?.display_name ?? metadata?.username ?? (status === 'guest' ? '게스트' : '나');
  const username = metadata?.username ?? (status === 'guest' ? 'guest' : null);
  const remaining = TOTAL_MOUNTAINS - completed.size;

  const handleSignOut = async () => {
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Screen>
      <TopBar title="MY" />
      <View style={styles.header}>
        <Avatar name={displayName} size="xl" />
        <AppText variant="heading2" style={styles.name}>
          {displayName}
        </AppText>
        {username ? (
          <AppText variant="bodySmall" color="inkMuted">
            @{username}
          </AppText>
        ) : null}
      </View>

      <View style={styles.progress}>
        {completedQuery.isLoading ? (
          <LoadingSkeleton height={38} width="45%" />
        ) : (
          <ProgressCounter
            completed={completed.size}
            size="md"
            caption={completed.size === 0 ? '첫 번째 산은 어디로 갈 건데?' : `아직 ${remaining}개나 남았는데?`}
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
        모은 캐릭터 {collected.length}
      </AppText>
      {collected.length === 0 ? (
        <View style={styles.card}>
          <AppText variant="bodySmall" color="inkMuted">
            산을 인증하면 그 산의 캐릭터가 여기에 모여요.
          </AppText>
        </View>
      ) : (
        <View style={styles.mascots}>
          {collected.map((m, i) => (
            <View key={m.id} style={styles.mascotCell}>
              <Mascot look={getMascotLook(m.mascot_key)} size={64} tilt={i % 2 === 0 ? -5 : 5} accessibilityLabel={`${m.name_ko} 캐릭터`} />
              <AppText variant="caption" numberOfLines={1}>
                {m.name_ko}
              </AppText>
            </View>
          ))}
        </View>
      )}

      {error ? (
        <AppText variant="bodySmall" color="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}
      <View style={styles.signOut}>
        <SecondaryButton label={status === 'guest' ? '둘러보기 종료' : '로그아웃'} onPress={handleSignOut} disabled={signingOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.lg },
  name: { marginTop: spacing.md },
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
  mascots: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  mascotCell: { width: '22%', alignItems: 'center', gap: spacing.xs },
  error: { marginTop: spacing.lg },
  signOut: { marginTop: spacing.xxxl },
});
