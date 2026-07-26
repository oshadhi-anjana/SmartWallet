import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const destinations = [
  ['/dashboard', 'grid-outline', 'Dashboard'],
  ['/transactions', 'swap-horizontal-outline', 'Transactions'],
  ['/budget', 'wallet-outline', 'Budgets'],
  ['/savings', 'flag-outline', 'Savings goals'],
  ['/analytics', 'bar-chart-outline', 'Analytics'],
  ['/profile', 'person-circle-outline', 'Profile'],
] as const;

export function ScreenNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.shell, { bottom: Math.max(insets.bottom, 12) + 8 }]}>
      {destinations.map(([href, icon, label]) => {
        const active = pathname === href;
        return (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={href}
            onPress={() => router.replace(href as never)}
            style={[styles.item, active && styles.active]}>
            <Ionicons name={icon} size={23} color={active ? '#FFFFFF' : '#212121'} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 12,
    right: 12,
    minHeight: 58,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#212121',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 20,
  },
  item: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: '#0F9D58' },
});
