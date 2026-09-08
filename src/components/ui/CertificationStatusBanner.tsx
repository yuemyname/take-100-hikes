import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/constants';
import { formatDistance } from '@/lib/geo';

import { AppText } from './AppText';

export type CertificationStatus = 'locating' | 'eligible' | 'too_far' | 'permission' | 'error';

export interface CertificationStatusBannerProps {
  status: CertificationStatus;
  distanceMeters?: number | null;
  accuracyM?: number | null;
  message?: string | null;
}

/** GPS state banner — spec §5.2 copy. Color plus icon plus text, never color alone (§17). */
export function CertificationStatusBanner({ status, distanceMeters, accuracyM, message }: CertificationStatusBannerProps) {
  const content = (() => {
    switch (status) {
      case 'eligible':
        return {
          bg: colors.success,
          fg: 'surface' as const,
          icon: 'check-circle' as const,
          title: '정상 반경 내에 있어요!',
          body: `현재 거리 ${formatDistance(distanceMeters ?? 0)}${accuracyM ? ` · 정확도 ${Math.round(accuracyM)}m` : ''}`,
        };
      case 'too_far':
        return {
          bg: colors.ink,
          fg: 'surface' as const,
          icon: 'map-marker-distance' as const,
          title: `아직 인증 지점에서 ${formatDistance(distanceMeters ?? 0)} 떨어져 있어요.`,
          body: '조금만 더 올라가볼까요?',
        };
      case 'permission':
        return {
          bg: colors.warning,
          fg: 'ink' as const,
          icon: 'map-marker-off' as const,
          title: '정상 인증을 위해 위치 권한이 필요해요.',
          body: '설정에서 위치 권한을 허용해주세요.',
        };
      case 'error':
        return {
          bg: colors.warning,
          fg: 'ink' as const,
          icon: 'alert-circle' as const,
          title: message ?? '위치를 잡지 못했어요.',
          body: '잠시 후 다시 시도해주세요.',
        };
      case 'locating':
      default:
        return { bg: colors.surface, fg: 'ink' as const, icon: null, title: '현재 위치를 찾는 중이에요', body: '정상 좌표와 거리를 재고 있어요.' };
    }
  })();

  return (
    <View style={[styles.banner, { backgroundColor: content.bg }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      {content.icon ? (
        <MaterialCommunityIcons name={content.icon} size={24} color={colors[content.fg]} />
      ) : (
        <ActivityIndicator color={colors.ink} />
      )}
      <View style={styles.text}>
        <AppText variant="body" weight="700" color={content.fg}>
          {content.title}
        </AppText>
        <AppText variant="caption" color={content.fg} style={styles.body}>
          {content.body}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  text: { flex: 1, gap: spacing.xxs },
  body: { opacity: 0.85 },
});
