import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function SecondaryButton({ title, onPress, disabled }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { borderColor: colors.primary },
        disabled && styles.disabled,
        pressed && { opacity: 0.8 },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, { color: colors.primary }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabled: { opacity: 0.5 },
  text: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
});
