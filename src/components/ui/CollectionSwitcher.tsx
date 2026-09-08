import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/constants';
import { COLLECTIONS, usePrimaryCollection } from '@/features/collections';

import { AppText } from './AppText';

export interface CollectionSwitcherProps {
  compact?: boolean;
  showDescription?: boolean;
}

export function CollectionSwitcher({ compact = false, showDescription = false }: CollectionSwitcherProps) {
  const { id, collection, setPrimaryCollection, isSaving } = usePrimaryCollection();

  return (
    <View style={styles.wrap}>
      <View style={[styles.row, compact ? styles.rowCompact : null]} accessibilityRole="tablist">
        {COLLECTIONS.map((item) => {
          const selected = item.id === id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setPrimaryCollection(item.id)}
              disabled={isSaving}
              accessibilityRole="tab"
              accessibilityState={{ selected, disabled: isSaving }}
              accessibilityLabel={`${item.name}로 보기`}
              style={[styles.option, compact ? styles.optionCompact : null, selected ? styles.selected : null]}
            >
              <AppText variant={compact ? 'caption' : 'bodySmall'} weight="700" color={selected ? 'surface' : 'ink'}>
                {item.shortName}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {showDescription ? (
        <AppText variant="caption" color="inkMuted" style={styles.description}>
          {collection.description} · 언제든 바꿀 수 있어요.
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    padding: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    gap: 4,
  },
  rowCompact: { alignSelf: 'flex-start' },
  option: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCompact: { flex: 0, minHeight: 36, paddingHorizontal: spacing.md },
  selected: { backgroundColor: colors.ink },
  description: { paddingHorizontal: spacing.xs },
});
