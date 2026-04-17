import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../theme/index';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: 'primary' | 'secondary';
}

export default function PrimaryButton({ title, onPress, disabled, loading, type = 'primary' }: Props) {
  const isPrimary = type === 'primary';
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        !isPrimary && styles.secondaryButton,
        disabled && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFF' : theme.colors.primary} />
      ) : (
        <Text style={[styles.text, !isPrimary && styles.secondaryText]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52, // STRICT: 48-52dp
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  secondaryButton: {
    backgroundColor: theme.colors.transparent,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  disabled: { opacity: 0.5 },
  text: { color: theme.colors.surface, fontSize: 16, fontWeight: '600' },
  secondaryText: { color: theme.colors.primary },
});