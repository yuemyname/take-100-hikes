import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui';
import { colors, radii, spacing } from '@/constants';

import type { MountainMapProps } from './MountainMap.types';

export function MountainMap({ mountains }: MountainMapProps) {
  return (
    <View style={styles.wrap}>
      <EmptyState
        mascot={false}
        title="지도 보기는 iPhone에서 확인해주세요"
        description={`웹에서는 ${mountains.length}개의 산을 리스트로 볼 수 있어요. 지도는 TestFlight 앱에서 제공돼요.`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
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
