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
  
  const [isModalVisible, setIsModalVisible] = useState(false);
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

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return Alert.alert("Error", "All fields are required.");
    setIsSubmitting(true);
    try {
      const author_id = await AsyncStorage.getItem('userId');
      await api.createAnnouncement({ title, content, author_id: author_id! });
      setIsModalVisible(false);
      setTitle(''); setContent('');
      fetchAnnouncements();
    } catch (e) { Alert.alert("Error", "Failed to post."); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Remove this announcement?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await api.deleteAnnouncement(id);
          setAnnouncements(prev => prev.filter(a => a.id !== id));
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Announcements</Text>
        <Pressable style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setIsModalVisible(true)}>
          <Ionicons name="add" size={24} color="#FFF" />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <Pressable onPress={() => handleDelete(item.id)} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                </Pressable>
              </View>
              <Text style={[styles.cardContent, { color: colors.textPrimary }]}>{item.content}</Text>
            </View>
          )}
        />
      )}

      {/* CREATE MODAL */}
      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setIsModalVisible(false)}><Ionicons name="close" size={28} color={colors.textPrimary} /></Pressable>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>New Announcement</Text>
            <View style={{ width: 28 }} />
          </View>
          
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ padding: 16, flex: 1 }}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Title</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]} 
              placeholder="e.g. Server Maintenance" placeholderTextColor={colors.textSecondary}
              value={title} onChangeText={setTitle}
            />
            
            <Text style={[styles.inputLabel, { color: colors.textPrimary, marginTop: 16 }]}>Message</Text>
            <TextInput 
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]} 
              placeholder="Type your message..." placeholderTextColor={colors.textSecondary}
              value={content} onChangeText={setContent} multiline textAlignVertical="top"
            />
            <View style={{ marginTop: 24 }}>
              <PrimaryButton title="Post Announcement" onPress={handleCreate} loading={isSubmitting} />
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold', marginBottom: 4 },
  cardContent: { fontSize: 15, fontFamily: 'DMSans_400Regular', lineHeight: 22 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold' },
  inputLabel: { fontSize: 14, fontFamily: 'DMSans_700Bold', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, fontFamily: 'DMSans_400Regular', height: 50 },
  textArea: { height: 150, paddingTop: 16 },
});