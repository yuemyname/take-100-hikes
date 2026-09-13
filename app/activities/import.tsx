import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, EmptyState, PrimaryButton, Screen, SegmentedControl, TopBar } from '@/components/ui';
import { colors, radii, spacing } from '@/constants';
import {
  formatActivityDate,
  formatActivityDistance,
  formatActivityDuration,
  formatActivityPace,
  useImportHealthKitActivity,
  useMyHealthKitWorkoutHashes,
} from '@/features/activities';
import { canUseHealthKitInThisBuild, readRecentHikingWorkouts, type HealthKitHikingWorkout } from '@/features/healthkit';
import type { HikingActivityVisibility } from '@/types';

const VISIBILITY_OPTIONS: readonly { key: HikingActivityVisibility; label: string }[] = [
  { key: 'private', label: '나만' },
  { key: 'friends', label: '맞팔' },
  { key: 'public', label: '전체' },
];

function HealthWorkoutCard({
  workout,
  imported,
  importing,
  onImport,
}: {
  workout: HealthKitHikingWorkout;
  imported: boolean;
  importing: boolean;
  onImport: () => void;
}) {
  const pace = workout.movingSeconds * 1000 / workout.distanceM;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <AppText variant="body" weight="800">{formatActivityDate(workout.startedAt)}</AppText>
          <AppText variant="caption" color="inkMuted">Apple Fitness · 하이킹</AppText>
        </View>
        <MaterialCommunityIcons name="heart-pulse" size={30} color={colors.green} />
      </View>
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <AppText variant="caption" color="inkMuted">거리</AppText>
          <AppText variant="body" weight="800">{formatActivityDistance(workout.distanceM)}</AppText>
        </View>
        <View style={styles.metric}>
          <AppText variant="caption" color="inkMuted">시간</AppText>
          <AppText variant="body" weight="800">{formatActivityDuration(workout.movingSeconds)}</AppText>
        </View>
        <View style={styles.metric}>
          <AppText variant="caption" color="inkMuted">평균 페이스</AppText>
          <AppText variant="body" weight="800">{formatActivityPace(pace)}</AppText>
        </View>
      </View>
      {workout.elevationGainM !== null ? (
        <AppText variant="caption" color="inkMuted" style={styles.elevation}>
          누적 상승 {workout.elevationGainM.toLocaleString('ko-KR')}m
        </AppText>
      ) : null}
      <View style={styles.importAction}>
        <PrimaryButton
          label={imported ? '가져옴' : '이 기록 가져오기'}
          tone={imported ? 'black' : 'yellow'}
          onPress={onImport}
          loading={importing}
          disabled={imported}
        />
      </View>
    </View>
  );
}

export default function ImportActivitiesScreen() {
  const router = useRouter();
  const importedHashes = useMyHealthKitWorkoutHashes();
  const importActivity = useImportHealthKitActivity();
  const [workouts, setWorkouts] = useState<HealthKitHikingWorkout[] | null>(null);
  const [visibility, setVisibility] = useState<HikingActivityVisibility>('private');
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [importingHash, setImportingHash] = useState<string | null>(null);
  const supportedBuild = canUseHealthKitInThisBuild();

  const readWorkouts = async () => {
    setReading(true);
    setReadError(null);
    try {
      setWorkouts(await readRecentHikingWorkouts());
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setReadError(
        message === 'HEALTHKIT_BUILD_REQUIRED'
          ? 'Apple Fitness 연결은 Expo Go가 아닌 TestFlight 앱에서 사용할 수 있어요.'
          : 'Apple Fitness 기록을 읽지 못했어요. 건강 앱의 데이터 접근 설정을 확인해주세요.',
      );
    } finally {
      setReading(false);
    }
  };

  const importWorkout = (workout: HealthKitHikingWorkout) => {
    if (importActivity.isPending) return;
    setImportingHash(workout.sourceIdHash);
    importActivity.mutate(
      { ...workout, visibility },
      { onSettled: () => setImportingHash(null) },
    );
  };

  return (
    <Screen>
      <TopBar title="Apple Fitness" onBack={() => router.back()} />

      <View style={styles.hero}>
        <View style={styles.heart}>
          <MaterialCommunityIcons name="heart-pulse" size={38} color={colors.surface} />
        </View>
        <View style={styles.heroCopy}>
          <AppText variant="heading3">등산 운동만 골라서</AppText>
          <AppText variant="bodySmall" color="inkMuted" style={styles.heroDescription}>
            최근 6개월의 하이킹 시간·거리·상승 고도만 읽어요. 경로, 심박수, 칼로리는 가져오거나 저장하지 않아요.
          </AppText>
        </View>
      </View>

      <AppText variant="bodySmall" weight="700" style={styles.label}>가져온 뒤 공개 범위</AppText>
      <SegmentedControl options={VISIBILITY_OPTIONS} value={visibility} onChange={setVisibility} />
      <AppText variant="caption" color="inkMuted" style={styles.help}>
        기본은 나만 보기이며, 랭킹 참여는 인증을 연결한 뒤 별도로 선택해요.
      </AppText>

      <View style={styles.connect}>
        <PrimaryButton
          label={supportedBuild ? 'Apple Fitness 연결' : 'TestFlight 앱에서 열어주세요'}
          onPress={readWorkouts}
          loading={reading}
          disabled={!supportedBuild}
        />
      </View>

      {readError ? <AppText variant="bodySmall" color="danger" style={styles.error}>{readError}</AppText> : null}
      {importActivity.isError ? (
        <AppText variant="bodySmall" color="danger" style={styles.error}>기록을 가져오지 못했어요. 잠시 후 다시 시도해주세요.</AppText>
      ) : null}

      {workouts?.length ? (
        <View style={styles.list}>
          <View style={styles.sectionHeader}>
            <AppText variant="heading2">찾은 기록</AppText>
            <AppText variant="bodySmall" color="inkMuted">{workouts.length}개</AppText>
          </View>
          {workouts.map((workout) => (
            <HealthWorkoutCard
              key={workout.sourceIdHash}
              workout={workout}
              imported={importedHashes.data?.has(workout.sourceIdHash) ?? false}
              importing={importingHash === workout.sourceIdHash}
              onImport={() => importWorkout(workout)}
            />
          ))}
        </View>
      ) : workouts ? (
        <EmptyState
          mascot={false}
          title="가져올 하이킹 기록이 없어요"
          description="최근 6개월 기록이 없거나 읽기 권한을 허용하지 않은 경우예요. Apple의 개인정보 보호 정책상 앱에서는 두 경우를 구분할 수 없어요."
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.cardLarge,
    backgroundColor: colors.surface,
  },
  heart: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.red },
  heroCopy: { flex: 1 },
  heroDescription: { marginTop: spacing.xs },
  label: { marginBottom: spacing.sm },
  help: { marginTop: spacing.sm },
  connect: { marginTop: spacing.xl },
  error: { marginTop: spacing.md },
  list: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xxxl },
  card: { padding: spacing.lg, borderRadius: radii.cardLarge, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  metrics: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  metric: { flex: 1 },
  elevation: { marginTop: spacing.md },
  importAction: { marginTop: spacing.lg },
});
