import MapView, { Marker, type Region } from 'react-native-maps';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, EmptyState } from '@/components/ui';
import { colors, radii, spacing } from '@/constants';
import type { Mountain } from '@/types';

import type { MountainMapProps } from './MountainMap.types';

const KOREA_REGION: Region = {
  latitude: 36.35,
  longitude: 127.8,
  latitudeDelta: 7,
  longitudeDelta: 5.5,
};

interface MountainPin {
  mountain: Mountain;
  latitude: number;
  longitude: number;
}

/**
 * The certification target is intentionally reduced to an approximate map pin.
 * Two decimal places is roughly kilometre-level precision in Korea, so the UI
 * cannot expose the exact summit-verification coordinate.
 */
function approximateCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

function regionForPins(pins: MountainPin[]): Region {
  if (pins.length === 0) return KOREA_REGION;

  const latitudes = pins.map((pin) => pin.latitude);
  const longitudes = pins.map((pin) => pin.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max(0.5, (maxLatitude - minLatitude) * 1.45),
    longitudeDelta: Math.max(0.4, (maxLongitude - minLongitude) * 1.45),
  };
}

export function MountainMap({ mountains, completedIds, onPressMountain }: MountainMapProps) {
  const pins = useMemo<MountainPin[]>(
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

  const pendingCount = mountains.length - pins.length;
  const mapKey = pins.map((pin) => pin.mountain.id).join(':');

  if (pins.length === 0) {
    return (
      <View style={styles.empty}>
        <EmptyState
          mascot={false}
          title="지도에 표시할 위치가 아직 없어요"
          description="확인되지 않은 산은 지도에 임의로 배치하지 않아요. 리스트에서 먼저 확인해주세요."
        />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.mapFrame}>
        <MapView
          key={mapKey}
          style={StyleSheet.absoluteFill}
          initialRegion={regionForPins(pins)}
          pitchEnabled={false}
          rotateEnabled={false}
          showsCompass
          toolbarEnabled={false}
          accessibilityLabel="명산 위치 지도"
        >
          {pins.map(({ mountain, latitude, longitude }) => {
            const completed = completedIds.has(mountain.id);
            return (
              <Marker
                key={mountain.id}
                coordinate={{ latitude, longitude }}
                pinColor={completed ? colors.green : colors.blue}
                title={mountain.name_ko}
                description={`${completed ? '인증 완료' : '미인증'} · 눌러서 상세 보기`}
                accessibilityLabel={`${mountain.name_ko}, ${completed ? '인증 완료' : '미인증'}`}
                onCalloutPress={() => onPressMountain(mountain.id)}
              />
            );
          })}
        </MapView>
        <View pointerEvents="none" style={styles.legend}>
          <View style={[styles.dot, styles.todoDot]} />
          <AppText variant="caption" color="inkMuted">미인증</AppText>
          <View style={[styles.dot, styles.doneDot]} />
          <AppText variant="caption" color="inkMuted">인증 완료</AppText>
        </View>
      </View>
      <AppText variant="caption" color="inkMuted" style={styles.note}>
        인증 위치 보호를 위해 핀은 약 1km 단위의 대략적인 위치로 표시돼요.
        {pendingCount > 0 ? ` 위치 확인 중인 산 ${pendingCount}개는 지도에서 제외했어요.` : ''}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.md, marginBottom: spacing.huge },
  mapFrame: {
    height: 520,
    overflow: 'hidden',
    borderRadius: radii.cardLarge,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
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
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  dot: { width: 9, height: 9, borderRadius: radii.pill, marginLeft: spacing.xs },
  todoDot: { backgroundColor: colors.blue },
  doneDot: { backgroundColor: colors.green },
  note: { marginTop: spacing.sm, paddingHorizontal: spacing.xs },
  empty: {
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
