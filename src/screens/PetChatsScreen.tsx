import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function PetChatsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      AsyncStorage.getItem('userId').then(id => {
        setCurrentUserId(id);
        if (id) {
          api.getConversations(id)
             .then(setConversations)
             .finally(() => setLoading(false));
        }
      });
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sleek Header with Notifications and New Message Icon */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Messages</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={{ marginRight: 16 }} onPress={() => navigation.navigate('ChatNotifications')}>
            <Ionicons name="notifications-outline" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AddNewUsersMessages')}>
            <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversations List */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.partnerId}
          contentContainerStyle={{ paddingBottom: 110, paddingHorizontal: 16, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Ionicons name="chatbubbles-outline" size={60} color={colors.border} />
              <Text style={{ color: colors.textSecondary, marginTop: 12, fontFamily: 'DMSans_400Regular' }}>No messages yet. Tap + to start a chat!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.conversationCard, { borderBottomColor: colors.border }]}
              onPress={() => navigation.navigate('ChatScreen', { receiverId: item.partnerId, receiverName: item.partnerName, senderId: currentUserId })}
            >
              <Image source={item.partnerAvatar ? { uri: item.partnerAvatar } : require('../../assets/adaptive-icon.png')} style={styles.convoAvatar} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.partnerName}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 14, fontFamily: 'DMSans_400Regular' }} numberOfLines={1}>
                  {item.latestMessage}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  headerTitle: { fontSize: 28, fontFamily: 'DMSerifDisplay_400Regular' },
  conversationCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  convoAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 16, backgroundColor: '#E9ECEF' },
  userName: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
});