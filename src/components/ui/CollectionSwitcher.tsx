import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/constants';
import { COLLECTIONS, usePrimaryCollection } from '@/features/collections';

import { AppText } from './AppText';

export interface CollectionSwitcherProps {
  compact?: boolean;
  showDescription?: boolean;
}

export function CollectionSwitcher({ compact = false, showDescription = false }: CollectionSwitcherProps) {
  const { id, collection, hasChosen, setPrimaryCollection, isSaving } = usePrimaryCollection();

  return (
    <View style={styles.wrap}>
      {!hasChosen && !compact ? (
        <View style={styles.firstChoice}>
          <AppText variant="heading3">어떤 100개의 산에 도전할까요?</AppText>
          <AppText variant="caption" color="inkMuted">처음 하나를 골라도 나중에 언제든 바꿀 수 있어요.</AppText>
        </View>
      ) : null}
      <View style={[styles.row, compact ? styles.rowCompact : null]} accessibilityRole="tablist">
        {COLLECTIONS.map((item) => {
          const selected = item.id === id && hasChosen;
          return (
            <Pressable
              key={item.id}
              onPress={() => setPrimaryCollection(item.id)}
              disabled={isSaving}
              accessibilityRole="tab"
              accessibilityState={{ selected, disabled: isSaving }}
              accessibilityLabel={`${item.name}로 보기`}
              style={({ pressed }) => [
                styles.option,
                compact ? styles.optionCompact : null,
                selected ? styles.selected : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <View style={[styles.radio, selected ? styles.radioSelected : null]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
              <AppText variant={compact ? 'caption' : 'bodySmall'} weight="700">
                {item.shortName}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {showDescription && hasChosen ? (
        <AppText variant="caption" color="inkMuted" style={styles.description}>
          {collection.description} · 언제든 바꿀 수 있어요.
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  firstChoice: { gap: spacing.xxs, marginBottom: spacing.xs },
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
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCompact: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', minHeight: 44 },
  selected: { backgroundColor: colors.surface, borderColor: colors.ink },
  pressed: { opacity: 0.7 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.inkMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.ink },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ink },
  description: { paddingHorizontal: spacing.xs },
});
