import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: 'primary' | 'secondary';
}

export default function PrimaryButton({ title, onPress, disabled, loading, type = 'primary' }: Props) {
  const { colors } = useTheme();
  const isPrimary = type === 'primary';
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: isPrimary ? colors.primary : 'transparent', borderColor: colors.primary },
        !isPrimary && styles.secondaryButton,
        disabled && styles.disabled,
        pressed && { opacity: 0.85 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFF' : colors.primary} />
      ) : (
        <Text style={[styles.text, !isPrimary && { color: colors.primary }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButton: {
    borderWidth: 1.5,
  },
  disabled: { opacity: 0.5 },
  text: { color: '#FFF', fontSize: 16, fontFamily: 'DMSans_700Bold' },
});
