import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface Props { onComplete: (code: string) => void; }

export default function OtpInputBox({ onComplete }: Props) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance
    if (text && index < 5) inputs.current[index + 1]?.focus();
    if (newOtp.every(val => val !== '')) onComplete(newOtp.join(''));
  };

  const handleBackspace = (text: string, index: number) => {
    if (!text && index > 0) inputs.current[index - 1]?.focus();
  };

  return (
    <View style={styles.container}>
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          /* FIX: Added curly braces to return void */
          ref={(ref) => { inputs.current[index] = ref; }}
          style={[styles.box, digit !== '' && styles.boxFilled]}
          keyboardType="numeric"
          maxLength={1}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === 'Backspace') handleBackspace(digit, index);
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: theme.spacing.xl },
  box: {
    width: 48,
    height: 56,
    borderRadius: 16, // Pill-like rounded box
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  boxFilled: { borderColor: theme.colors.primary },
});