// [ADMIN] Lost & Found moderation — view all reports (including resolved), delete any
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Image, ActivityIndicator, Alert, RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

type Filter = 'All' | 'Active' | 'Resolved';

export default function AdminLostFoundModerationScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('All');

  const load = useCallback(async () => {
    try {
      const data = await api.getAdminLostFoundReports();
      setReports(data || []);
    } catch (e) { console.error('[ADMIN-L&F] load failed', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleDelete = (report: any) => {
    const label = report.pet_name || `${report.report_type} ${report.pet_category}`;
    Alert.alert(
      'Delete Report',
      `Permanently remove the report "${label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAdminLostFoundReport(report.id);
              setReports((prev) => prev.filter((r) => r.id !== report.id));
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Could not delete report.');
            }
          },
        },
      ],
    );
  };

  const filtered = reports.filter((r) => {
    if (filter === 'Active') return r.status === 'Active';
    if (filter === 'Resolved') return r.status === 'Resolved';
    return true;
  });

  const countFor = (f: Filter) => {
    if (f === 'All') return reports.length;
    if (f === 'Active') return reports.filter((r) => r.status === 'Active').length;
    return reports.filter((r) => r.status === 'Resolved').length;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Lost & Found Reports</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{reports.length} total reports</Text>
        </View>
      </View>

      {/* filter tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {(['All', 'Active', 'Resolved'] as Filter[]).map((f) => {
          const active = filter === f;
          return (
            <Pressable key={f} style={styles.tab} onPress={() => setFilter(f)}>
              <Text style={[styles.tabText, { color: active ? colors.primary : colors.textSecondary }]}>
                {f} ({countFor(f)})
              </Text>
              {active && <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />}
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={56} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No reports found.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isLost = item.report_type === 'Lost';
            const isResolved = item.status === 'Resolved';
            return (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* poster row */}
                <View style={styles.cardHeader}>
                  <Image
                    source={item.owner?.avatar_url ? { uri: item.owner.avatar_url } : require('../../../assets/adaptive-icon.png')}
                    style={styles.avatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ownerName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.owner?.full_name || item.owner?.email || 'Unknown'}
                    </Text>
                    <Text style={[styles.date, { color: colors.textSecondary }]}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {/* status pill */}
                  <View style={[styles.statusPill, { backgroundColor: isResolved ? '#E8F5E9' : '#FFF3E0' }]}>
                    <Text style={[styles.statusText, { color: isResolved ? '#4CAF50' : '#F59E0B' }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {item.image_url && (
                  <Image source={{ uri: item.image_url }} style={styles.reportImage} />
                )}

                <View style={styles.details}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.petName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.pet_name || item.pet_category}
                    </Text>
                    <View style={[styles.typeBadge, { backgroundColor: isLost ? '#D32F2F' : '#4CAF50' }]}>
                      <Text style={styles.typeText}>{item.report_type.toUpperCase()} · {item.pet_category}</Text>
                    </View>
                  </View>
                  <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-sharp" size={13} color={colors.primary} style={{ marginTop: 1 }} />
                    <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>

                  <Pressable
                    style={[styles.deleteBtn, { borderColor: '#D32F2F' }]}
                    onPress={() => handleDelete(item)}
                  >
                    <Ionicons name="trash-outline" size={15} color="#D32F2F" />
                    <Text style={styles.deleteBtnText}>Remove Report</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabText: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  tabUnderline: { position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, borderRadius: 1 },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  ownerName: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  date: { fontSize: 11, fontFamily: 'DMSans_400Regular' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontFamily: 'DMSans_700Bold' },
  reportImage: { width: '100%', height: 180, resizeMode: 'cover' },
  details: { padding: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 },
  petName: { fontSize: 16, fontFamily: 'DMSerifDisplay_400Regular', flex: 1 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 16, flexShrink: 0 },
  typeText: { color: '#FFF', fontSize: 10, fontFamily: 'DMSans_700Bold' },
  desc: { fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 18, marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: 12 },
  location: { fontSize: 12, fontFamily: 'DMSans_400Regular', flex: 1 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderRadius: 10, paddingVertical: 9, gap: 6,
  },
  deleteBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#D32F2F' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, marginTop: 12 },
});
