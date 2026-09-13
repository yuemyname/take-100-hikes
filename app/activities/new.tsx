import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ZodIssue } from 'zod';

import { AppText, PrimaryButton, Screen, SearchField, SegmentedControl, TextField, TopBar } from '@/components/ui';
import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';
import {
  buildManualActivityInput,
  manualActivityFormSchema,
  useCreateManualActivity,
} from '@/features/activities';
import { useMountains } from '@/features/mountains';
import type { HikingActivityVisibility } from '@/types';

const VISIBILITY_OPTIONS: readonly { key: HikingActivityVisibility; label: string }[] = [
  { key: 'private', label: '나만' },
  { key: 'friends', label: '맞팔' },
  { key: 'public', label: '전체' },
];

type FieldErrors = Partial<Record<'date' | 'startTime' | 'durationMinutes' | 'distanceKm' | 'elevationGainM' | 'note', string>>;

function localDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function issuesToErrors(issues: ZodIssue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in errors)) {
      errors[field as keyof FieldErrors] = issue.message;
    }
  }
  return errors;
}

export default function NewActivityScreen() {
  const router = useRouter();
  const mountains = useMountains();
  const createActivity = useCreateManualActivity();
  const [search, setSearch] = useState('');
  const [mountainId, setMountainId] = useState<string | null>(null);
  const [date, setDate] = useState(localDateString);
  const [startTime, setStartTime] = useState('08:00');
  const [durationMinutes, setDurationMinutes] = useState('120');
  const [distanceKm, setDistanceKm] = useState('5');
  const [elevationGainM, setElevationGainM] = useState('');
  const [note, setNote] = useState('');
  const [visibility, setVisibility] = useState<HikingActivityVisibility>('private');
  const [errors, setErrors] = useState<FieldErrors>({});

  const selectedMountain = useMemo(
    () => (mountains.data ?? []).find((mountain) => mountain.id === mountainId) ?? null,
    [mountainId, mountains.data],
  );
  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return (mountains.data ?? [])
      .filter((mountain) => mountain.name_ko.toLowerCase().includes(term))
      .slice(0, 6);
  }, [mountains.data, search]);

  const selectMountain = (id: string, name: string) => {
    setMountainId(id);
    setSearch(name);
  };

  const save = () => {
    const result = manualActivityFormSchema.safeParse({
      mountainId,
      date,
      startTime,
      durationMinutes,
      distanceKm,
      elevationGainM,
      note,
      visibility,
    });
    if (!result.success) {
      setErrors(issuesToErrors(result.error.issues));
      return;
    }
    setErrors({});
    createActivity.mutate(buildManualActivityInput(result.data), {
      onSuccess: () => router.replace('/activities'),
    });
  };

  return (
    <Screen>
      <TopBar title="수동 기록" onBack={() => router.back()} />

      <View style={styles.notice}>
        <MaterialCommunityIcons name="notebook-edit-outline" size={30} color={colors.ink} />
        <View style={styles.noticeCopy}>
          <AppText variant="body" weight="800">나만의 등산 일지</AppText>
          <AppText variant="bodySmall" color="inkMuted">
            수동 기록은 인증이나 페이스 랭킹에 사용되지 않아요.
          </AppText>
        </View>
      </View>

      <AppText variant="bodySmall" weight="700" style={styles.label}>산 (선택)</AppText>
      <SearchField
        value={search}
        onChangeText={(value) => {
          setSearch(value);
          if (selectedMountain && value !== selectedMountain.name_ko) setMountainId(null);
        }}
        onClear={() => {
          setSearch('');
          setMountainId(null);
        }}
        placeholder="산 이름 검색"
        accessibilityLabel="산 이름 검색"
      />
      {searchResults.length > 0 && (!selectedMountain || search !== selectedMountain.name_ko) ? (
        <View style={styles.results}>
          {searchResults.map((mountain) => (
            <Pressable
              key={mountain.id}
              onPress={() => selectMountain(mountain.id, mountain.name_ko)}
              accessibilityRole="button"
              accessibilityLabel={`${mountain.name_ko} 선택`}
              style={styles.resultRow}
            >
              <AppText variant="body" weight="700">{mountain.name_ko}</AppText>
              <AppText variant="caption" color="inkMuted">
                {[mountain.region, mountain.altitude_m ? `${mountain.altitude_m.toLocaleString('ko-KR')}m` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
      {mountains.isError ? (
        <AppText variant="caption" color="danger" style={styles.help}>산 목록을 불러오지 못했어요. 산을 지정하지 않고도 저장할 수 있어요.</AppText>
      ) : null}

      <View style={styles.form}>
        <TextField
          label="날짜"
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          error={errors.date}
        />
        <TextField
          label="시작 시각"
          value={startTime}
          onChangeText={setStartTime}
          placeholder="HH:MM"
          keyboardType="numbers-and-punctuation"
          error={errors.startTime}
        />
        <TextField
          label="운동 시간 (분)"
          value={durationMinutes}
          onChangeText={setDurationMinutes}
          placeholder="예: 120"
          keyboardType="decimal-pad"
          error={errors.durationMinutes}
        />
        <TextField
          label="이동 거리 (km)"
          value={distanceKm}
          onChangeText={setDistanceKm}
          placeholder="예: 5.4"
          keyboardType="decimal-pad"
          error={errors.distanceKm}
        />
        <TextField
          label="누적 상승 고도 (m, 선택)"
          value={elevationGainM}
          onChangeText={setElevationGainM}
          placeholder="예: 620"
          keyboardType="number-pad"
          error={errors.elevationGainM}
        />
        <TextField
          label="메모 (선택)"
          value={note}
          onChangeText={setNote}
          placeholder="오늘 산행은 어땠나요?"
          multiline
          textAlignVertical="top"
          style={styles.noteInput}
          maxLength={500}
          error={errors.note}
        />
      </View>

      <AppText variant="bodySmall" weight="700" style={styles.label}>공개 범위</AppText>
      <SegmentedControl options={VISIBILITY_OPTIONS} value={visibility} onChange={setVisibility} />
      <AppText variant="caption" color="inkMuted" style={styles.help}>
        맞팔은 서로 팔로우한 친구에게만 보여요. 언제든 내 활동에서 바꿀 수 있어요.
      </AppText>

      {createActivity.isError ? (
        <AppText variant="bodySmall" color="danger" style={styles.submitError}>
          기록을 저장하지 못했어요. 잠시 후 다시 시도해주세요.
        </AppText>
      ) : null}
      <View style={styles.submit}>
        <PrimaryButton label="기록 저장" onPress={save} loading={createActivity.isPending} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    borderRadius: radii.cardLarge,
    backgroundColor: colors.yellow,
  },
  noticeCopy: { flex: 1, gap: spacing.xs },
  label: { marginBottom: spacing.sm },
  results: {
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  resultRow: {
    minHeight: MIN_TOUCH_TARGET + 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  form: { marginTop: spacing.xxl },
  noteInput: { minHeight: 112, paddingTop: spacing.lg },
  help: { marginTop: spacing.sm },
  submitError: { marginTop: spacing.xl },
  submit: { marginTop: spacing.xl },
});
