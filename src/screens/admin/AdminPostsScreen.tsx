// [ADMIN] manage system posts — view all general_posts, delete by admin
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

export default function AdminPostsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const data = await api.getAllSystemPosts();
      setPosts(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = (id: string) => {
    Alert.alert("Delete Post", "Are you sure you want to permanently delete this post?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await api.deleteSystemPost(id);
            setPosts(prev => prev.filter(p => p.id !== id));
          } catch (e) { Alert.alert("Error", "Could not delete post."); }
      }}
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Manage Posts</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.postHeader}>
                <Image source={item.owner?.avatar_url ? { uri: item.owner.avatar_url } : require('../../../assets/adaptive-icon.png')} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.owner?.full_name || 'User'}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{new Date(item.created_at).toLocaleString()}</Text>
                </View>
                <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash" size={18} color="#D32F2F" />
                </Pressable>
              </View>
              {item.description ? <Text style={[styles.postText, { color: colors.textPrimary }]}>{item.description}</Text> : null}
              {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.postImage} /> : null}
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
  postCard: { borderRadius: 16, borderWidth: 1, marginBottom: 16, paddingBottom: 16, overflow: 'hidden' },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  userName: { fontSize: 15, fontFamily: 'DMSans_700Bold' },
  deleteBtn: { padding: 8, backgroundColor: '#FDECEA', borderRadius: 8 },
  postText: { paddingHorizontal: 16, paddingBottom: 12, fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 20 },
  postImage: { width: '100%', height: 300, resizeMode: 'cover' },
});