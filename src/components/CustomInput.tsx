import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { theme } from '../theme/index';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export default function CustomInput({ label, error, ...props }: Props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, isFocused && styles.inputFocused, error && styles.inputError]}
        placeholderTextColor={theme.colors.border}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.m },
  label: { fontSize: theme.typography.labelSize, color: theme.colors.label, marginBottom: theme.spacing.xs, fontWeight: '500' },
  input: {
    height: 44, // STRICT: 40-44dp
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.m,
    color: theme.colors.textDark,
  },
  inputFocused: { borderColor: theme.colors.primary, borderWidth: 1.5 },
  inputError: { borderColor: theme.colors.error },
  errorText: { color: theme.colors.error, fontSize: 12, marginTop: 4 },
});