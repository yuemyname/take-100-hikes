import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import MapView, { Callout, Circle, Marker, type Region } from 'react-native-maps';

import { AppText, EmptyState, Pill } from '@/components/ui';
import { colors, radii, spacing } from '@/constants';
import { formatDistance, getDistanceMeters, type LatLng } from '@/lib/geo';
import type { Mountain } from '@/types';

import type { MountainMapProps } from './MountainMap.types';

const RADIUS_OPTIONS_KM = [10, 30, 50, 100] as const;
const DEFAULT_RADIUS_KM = 50;

interface MountainPin {
  mountain: Mountain;
  latitude: number;
  longitude: number;
  distanceMeters: number;
}

type MapLocationState =
  | { status: 'loading' }
  | { status: 'ready'; coordinate: LatLng }
  | { status: 'denied' }
  | { status: 'unavailable' };

async function resolveCurrentMapLocation(): Promise<MapLocationState> {
  try {
    let permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted && permission.canAskAgain) {
      permission = await Location.requestForegroundPermissionsAsync();
    }

    if (!permission.granted) return { status: 'denied' };

    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return {
      status: 'ready',
      coordinate: {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      },
    };
  } catch {
    return { status: 'unavailable' };
  }
}

/**
 * The certification target is intentionally reduced to an approximate map pin.
 * Two decimal places is roughly kilometre-level precision in Korea, so the UI
 * cannot expose the exact summit-verification coordinate.
 */
function approximateCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

function regionAroundLocation(coordinate: LatLng, radiusKm: number): Region {
  const latitudeDelta = Math.max(0.12, (radiusKm * 2.2) / 111);
  const longitudeScale = Math.max(0.35, Math.cos((coordinate.latitude * Math.PI) / 180));

  return {
    ...coordinate,
    latitudeDelta,
    longitudeDelta: latitudeDelta / longitudeScale,
  };
}

