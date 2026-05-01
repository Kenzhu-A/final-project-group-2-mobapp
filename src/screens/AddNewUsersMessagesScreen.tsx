import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function AddNewUsersMessages({ navigation }: any) {
  const { colors } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('userId').then(id => {
      setCurrentUserId(id);
      if (id) {
        api.getUsers(id).then(setUsers).finally(() => setLoading(false));
      }
    });
  }, []);

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="close" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>New Message</Text>
        <View style={{ width: 32 }} />
      </View>
      
      <View style={{ padding: 16 }}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput 
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search users to message..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <Pressable 
              style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.replace('ChatScreen', { receiverId: item.id, receiverName: item.full_name || item.email, senderId: currentUserId })}
            >
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color="#FFF" />
              </View>
              <View>
                <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.full_name || 'User'}</Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16 },
  searchInput: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 15 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F26419', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  userName: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  userEmail: { fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
});