// [DELETE-CONFIRM] re-enter email confirmation before irreversible delete
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function DeletePetPostScreen({ route, navigation }: any) {
  const { pet } = route.params;
  const { colors } = useTheme();
  const [storedEmail, setStoredEmail] = useState<string | null>(null);
  const [typedEmail, setTypedEmail] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('userEmail').then(setStoredEmail);
  }, []);

  const matches =
    !!storedEmail &&
    typedEmail.trim().toLowerCase() === storedEmail.toLowerCase();

  const onDelete = async () => {
    if (!matches) return;
    setDeleting(true);
    try {
      await api.deletePetPost(pet.id);
      Alert.alert('Deleted', 'Your listing has been removed.');
      navigation.popToTop();
    } catch (e: any) {
      Alert.alert('Delete failed', e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Ionicons name="trash-outline" size={48} color="#B23A3A" />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Delete Post</Text>
        <Text style={[styles.warn, { color: colors.textSecondary }]}>
          WARNING: This action is permanent and cannot be undone.
        </Text>

        <View style={[styles.preview, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {pet.image_url ? (
            <Image source={{ uri: pet.image_url }} style={styles.previewImg} />
          ) : (
            <View style={[styles.previewImg, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="paw" size={28} color="#FFF" />
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.previewName, { color: colors.textPrimary }]} numberOfLines={1}>{pet.pet_name}</Text>
            <Text style={[styles.previewMeta, { color: colors.textSecondary }]}>
              {pet.category} • {pet.age} {pet.age === 1 ? 'year' : 'years'} old
            </Text>
          </View>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Email</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
          autoCapitalize="none"
          keyboardType="email-address"
          value={typedEmail}
          onChangeText={setTypedEmail}
          placeholder={storedEmail ? 'Enter your account email' : 'No email on file'}
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[styles.fineprint, { color: colors.textSecondary }]}>
          All inquiries, saved interactions, and messages related to this post will be deleted. This listing will no longer be visible and cannot be restored.
        </Text>

        <Pressable
          style={[styles.deleteBtn, { backgroundColor: matches ? '#B23A3A' : colors.border }]}
          onPress={onDelete}
          disabled={!matches || deleting}
        >
          <Text style={[styles.deleteBtnText, { color: matches ? '#FFF' : colors.textSecondary }]}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Text>
        </Pressable>

        <Pressable style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  body: { padding: 24, alignItems: 'center' },
  title: { fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', marginTop: 12, marginBottom: 4 },
  warn: { fontSize: 12, fontFamily: 'DMSans_400Regular', textAlign: 'center', marginBottom: 20 },
  preview: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, alignSelf: 'stretch', marginBottom: 20 },
  previewImg: { width: 56, height: 56, borderRadius: 8, resizeMode: 'cover' },
  previewName: { fontSize: 15, fontFamily: 'DMSans_700Bold' },
  previewMeta: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  label: { fontSize: 11, fontFamily: 'DMSans_700Bold', alignSelf: 'flex-start', marginBottom: 6, letterSpacing: 0.5 },
  input: { alignSelf: 'stretch', borderWidth: 1, borderRadius: 12, padding: 12, fontFamily: 'DMSans_400Regular', fontSize: 14 },
  fineprint: { fontSize: 11, fontFamily: 'DMSans_400Regular', textAlign: 'center', marginVertical: 16, lineHeight: 17 },
  deleteBtn: { alignSelf: 'stretch', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  deleteBtnText: { fontFamily: 'DMSans_700Bold', fontSize: 15 },
  cancelBtn: { alignSelf: 'stretch', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  cancelBtnText: { fontFamily: 'DMSans_700Bold', fontSize: 15 },
});
