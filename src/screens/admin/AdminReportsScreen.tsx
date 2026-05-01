// [USER-REPORT-MODERATION] admin reports screen — review content reports and user chat reports
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { api } from "../../services/api";
import { ScrollView } from "react-native";

type FilterTab = "All" | "Pet Listing" | "Community Post" | "User Report";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function AdminReportsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("All");

  const load = useCallback(async () => {
    try {
      const data = await api.getAdminReports();
      setReports(data || []);
    } catch (e) {
      console.error("[ADMIN-REPORTS] load failed", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const displayed = reports.filter((r) => {
    if (filter === "Pet Listing") return r.report_type === "pet_post";
    if (filter === "Community Post") return r.report_type === "community_post";
    if (filter === "User Report") return r.report_type === "user";
    return true;
  });

  const countFor = (f: FilterTab) => {
    if (f === "All") return reports.length;
    if (f === "Pet Listing")
      return reports.filter((r) => r.report_type === "pet_post").length;
    if (f === "Community Post")
      return reports.filter((r) => r.report_type === "community_post").length;
    return reports.filter((r) => r.report_type === "user").length;
  };

  const handleDismiss = (report: any) => {
    Alert.alert(
      "Dismiss Report",
      "Mark this report as reviewed and remove it without deleting the content?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Dismiss",
          onPress: async () => {
            try {
              await api.dismissReport(report.id);
              setReports((prev) => prev.filter((r) => r.id !== report.id));
            } catch (e: any) {
              Alert.alert("Error", e.message || "Could not dismiss report.");
            }
          },
        },
      ],
    );
  };

  const handleDeleteContent = (report: any) => {
    const label =
      report.report_type === "pet_post" ? "pet listing" : "community post";
    Alert.alert(
      "Delete Reported Content",
      `This will permanently delete the reported ${label} and remove this report. This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Content",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteReportedContent(report.id);
              setReports((prev) => prev.filter((r) => r.id !== report.id));
            } catch (e: any) {
              Alert.alert("Error", e.message || "Could not delete content.");
            }
          },
        },
      ],
    );
  };

  const handleReviewConversation = (report: any) => {
    // [USER-REPORT-MODERATION] User reports should be reviewed in the exact reporter/reported thread before deletion.
    navigation.navigate("AdminMessageThreadScreen", {
      user1: report.reporter_id,
      user1Name:
        report.reporter?.full_name || report.reporter?.email || "Reporter",
      user2: report.item_id,
      user2Name:
        report.reported_user?.full_name ||
        report.reported_user?.email ||
        "Reported User",
      reportId: report.id,
    });
  };

  const typeLabel = (type: string) => {
    if (type === "pet_post") return "Pet Listing";
    if (type === "user") return "User Report";
    return "Community Post";
  };

  const typeColor = (type: string) => {
    if (type === "pet_post") return "#F57C00";
    if (type === "user") return "#7B1FA2";
    return "#1976D2";
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      {/* header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border, paddingTop: insets.top + 8 },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ padding: 4, marginRight: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Reports
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {reports.length} pending review
          </Text>
        </View>
      </View>

      {/* filter tabs */}
      <View style={[styles.tabWrapper, { borderBottomColor: colors.border }]}>
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.tabRowContent}
  >
    {(['All', 'Pet Listing', 'Community Post', 'User Report'] as FilterTab[]).map((f) => {
      const active = filter === f;
      return (
        <Pressable
          key={f}
          style={[styles.tab, active && { borderBottomColor: colors.accent }]}
          onPress={() => setFilter(f)}
        >
          <Text style={[styles.tabText, { color: active ? colors.accent : colors.textSecondary }]}>
            {f}
          </Text>
          <Text style={[styles.tabCount, { color: active ? colors.accent : colors.textSecondary, opacity: active ? 1 : 0.6 }]}>
            {countFor(f)}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
</View>
      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="checkmark-circle-outline"
                size={56}
                color={colors.border}
              />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No reports here.
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                All content is clean!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {/* reporter row */}
              <View style={styles.reporterRow}>
                <Image
                  source={
                    item.reporter?.avatar_url
                      ? { uri: item.reporter.avatar_url }
                      : require("../../../assets/adaptive-icon.png")
                  }
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.reporterName, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.reporter?.full_name ||
                      item.reporter?.email ||
                      "Unknown user"}
                  </Text>
                  <Text
                    style={[
                      styles.reporterTime,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {timeAgo(item.created_at)}
                  </Text>
                </View>
                {/* type badge */}
                <View
                  style={[
                    styles.typeBadge,
                    {
                      backgroundColor: typeColor(item.report_type) + "18",
                      borderColor: typeColor(item.report_type) + "40",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBadgeText,
                      { color: typeColor(item.report_type) },
                    ]}
                  >
                    {typeLabel(item.report_type)}
                  </Text>
                </View>
              </View>

              {/* reason */}
              <View
                style={[
                  styles.reasonBox,
                  { backgroundColor: colors.background },
                ]}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={15}
                  color={colors.accent}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[styles.reasonText, { color: colors.textPrimary }]}
                >
                  {item.reason}
                </Text>
              </View>

              {/* optional description */}
              {!!item.description && (
                <Text
                  style={[styles.descText, { color: colors.textSecondary }]}
                  numberOfLines={3}
                >
                  "{item.description}"
                </Text>
              )}

              {/* [USER-REPORT-MODERATION] show who was reported before opening the thread */}
              {item.report_type === "user" && (
                <View
                  style={[
                    styles.reportedUserBox,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={16}
                    color={typeColor(item.report_type)}
                  />
                  <Text
                    style={[
                      styles.reportedUserText,
                      { color: colors.textPrimary },
                    ]}
                    numberOfLines={1}
                  >
                    Reported:{" "}
                    {item.reported_user?.full_name ||
                      item.reported_user?.email ||
                      "Unknown user"}
                  </Text>
                </View>
              )}

              {/* actions */}
              <View style={styles.actionRow}>
                <Pressable
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      flex: 1,
                    },
                  ]}
                  onPress={() => handleDismiss(item)}
                >
                  <Ionicons
                    name="checkmark-outline"
                    size={15}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Dismiss
                  </Text>
                </Pressable>
                {item.report_type === "user" ? (
                  <Pressable
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: typeColor(item.report_type) + "12",
                        borderColor: typeColor(item.report_type) + "40",
                        flex: 1,
                      },
                    ]}
                    onPress={() => handleReviewConversation(item)}
                  >
                    <Ionicons
                      name="chatbubbles-outline"
                      size={15}
                      color={typeColor(item.report_type)}
                    />
                    <Text
                      style={[
                        styles.actionBtnText,
                        { color: typeColor(item.report_type) },
                      ]}
                    >
                      Review Conversation
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: "#FDECEA",
                        borderColor: "#FFCDD2",
                        flex: 1,
                      },
                    ]}
                    onPress={() => handleDeleteContent(item)}
                  >
                    <Ionicons name="trash-outline" size={15} color="#D32F2F" />
                    <Text style={[styles.actionBtnText, { color: "#D32F2F" }]}>
                      Delete Content
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontFamily: "DMSans_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 1 },
    tabWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth, // single source of truth for the divider
  },
  tabRowContent: { paddingHorizontal: 4 },
  tab: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2, // ✅ always reserve the space
    borderBottomColor: "transparent", // ✅ invisible when inactive
  },
  tabText: {
    fontSize: 13,
    fontFamily: "DMSans_700Bold",
    textAlign: "center",
  },
  tabCount: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 14, padding: 14 },
  reporterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  reporterName: { fontSize: 13, fontFamily: "DMSans_700Bold" },
  reporterTime: { fontSize: 11, fontFamily: "DMSans_400Regular" },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeBadgeText: { fontSize: 10, fontFamily: "DMSans_700Bold" },
  reasonBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  reasonText: { fontSize: 13, fontFamily: "DMSans_700Bold", flex: 1 },
  descText: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    lineHeight: 17,
    fontStyle: "italic",
    marginBottom: 10,
    color: "#666",
  },
  reportedUserBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  reportedUserText: { flex: 1, fontSize: 12, fontFamily: "DMSans_700Bold" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontFamily: "DMSans_700Bold" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyTitle: {
    fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 18,
    marginTop: 12,
  },
  emptySub: { fontFamily: "DMSans_400Regular", fontSize: 13, marginTop: 6 },
});
