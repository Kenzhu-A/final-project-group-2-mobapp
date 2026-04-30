// [SAVED-PETS] confirmation sheet for unsaving a pet — rendered once globally via SavedPetsProvider
import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface Props {
  visible: boolean;
  pet: any | null;
  onConfirm: () => void;
  onDismiss: () => void;
}

export default function RemoveSavedSheet({ visible, pet, onConfirm, onDismiss }: Props) {
  const { colors } = useTheme();
  if (!pet) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>Remove from saved?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            This pet will be removed from your saved posts. You can always save them again from their profile.
          </Text>

          <View style={[styles.preview, { borderColor: colors.border }]}>
            {pet.image_url ? (
              <Image source={{ uri: pet.image_url }} style={styles.previewImage} />
            ) : (
              <View style={[styles.previewImage, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="paw" size={24} color="#FFF" />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.previewName, { color: colors.textPrimary }]} numberOfLines={1}>{pet.pet_name}</Text>
              <Text style={[styles.previewMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                {pet.category} • {pet.age} {pet.age === 1 ? 'year' : 'years'} old
              </Text>
            </View>
          </View>

          <Pressable style={styles.removeBtn} onPress={onConfirm} accessibilityRole="button">
            <Text style={styles.removeBtnText}>Remove from saved</Text>
          </Pressable>
          <Pressable style={[styles.keepBtn, { borderColor: colors.border }]} onPress={onDismiss} accessibilityRole="button">
            <Text style={[styles.keepBtnText, { color: colors.textPrimary }]}>Keep saved</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 16 },
  title: { fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: 'DMSans_400Regular', marginBottom: 16, lineHeight: 20 },
  preview: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 20 },
  previewImage: { width: 50, height: 50, borderRadius: 8, resizeMode: 'cover' },
  previewName: { fontSize: 16, fontFamily: 'DMSans_700Bold', marginBottom: 2 },
  previewMeta: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  removeBtn: { backgroundColor: '#B23A3A', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  removeBtnText: { color: '#FFF', fontSize: 16, fontFamily: 'DMSans_700Bold' },
  keepBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  keepBtnText: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
});
