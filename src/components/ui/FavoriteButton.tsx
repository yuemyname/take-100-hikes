import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radii } from '@/constants';

export interface FavoriteButtonProps {
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function FavoriteButton({ active, onPress, disabled }: FavoriteButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={active ? '즐겨찾기 해제' : '즐겨찾기 추가'}
      accessibilityState={{ selected: active, disabled: !!disabled }}
      style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
    >
      <MaterialCommunityIcons name={active ? 'heart' : 'heart-outline'} size={24} color={active ? colors.red : colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.surfaceMuted },
});
