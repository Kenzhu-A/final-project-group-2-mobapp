import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function SecondaryButton({ title, onPress, disabled }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52, // STRICT: 48-52dp
    backgroundColor: theme.colors.transparent,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});