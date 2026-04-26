import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface Props {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  maximumLength: number;
}

export default function OtpInputBox({ code, setCode, maximumLength }: Props) {
  const { colors } = useTheme(); 
  const [isFocused, setIsFocused] = useState(false);

  const boxArray = new Array(maximumLength).fill(0);

  return (
    <View style={styles.container}>
      {/* Visual OTP Boxes */}
      {/* pointerEvents="none" ensures any taps pass directly through to the invisible TextInput underneath */}
      <View style={styles.inputsContainer} pointerEvents="none">
        {boxArray.map((_, index) => {
          const digit = code[index] || '';
          
          const isCurrentDigit = index === code.length;
          const isLastDigit = index === maximumLength - 1;
          const isCodeComplete = code.length === maximumLength;
          const isBoxActive = isFocused && (isCurrentDigit || (isLastDigit && isCodeComplete));

          return (
            <View 
              key={index} 
              style={[
                styles.box, 
                { backgroundColor: colors.surface, borderColor: colors.border },
                isBoxActive && { borderColor: colors.primary } 
              ]}
            >
              <Text style={[styles.digit, { color: colors.textPrimary }]}>{digit}</Text>
            </View>
          );
        })}
      </View>

      {/* This is the actual input! 
        It stretches over the entire container and sits on top of the visual boxes.
        Because it is opacity: 0, you can't see it, but the OS perfectly recognizes it for typing.
      */}
      <TextInput
        value={code}
        onChangeText={setCode}
        maxLength={maximumLength}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        style={styles.hiddenInput}
        autoFocus={true} 
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        caretHidden={true} // Hides the blinking cursor
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    position: 'relative', 
  },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10, 
  },
  box: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 10,
    minWidth: 40,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digit: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0, // Makes it entirely invisible
    zIndex: 99, // Brings it to the very front so it catches all taps
  },
});