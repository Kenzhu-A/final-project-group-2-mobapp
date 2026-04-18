import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean; // NEW: Triggers the eye icon toggle
}

export default function CustomInput({ label, error, isPassword, ...props }: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // If it's a password field, toggle visibility. Otherwise, fallback to whatever secureTextEntry is passed.
  const secureEntry = isPassword ? !isPasswordVisible : props.secureTextEntry;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {/* Moved borders to a wrapper view to hold both the input and the icon */}
      <View style={[
        styles.inputWrapper, 
        isFocused && styles.inputWrapperFocused, 
        error ? styles.inputError : null
      ]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={theme.colors.border}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureEntry}
          {...props}
        />
        
        {/* The Eye Icon Toggle */}
        {isPassword && (
          <TouchableOpacity 
            style={styles.eyeIconContainer}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'} 
              size={20} 
              color={theme.colors.textLight} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.m },
  label: { 
    fontSize: theme.typography.labelSize, 
    color: theme.colors.textLight, 
    marginBottom: theme.spacing.xs, 
    fontFamily: theme.typography.bodyFontBold 
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44, // STRICT: 40-44dp
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.m,
  },
  inputWrapperFocused: { borderColor: theme.colors.primary },
  inputError: { borderColor: theme.colors.error },
  input: {
    flex: 1,
    height: '100%',
    color: theme.colors.textDark,
    fontFamily: theme.typography.bodyFont,
  },
  eyeIconContainer: {
    paddingLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: { color: theme.colors.error, fontSize: 12, marginTop: 4, fontFamily: theme.typography.bodyFont },
});