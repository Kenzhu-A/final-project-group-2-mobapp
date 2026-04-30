// [ADMIN] activity logs — view latest 100 system/user action logs
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

export default function AdminLogsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getActivityLogs().then(setLogs).finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Activity Logs</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 40 }}>No activity logs recorded yet.</Text>}
          renderItem={({ item }) => (
            <View style={[styles.logCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="pulse" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>{item.action}</Text>
                <Text style={[styles.userText, { color: colors.textSecondary }]}>User: {item.user?.email || 'System'}</Text>
                {item.details && <Text style={[styles.detailsText, { color: colors.textSecondary }]}>{item.details}</Text>}
              </View>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold' },
  logCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  actionText: { fontSize: 14, fontFamily: 'DMSans_700Bold', marginBottom: 2 },
  userText: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  detailsText: { fontSize: 12, fontFamily: 'DMSans_400Regular', fontStyle: 'italic', marginTop: 4 },
});