export function MountainMap({ mountains, completedIds, onPressMountain }: MountainMapProps) {
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [locationState, setLocationState] = useState<MapLocationState>({ status: 'loading' });

  const retryCurrentLocation = useCallback(() => {
    setLocationState({ status: 'loading' });
    void resolveCurrentMapLocation().then(setLocationState);
  }, []);

  useEffect(() => {
    let active = true;
    void resolveCurrentMapLocation().then((nextState) => {
      if (active) setLocationState(nextState);
    });
    return () => {
      active = false;
    };
  }, []);

  const location = locationState.status === 'ready' ? locationState.coordinate : null;

  const allPins = useMemo<Omit<MountainPin, 'distanceMeters'>[]>(
    () =>
      mountains.flatMap((mountain) => {
        if (!Number.isFinite(mountain.latitude) || !Number.isFinite(mountain.longitude)) return [];

        return [{
          mountain,
          latitude: approximateCoordinate(mountain.latitude as number),
          longitude: approximateCoordinate(mountain.longitude as number),
        }];
      }),
    [mountains],
  );

  const nearbyPins = useMemo<MountainPin[]>(() => {
    if (!location) return [];

    return allPins
      .map((pin) => ({
        ...pin,
        distanceMeters: getDistanceMeters(location, pin),
      }))
      .filter((pin) => pin.distanceMeters <= radiusKm * 1000)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [allPins, location, radiusKm]);

  const pendingCount = mountains.length - allPins.length;

  if (locationState.status === 'loading') {
    return (
      <View style={styles.stateCard}>
        <EmptyState
          mascot={false}
          title="내 주변 산을 찾고 있어요"
          description="현재 위치는 주변 산을 찾는 데만 사용하고 저장하지 않아요."
        />
      </View>
    );
  }

  if (locationState.status === 'denied') {
    return (
      <View style={styles.stateCard}>
        <EmptyState
          mascot={false}
          title="내 주변 지도를 보려면 위치 권한이 필요해요"
          description="아이폰 설정에서 100PEAKS의 위치 권한을 허용해주세요."
          actionLabel="설정 열기"
          onAction={() => Linking.openSettings().catch(() => {})}
        />
      </View>
    );
  }

  if (locationState.status === 'unavailable' || !location) {
    return (
      <View style={styles.stateCard}>
        <EmptyState
          mascot={false}
          title="현재 위치를 확인하지 못했어요"
          description="위치 서비스와 네트워크 상태를 확인한 뒤 다시 시도해주세요."
          actionLabel="다시 찾기"
          onAction={retryCurrentLocation}
        />
      </View>
    );
  }

  const mapKey = `${radiusKm}:${nearbyPins.map((pin) => pin.mountain.id).join(':')}`;

  return (
    <View style={styles.section}>
      <View style={styles.radiusHeader}>
        <View>
          <AppText variant="bodySmall" weight="700">내 주변 반경</AppText>
          <AppText variant="caption" color="inkMuted">{nearbyPins.length}개의 산이 보여요</AppText>
        </View>
        <View style={styles.radiusOptions}>
          {RADIUS_OPTIONS_KM.map((option) => (
            <Pill
              key={option}
              label={`${option}km`}
              tone="yellow"
              selected={radiusKm === option}
              onPress={() => setRadiusKm(option)}
            />
          ))}
        </View>
      </View>

      <View style={styles.mapFrame}>
        <MapView
          key={mapKey}
          style={StyleSheet.absoluteFill}
          initialRegion={regionAroundLocation(location, radiusKm)}
          pitchEnabled={false}
          rotateEnabled={false}
          showsCompass
          showsMyLocationButton
          showsUserLocation
          toolbarEnabled={false}
          accessibilityLabel={`내 주변 ${radiusKm}킬로미터 명산 지도`}
        >
          <Circle
            center={location}
            radius={radiusKm * 1000}
            fillColor="rgba(36,91,255,0.06)"
            strokeColor="rgba(36,91,255,0.42)"
            strokeWidth={2}
          />
          {nearbyPins.map(({ mountain, latitude, longitude, distanceMeters }) => {
            const completed = completedIds.has(mountain.id);
            return (
              <Marker
                key={mountain.id}
                coordinate={{ latitude, longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
                accessibilityLabel={`${mountain.name_ko}, ${formatDistance(distanceMeters)}, ${completed ? '인증 완료' : '미인증'}`}
              >
                <View style={[styles.marker, completed ? styles.markerDone : styles.markerTodo]}>
                  <MaterialCommunityIcons name="image-filter-hdr" size={23} color={colors.ink} />
                  {completed ? (
                    <View style={styles.markerCheck}>
                      <MaterialCommunityIcons name="check" size={11} color={colors.surface} />
                    </View>
                  ) : null}
                </View>
                <Callout onPress={() => onPressMountain(mountain.id)}>
                  <View style={styles.callout}>
                    <AppText variant="bodySmall" weight="700">{mountain.name_ko}</AppText>
                    <AppText variant="caption" color="inkMuted">
                      {formatDistance(distanceMeters)} · {completed ? '인증 완료' : '미인증'}
                    </AppText>
                    <AppText variant="caption" color="blue" style={styles.calloutAction}>상세 보기</AppText>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

        {nearbyPins.length === 0 ? (
          <View pointerEvents="none" style={styles.noResultsBubble}>
            <AppText variant="bodySmall" weight="700" align="center">반경 {radiusKm}km 안에 표시할 산이 없어요</AppText>
            <AppText variant="caption" color="inkMuted" align="center">위에서 더 넓은 반경을 골라보세요.</AppText>
          </View>
        ) : null}

        <View pointerEvents="none" style={styles.legend}>
          <View style={[styles.legendMarker, styles.markerTodo]}>
            <MaterialCommunityIcons name="image-filter-hdr" size={13} color={colors.ink} />
          </View>
          <AppText variant="caption" color="inkMuted">미인증</AppText>
          <View style={[styles.legendMarker, styles.markerDone]}>
            <MaterialCommunityIcons name="check" size={12} color={colors.ink} />
          </View>
          <AppText variant="caption" color="inkMuted">완료</AppText>
        </View>
      </View>

      <AppText variant="caption" color="inkMuted" style={styles.note}>
        현재 위치는 저장하지 않으며, 산 핀은 인증 위치 보호를 위해 약 1km 단위로 표시돼요.
        {pendingCount > 0 ? ` 위치 확인 중인 산 ${pendingCount}개는 지도에서 제외했어요.` : ''}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.md, marginBottom: spacing.huge },
  radiusHeader: { gap: spacing.sm, marginBottom: spacing.md },
  radiusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  mapFrame: {
    height: 520,
    overflow: 'hidden',
    borderRadius: radii.cardLarge,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.surfaceMuted,
  },
  marker: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    borderWidth: 2.5,
    borderColor: colors.ink,
    shadowColor: colors.ink,
    shadowOpacity: 0.22,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  markerTodo: { backgroundColor: colors.yellow },
  markerDone: { backgroundColor: colors.green },
  markerCheck: {
    position: 'absolute',
    right: -5,
    top: -5,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.blue,
  },
  callout: { minWidth: 150, padding: spacing.sm },
  calloutAction: { marginTop: spacing.xs },
  legend: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  legendMarker: {
    width: 23,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ink,
    marginLeft: spacing.xs,
  },
  noResultsBubble: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: '42%',
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: 'rgba(255,249,237,0.95)',
  },
  note: { marginTop: spacing.sm, paddingHorizontal: spacing.xs },
  stateCard: {
    minHeight: 360,
    marginTop: spacing.md,
    marginBottom: spacing.huge,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.cardLarge,
    backgroundColor: colors.surface,
  },
});
