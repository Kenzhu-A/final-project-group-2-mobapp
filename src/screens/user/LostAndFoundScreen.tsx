// [LOST-FOUND] Lost & Found report feed + create modal
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Image, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, Linking, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import CustomInput from '../../components/CustomInput';
import CustomDropdown from '../../components/CustomDropdown';
import PrimaryButton from '../../components/PrimaryButton';

export default function LostAndFoundScreen({ navigation }: any) {
  const { colors } = useTheme();
  
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<'All' | 'Lost' | 'Found'>('All');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // [LOST-FOUND] editTarget: null = create mode, object = edit mode
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const [form, setForm] = useState({
    reportType: 'Lost',
    petCategory: 'Dog',
    petName: '',
    description: '',
    location: '',
    contact: ''
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // [OTHER-CATEGORY] free-text when "Other" is selected as pet category
  const [otherCategoryText, setOtherCategoryText] = useState('');

  const fetchReports = useCallback(async () => {
    try {
      const [data, uid, uname] = await Promise.all([
        api.getLostAndFoundReports(),
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('userFullName').catch(() => ''),
      ]);
      setReports(data);
      setCurrentUserId(uid);
      setCurrentUserName(uname || '');
    } catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchReports(); }, [fetchReports]));

  const onRefresh = () => { setRefreshing(true); fetchReports(); };

  const filteredReports = reports.filter(r => filterType === 'All' || r.report_type === filterType);

  const CATEGORY_OPTIONS = ['Dog', 'Cat', 'Bird', 'Other'];

  // [LOST-FOUND] open modal pre-filled for editing
  const openEdit = (item: any) => {
    setEditTarget(item);
    const isStandard = CATEGORY_OPTIONS.includes(item.pet_category);
    setForm({
      reportType: item.report_type,
      petCategory: isStandard ? item.pet_category : 'Other',
      petName: item.pet_name || '',
      description: item.description || '',
      location: item.location || '',
      contact: item.contact_info || '',
    });
    // [OTHER-CATEGORY] restore free-text if it was a custom category
    setOtherCategoryText(isStandard ? '' : (item.pet_category || ''));
    setSelectedImage(item.image_url || null);
    setIsModalVisible(true);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({ reportType: 'Lost', petCategory: 'Dog', petName: '', description: '', location: '', contact: '' });
    setOtherCategoryText('');
    setSelectedImage(null);
    setIsModalVisible(true);
  };

  // [LOST-FOUND] offer camera or gallery when tapping the image picker
  const pickImage = () => {
    Alert.alert('Add Photo', 'Choose how you want to add a photo.', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const { granted } = await ImagePicker.requestCameraPermissionsAsync();
          if (!granted) {
            Alert.alert('Permission Required', 'Camera access is needed to take a photo.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [4, 5], quality: 0.8,
          });
          if (!result.canceled) setSelectedImage(result.assets[0].uri);
        },
      },
      {
        text: 'Choose from Library',
        onPress: async () => {
          const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!granted) {
            Alert.alert('Permission Required', 'Photo library access is needed to pick an image.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [4, 5], quality: 0.8,
          });
          if (!result.canceled) setSelectedImage(result.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!form.description || !form.location || !form.contact) {
      Alert.alert('Missing Details', 'Please fill in description, location, and contact info.');
      return;
    }
    setIsSubmitting(true);
    try {
      const userId = await AsyncStorage.getItem('userId');

      // upload new image only if it's a local URI (not an existing remote URL)
      let imageUrl = typeof selectedImage === 'string' && selectedImage.startsWith('http')
        ? selectedImage
        : null;
      if (selectedImage && !selectedImage.startsWith('http')) {
        const filename = selectedImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;
        const formData = new FormData();
        formData.append('report_image', { uri: selectedImage, name: filename, type } as any);
        imageUrl = await api.uploadLostAndFoundImage(formData);
      }

      // [OTHER-CATEGORY] resolve actual category before submitting
      const resolvedCategory = form.petCategory === 'Other' ? otherCategoryText.trim() : form.petCategory;
      if (!resolvedCategory) {
        Alert.alert('Missing Details', 'Please specify the pet type when selecting "Other".');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        report_type: form.reportType,
        pet_category: resolvedCategory,
        pet_name: form.petName,
        description: form.description,
        location: form.location,
        contact_info: form.contact,
        image_url: imageUrl,
      };

      if (editTarget) {
        // [LOST-FOUND] edit mode — update existing report
        const updated = await api.updateLostAndFoundReport(editTarget.id, payload);
        setReports((prev) => prev.map((r) => r.id === editTarget.id ? { ...r, ...updated } : r));
        Alert.alert('Updated', 'Your report has been updated.');
      } else {
        // create mode
        await api.createLostAndFoundReport({ owner_id: userId, ...payload });
        Alert.alert('Success', 'Report posted to the board!');
        fetchReports();
      }

      setIsModalVisible(false);
      setEditTarget(null);
      setForm({ reportType: 'Lost', petCategory: 'Dog', petName: '', description: '', location: '', contact: '' });
      setOtherCategoryText(''); // [OTHER-CATEGORY]
      setSelectedImage(null);
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
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Lost & Found</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* [LOST-FOUND] filter tabs — same underline style as LikedPetsAndPostsScreen */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {(['All', 'Lost', 'Found'] as const).map((type) => {
          const active = filterType === type;
          const activeColor = type === 'Lost' ? '#D32F2F' : type === 'Found' ? '#4CAF50' : colors.primary;
          const count = type === 'All' ? reports.length : reports.filter(r => r.report_type === type).length;
          return (
            <Pressable key={type} style={styles.tab} onPress={() => setFilterType(type)}>
              <Text style={[styles.tabText, { color: active ? activeColor : colors.textSecondary }]}>
                {type} ({count})
              </Text>
              {active && <View style={[styles.tabUnderline, { backgroundColor: activeColor }]} />}
            </Pressable>
          );
        })}
      </View>

      {/* [LOST-FOUND] feed */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="search-outline" size={56} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No reports yet.</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                {filterType === 'All'
                  ? 'Be the first to report a lost or found pet.'
                  : `No "${filterType}" reports at the moment.`}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isLost = item.report_type === 'Lost';
            const badgeColor = isLost ? '#D32F2F' : '#4CAF50';
            const isOwner = item.owner_id === currentUserId;
            return (
              <View style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>

                {/* [LOST-FOUND] poster row */}
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <Image
                      source={item.owner?.avatar_url ? { uri: item.owner.avatar_url } : require('../../../assets/adaptive-icon.png')}
                      style={styles.avatar}
                    />
                    <View>
                      <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.owner?.full_name || 'Unknown'}</Text>
                      <Text style={[styles.dateText, { color: colors.textSecondary }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  {/* [LOST-FOUND] owner controls — edit + resolve */}
                  {isOwner && (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable onPress={() => openEdit(item)} style={[styles.resolveBtn, { borderColor: colors.primary }]}>
                        <Ionicons name="pencil-outline" size={14} color={colors.primary} />
                        <Text style={[styles.resolveBtnText, { color: colors.primary }]}>Edit</Text>
                      </Pressable>
                      <Pressable onPress={() => handleResolve(item.id)} style={[styles.resolveBtn, { borderColor: '#4CAF50' }]}>
                        <Ionicons name="checkmark-circle-outline" size={14} color="#4CAF50" />
                        <Text style={[styles.resolveBtnText, { color: '#4CAF50' }]}>Resolved</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {item.image_url && <Image source={{ uri: item.image_url }} style={styles.reportImage} />}

                <View style={styles.reportDetails}>
                  {/* [LOST-FOUND] name + badge on the same row — badge right-aligned for emphasis */}
                  <View style={styles.nameRow}>
                    <Text style={[styles.petName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.pet_name || item.pet_category}
                    </Text>
                    <View style={[styles.typeBadge, { backgroundColor: badgeColor }]}>
                      <Text style={styles.typeText}>{item.report_type.toUpperCase()} · {item.pet_category}</Text>
                    </View>
                  </View>

                  <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
                    {item.description}
                  </Text>

                  {/* [LOST-FOUND] location — icon baseline-aligned with text */}
                  <View style={styles.locationRow}>
                    <Ionicons name="location-sharp" size={14} color={colors.primary} style={{ marginTop: 1 }} />
                    <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={2}>
                      {item.location}
                    </Text>
                  </View>

                  {/* action buttons */}
                  <View style={styles.actionRow}>
                    <Pressable
                      style={[styles.actionBtn, { borderColor: colors.border, flex: 1 }]}
                      onPress={() => Linking.openURL(`tel:${item.contact_info}`)}
                    >
                      <Ionicons name="call-outline" size={15} color={colors.primary} />
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>Call</Text>
                    </Pressable>

                    {!isOwner && (
                      <Pressable
                        style={[styles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary, flex: 1 }]}
                        onPress={() => navigation.navigate('ChatScreen', {
                          receiverId: item.owner_id,
                          receiverName: item.owner?.full_name || 'Poster',
                          senderId: currentUserId,
                          initialMessage: `Hi! I saw your ${item.report_type.toLowerCase()} pet report for a ${item.pet_category}${item.pet_name ? ` named ${item.pet_name}` : ''}. Can I help?`,
                        })}
                      >
                        <Ionicons name="chatbubble-outline" size={15} color="#FFF" />
                        <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Message</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Floating Action Button */}
      <Pressable style={[styles.fab, { backgroundColor: colors.primary }]} onPress={openCreate}>
        <Ionicons name="add" size={32} color="#FFF" />
      </Pressable>

      {/* Creation Modal */}
      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
            <Pressable onPress={() => setIsModalVisible(false)}><Ionicons name="close" size={28} color={colors.textPrimary} /></Pressable>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{editTarget ? 'Edit Report' : 'Submit Report'}</Text>
            <View style={{ width: 28 }} />
          </View>
          
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              
              <View style={[styles.toggleContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Pressable style={[styles.toggleBtn, form.reportType === 'Lost' && { backgroundColor: '#D32F2F' }]} onPress={() => setForm({...form, reportType: 'Lost'})}>
                  <Text style={[styles.toggleText, { color: form.reportType === 'Lost' ? '#FFF' : colors.textPrimary }]}>I Lost a Pet</Text>
                </Pressable>
                <Pressable style={[styles.toggleBtn, form.reportType === 'Found' && { backgroundColor: '#4CAF50' }]} onPress={() => setForm({...form, reportType: 'Found'})}>
                  <Text style={[styles.toggleText, { color: form.reportType === 'Found' ? '#FFF' : colors.textPrimary }]}>I Found a Pet</Text>
                </Pressable>
              </View>

              <Pressable style={[styles.imagePickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={pickImage}>
                {selectedImage ? <Image source={{ uri: selectedImage }} style={styles.previewImage} /> : <View style={styles.imagePlaceholder}><Ionicons name="camera-outline" size={40} color={colors.textSecondary} /><Text style={{ color: colors.textSecondary, marginTop: 8 }}>Add Photo (Important!)</Text></View>}
              </Pressable>

              <CustomDropdown label="Pet Category *" value={form.petCategory} options={CATEGORY_OPTIONS} onSelect={(val) => { setForm({...form, petCategory: val}); if (val !== 'Other') setOtherCategoryText(''); }} />
              {/* [OTHER-CATEGORY] show free-text when Other is selected */}
              {form.petCategory === 'Other' && (
                <CustomInput label="Specify Pet Type *" placeholder="e.g., Hamster, Turtle, Parrot" value={otherCategoryText} onChangeText={setOtherCategoryText} />
              )}
              
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
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  tabText: { fontSize: 15, fontFamily: 'DMSans_700Bold' },
  tabUnderline: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, borderRadius: 1 },
  emptyTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, marginTop: 12 },
  emptySub: { fontFamily: 'DMSans_400Regular', fontSize: 13, marginTop: 6, textAlign: 'center' },
  dateText: { fontSize: 11, fontFamily: 'DMSans_400Regular' },
  resolveBtnText: { fontSize: 12, fontFamily: 'DMSans_700Bold' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 6 },
  actionBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  
  reportCard: { borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 38, height: 38, borderRadius: 19, marginRight: 10 },
  userName: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
  // [LOST-FOUND] resolve button — flexDirection row keeps icon+text on one line
  resolveBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, gap: 4 },
  reportImage: { width: '100%', height: 220, resizeMode: 'cover' },
  reportDetails: { padding: 14 },
  // [LOST-FOUND] name + badge side by side
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, flexShrink: 0 },
  typeText: { color: '#FFF', fontSize: 11, fontFamily: 'DMSans_700Bold' },
  petName: { fontSize: 18, fontFamily: 'DMSerifDisplay_400Regular', flex: 1 },
  description: { fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 19, color: '#666', marginBottom: 10 },
  // [LOST-FOUND] location row — icon top-aligned with first line of text
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: 14 },
  locationText: { fontSize: 13, fontFamily: 'DMSans_400Regular', flex: 1, lineHeight: 18 },
  
  fab: { position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  toggleContainer: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginBottom: 20, overflow: 'hidden' },
  toggleBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  toggleText: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
  imagePickerContainer: { height: 200, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', marginBottom: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
});