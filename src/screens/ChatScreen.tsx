import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { useTheme } from '../context/ThemeContext'; // <-- Global Theme
import { api, BASE_URL } from '../services/api';

const SOCKET_URL = BASE_URL.replace('/api', '');

export default function ChatScreen({ route, navigation }: any) {
  const { colors } = useTheme(); 
  
  // Extract initialMessage passed from PetAdoptScreen
  const { receiverId, receiverName, senderId, initialMessage } = route.params;
  
  const [messages, setMessages] = useState<any[]>([]);
  // Automatically fill the text box if initialMessage exists!
  const [inputText, setInputText] = useState(initialMessage || '');
  
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

        if (newMessage.sender_id === senderId) {
          const index = prev.findIndex(msg => msg.isOptimistic && msg.text === newMessage.text);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = newMessage; 
            return updated;
          }
        }
        
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
    setInputText(''); 

    const optimisticMessage = {
      id: Math.random().toString(),
      sender_id: senderId,
      receiver_id: receiverId,
      text: textToSend,
      created_at: new Date().toISOString(),
      isOptimistic: true
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    socketRef.current?.emit('send_message', {
      sender_id: senderId,
      receiver_id: receiverId,
      text: textToSend
    });
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_id === senderId;
    return (
      <View style={[
        styles.messageBubble, 
        isMe ? { backgroundColor: colors.primary, borderBottomRightRadius: 4, alignSelf: 'flex-end' } 
             : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4, alignSelf: 'flex-start' },
        item.isOptimistic && { opacity: 0.7 }
      ]}>
        <Text style={[styles.messageText, isMe ? { color: '#FFF' } : { color: colors.textPrimary }]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'android' ? 25 : 0} 
      >
        
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{receiverName}</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.primary }]} onPress={sendMessage}>
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular' },
  chatList: { padding: 16, paddingBottom: 24 },
  messageBubble: { maxWidth: '80%', padding: 14, borderRadius: 20, marginBottom: 10 },
  messageText: { fontSize: 15, fontFamily: 'DMSans_400Regular' },
  inputContainer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, alignItems: 'center' },
  input: { flex: 1, borderRadius: 24, paddingHorizontal: 16, height: 48, marginRight: 12, fontFamily: 'DMSans_400Regular' },
  sendButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
});