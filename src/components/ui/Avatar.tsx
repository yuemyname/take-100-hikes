import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants';

import { AppText } from './AppText';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const sizes: Record<AvatarSize, number> = { sm: 28, md: 40, lg: 56, xl: 88 };

export interface AvatarProps {
  uri?: string | null;
  /** Used for the initial when there is no image and for the accessibility label. */
  name?: string | null;
  size?: AvatarSize;
  /** Outline color for stacked/overlapping avatars. */
  ringColor?: string;
}

export function Avatar({ uri, name, size = 'md', ringColor }: AvatarProps) {
  const dimension = sizes[size];
  const initial = (name ?? '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name ? `${name} 프로필 사진` : '프로필 사진'}
      style={[
        styles.base,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
        ringColor ? { borderWidth: 2, borderColor: ringColor } : null,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <AppText variant={size === 'xl' ? 'heading1' : size === 'lg' ? 'heading3' : 'bodySmall'} color="surface">
          {initial}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
