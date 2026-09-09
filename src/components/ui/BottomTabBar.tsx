import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';

import { AppText } from './AppText';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Tab order and labels are fixed by spec §3. */
export const TAB_ITEMS: { name: string; label: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', label: '홈', icon: 'home-variant-outline', iconActive: 'home-variant' },
  { name: 'mountains', label: '명산', icon: 'image-filter-hdr-outline', iconActive: 'image-filter-hdr' },
  { name: 'verify', label: '인증', icon: 'camera-outline', iconActive: 'camera' },
  { name: 'friends', label: '친구', icon: 'account-group-outline', iconActive: 'account-group' },
  { name: 'profile', label: 'MY', icon: 'account-outline', iconActive: 'account' },
];

const VERIFY_TAB = 'verify';

/** Custom 5-tab bar with an emphasized center Verify tab — spec §3. */
export function BottomTabBar({ state, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {TAB_ITEMS.map((item) => {
        const routeIndex = state.routes.findIndex((route) => route.name === item.name);
        const route = state.routes[routeIndex];
        if (!route) return null;

        const focused = state.index === routeIndex;
        const isVerify = item.name === VERIFY_TAB;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        if (isVerify) {
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={item.label}
              style={styles.item}
            >
              <View style={[styles.verifyButton, focused ? styles.verifyButtonActive : null]}>
                <MaterialCommunityIcons name="camera" size={26} color={colors.surface} />
              </View>
              <AppText variant="caption" weight={focused ? '700' : '500'} color={focused ? 'ink' : 'inkMuted'} style={styles.label}>
                {item.label}
              </AppText>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={item.label}
            style={styles.item}
          >
            <MaterialCommunityIcons
              name={focused ? item.iconActive : item.icon}
              size={26}
              color={focused ? colors.ink : colors.inkMuted}
            />
            <AppText variant="caption" weight={focused ? '700' : '500'} color={focused ? 'ink' : 'inkMuted'} style={styles.label}>
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
  },
  item: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET + 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  label: { marginTop: spacing.xxs },
  verifyButton: {
    width: 58,
    height: 58,
    borderRadius: radii.pill,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing.xxl,
    borderWidth: 4,
    borderColor: colors.surface,
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 8,
  },
  verifyButtonActive: { borderColor: colors.ink },
});
