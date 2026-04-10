import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TextInput, TouchableOpacity, SafeAreaView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { INITIAL_PETS, MOCK_LOST_FOUND, MOCK_USER } from '../utils/mockData';
import { PetPost, LostFoundPost } from '../types';

export default function MainAppScreen({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'feed' | 'lost' | 'create' | 'messages' | 'dashboard'>('feed');
  const [pets, setPets] = useState<PetPost[]>(INITIAL_PETS);
  const [lostFoundPosts] = useState<LostFoundPost[]>(MOCK_LOST_FOUND);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.brandName}>SnoutScout</Text>
        <Ionicons name="notifications-outline" size={24} color="#212529" />
      </View>

      <View style={styles.container}>
        {activeTab === 'feed' && (
          <FlatList
            data={pets}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollPadding}
            renderItem={({ item }) => (
              <View style={styles.cardContainer}>
                <Image source={{ uri: item.images[0] }} style={[styles.cardImage, item.status === 'adopted' && { opacity: 0.5 }]} />
                {item.status === 'adopted' && <View style={styles.adoptedBadge}><Text style={styles.adoptedText}>ADOPTED</Text></View>}
                <View style={styles.cardContent}>
                  <View style={styles.cardHeaderRow}><Text style={styles.petName}>{item.name}</Text><Text style={styles.petAge}>{item.age}</Text></View>
                  <Text style={styles.petBreed}>{item.breed} •📍{item.location}</Text>
                </View>
              </View>
            )}
          />
        )}

        {activeTab === 'lost' && (
          <FlatList
            data={lostFoundPosts}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollPadding}
            ListHeaderComponent={<Text style={styles.sectionTitle}>Lost & Found</Text>}
            renderItem={({ item }) => (
              <View style={styles.cardContainer}>
                <View style={[styles.reportBadge, { backgroundColor: item.report_type === 'lost' ? '#FF4D4D' : '#28A745' }]}>
                  <Text style={styles.reportBadgeText}>{item.report_type.toUpperCase()}</Text>
                </View>
                <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
                <View style={styles.cardContent}>
                  <Text style={styles.petName}>{item.pet_type.charAt(0).toUpperCase() + item.pet_type.slice(1)}</Text>
                  <Text style={styles.detailText}><Text style={styles.boldText}>Date:</Text> {item.incident_date}</Text>
                  <Text style={styles.detailText}><Text style={styles.boldText}>Location:</Text> {item.last_seen_location}</Text>
                  <Text style={styles.detailText}><Text style={styles.boldText}>Details:</Text> {item.description}</Text>
                </View>
              </View>
            )}
          />
        )}

        {activeTab === 'create' && (
          <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Create Adoption Post</Text>
            <TextInput style={styles.input} placeholder="Pet Name" />
            <TextInput style={styles.input} placeholder="Breed" />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Medical History" multiline />
            <TouchableOpacity style={styles.submitBtn}>
              <Ionicons name="paw" size={20} color="#FFF" style={{marginRight: 8}} />
              <Text style={styles.submitBtnText}>Post for Adoption</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {activeTab === 'dashboard' && (
          <ScrollView contentContainerStyle={styles.scrollPadding}>
             <View style={styles.profileHeader}>
                <View>
                  <Text style={styles.sectionTitle}>{MOCK_USER.full_name}</Text>
                  <Text style={styles.detailText}>{MOCK_USER.email}</Text>
                </View>
                <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
                  <Ionicons name="log-out-outline" size={24} color="#FF4D4D" />
                </TouchableOpacity>
              </View>
          </ScrollView>
        )}
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('feed')}>
          <Ionicons name={activeTab === 'feed' ? 'home' : 'home-outline'} size={24} color={activeTab === 'feed' ? '#F26419' : '#6C757D'} />
          <Text style={[styles.navTabText, activeTab === 'feed' && styles.navTabTextActive]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('lost')}>
          <Ionicons name={activeTab === 'lost' ? 'megaphone' : 'megaphone-outline'} size={24} color={activeTab === 'lost' ? '#F26419' : '#6C757D'} />
          <Text style={[styles.navTabText, activeTab === 'lost' && styles.navTabTextActive]}>Lost</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTabCenter} onPress={() => setActiveTab('create')}>
          <View style={styles.centerIconWrapper}>
            <Ionicons name="add" size={32} color="#FFF" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('messages')}>
          <Ionicons name={activeTab === 'messages' ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={activeTab === 'messages' ? '#F26419' : '#6C757D'} />
          <Text style={[styles.navTabText, activeTab === 'messages' && styles.navTabTextActive]}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('dashboard')}>
          <Ionicons name={activeTab === 'dashboard' ? 'person' : 'person-outline'} size={24} color={activeTab === 'dashboard' ? '#F26419' : '#6C757D'} />
          <Text style={[styles.navTabText, activeTab === 'dashboard' && styles.navTabTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { flex: 1, paddingHorizontal: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
  brandName: { fontSize: 22, fontWeight: '900', color: '#F26419' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 25, borderTopWidth: 1, borderTopColor: '#E9ECEF' },
  navTab: { alignItems: 'center', flex: 1 },
  navTabCenter: { alignItems: 'center', flex: 1, marginBottom: 5 },
  centerIconWrapper: { backgroundColor: '#F26419', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#F26419', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8 },
  navTabText: { fontSize: 11, color: '#6C757D', marginTop: 4, fontWeight: '600' },
  navTabTextActive: { color: '#F26419', fontWeight: '800' },
  scrollPadding: { paddingBottom: 20, paddingTop: 10 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#212529' },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logoutBtn: { padding: 10, backgroundColor: '#FFF4ED', borderRadius: 50 },
  cardContainer: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, overflow: 'hidden' },
  cardImage: { width: '100%', height: 200, backgroundColor: '#E9ECEF' },
  adoptedBadge: { position: 'absolute', top: '35%', left: 0, right: 0, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 10 },
  adoptedText: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  reportBadge: { position: 'absolute', top: 15, left: 15, zIndex: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  reportBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  cardContent: { padding: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  petName: { fontSize: 20, fontWeight: 'bold', color: '#212529' },
  petAge: { fontSize: 14, fontWeight: '600', color: '#F26419', backgroundColor: '#FFF4ED', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  petBreed: { fontSize: 14, color: '#6C757D', marginBottom: 4 },
  detailText: { fontSize: 13, color: '#495057', marginBottom: 4, lineHeight: 18 },
  boldText: { fontWeight: '700', color: '#212529' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DEE2E6', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 15 },
  textArea: { height: 80, textAlignVertical: 'top' },
  submitBtn: { flexDirection: 'row', backgroundColor: '#F26419', padding: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});