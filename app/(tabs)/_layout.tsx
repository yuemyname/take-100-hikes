import { Tabs } from 'expo-router/js-tabs';

import { BottomTabBar, TAB_ITEMS } from '@/components/ui';
import { colors } from '@/constants';

/** Exactly five tabs, in spec order — 100PEAKS_MASTER_SPEC.md §3. */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      {TAB_ITEMS.map((item) => (
        <Tabs.Screen key={item.name} name={item.name} options={{ title: item.label }} />
      ))}
    </Tabs>
  );
}
