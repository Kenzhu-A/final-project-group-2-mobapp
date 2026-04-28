import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ChatNotifications({ navigation }: any) {
  const { colors } = useTheme();

  // You can link this to a real notifications table in Supabase later!
  const dummyNotifications = [
    { id: '1', title: 'Welcome to SnoutScout!', desc: 'Start browsing pets or create your first post.', time: 'Just now', icon: 'paw' },
    { id: '2', title: 'Profile Updated', desc: 'Your account details have been successfully saved.', time: '2 hours ago', icon: 'person-circle' }
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={dummyNotifications}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={[styles.notificationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name={item.icon as any} size={24} color={colors.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.notifTitle, { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.notifDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>{item.time}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold' },
  notificationCard: { flexDirection: 'row', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  iconWrapper: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1, justifyContent: 'center' },
  notifTitle: { fontSize: 15, fontFamily: 'DMSans_700Bold', marginBottom: 4 },
  notifDesc: { fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 18 },
  timeText: { fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 6, opacity: 0.7 },
});