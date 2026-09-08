import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState, Pill, Screen, TopBar } from '@/components/ui';
import { spacing } from '@/constants';

const FILTERS = ['전체', '지역별', '내 인증', '미인증'] as const;

/** Mountain collection shell — grid and data land in Phase 2 (spec §4.2). */
export default function MountainsScreen() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('전체');

  return (
    <Screen>
      <TopBar title="명산 도감" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((label) => (
          <Pill key={label} label={label} selected={label === filter} onPress={() => setFilter(label)} />
        ))}
      </ScrollView>
      <View style={styles.body}>
        <EmptyState
          title="도감을 채우는 중이에요"
          description="100개의 산이 곧 여기에 줄을 설 거예요."
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { gap: spacing.sm, paddingVertical: spacing.sm },
  body: { marginTop: spacing.xl },
});
