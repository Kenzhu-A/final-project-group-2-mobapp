import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Modal, FlatList, TextInput, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function GeneralPostCard({ item, colors, onUnsave }: any) {
  const [expanded, setExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(item.likes_count || 0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('userId').then(uid => {
      setCurrentUserId(uid);
      if (uid) {
        // [SAVED-PETS] use String() on both sides to avoid number/string mismatch
        const sid = String(item.id);
        AsyncStorage.getItem(`${uid}_likedPosts`).then(res => {
          if (res && JSON.parse(res).map(String).includes(sid)) setIsLiked(true);
        });
        AsyncStorage.getItem(`${uid}_savedPosts`).then(res => {
          if (res && JSON.parse(res).map(String).includes(sid)) setIsSaved(true);
        });
      }
    });
  }, [item.id]);

  const toggleLike = async () => {
    if (!currentUserId) return;
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((prev: number) => newLiked ? prev + 1 : Math.max(0, prev - 1));
    
    try {
      await api.updateLikeCount(item.id, newLiked);
      const stored = await AsyncStorage.getItem(`${currentUserId}_likedPosts`);
      let likesArr = stored ? JSON.parse(stored) : [];
      if (newLiked) likesArr.push(item.id);
      else likesArr = likesArr.filter((id: string) => id !== item.id);
      await AsyncStorage.setItem(`${currentUserId}_likedPosts`, JSON.stringify(likesArr));
    } catch (e) {
      setIsLiked(!newLiked);
      setLikesCount((prev: number) => !newLiked ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  const toggleSave = async () => {
    if (!currentUserId) return;
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    // [SAVED-PETS] notify parent before any await so the list updates instantly
    if (!newSaved && onUnsave) onUnsave(item.id);
    // persist to AsyncStorage in background
    const stored = await AsyncStorage.getItem(`${currentUserId}_savedPosts`);
    let savedArr = stored ? JSON.parse(stored) : [];
    if (newSaved) savedArr.push(item.id);
    else savedArr = savedArr.filter((id: string) => id !== item.id);
    await AsyncStorage.setItem(`${currentUserId}_savedPosts`, JSON.stringify(savedArr));
  };

  const handleOpenComments = async () => {
    setShowComments(true);
    try {
      const data = await api.getComments(item.id);
      setComments(data);
    } catch (e) { console.error(e); }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !currentUserId) return;
    setPostingComment(true);
    try {
      const addedComment = await api.addComment(item.id, currentUserId, newComment.trim());
      setComments(prev => [...prev, addedComment]);
      setNewComment('');
    } catch (e: any) {
      Alert.alert('Error', 'Failed to post comment.');
    } finally {
      setPostingComment(false);
    }
  };

  const handleOptions = () => {
    if (item.owner_id === currentUserId) {
      Alert.alert("Manage Post", "What would you like to do?", [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Post", 
          style: "destructive", 
          onPress: async () => {
            try {
              await api.deleteGeneralPost(item.id);
              Alert.alert("Deleted", "Post removed. Pull to refresh your feed.");
            } catch (e) { 
              Alert.alert("Error", "Failed to delete."); 
            }
          }
        }
      ]);
    } else {
      Alert.alert("Report Post", "Are you sure you want to report this post?", [
        { text: "Cancel", style: "cancel" },
        { text: "Report", style: "destructive", onPress: () => Alert.alert("Reported", "Our team will review this post.") }
      ]);
    }
  };

  return (
    // [COMMUNITY-FEED] card style — rounded corners, border, horizontal margin to align with other cards
    <View style={[styles.postContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <Image source={item.owner?.avatar_url ? { uri: item.owner.avatar_url } : require('../../assets/adaptive-icon.png')} style={styles.avatar} />
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.owner?.full_name || 'Anonymous User'}</Text>
        </View>
        <TouchableOpacity onPress={handleOptions}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.postImage} />
      ) : null}

      <View style={styles.actionBar}>
        <View style={styles.actionLeft}>
          <TouchableOpacity style={styles.actionIcon} onPress={toggleLike}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={28} color={isLiked ? "#E0245E" : colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={handleOpenComments}>
            <Ionicons name="chatbubble-outline" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={toggleSave}>
          <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={26} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.likesText, { color: colors.textPrimary }]}>{likesCount} liked this post</Text>

      {item.description ? (
        <View style={styles.descriptionContainer}>
          <Text style={[styles.descriptionText, { color: colors.textPrimary }]} numberOfLines={expanded ? undefined : 2}>
            <Text style={{ fontFamily: 'DMSans_700Bold' }}>{item.owner?.full_name || 'User'} </Text>
            {item.description}
          </Text>
          {item.description.length > 80 && !expanded && (
            <TouchableOpacity onPress={() => setExpanded(true)}>
              <Text style={[styles.seeMoreText, { color: colors.textSecondary }]}>see more...</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      <Modal visible={showComments} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowComments(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={{ width: 24 }} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Comments</Text>
            <TouchableOpacity onPress={() => setShowComments(false)}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={comments}
            keyExtractor={c => c.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>No comments yet. Start the conversation!</Text>}
            renderItem={({ item: comment }) => (
              <View style={styles.commentRow}>
                <Image source={comment.user?.avatar_url ? { uri: comment.user.avatar_url } : require('../../assets/adaptive-icon.png')} style={styles.commentAvatar} />
                <View style={[styles.commentBubble, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.commentName, { color: colors.textPrimary }]}>{comment.user?.full_name}</Text>
                  <Text style={[styles.commentText, { color: colors.textPrimary }]}>{comment.text}</Text>
                </View>
              </View>
            )}
          />

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
            <View style={[styles.commentInputContainer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
              <TextInput
                style={[styles.commentInput, { color: colors.textPrimary, backgroundColor: colors.background }]}
                placeholder="Add a comment..."
                placeholderTextColor={colors.textSecondary}
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity onPress={handlePostComment} disabled={postingComment} style={styles.sendButton}>
                <Ionicons name="send" size={24} color={newComment.trim() ? colors.primary : colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  postContainer: { borderRadius: 16, borderWidth: 1, marginHorizontal: 16, marginBottom: 12, overflow: 'hidden', paddingBottom: 12 },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  postHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10, borderWidth: 1, borderColor: '#E9ECEF' },
  userName: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
  postImage: { width: '100%', height: 280, resizeMode: 'cover' },
  actionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  actionLeft: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { marginRight: 16 },
  likesText: { fontSize: 13, fontFamily: 'DMSans_700Bold', paddingHorizontal: 16, marginBottom: 6 },
  descriptionContainer: { paddingHorizontal: 16 },
  descriptionText: { fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 20 },
  seeMoreText: { fontSize: 14, fontFamily: 'DMSans_400Regular', marginTop: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold' },
  commentRow: { flexDirection: 'row', marginBottom: 16 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  commentBubble: { flex: 1, padding: 12, borderRadius: 16, borderTopLeftRadius: 4 },
  commentName: { fontSize: 13, fontFamily: 'DMSans_700Bold', marginBottom: 4 },
  commentText: { fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 20 },
  commentInputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1 },
  commentInput: { flex: 1, minHeight: 40, maxHeight: 100, borderRadius: 20, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, fontFamily: 'DMSans_400Regular', fontSize: 14 },
  sendButton: { padding: 10, marginLeft: 8 },
});