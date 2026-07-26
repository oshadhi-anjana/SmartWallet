import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';

type PasswordFieldProps = Omit<TextInputProps, 'secureTextEntry'>;

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        secureTextEntry={!visible}
        style={[styles.input, props.style]}
      />
      <Pressable
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => setVisible((value) => !value)}
        style={styles.iconButton}>
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color="#212121" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 48,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    color: '#212121',
  },
  iconButton: {
    position: 'absolute',
    right: 4,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
