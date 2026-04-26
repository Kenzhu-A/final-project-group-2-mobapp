import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export default function CustomInput({ label, error, isPassword, ...props }: Props) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const secureEntry = isPassword ? !isPasswordVisible : props.secureTextEntry;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      
      <View style={[
        styles.inputWrapper, 
        { backgroundColor: colors.surface, borderColor: colors.border },
        isFocused && { borderColor: colors.primary }, 
        error ? { borderColor: '#dc3545' } : null
      ]}>
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholderTextColor={colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureEntry}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity 
            style={styles.eyeIconContainer}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'} 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 8, fontFamily: 'DMSans_700Bold' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', height: 48, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16 },
  input: { flex: 1, height: '100%', fontFamily: 'DMSans_400Regular' },
  eyeIconContainer: { paddingLeft: 10, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#dc3545', fontSize: 12, marginTop: 4, fontFamily: 'DMSans_400Regular' },
});