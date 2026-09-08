import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, EmptyState, PrimaryButton, Screen, SecondaryButton, TopBar } from '@/components/ui';
import { colors, radii, spacing } from '@/constants';
import { useAuth } from '@/features/auth';
import { authErrorMessage } from '@/features/auth/messages';
import { useCreateCertification, type CaptureDraft } from '@/features/certification';
import { useMountain } from '@/features/mountains';
import { formatDistance } from '@/lib/geo';

type Params = {
  mountainId: string;
  photoUri: string;
  latitude: string;
  longitude: string;
  accuracy?: string;
  capturedAt: string;
  distance: string;
};

/** Review the summit capture, then create the session with the creator confirmed (spec §5, §6.4). */
export default function ReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const { status: authStatus } = useAuth();
  const mountain = useMountain(params.mountainId);
  const create = useCreateCertification();

  const draft: CaptureDraft | null =
    mountain.data && params.photoUri
      ? {
          mountainId: mountain.data.id,
          photoUri: params.photoUri,
          latitude: Number(params.latitude),
          longitude: Number(params.longitude),
          gpsAccuracyM: params.accuracy ? Number(params.accuracy) : null,
          capturedAt: params.capturedAt,
          verificationRadiusM: mountain.data.verification_radius_m,
          distanceMeters: Number(params.distance),
        }
      : null;

  const handleSubmit = () => {
    if (!draft) return;
    create.mutate(draft, {
      onSuccess: (result) =>
        router.replace({
          pathname: '/certification/success',
          params: { sessionId: result.sessionId, mountainId: result.mountainId, newlyCollected: result.newlyCollected ? '1' : '0' },
        }),
    });
  };

  if (!draft || mountain.isError) {
    return (
      <Screen>
        <TopBar title="인증 확인" onBack={() => router.back()} />
        <EmptyState
          title="촬영 정보가 없어요"
          description="정상에서 다시 찍어주세요."
          actionLabel="다시 찍기"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const time = new Date(draft.capturedAt);
  const timeLabel = `${time.getFullYear()}.${String(time.getMonth() + 1).padStart(2, '0')}.${String(time.getDate()).padStart(2, '0')} ${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

  return (
    <Screen>
      <TopBar title="인증 확인" onBack={() => router.back()} />
      <View style={styles.photoWrap}>
        <Image source={{ uri: draft.photoUri }} style={styles.photo} contentFit="cover" accessibilityLabel="촬영한 인증 사진" />
        <View style={styles.photoTag}>
          <MaterialCommunityIcons name="camera" size={14} color={colors.surface} />
          <AppText variant="caption" weight="700" color="surface">
            앱 카메라 촬영
          </AppText>
        </View>
      </View>

      <AppText variant="heading1" style={styles.title}>
        {mountain.data?.name_ko} 정상 맞죠?
      </AppText>
      <View style={styles.facts}>
        <Fact icon="crosshairs-gps" label="정상까지" value={formatDistance(draft.distanceMeters)} />
        <Fact icon="clock-outline" label="촬영 시각" value={timeLabel} />
        <Fact icon="map-marker-radius" label="인증 반경" value={`${draft.verificationRadiusM}m`} />
      </View>
      <AppText variant="bodySmall" color="inkMuted" style={styles.note}>
        정확한 위치 좌표는 공개되지 않아요. 친구에게는 산 이름과 날짜만 보여요.
      </AppText>

      {create.isError ? (
        <AppText variant="bodySmall" color="danger" style={styles.error}>
          {authErrorMessage(create.error)}
        </AppText>
      ) : null}
      <PrimaryButton label={authStatus === 'guest' ? '인증 완료하기 (둘러보기)' : '인증 완료하기'} onPress={handleSubmit} loading={create.isPending} />
      <View style={styles.gap} />
      <SecondaryButton label="다시 찍기" onPress={() => router.back()} disabled={create.isPending} />
    </Screen>
  );
}

function Fact({ icon, label, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.inkMuted} />
      <AppText variant="caption" color="inkMuted">
        {label}
      </AppText>
      <AppText variant="body" weight="700">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  photoWrap: { borderRadius: radii.cardLarge, overflow: 'hidden', backgroundColor: colors.ink, marginTop: spacing.sm },
  photo: { width: '100%', aspectRatio: 3 / 4 },
  photoTag: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(17,17,17,0.7)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: { marginTop: spacing.xl },
  facts: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  fact: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  note: { marginTop: spacing.md, marginBottom: spacing.xl },
  error: { marginBottom: spacing.md },
  gap: { height: spacing.md },
});
