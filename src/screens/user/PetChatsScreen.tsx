import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { io, Socket } from "socket.io-client";
import { useTheme } from "../../context/ThemeContext";
import { api, BASE_URL } from "../../services/api";

const CHAT_READ_KEY = "snoutscout_chat_read_map";
const SOCKET_URL = BASE_URL.replace("/api", "");

export default function PetChatsScreen({ navigation, onChatEnter }: any) {
  const { colors } = useTheme();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [readMap, setReadMap] = useState<Record<string, string>>({});
  const socketRef = useRef<Socket | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([
        AsyncStorage.getItem("userId"),
        AsyncStorage.getItem(CHAT_READ_KEY),
      ]).then(([id, rawReadMap]) => {
        setCurrentUserId(id);
        setReadMap(rawReadMap ? JSON.parse(rawReadMap) : {});
        if (id) {
          api
            .getConversations(id)
            .then(setConversations)
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });
    }, []),
  );

  // Keep conversations list up-to-date in real-time
  useEffect(() => {
    if (!currentUserId) return;

    // Disconnect previous socket if it exists (e.g., user switched accounts)
    socketRef.current?.disconnect();

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.emit("register", currentUserId);

    socket.on("receive_message", (newMessage: any) => {
      // newMessage shape from backend: { id, sender_id, receiver_id, text, created_at, ... }
      const partnerId =
        newMessage.sender_id === currentUserId
          ? newMessage.receiver_id
          : newMessage.sender_id;

      setConversations((prev) => {
        const next = [...prev];
        const idx = next.findIndex((c) => c.partnerId === partnerId);
        const updated = {
          ...(idx >= 0 ? next[idx] : { partnerId }),
          latestMessage: newMessage.text,
          createdAt: newMessage.created_at,
        };

        // If we don't have a conversation entry yet, refresh from server to get name/avatar.
        if (idx < 0) {
          api
            .getConversations(currentUserId)
            .then(setConversations)
            .catch(() => {});
          return prev;
        }

        next.splice(idx, 1);
        return [updated, ...next];
      });

      // If message is from someone else, mark this conversation as read so it doesn't show unread
      if (newMessage.sender_id !== currentUserId) {
        const markAsRead = async () => {
          const readRaw = await AsyncStorage.getItem(CHAT_READ_KEY);
          const readMap = readRaw ? JSON.parse(readRaw) : {};
          readMap[partnerId] = new Date().toISOString();
          await AsyncStorage.setItem(CHAT_READ_KEY, JSON.stringify(readMap));
          setReadMap(readMap);
        };
        markAsRead().catch(() => {});
      }
    });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [currentUserId]);

  const withUnreadMeta = useMemo(
    () =>
      conversations.map((item) => {
        const latestTs = item.createdAt || item.created_at;
        const readTs = readMap[item.partnerId];
        const isUnread =
          !readTs || new Date(latestTs).getTime() > new Date(readTs).getTime();
        return { ...item, isUnread };
      }),
    [conversations, readMap],
  );

  const filteredConversations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return withUnreadMeta.filter((item) => {
      const matchesKeyword =
        !keyword ||
        (item.partnerName || "").toLowerCase().includes(keyword) ||
        (item.latestMessage || "").toLowerCase().includes(keyword);
      if (!matchesKeyword) return false;
      if (activeTab === "unread") return item.isUnread;
      return true;
    });
  }, [withUnreadMeta, search, activeTab]);

  const unreadCount = withUnreadMeta.filter((c) => c.isUnread).length;

  const markConversationRead = async (partnerId: string) => {
    const next = { ...readMap, [partnerId]: new Date().toISOString() };
    setReadMap(next);
    await AsyncStorage.setItem(CHAT_READ_KEY, JSON.stringify(next));
  };

  const formatListTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay)
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Messages
        </Text>
        <View style={{ flexDirection: "row" }}>
          <Pressable
            style={{ marginRight: 16 }}
            onPress={() => navigation.navigate("ChatNotifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={26}
              color={colors.textPrimary}
            />
          </Pressable>
          <Pressable onPress={() => navigation.navigate("AddNewUsersMessages")}>
            <Ionicons
              name="add-circle-outline"
              size={26}
              color={colors.primary}
            />
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.searchWrap,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={16}
          color={colors.textSecondary}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search conversations..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.tabRow}>
        {[
          { key: "all", label: "All", count: withUnreadMeta.length },
          { key: "unread", label: "Unread", count: unreadCount },
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key as "all" | "unread")}
              style={[
                styles.tabPill,
                {
                  backgroundColor: active
                    ? colors.primary + "20"
                    : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: active ? colors.primary : colors.textSecondary },
                ]}
              >
                {`${tab.label}${tab.key !== "all" ? ` (${tab.count})` : ""}`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.partnerId}
          contentContainerStyle={{
            paddingBottom: 110,
            paddingHorizontal: 16,
            paddingTop: 10,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Ionicons
                name="chatbubbles-outline"
                size={60}
                color={colors.border}
              />
              <Text
                style={{
                  color: colors.textSecondary,
                  marginTop: 12,
                  fontFamily: "DMSans_400Regular",
                }}
              >
                {search || activeTab !== "all"
                  ? "No conversations match your filter."
                  : "No messages yet. Tap + to start a chat!"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.conversationCard,
                { borderBottomColor: colors.border },
              ]}
              onPress={async () => {
                await markConversationRead(item.partnerId);
                navigation.navigate("ChatScreen", {
                  receiverId: item.partnerId,
                  receiverName: item.partnerName,
                  senderId: currentUserId,
                  onChatEnter, // [MESSAGE-BADGE] pass callback
                });
              }}
            >
              <Image
                source={
                  item.partnerAvatar
                    ? { uri: item.partnerAvatar }
                    : require("../../../assets/adaptive-icon.png")
                }
                style={styles.convoAvatar}
              />
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={[styles.userName, { color: colors.textPrimary }]}
                  >
                    {item.partnerName}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {formatListTime(item.createdAt)}
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    fontFamily: "DMSans_400Regular",
                  }}
                  numberOfLines={1}
                >
                  {item.latestMessage}
                </Text>
              </View>
              {item.isUnread ? (
                <View
                  style={[
                    styles.unreadDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
              ) : null}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerTitle: { fontSize: 28, fontFamily: "DMSerifDisplay_400Regular" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  tabPill: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tabText: { fontSize: 13, fontFamily: "DMSans_700Bold" },
  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  convoAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    backgroundColor: "#E9ECEF",
  },
  userName: { fontSize: 16, fontFamily: "DMSans_700Bold" },
  unreadDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
});
