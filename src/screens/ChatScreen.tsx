import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { api, BASE_URL } from '../services/api';

const SOCKET_URL = BASE_URL.replace('/api', '');
const CHAT_READ_KEY = 'snoutscout_chat_read_map';

export default function ChatScreen({ route, navigation }: any) {
  const { colors } = useTheme(); 
  const { receiverId, receiverName, senderId: routeSenderId, initialMessage } = route.params;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState(initialMessage || '');
  const [senderId, setSenderId] = useState<string | null>(routeSenderId || null);
  
  // Message Options State
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showDeleteConversationModal, setShowDeleteConversationModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const safeExitChatToMessages = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home', params: { initialTab: 'messages' } }],
    });
  };

  const formatMessageTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const bootChat = async () => {
      try {
        const currentSenderId = routeSenderId || (await AsyncStorage.getItem('userId'));
        setSenderId(currentSenderId);
        if (!currentSenderId) return;

        const history = await api.getMessages(currentSenderId, receiverId);
        setMessages(history);
        const readRaw = await AsyncStorage.getItem(CHAT_READ_KEY);
        const readMap = readRaw ? JSON.parse(readRaw) : {};
        readMap[receiverId] = new Date().toISOString();
        await AsyncStorage.setItem(CHAT_READ_KEY, JSON.stringify(readMap));

        socketRef.current = io(SOCKET_URL);
        socketRef.current.emit('register', currentSenderId);
        socketRef.current.on('receive_message', (newMessage) => {
          setMessages((prev) => {
            if (prev.some(msg => msg.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        });
        socketRef.current.on('message_edited', (updatedMessage) => {
          setMessages((prev) => prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m)));
        });
        socketRef.current.on('message_deleted', ({ messageId }) => {
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
        });
        socketRef.current.on('conversation_deleted', ({ user1, user2, deletedBy }) => {
          const isCurrentConversation =
            (user1 === currentSenderId && user2 === receiverId) || (user1 === receiverId && user2 === currentSenderId);
          if (!isCurrentConversation) return;
          setMessages([]);
          if (deletedBy && deletedBy !== currentSenderId) {
            Alert.alert('Conversation removed', 'This conversation was deleted.');
          }
          safeExitChatToMessages();
        });
      } catch (e) {
        console.error(e);
      }
    };
    bootChat();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const sendMessage = async () => {
    if (!senderId) return;
    if (inputText.trim() === '') return;
    const textToSend = inputText.trim();
    
    if (editingMessageId) {
      // HANDLE EDIT
      const originalId = editingMessageId;
      try {
        const updated = await api.editMessage(originalId, textToSend, senderId);
        setMessages(prev => prev.map(m => m.id === originalId ? { ...m, ...updated } : m));
        setEditingMessageId(null);
        setInputText('');
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Failed to edit message.");
      }
    } else {
      // HANDLE NEW MESSAGE
      setInputText(''); 
      socketRef.current?.emit('send_message', { sender_id: senderId, receiver_id: receiverId, text: textToSend });
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(selectedMessage.text);
    setSelectedMessage(null);
  };

  const handleDeleteMessage = () => {
    const idToDelete = selectedMessage.id;
    setSelectedMessage(null);
    Alert.alert("Delete Message", "Remove this message?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            if (!senderId) return;
            await api.deleteMessage(idToDelete, senderId);
            setMessages(prev => prev.filter(m => m.id !== idToDelete));
            const latest = await api.getMessages(senderId, receiverId);
            setMessages(latest);
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to delete message.");
          }
      }}
    ]);
  };

  const handleDeleteConversation = () => {
    (async () => {
      const currentUserId = senderId || (await AsyncStorage.getItem('userId'));
      if (!currentUserId) {
        Alert.alert('Error', 'Unable to identify current user. Please re-login and try again.');
        return;
      }
      if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
        Alert.alert('Confirmation required', 'Type DELETE to confirm conversation deletion.');
        return;
      }
      try {
        await api.deleteConversation(currentUserId, receiverId, currentUserId);
        setShowDeleteConversationModal(false);
        setDeleteConfirmText('');
        setMessages([]);
        safeExitChatToMessages();
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Could not delete conversation.");
      }
    })();
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_id === senderId;
    return (
      <View style={[styles.messageRow, { alignSelf: isMe ? 'flex-end' : 'flex-start' }]}>
        <Pressable 
          onLongPress={() => setSelectedMessage(item)}
          delayLongPress={300}
          style={[
            styles.messageBubble, 
            isMe ? { backgroundColor: colors.primary, borderBottomRightRadius: 4, alignSelf: 'flex-end' } 
                 : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4, alignSelf: 'flex-start' }
          ]}
        >
          <Text style={[styles.messageText, isMe ? { color: '#FFF' } : { color: colors.textPrimary }]}>{item.text}</Text>
        </Pressable>
        <Text style={[styles.messageTime, { color: colors.textSecondary, alignSelf: isMe ? 'flex-end' : 'flex-start' }]}>
          {formatMessageTime(item.created_at)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      
      {/* NO TOP BAR DESIGN: Flush background, transparent, minimalist icons */}
      <View style={[styles.cleanHeader, { backgroundColor: colors.background }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, flex: 1, textAlign: 'center' }]}>{receiverName}</Text>
        <Pressable onPress={() => setShowDeleteConversationModal(true)} style={styles.optionsBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container} keyboardVerticalOffset={Platform.OS === 'android' ? 25 : 0}>
        
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
          {editingMessageId && (
            <View style={styles.editingBanner}>
              <Text style={{ color: colors.primary, fontSize: 12, fontFamily: 'DMSans_700Bold' }}>Editing message...</Text>
              <Pressable onPress={() => { setEditingMessageId(null); setInputText(''); }}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          )}
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Message..."
              value={inputText}
              onChangeText={setInputText}
              placeholderTextColor={colors.textSecondary}
              multiline
            />
            <Pressable style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.primary : colors.border }]} onPress={sendMessage}>
              <Ionicons name="send" size={16} color="#FFF" />
            </Pressable>
          </View>
        </View>

      </KeyboardAvoidingView>

      {/* MESSAGE OPTIONS MODAL */}
      <Modal visible={!!selectedMessage} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSelectedMessage(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.optionsMenu, { backgroundColor: colors.surface }]}>
              
              <Pressable style={[styles.optionItem, { borderBottomColor: colors.border }]} onPress={handleCopy}>
                <Ionicons name="copy-outline" size={20} color={colors.textPrimary} style={styles.optionIcon} />
                <Text style={[styles.optionText, { color: colors.textPrimary }]}>Copy Text</Text>
              </Pressable>
              
              {selectedMessage?.sender_id === senderId && (
                <>
                  <Pressable style={[styles.optionItem, { borderBottomColor: colors.border }]} onPress={() => {
                    setEditingMessageId(selectedMessage.id);
                    setInputText(selectedMessage.text);
                    setSelectedMessage(null);
                  }}>
                    <Ionicons name="pencil-outline" size={20} color={colors.textPrimary} style={styles.optionIcon} />
                    <Text style={[styles.optionText, { color: colors.textPrimary }]}>Edit Message</Text>
                  </Pressable>
                  
                  <Pressable style={[styles.optionItem, { borderBottomWidth: 0 }]} onPress={handleDeleteMessage}>
                    <Ionicons name="trash-outline" size={20} color="#D32F2F" style={styles.optionIcon} />
                    <Text style={[styles.optionText, { color: '#D32F2F' }]}>Delete</Text>
                  </Pressable>
                </>
              )}

            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showDeleteConversationModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowDeleteConversationModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.deleteConversationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.deleteConversationTitle, { color: colors.textPrimary }]}>Delete Conversation</Text>
                <Text style={[styles.deleteConversationSub, { color: colors.textSecondary }]}>
                  This action is permanent. Type DELETE to confirm.
                </Text>
                <TextInput
                  style={[styles.deleteConversationInput, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Type DELETE here"
                  placeholderTextColor={colors.textSecondary}
                  value={deleteConfirmText}
                  onChangeText={setDeleteConfirmText}
                  autoCapitalize="characters"
                />
                <View style={styles.deleteConversationBtns}>
                  <Pressable
                    style={[styles.modalBtn, { borderColor: colors.border }]}
                    onPress={() => {
                      setShowDeleteConversationModal(false);
                      setDeleteConfirmText('');
                    }}
                  >
                    <Text style={[styles.modalBtnText, { color: colors.textPrimary }]}>Go Back</Text>
                  </Pressable>
                  <Pressable style={[styles.modalBtn, { backgroundColor: '#D32F2F', borderColor: '#D32F2F' }]} onPress={handleDeleteConversation}>
                    <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Delete conversation</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  cleanHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0 },
  backBtn: { padding: 4 },
  optionsBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold' },
  chatList: { padding: 16, paddingBottom: 24 },
  messageRow: { marginBottom: 10, maxWidth: '80%' },
  messageBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  messageText: { fontSize: 15, fontFamily: 'DMSans_400Regular', lineHeight: 22 },
  messageTime: { fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 4 },
  
  inputWrapper: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 },
  editingBanner: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', borderWidth: 1, borderRadius: 24, paddingLeft: 16, paddingRight: 8, paddingVertical: 8, minHeight: 48 },
  input: { flex: 1, maxHeight: 100, fontFamily: 'DMSans_400Regular', paddingTop: 8, paddingBottom: 8 },
  sendButton: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginLeft: 8, marginBottom: 2 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  optionsMenu: { width: 250, borderRadius: 16, overflow: 'hidden' },
  optionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1 },
  optionIcon: { marginRight: 16 },
  optionText: { fontSize: 16, fontFamily: 'DMSans_400Regular' },
  deleteConversationCard: { width: '88%', borderRadius: 16, borderWidth: 1, padding: 16 },
  deleteConversationTitle: { fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 8 },
  deleteConversationSub: { fontSize: 13, fontFamily: 'DMSans_400Regular', marginBottom: 12 },
  deleteConversationInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'DMSans_400Regular' },
  deleteConversationBtns: { marginTop: 14, gap: 10 },
  modalBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  modalBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
});