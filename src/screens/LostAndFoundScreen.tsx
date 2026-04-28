import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import CustomInput from '../components/CustomInput';
import CustomDropdown from '../components/CustomDropdown';
import PrimaryButton from '../components/PrimaryButton';

const CATEGORIES = ['Dog', 'Cat', 'Bird', 'Other'];

export default function LostAndFoundScreen({ navigation }: any) {
  const { colors } = useTheme();
  
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'All' | 'Lost' | 'Found'>('All');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    reportType: 'Lost',
    petCategory: 'Dog',
    petName: '',
    description: '',
    location: '',
    contact: ''
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const data = await api.getLostAndFoundReports();
      setReports(data);
      const uid = await AsyncStorage.getItem('userId');
      setCurrentUserId(uid);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { fetchReports(); }, []));

  const filteredReports = reports.filter(r => filterType === 'All' || r.report_type === filterType);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [4, 5], quality: 0.8,
    });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!form.description || !form.location || !form.contact) {
      Alert.alert('Missing Details', 'Please fill in description, location, and contact info.');
      return;
    }
    setIsSubmitting(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      let uploadedImageUrl = null;
      
      if (selectedImage) {
        const filename = selectedImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;
        const formData = new FormData();
        formData.append('report_image', { uri: selectedImage, name: filename, type } as any);
        uploadedImageUrl = await api.uploadLostAndFoundImage(formData);
      }

      await api.createLostAndFoundReport({
        owner_id: userId,
        report_type: form.reportType,
        pet_category: form.petCategory,
        pet_name: form.petName,
        description: form.description,
        location: form.location,
        contact_info: form.contact,
        image_url: uploadedImageUrl
      });
      
      Alert.alert('Success', 'Report posted to the board!');
      setIsModalVisible(false);
      setForm({ reportType: 'Lost', petCategory: 'Dog', petName: '', description: '', location: '', contact: '' });
      setSelectedImage(null);
      fetchReports();
    } catch (e: any) { Alert.alert('Error', e.message); } 
    finally { setIsSubmitting(false); }
  };

  const handleResolve = (reportId: string) => {
    Alert.alert("Resolve Report", "Has this pet been safely returned or found?", [
      { text: "Cancel", style: "cancel" },
      { text: "Resolve", onPress: async () => {
          try {
            await api.resolveLostAndFoundReport(reportId);
            setReports(prev => prev.filter(r => r.id !== reportId));
          } catch (e) { Alert.alert("Error", "Could not resolve report."); }
      }}
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Lost & Found</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.background }]}>
        {['All', 'Lost', 'Found'].map(type => (
          <TouchableOpacity 
            key={type} 
            style={[styles.filterBtn, filterType === type && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setFilterType(type as any)}
          >
            <Text style={[styles.filterText, { color: filterType === type ? '#FFF' : colors.textSecondary }]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feed List */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : filteredReports.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search" size={64} color={colors.border} />
          <Text style={{ color: colors.textSecondary, marginTop: 16, fontFamily: 'DMSans_400Regular' }}>No reports found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <Image source={item.owner?.avatar_url ? { uri: item.owner.avatar_url } : require('../../assets/adaptive-icon.png')} style={styles.avatar} />
                  <View>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.owner?.full_name}</Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>{new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
                {item.owner_id === currentUserId && (
                  <TouchableOpacity onPress={() => handleResolve(item.id)} style={[styles.resolveBtn, { borderColor: colors.primary }]}>
                    <Text style={{ color: colors.primary, fontSize: 12, fontFamily: 'DMSans_700Bold' }}>Resolve</Text>
                  </TouchableOpacity>
                )}
              </View>

              {item.image_url && <Image source={{ uri: item.image_url }} style={styles.reportImage} />}
              
              <View style={styles.reportDetails}>
                <View style={[styles.typeBadge, { backgroundColor: item.report_type === 'Lost' ? '#D32F2F' : '#4CAF50' }]}>
                  <Text style={styles.typeText}>{item.report_type} {item.pet_category}</Text>
                </View>
                
                {item.pet_name && <Text style={[styles.petName, { color: colors.textPrimary }]}>{item.pet_name}</Text>}
                <Text style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text>
                
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.infoText, { color: colors.textPrimary }]} numberOfLines={2}>{item.location}</Text>
                </View>
                
                <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${item.contact_info}`)}>
                  <Ionicons name="call" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.infoText, { color: colors.primary, textDecorationLine: 'underline' }]}>{item.contact_info}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setIsModalVisible(true)}>
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>

      {/* Creation Modal */}
      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}><Ionicons name="close" size={28} color={colors.textPrimary} /></TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Submit Report</Text>
            <View style={{ width: 28 }} />
          </View>
          
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              
              <View style={[styles.toggleContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity style={[styles.toggleBtn, form.reportType === 'Lost' && { backgroundColor: '#D32F2F' }]} onPress={() => setForm({...form, reportType: 'Lost'})}>
                  <Text style={[styles.toggleText, { color: form.reportType === 'Lost' ? '#FFF' : colors.textPrimary }]}>I Lost a Pet</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, form.reportType === 'Found' && { backgroundColor: '#4CAF50' }]} onPress={() => setForm({...form, reportType: 'Found'})}>
                  <Text style={[styles.toggleText, { color: form.reportType === 'Found' ? '#FFF' : colors.textPrimary }]}>I Found a Pet</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.imagePickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={pickImage}>
                {selectedImage ? <Image source={{ uri: selectedImage }} style={styles.previewImage} /> : <View style={styles.imagePlaceholder}><Ionicons name="camera-outline" size={40} color={colors.textSecondary} /><Text style={{ color: colors.textSecondary, marginTop: 8 }}>Add Photo (Important!)</Text></View>}
              </TouchableOpacity>

              <CustomDropdown label="Pet Category *" value={form.petCategory} options={CATEGORIES} onSelect={(val) => setForm({...form, petCategory: val})} />
              
              {form.reportType === 'Lost' && (
                <CustomInput label="Pet's Name" placeholder="e.g., Bella" value={form.petName} onChangeText={t => setForm({...form, petName: t})} />
              )}
              
              <CustomInput label="Description / Identifiers *" placeholder="Colors, collar details, condition..." value={form.description} onChangeText={t => setForm({...form, description: t})} multiline />
              <CustomInput label="Last Known Location *" placeholder="Street, landmark, city..." value={form.location} onChangeText={t => setForm({...form, location: t})} multiline />
              <CustomInput label="Contact Number *" placeholder="e.g., 09123456789" value={form.contact} onChangeText={t => setForm({...form, contact: t})} keyboardType="phone-pad" />
              
              <View style={{ marginTop: 24 }}>
                <PrimaryButton title="Submit Report" onPress={handleSubmit} loading={isSubmitting} />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  filterText: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
  
  reportCard: { borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  userName: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
  resolveBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  reportImage: { width: '100%', height: 250, resizeMode: 'cover' },
  reportDetails: { padding: 16 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  typeText: { color: '#FFF', fontSize: 12, fontFamily: 'DMSans_700Bold' },
  petName: { fontSize: 18, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 4 },
  description: { fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 20, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  infoText: { fontSize: 14, fontFamily: 'DMSans_700Bold', flex: 1 },
  
  fab: { position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  toggleContainer: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginBottom: 20, overflow: 'hidden' },
  toggleBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  toggleText: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
  imagePickerContainer: { height: 200, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', marginBottom: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
});