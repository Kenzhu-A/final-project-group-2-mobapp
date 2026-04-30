import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

export default function AdminDashboardScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>(); // Hook to allow nested navigation
  const [stats, setStats] = useState({ users: 0, activePets: 0, successfulAdoptions: 0, activeReports: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminStats()
       .then(setStats)
       .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      
      <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Dashboard</Text>

      {/* --- STATS GRID 2×2 --- */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.primary + '18' }]}>
            <Ionicons name="people" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats.users}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Users</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.accent + '18' }]}>
            <Ionicons name="paw" size={24} color={colors.accent} />
          </View>
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats.activePets}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Pets</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconWrapper, { backgroundColor: '#63992218' }]}>
            <Ionicons name="heart" size={24} color="#639922" />
          </View>
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats.successfulAdoptions}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Adoptions</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconWrapper, { backgroundColor: '#A32D2D18' }]}>
            <Ionicons name="search-circle" size={24} color="#A32D2D" />
          </View>
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats.activeReports}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Reports</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Administrative Tasks</Text>
      
      {/* --- QUICK ACTION MENU --- */}
      <View style={{ gap: 12 }}>
        
        <Pressable 
          style={[styles.menuRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('AdminPostsScreen')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#F2641915' }]}>
            <Ionicons name="images" size={22} color="#F26419" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Manage System Posts</Text>
            <Text style={[styles.menuDesc, { color: colors.textSecondary }]}>Review and delete community feed posts</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          style={[styles.menuRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('AdminLogsScreen')}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="list" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>View Activity Logs</Text>
            <Text style={[styles.menuDesc, { color: colors.textSecondary }]}>Monitor system and user actions</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          style={[styles.menuRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('AdminUsersScreen')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#3B82F615' }]}>
            <Ionicons name="people" size={22} color="#3B82F6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Manage Users</Text>
            <Text style={[styles.menuDesc, { color: colors.textSecondary }]}>View and remove user accounts</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          style={[styles.menuRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('AdminLostFoundModerationScreen')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#4CAF5015' }]}>
            <Ionicons name="search-circle" size={22} color="#4CAF50" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Lost & Found Reports</Text>
            <Text style={[styles.menuDesc, { color: colors.textSecondary }]}>Review and remove inappropriate reports</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Pressable>

        {/* System Health Status Banner */}
        <View style={[styles.actionBanner, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 }]}>
           <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
           <View style={{ marginLeft: 16, flex: 1 }}>
               <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>System Healthy</Text>
               <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>All services are running normally. No critical issues reported.</Text>
           </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 120 },
  headerTitle: { fontSize: 32, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 24, marginTop: 8 },
  
  // Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  iconWrapper: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statNumber: { fontSize: 28, fontFamily: 'DMSans_700Bold', marginBottom: 4 },
  statLabel: { fontSize: 13, fontFamily: 'DMSans_400Regular' },
  
  // Section Titles
  sectionTitle: { fontSize: 20, fontFamily: 'DMSans_700Bold', marginTop: 16, marginBottom: 16 },
  
  // Menu Rows
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1 },
  menuIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', marginBottom: 4 },
  menuDesc: { fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 18 },
  
  // System Health Banner
  actionBanner: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 1 },
  actionTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', marginBottom: 4 },
  actionDesc: { fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 18 },
});