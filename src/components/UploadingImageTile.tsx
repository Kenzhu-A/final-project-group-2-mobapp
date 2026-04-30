// [UPLOAD-PROGRESS] thumbnail with progress overlay, success state, retry on error
import React from 'react';
import { View, Image, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UploadItem } from '../hooks/useImageUploader';
import { useTheme } from '../context/ThemeContext';

interface Props {
  item: UploadItem;
  onRemove: () => void;
  onRetry: () => void;
}

export default function UploadingImageTile({ item, onRemove, onRetry }: Props) {
  const { colors } = useTheme();
  const showProgress = item.status === 'uploading' || item.status === 'pending';

  return (
    <View style={[styles.tile, { borderColor: colors.border }]}>
      <Image source={{ uri: item.uri }} style={styles.img} />

      {showProgress && (
        <View style={styles.overlay}>
          <Text style={styles.percent}>{item.progress}%</Text>
        </View>
      )}

      {item.status === 'error' && (
        <Pressable style={styles.errorOverlay} onPress={onRetry}>
          <Ionicons name="refresh" size={28} color="#FFF" />
          <Text style={styles.errorText}>Retry</Text>
        </Pressable>
      )}

      {item.status === 'done' && (
        <Pressable style={styles.removeBtn} onPress={onRemove} hitSlop={8}>
          <Ionicons name="close" size={14} color="#FFF" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, marginRight: 8, marginBottom: 8, overflow: 'hidden' },
  img: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  percent: { color: '#FFF', fontFamily: 'DMSans_700Bold', fontSize: 14 },
  errorOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(178,58,58,0.85)', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#FFF', fontFamily: 'DMSans_700Bold', fontSize: 11, marginTop: 2 },
  removeBtn: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
});
