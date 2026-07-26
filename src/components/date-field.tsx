import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

type DateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  mode?: 'date' | 'month';
  placeholder?: string;
};

function toDate(value: string) {
  const parsed = value ? new Date(`${value.length === 7 ? `${value}-01` : value}T12:00:00`) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function DateField({ value, onChange, mode = 'date', placeholder = 'Select date' }: DateFieldProps) {
  const [open, setOpen] = useState(false);

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS !== 'ios') setOpen(false);
    if (event.type === 'dismissed' || !selected) return;
    const iso = selected.toISOString().slice(0, 10);
    onChange(mode === 'month' ? iso.slice(0, 7) : iso);
  }

  return (
    <View>
      <Pressable
        accessibilityLabel={mode === 'month' ? 'Select month' : 'Select date'}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={styles.field}>
        <ThemedText style={!value ? styles.placeholder : undefined}>{value || placeholder}</ThemedText>
        <Ionicons name="calendar-outline" size={22} color="#0F9D58" />
      </Pressable>
      {open ? (
        <DateTimePicker
          value={toDate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleChange}
        />
      ) : null}
      {open && Platform.OS === 'ios' ? (
        <Pressable onPress={() => setOpen(false)} style={styles.done}>
          <ThemedText type="smallBold" style={styles.doneText}>Done</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholder: { opacity: 0.55 },
  done: { alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 8 },
  doneText: { color: '#0F9D58' },
});
