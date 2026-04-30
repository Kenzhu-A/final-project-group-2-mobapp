// [ADMIN] announcements — create, edit, and delete announcements
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import PrimaryButton from '../../components/PrimaryButton';

export default function AdminAnnouncementsScreen() {
  const { colors } = useTheme();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // create / edit modal shared state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null = create mode
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const data = await api.getAnnouncements();
      setAnnouncements(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setIsModalVisible(true);
  };

  // [ADMIN-ANNOUNCE-EDIT] pre-fill modal with existing announcement data
  const openEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return Alert.alert('Error', 'All fields are required.');
    setIsSubmitting(true);
    try {
      if (editingId) {
        // [ADMIN-ANNOUNCE-EDIT] update existing announcement
        const updated = await api.updateAnnouncement(editingId, { title: title.trim(), content: content.trim() });
        setAnnouncements((prev) => prev.map((a) => (a.id === editingId ? { ...a, ...updated } : a)));
      } else {
        const author_id = await AsyncStorage.getItem('userId');
        await api.createAnnouncement({ title: title.trim(), content: content.trim(), author_id: author_id! });
        fetchAnnouncements();
      }
      closeModal();
    } catch (e) { Alert.alert('Error', editingId ? 'Failed to update.' : 'Failed to post.'); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          await api.deleteAnnouncement(id);
          setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Announcements</Text>
        <Pressable style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={openCreate}>
          <Ionicons name="add" size={24} color="#FFF" />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Ionicons name="megaphone-outline" size={56} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No announcements yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
                {/* [ADMIN-ANNOUNCE-EDIT] edit button */}
                <Pressable onPress={() => openEdit(item)} style={[styles.actionBtn, { backgroundColor: colors.primary + '18', marginRight: 8 }]}>
                  <Ionicons name="pencil-outline" size={17} color={colors.primary} />
                </Pressable>
                <Pressable onPress={() => handleDelete(item.id)} style={[styles.actionBtn, { backgroundColor: '#FDECEA' }]}>
                  <Ionicons name="trash-outline" size={17} color="#D32F2F" />
                </Pressable>
              </View>
              <Text style={[styles.cardContent, { color: colors.textPrimary }]}>{item.content}</Text>
            </View>
          )}
        />
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Pressable onPress={closeModal}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingId ? 'Edit Announcement' : 'New Announcement'}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ padding: 16, flex: 1 }}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="e.g. Server Maintenance"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.inputLabel, { color: colors.textPrimary, marginTop: 16 }]}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Type your message..."
              placeholderTextColor={colors.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
            <View style={{ marginTop: 24 }}>
              <PrimaryButton
                title={editingId ? 'Save Changes' : 'Post Announcement'}
                onPress={handleSubmit}
                loading={isSubmitting}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 32, fontFamily: 'DMSerifDisplay_400Regular' },
  addBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold', marginBottom: 4 },
  cardContent: { fontSize: 15, fontFamily: 'DMSans_400Regular', lineHeight: 22 },
  actionBtn: { padding: 8, borderRadius: 10 },
  emptyText: { fontFamily: 'DMSans_400Regular', fontSize: 14, marginTop: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold' },
  inputLabel: { fontSize: 14, fontFamily: 'DMSans_700Bold', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, fontFamily: 'DMSans_400Regular', height: 50 },
  textArea: { height: 150, paddingTop: 16 },
});
