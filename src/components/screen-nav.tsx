import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const destinations = [
  ['/dashboard', 'home-outline', 'home', 'Dashboard'],
  ['/transactions', 'receipt-outline', 'receipt', 'Transactions'],
  ['/add-transaction', 'add', 'add', 'Add'],
  ['/budget', 'wallet-outline', 'wallet', 'Monthly Budget'],
  ['/profile', 'person-outline', 'person', 'Profile'],
] as const;

export function ScreenNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.shell, { bottom: Math.max(insets.bottom, 8) + 6 }]}>
      {destinations.map(([href, icon, activeIcon, label], index) => {
        const active = pathname === href;
        const isAdd = index === 2;
        return (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={href}
            onPress={() => router.replace(href as never)}
            style={styles.item}>
            <View style={[styles.iconContainer, isAdd && styles.addItem, active && !isAdd && styles.activeItem]}>
              <Ionicons
                name={(active ? activeIcon : icon) as never}
                size={isAdd ? 29 : 22}
                color={isAdd || active ? '#FFFFFF' : '#68756F'}
              />
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={[styles.label, (active || isAdd) && styles.activeLabel]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 76,
    paddingHorizontal: 5,
    paddingTop: 5,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#ECE9DF',
    shadowColor: '#123D2B',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    zIndex: 20,
  },
  item: { flex: 1, height: 68, alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  iconContainer: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  activeItem: { backgroundColor: '#0F9D58' },
  label: { color: '#68756F', fontSize: 9, lineHeight: 12, fontWeight: '600', width: '100%', textAlign: 'center' },
  activeLabel: { color: '#0F9D58', fontWeight: '800' },
  addItem: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginTop: -22,
    backgroundColor: '#0F9D58',
    borderWidth: 4,
    borderColor: '#F7F8FA',
    shadowColor: '#0F9D58',
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 8,
  },
});
