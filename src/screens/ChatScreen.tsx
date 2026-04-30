import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { api, BASE_URL } from '../services/api';

const SOCKET_URL = BASE_URL.replace('/api', '');

export default function ChatScreen({ route, navigation }: any) {
  const { colors } = useTheme(); 
  const { receiverId, receiverName, senderId, initialMessage } = route.params;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState(initialMessage || '');
  
  // Message Options State
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await api.getMessages(senderId, receiverId);
        setMessages(history);
      } catch (e) { console.error(e); }
    };
    loadHistory();

    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('register', senderId);

    socketRef.current.on('receive_message', (newMessage) => {
      setMessages((prev) => {
        if (prev.some(msg => msg.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const sendMessage = async () => {
    if (inputText.trim() === '') return;
    const textToSend = inputText.trim();
    
    if (editingMessageId) {
      // HANDLE EDIT
      const originalId = editingMessageId;
      setEditingMessageId(null);
      setInputText('');
      
      setMessages(prev => prev.map(m => m.id === originalId ? { ...m, text: textToSend } : m));
      try {
        await api.editMessage(originalId, textToSend);
      } catch (e) { Alert.alert("Error", "Failed to edit message."); }
    } else {
      // HANDLE NEW MESSAGE
      setInputText(''); 
      const optimisticMessage = {
        id: Math.random().toString(), sender_id: senderId, receiver_id: receiverId,
        text: textToSend, created_at: new Date().toISOString(), isOptimistic: true
      };
      
      setMessages((prev) => [...prev, optimisticMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

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
            await api.deleteMessage(idToDelete);
            setMessages(prev => prev.filter(m => m.id !== idToDelete));
          } catch (e) { console.error(e); }
      }}
    ]);
  };

  const handleDeleteConversation = () => {
    Alert.alert("Delete Conversation", "Are you sure you want to permanently delete this entire conversation?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await api.deleteConversation(senderId, receiverId);
            setMessages([]);
            navigation.goBack();
          } catch (e) { Alert.alert("Error", "Could not delete conversation."); }
      }}
    ]);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_id === senderId;
    return (
      <Pressable 
        onLongPress={() => setSelectedMessage(item)}
        delayLongPress={300}
        style={[
          styles.messageBubble, 
          isMe ? { backgroundColor: colors.primary, borderBottomRightRadius: 4, alignSelf: 'flex-end' } 
               : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4, alignSelf: 'flex-start' },
          item.isOptimistic && { opacity: 0.7 }
        ]}
      >
        <Text style={[styles.messageText, isMe ? { color: '#FFF' } : { color: colors.textPrimary }]}>{item.text}</Text>
      </Pressable>
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
        <Pressable onPress={handleDeleteConversation} style={styles.optionsBtn}>
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
  messageBubble: { maxWidth: '80%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, marginBottom: 10 },
  messageText: { fontSize: 15, fontFamily: 'DMSans_400Regular', lineHeight: 22 },
  
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
});