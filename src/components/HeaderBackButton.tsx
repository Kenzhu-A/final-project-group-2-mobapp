import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/index';

export default function HeaderBackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.container} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
      <Text style={styles.text}>Back</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  container: { alignSelf: 'flex-start', marginBottom: theme.spacing.l },
  text: { color: theme.colors.primary, fontSize: 16, fontWeight: '600' }
});