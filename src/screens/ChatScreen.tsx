import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // <-- System UI Fix
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { theme } from '../theme';
import { api, BASE_URL } from '../services/api';

const SOCKET_URL = BASE_URL.replace('/api', '');

export default function ChatScreen({ route, navigation }: any) {
  const { receiverId, receiverName, senderId } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
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

    // Handle Incoming Messages & Echoes
    socketRef.current.on('receive_message', (newMessage) => {
      setMessages((prev) => {
        // 1. Prevent duplicates
        if (prev.some(msg => msg.id === newMessage.id)) return prev;

        // 2. If this is an echo of a message we sent, replace our temporary optimistic bubble with the real one
        if (newMessage.sender_id === senderId) {
          const index = prev.findIndex(msg => msg.isOptimistic && msg.text === newMessage.text);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = newMessage; 
            return updated;
          }
        }
        
        // 3. Otherwise, it's a brand new message from the other person
        return [...prev, newMessage];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (inputText.trim() === '') return;
    
    const textToSend = inputText.trim();
    setInputText(''); // CLEAR INSTANTLY

    // OPTIMISTIC UPDATE: Show it on the screen immediately without waiting for the server
    const optimisticMessage = {
      id: Math.random().toString(), // Temporary ID
      sender_id: senderId,
      receiver_id: receiverId,
      text: textToSend,
      created_at: new Date().toISOString(),
      isOptimistic: true // Custom flag
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    // Send it to the server in the background
    socketRef.current?.emit('send_message', {
      sender_id: senderId,
      receiver_id: receiverId,
      text: textToSend
    });
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_id === senderId;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage, item.isOptimistic && { opacity: 0.7 }]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : null]}>{item.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'android' ? 25 : 0} // <-- FIXES ANDROID KEYBOARD OVERLAP
      >
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{receiverName}</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            placeholderTextColor={theme.colors.textLight}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.m, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { marginRight: theme.spacing.m },
  headerTitle: { fontSize: 20, fontFamily: theme.typography.headingFont, color: theme.colors.textDark },
  chatList: { padding: theme.spacing.m, paddingBottom: theme.spacing.xl },
  messageBubble: { maxWidth: '80%', padding: 14, borderRadius: 20, marginBottom: 10 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, fontFamily: theme.typography.bodyFont, color: theme.colors.textDark },
  myMessageText: { color: '#FFF' },
  inputContainer: { flexDirection: 'row', padding: theme.spacing.m, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border, alignItems: 'center' },
  input: { flex: 1, backgroundColor: theme.colors.background, borderRadius: 24, paddingHorizontal: 16, height: 48, marginRight: 12, fontFamily: theme.typography.bodyFont, color: theme.colors.textDark },
  sendButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
});