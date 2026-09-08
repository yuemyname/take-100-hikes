import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, CertificationStatusBanner, EmptyState, LoadingSkeleton, PrimaryButton, SecondaryButton, TopBar, type CertificationStatus } from '@/components/ui';
import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';
import { useAuth } from '@/features/auth';
import { useSummitProximity } from '@/features/certification';
import { useMountain } from '@/features/mountains';
import { track } from '@/lib/analytics';
import { getDistanceMeters } from '@/lib/geo';
import { isSupabaseConfigured } from '@/lib/supabase';

/**
 * Summit certification capture — spec §5.2: mountain name, location status,
 * distance to summit, in-app camera, eligibility banner. The shutter only
 * works inside the mountain's verification radius.
 */
export default function CaptureScreen() {
  const router = useRouter();
  const { mountainId } = useLocalSearchParams<{ mountainId: string }>();
  const { status: authStatus } = useAuth();
  const mountain = useMountain(mountainId);
  const proximity = useSummitProximity(mountain.data);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  // Development helpers for guest / unconfigured builds only.
  const demoMode = __DEV__ && (authStatus === 'guest' || !isSupabaseConfigured);
  const [demoAtSummit, setDemoAtSummit] = useState(false);

  useEffect(() => {
    if (mountain.data) track('verification_started', { mountainId: mountain.data.id });
  }, [mountain.data]);

  const position = useMemo(() => {
    if (demoAtSummit && mountain.data) {
      return { latitude: mountain.data.latitude + 0.0002, longitude: mountain.data.longitude, accuracyM: 12 };
    }
    return proximity.position;
  }, [demoAtSummit, mountain.data, proximity.position]);

  const distanceMeters = useMemo(
    () => (position && mountain.data ? getDistanceMeters(position, mountain.data) : null),
    [position, mountain.data],
  );
  const eligible =
    distanceMeters !== null && mountain.data !== null && mountain.data !== undefined
      ? distanceMeters <= mountain.data.verification_radius_m
      : false;

  useEffect(() => {
    if (eligible && mountain.data) track('verification_location_passed', { mountainId: mountain.data.id, distanceMeters });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible]);

  const bannerStatus: CertificationStatus = (() => {
    if (proximity.permission === 'denied' && !demoAtSummit) return 'permission';
    if (proximity.error && !position) return 'error';
    if (!position) return 'locating';
    return eligible ? 'eligible' : 'too_far';
  })();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/verify'));

  const handleCapture = async () => {
    if (!mountain.data || !position || distanceMeters === null) return;
    setCaptureError(null);
    setCapturing(true);
    try {
      let photoUri: string | null = null;
      if (cameraRef.current && cameraPermission?.granted) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
        photoUri = photo?.uri ?? null;
      } else if (demoMode) {
        photoUri = Image.resolveAssetSource(require('../../assets/mascots/guide.png')).uri;
      }
      if (!photoUri) throw new Error('사진을 찍지 못했어요.');

      track('verification_photo_captured', { mountainId: mountain.data.id });
      router.push({
        pathname: '/certification/review',
        params: {
          mountainId: mountain.data.id,
          photoUri,
          latitude: String(position.latitude),
          longitude: String(position.longitude),
          accuracy: position.accuracyM === null ? '' : String(position.accuracyM),
          capturedAt: new Date().toISOString(),
          distance: String(Math.round(distanceMeters)),
        },
      });
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : '사진을 찍지 못했어요. 다시 시도해주세요.');
    } finally {
      setCapturing(false);
    }
  };

  if (mountain.isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.padded}>
          <TopBar title="인증하기" onBack={goBack} />
          <LoadingSkeleton height={64} radius={18} />
          <View style={styles.gap} />
          <LoadingSkeleton height={380} radius={24} />
        </View>
      </SafeAreaView>
    );
  }
  if (mountain.isError || !mountain.data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.padded}>
          <TopBar title="인증하기" onBack={goBack} />
          <EmptyState
            title={mountain.isError ? '잠깐 연결이 끊겼어요.' : '어느 산인지 모르겠어요'}
            description={mountain.isError ? '다시 시도해주세요.' : '도감에서 산을 먼저 골라주세요.'}
            actionLabel={mountain.isError ? '다시 시도' : '산 고르러 가기'}
            onAction={() => (mountain.isError ? mountain.refetch() : router.replace('/mountains'))}
          />
        </View>
      </SafeAreaView>
    );
  }

  const m = mountain.data;
  const cameraDenied = cameraPermission !== null && !cameraPermission.granted && !cameraPermission.canAskAgain;
  const cameraAvailable = Boolean(cameraPermission?.granted);
  const canShoot = eligible && !capturing && (cameraAvailable ? cameraReady : demoMode);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.padded}>
        <TopBar title="인증하기" onBack={goBack} />
        <View style={styles.mountainRow}>
          <MaterialCommunityIcons name="image-filter-hdr" size={20} color={colors.ink} />
          <AppText variant="heading3">{m.name_ko}</AppText>
          <AppText variant="bodySmall" color="inkMuted">
            정상 반경 {m.verification_radius_m}m
          </AppText>
        </View>
        <CertificationStatusBanner
          status={bannerStatus}
          distanceMeters={distanceMeters}
          accuracyM={position?.accuracyM ?? null}
          message={proximity.error}
        />
        {proximity.permission === 'undetermined' && !demoAtSummit ? (
          <View style={styles.inlineAction}>
            <SecondaryButton label="위치 권한 허용하기" onPress={proximity.requestPermission} />
          </View>
        ) : proximity.permission === 'denied' && !demoAtSummit ? (
          <View style={styles.inlineAction}>
            <SecondaryButton label="설정 열기" onPress={() => Linking.openSettings().catch(() => {})} />
          </View>
        ) : null}
      </View>

      <View style={styles.cameraWrap}>
        {cameraAvailable ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            onCameraReady={() => setCameraReady(true)}
            accessibilityLabel="카메라 미리보기"
          />
        ) : (
          <View style={styles.cameraFallback}>
            <MaterialCommunityIcons name="camera-outline" size={48} color={colors.surface} />
            <AppText variant="body" weight="700" color="surface" align="center">
              {cameraDenied ? '카메라 권한이 꺼져 있어요' : '정상 인증은 앱 카메라로 찍어요'}
            </AppText>
            <AppText variant="caption" color="surface" align="center" style={styles.fallbackHint}>
              {cameraDenied ? '설정에서 카메라 권한을 허용해주세요.' : '갤러리 사진은 인증에 쓸 수 없어요.'}
            </AppText>
            <View style={styles.fallbackAction}>
              <PrimaryButton
                label={cameraDenied ? '설정 열기' : '카메라 켜기'}
                tone="yellow"
                fullWidth={false}
                onPress={() => (cameraDenied ? Linking.openSettings().catch(() => {}) : requestCameraPermission())}
              />
            </View>
          </View>
        )}
        <View style={styles.distanceTag}>
          <MaterialCommunityIcons name="crosshairs-gps" size={14} color={colors.surface} />
          <AppText variant="caption" weight="700" color="surface">
            {distanceMeters === null ? '거리 측정 중' : `정상까지 ${Math.round(distanceMeters).toLocaleString('ko-KR')}m`}
          </AppText>
        </View>
      </View>

      <View style={styles.controls}>
        {captureError ? (
          <AppText variant="bodySmall" color="danger" align="center" style={styles.error}>
            {captureError}
          </AppText>
        ) : null}
        <View style={styles.shutterRow}>
          <Pressable
            onPress={proximity.refresh}
            accessibilityRole="button"
            accessibilityLabel="위치 다시 잡기"
            style={styles.sideButton}
          >
            <MaterialCommunityIcons name="refresh" size={24} color={colors.ink} />
          </Pressable>
          <Pressable
            onPress={handleCapture}
            disabled={!canShoot}
            accessibilityRole="button"
            accessibilityLabel="사진 촬영"
            accessibilityState={{ disabled: !canShoot, busy: capturing }}
            style={({ pressed }) => [styles.shutter, !canShoot ? styles.shutterDisabled : null, pressed && canShoot ? styles.shutterPressed : null]}
          >
            <View style={styles.shutterInner} />
          </Pressable>
          <View style={styles.sideButton} />
        </View>
        <AppText variant="caption" color="inkMuted" align="center">
          {eligible ? '정상이 보이게 찍어주세요' : '정상 반경 안에 들어오면 촬영할 수 있어요'}
        </AppText>
        {demoMode ? (
          <View style={styles.demo}>
            <AppText variant="caption" color="inkMuted">
              개발용 · {Platform.OS === 'web' ? '웹' : '시뮬레이터'} 테스트
            </AppText>
            <SecondaryButton
              label={demoAtSummit ? '데모 위치 끄기' : '데모: 정상 위치로 이동'}
              fullWidth={false}
              onPress={() => setDemoAtSummit((v) => !v)}
            />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  padded: { paddingHorizontal: spacing.xl },
  gap: { height: spacing.lg },
  mountainRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  inlineAction: { marginTop: spacing.md },
  cameraWrap: {
    flex: 1,
    marginTop: spacing.lg,
    marginHorizontal: spacing.xl,
    borderRadius: radii.cardLarge,
    overflow: 'hidden',
    backgroundColor: colors.ink,
    minHeight: 260,
  },
  cameraFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  fallbackHint: { opacity: 0.8 },
  fallbackAction: { marginTop: spacing.md },
  distanceTag: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(17,17,17,0.7)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  controls: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.sm },
  error: { marginBottom: spacing.xs },
  shutterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sideButton: { width: MIN_TOUCH_TARGET + 8, height: MIN_TOUCH_TARGET + 8, alignItems: 'center', justifyContent: 'center' },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: radii.pill,
    borderWidth: 4,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 58, height: 58, borderRadius: radii.pill, backgroundColor: colors.blue },
  shutterDisabled: { opacity: 0.35 },
  shutterPressed: { transform: [{ scale: 0.95 }] },
  demo: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
});
