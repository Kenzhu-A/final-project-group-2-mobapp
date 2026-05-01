import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { io, Socket } from "socket.io-client";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";
import { api, BASE_URL } from "../services/api";

const SOCKET_URL = BASE_URL.replace("/api", "");
const CHAT_READ_KEY = "snoutscout_chat_read_map";
const REPORT_REASONS = [
  "Harassment or bullying",
  "Spam or scam",
  "Inappropriate messages",
  "Other concern",
]; // [MESSAGING-FIX]

function getMessageId(m: any): string | undefined {
  return m?.id ?? m?.message_id ?? m?.messageId ?? m?.uuid;
}

function normalizeMessage(m: any): any {
  const id = getMessageId(m);
  return id ? { ...m, id } : m;
}

export default function ChatScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const {
    receiverId,
    receiverName,
    senderId: routeSenderId,
    initialMessage,
    onChatEnter,
  } = route.params; // [MESSAGE-BADGE]

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState(initialMessage || "");
  const [senderId, setSenderId] = useState<string | null>(
    routeSenderId || null,
  );

  // Message Options State
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false); // [CHAT-MENU] options for report/delete
  const [showReportUserModal, setShowReportUserModal] = useState(false); // [CHAT-MENU]
  const [showDeleteConversationModal, setShowDeleteConversationModal] =
    useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]); // [MESSAGING-FIX]
  const [reportDetails, setReportDetails] = useState(""); // [MESSAGING-FIX]
  const [submittingReport, setSubmittingReport] = useState(false); // [MESSAGING-FIX]

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const senderIdRef = useRef<string | null>(null);
  const messagesRef = useRef<any[]>([]);
  const safeExitChatToMessages = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Home", params: { initialTab: "messages" } }],
    });
  };

  const setupSocketConnection = useCallback(async () => {
    try {
      const currentSenderId =
        routeSenderId || (await AsyncStorage.getItem("userId"));
      setSenderId(currentSenderId);
      if (!currentSenderId) return;

      // Fetch message history
      const history = await api.getMessages(currentSenderId, receiverId);
      setMessages((history || []).map(normalizeMessage));

      // Mark conversation as read
      const readRaw = await AsyncStorage.getItem(CHAT_READ_KEY);
      const readMap = readRaw ? JSON.parse(readRaw) : {};
      readMap[receiverId] = new Date().toISOString();
      await AsyncStorage.setItem(CHAT_READ_KEY, JSON.stringify(readMap));

      // Disconnect existing socket if any
      socketRef.current?.disconnect();

      // Create new socket connection
      socketRef.current = io(SOCKET_URL);
      socketRef.current.emit("register", currentSenderId);

      // Set up event listeners
      socketRef.current.on("receive_message", (newMessage) => {
        const normalized = normalizeMessage(newMessage);
        setMessages((prev) => {
          const nid = getMessageId(normalized);
          if (nid && prev.some((msg) => getMessageId(msg) === nid)) return prev;
          return [...prev, normalized];
        });
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100,
        );
      });

      socketRef.current.on("message_edited", (updatedMessage) => {
        const normalized = normalizeMessage(updatedMessage);
        const uid = getMessageId(normalized);
        setMessages((prev) =>
          prev.map((m) => (uid && getMessageId(m) === uid ? normalized : m)),
        );
      });

      socketRef.current.on("message_deleted", ({ messageId }) => {
        setMessages((prev) =>
          prev.filter((m) => getMessageId(m) !== messageId),
        );
      });

      socketRef.current.on(
        "conversation_deleted",
        ({ user1, user2, deletedBy }) => {
          const me = senderIdRef.current;

          const isCurrentConversation =
            (user1 === me && user2 === receiverId) ||
            (user1 === receiverId && user2 === me);

          if (!isCurrentConversation) return;

          setMessages([]);

          if (deletedBy && deletedBy !== me) {
            Alert.alert(
              "Conversation removed",
              "This conversation was deleted.",
            );
          }

          safeExitChatToMessages();
        },
      );
    } catch (e) {
      console.error(e);
    }
  }, [routeSenderId, receiverId]);

  // Set up socket connection when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setupSocketConnection();

      // [MESSAGE-BADGE] Reset badge when entering specific chat
      onChatEnter?.();

      return () => {
        // Keep socket connected (don't disconnect on blur)
        // This allows messages to be received even when not actively viewing the screen
      };
    }, [setupSocketConnection, onChatEnter]),
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    senderIdRef.current = senderId;
  }, [senderId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const formatMessageTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const sendMessage = async () => {
    const currentSenderId = senderIdRef.current;
    if (!currentSenderId) return;
    if (inputText.trim() === "") return;
    const textToSend = inputText.trim();

    if (editingMessageId) {
      // HANDLE EDIT
      const originalId = editingMessageId;
      try {
        const updated = await api.editMessage(
          originalId,
          textToSend,
          currentSenderId,
        );
        const normalized = normalizeMessage(updated);
        setMessages((prev) =>
          prev.map((m) =>
            getMessageId(m) === originalId ? { ...m, ...normalized } : m,
          ),
        );
        setEditingMessageId(null);
        setInputText("");
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Failed to edit message.");
      }
    } else {
      // HANDLE NEW MESSAGE
      setInputText("");

      // Update readMap BEFORE sending so this conversation doesn't show as unread
      // Use a buffer (+1000ms) to ensure this timestamp is always >= the server timestamp
      const updateReadMapBeforeSend = async () => {
        const futureTime = new Date(Date.now() + 1000).toISOString();
        const readRaw = await AsyncStorage.getItem(CHAT_READ_KEY);
        const readMap = readRaw ? JSON.parse(readRaw) : {};
        readMap[receiverId] = futureTime;
        await AsyncStorage.setItem(CHAT_READ_KEY, JSON.stringify(readMap));
      };
      updateReadMapBeforeSend().catch(() => {});

      socketRef.current?.emit("send_message", {
        sender_id: currentSenderId,
        receiver_id: receiverId,
        text: textToSend,
      });
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(selectedMessage.text);
    setSelectedMessage(null);
  };

  const handleDeleteMessage = () => {
    const idToDelete = getMessageId(selectedMessage);
    setSelectedMessage(null);
    if (!idToDelete) {
      Alert.alert(
        "Error",
        "Unable to delete this message (missing id). Please refresh the chat and try again.",
      );
      return;
    }
    Alert.alert("Delete Message", "Remove this message?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (!senderIdRef.current) return;
            setMessages((prev) =>
              prev.filter((m) => getMessageId(m) !== idToDelete),
            );

            try {
              await api.deleteMessage(idToDelete, senderIdRef.current);
            } catch (e) {
              if (senderIdRef.current) {
                const latest = await api.getMessages(
                  senderIdRef.current,
                  receiverId,
                );
                setMessages((latest || []).map(normalizeMessage));
              }
              throw e;
            }
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to delete message.");
          }
        },
      },
    ]);
  };

  const handleReportUser = async () => {
    const currentUserId = senderIdRef.current || (await AsyncStorage.getItem("userId"));
    if (!currentUserId) {
      Alert.alert("Error", "Unable to identify current user. Please re-login and try again.");
      return;
    }
    if (!reportReason.trim()) {
      Alert.alert("Missing reason", "Please choose a reason before submitting.");
      return;
    }

    setSubmittingReport(true);
    try {
      await api.createReport({
        report_type: "user",
        item_id: receiverId,
        reporter_id: currentUserId,
        reason: reportReason,
        description: reportDetails.trim() || `Reported from conversation with ${receiverName}`,
      });
      setShowReportUserModal(false);
      setReportDetails("");
      Alert.alert("Report submitted", "An admin will review this conversation.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to submit report.");
    } finally {
      setSubmittingReport(false);
    }
  }; // [MESSAGING-FIX]

  const handleDeleteConversation = () => {
    (async () => {
      const currentUserId =
        senderIdRef.current || (await AsyncStorage.getItem("userId"));
      if (!currentUserId) {
        Alert.alert(
          "Error",
          "Unable to identify current user. Please re-login and try again.",
        );
        return;
      }
      try {
        await api.deleteConversation(currentUserId, receiverId, currentUserId);
        setShowDeleteConversationModal(false);
        setMessages([]);
        safeExitChatToMessages();
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Could not delete conversation.");
      }
    })();
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_id === senderIdRef.current;
    return (
      <View
        style={[
          styles.messageRow,
          { alignSelf: isMe ? "flex-end" : "flex-start" },
        ]}
      >
        <Pressable
          onLongPress={() => setSelectedMessage(item)}
          delayLongPress={300}
          style={[
            styles.messageBubble,
            isMe
              ? {
                  backgroundColor: colors.primary,
                  borderBottomRightRadius: 4,
                  alignSelf: "flex-end",
                }
              : {
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderBottomLeftRadius: 4,
                  alignSelf: "flex-start",
                },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMe ? { color: "#FFF" } : { color: colors.textPrimary },
            ]}
          >
            {item.text}
          </Text>
        </Pressable>
        <Text
          style={[
            styles.messageTime,
            {
              color: colors.textSecondary,
              alignSelf: isMe ? "flex-end" : "flex-start",
            },
          ]}
        >
          {formatMessageTime(item.created_at)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {/* NO TOP BAR DESIGN: Flush background, transparent, minimalist icons */}
      <View
        style={[styles.cleanHeader, { backgroundColor: colors.background }]}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.textPrimary, flex: 1, textAlign: "center" },
          ]}
        >
          {receiverName}
        </Text>
        <Pressable
          onPress={() => setShowChatMenu(true)}
          style={styles.optionsBtn}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color={colors.textPrimary}
          />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "android" ? 25 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => getMessageId(item) || index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        <View
          style={[styles.inputWrapper, { backgroundColor: colors.background }]}
        >
          {editingMessageId && (
            <View style={styles.editingBanner}>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 12,
                  fontFamily: "DMSans_700Bold",
                }}
              >
                Editing message...
              </Text>
              <Pressable
                onPress={() => {
                  setEditingMessageId(null);
                  setInputText("");
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          )}
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Message..."
              value={inputText}
              onChangeText={setInputText}
              placeholderTextColor={colors.textSecondary}
              multiline
            />
            <Pressable
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim()
                    ? colors.primary
                    : colors.border,
                },
              ]}
              onPress={sendMessage}
            >
              <Ionicons name="send" size={16} color="#FFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* MESSAGE OPTIONS MODAL */}
      <Modal visible={!!selectedMessage} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSelectedMessage(null)}>
          <View style={styles.modalOverlay}>
            <View
              style={[styles.optionsMenu, { backgroundColor: colors.surface }]}
            >
              <Pressable
                style={[
                  styles.optionItem,
                  { borderBottomColor: colors.border },
                ]}
                onPress={handleCopy}
              >
                <Ionicons
                  name="copy-outline"
                  size={20}
                  color={colors.textPrimary}
                  style={styles.optionIcon}
                />
                <Text
                  style={[styles.optionText, { color: colors.textPrimary }]}
                >
                  Copy Text
                </Text>
              </Pressable>

              {selectedMessage?.sender_id === senderIdRef.current && (
                <>
                  <Pressable
                    style={[
                      styles.optionItem,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => {
                      const id = getMessageId(selectedMessage);
                      if (!id) return;
                      setEditingMessageId(id);
                      setInputText(selectedMessage.text);
                      setSelectedMessage(null);
                    }}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={20}
                      color={colors.textPrimary}
                      style={styles.optionIcon}
                    />
                    <Text
                      style={[styles.optionText, { color: colors.textPrimary }]}
                    >
                      Edit Message
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.optionItem, { borderBottomWidth: 0 }]}
                    onPress={handleDeleteMessage}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color="#D32F2F"
                      style={styles.optionIcon}
                    />
                    <Text style={[styles.optionText, { color: "#D32F2F" }]}>
                      Delete
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* [MESSAGING-FIX] CHAT HEADER MENU */}
      <Modal visible={showChatMenu} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowChatMenu(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.optionsMenu, { backgroundColor: colors.surface }]}>
                <Pressable
                  style={[styles.optionItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setShowChatMenu(false);
                    setShowReportUserModal(true);
                  }}
                >
                  <Ionicons name="flag-outline" size={20} color={colors.textPrimary} style={styles.optionIcon} />
                  <Text style={[styles.optionText, { color: colors.textPrimary }]}>Report User</Text>
                </Pressable>
                <Pressable
                  style={[styles.optionItem, { borderBottomWidth: 0 }]}
                  onPress={() => {
                    setShowChatMenu(false);
                    setShowDeleteConversationModal(true);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#D32F2F" style={styles.optionIcon} />
                  <Text style={[styles.optionText, { color: "#D32F2F" }]}>Delete Conversation</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* [MESSAGING-FIX] REPORT USER MODAL */}
      <Modal visible={showReportUserModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowReportUserModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.deleteConversationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.reportIconWrapper}>
                  <Ionicons name="flag-outline" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.deleteConversationTitle, { color: colors.textPrimary }]}>Report {receiverName}</Text>
                <Text style={[styles.deleteConversationSub, { color: colors.textSecondary }]}>Admins will review this conversation.</Text>

                {REPORT_REASONS.map((reason) => {
                  const active = reportReason === reason;
                  return (
                    <Pressable
                      key={reason}
                      onPress={() => setReportReason(reason)}
                      style={[styles.reasonChoice, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + "14" : colors.background }]}
                    >
                      <Text style={[styles.reasonChoiceText, { color: active ? colors.primary : colors.textPrimary }]}>{reason}</Text>
                    </Pressable>
                  );
                })}

                <TextInput
                  style={[styles.reportDetailsInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background }]}
                  placeholder="Add details for the admin review"
                  placeholderTextColor={colors.textSecondary}
                  value={reportDetails}
                  onChangeText={setReportDetails}
                  multiline
                />

                <View style={styles.deleteConversationBtns}>
                  <Pressable style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setShowReportUserModal(false)}>
                    <Text style={[styles.modalBtnText, { color: colors.textPrimary }]}>Cancel</Text>
                  </Pressable>
                  <Pressable style={[styles.modalBtn, { backgroundColor: colors.primary, borderColor: colors.primary, opacity: submittingReport ? 0.6 : 1 }]} onPress={handleReportUser} disabled={submittingReport}>
                    <Text style={[styles.modalBtnText, { color: "#FFF" }]}>{submittingReport ? "Submitting..." : "Submit report"}</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showDeleteConversationModal}
        transparent
        animationType="fade"
      >
        <TouchableWithoutFeedback
          onPress={() => setShowDeleteConversationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.deleteConversationCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.deleteIconWrapper}>
                  <Ionicons name="trash-outline" size={28} color="#D32F2F" />
                </View>

                <Text
                  style={[
                    styles.deleteConversationTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  Delete Conversation
                </Text>
                <Text
                  style={[
                    styles.deleteConversationSub,
                    { color: colors.textSecondary },
                  ]}
                >
                  This conversation will be removed from your message list. {receiverName} can still see their copy.
                </Text>

                <View style={styles.deleteConversationBtns}>
                  <Pressable
                    style={[styles.modalBtn, { borderColor: colors.border }]}
                    onPress={() => setShowDeleteConversationModal(false)}
                  >
                    <Text
                      style={[
                        styles.modalBtnText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      Keep it
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.modalBtn,
                      { backgroundColor: "#D32F2F", borderColor: "#D32F2F" },
                    ]}
                    onPress={handleDeleteConversation}
                  >
                    <Text style={[styles.modalBtnText, { color: "#FFF" }]}>
                      Delete conversation
                    </Text>
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
  cleanHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0,
  },
  backBtn: { padding: 4 },
  optionsBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: "DMSans_700Bold" },
  chatList: { padding: 16, paddingBottom: 24 },
  messageRow: { marginBottom: 10, maxWidth: "80%" },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageText: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    lineHeight: 22,
  },
  messageTime: { fontSize: 11, fontFamily: "DMSans_400Regular", marginTop: 4 },

  inputWrapper: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 },
  editingBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    minHeight: 48,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontFamily: "DMSans_400Regular",
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    marginBottom: 2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionsMenu: { width: 250, borderRadius: 16, overflow: "hidden" },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  optionIcon: { marginRight: 16 },
  optionText: { fontSize: 16, fontFamily: "DMSans_400Regular" },
  deleteConversationCard: {
    width: "88%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  deleteConversationTitle: {
    fontSize: 20,
    fontFamily: "DMSerifDisplay_400Regular",
    marginBottom: 8,
    textAlign: "center",
  },
  deleteConversationSub: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    marginBottom: 12,
    textAlign: "center",
  },
  deleteConversationInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "DMSans_400Regular",
  },
  deleteConversationBtns: { marginTop: 14, gap: 10 },
  modalBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  deleteIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FDECEA",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalBtnText: { fontSize: 14, fontFamily: "DMSans_700Bold" },
  reportIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF3E8",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  reasonChoice: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  reasonChoiceText: { fontSize: 13, fontFamily: "DMSans_700Bold" },
  reportDetailsInput: {
    minHeight: 84,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "DMSans_400Regular",
    textAlignVertical: "top",
  },
});
