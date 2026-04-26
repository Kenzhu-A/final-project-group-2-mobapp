import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

export default function SavedPostsScreen({ navigation }: any) {
  // Currently set to empty to trigger the "No saved posts yet" UI
  const [savedPosts, setSavedPosts] = useState<any[]>([]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Posts</Text>
      </View>

      {savedPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color={theme.colors.border} />
          <Text style={styles.emptyText}>No saved posts yet.</Text>
          <Text style={styles.emptySubtext}>Pets you bookmark for later will be saved in this list.</Text>
        </View>
      ) : (
        <FlatList
          data={savedPosts}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <Text>Saved Post Data Goes Here</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.m, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface },
  backBtn: { marginRight: theme.spacing.m },
  headerTitle: { fontSize: 20, fontFamily: theme.typography.headingFont, color: theme.colors.textDark },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  emptyText: { fontSize: 20, fontFamily: theme.typography.headingFont, color: theme.colors.textDark, marginTop: theme.spacing.m },
  emptySubtext: { fontSize: 14, fontFamily: theme.typography.bodyFont, color: theme.colors.textLight, textAlign: 'center', marginTop: 8 },
  listContainer: { padding: theme.spacing.m },
  postCard: { padding: 16, backgroundColor: theme.colors.surface, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border }
});