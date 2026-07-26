import { usePathname, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

const destinations = [
  ['/dashboard', 'Home'],
  ['/transactions', 'Transactions'],
  ['/budget', 'Budget'],
  ['/savings', 'Goals'],
  ['/analytics', 'Analytics'],
  ['/profile', 'Profile'],
] as const;

export function ScreenNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <ThemedView type="backgroundElement" style={styles.shell}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
        {destinations.map(([href, label]) => {
          const active = pathname === href;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={href}
              onPress={() => router.replace(href as never)}
              style={[styles.item, active && styles.active]}>
              <ThemedText type="smallBold" style={active ? styles.activeText : undefined}>{label}</ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  shell: { borderRadius: 16, overflow: 'hidden' },
  content: { padding: 6, gap: 4 },
  item: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  active: { backgroundColor: '#0F9D58' },
  activeText: { color: '#fff' },
});
