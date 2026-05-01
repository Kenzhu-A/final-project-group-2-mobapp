// [CHAT-MENU] report user form — used in ChatScreen for reporting conversation users
import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, Pressable, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

const USER_REPORT_REASONS = [
  'Harassment / bullying',
  'Inappropriate behavior',
  'Spam messages',
  'Scam / fraud',
  'Other',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  reporterId: string;
}

export default function ReportUserModal({ visible, onClose, reportedUserId, reportedUserName, reporterId }: Props) {
  const { colors } = useTheme();
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setSelectedReason('');
    setDescription('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Select a reason', 'Please choose a reason before submitting.');
      return;
    }
    if (!reporterId) {
      Alert.alert('Not logged in', 'Please log in to submit a report.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createReport({
        report_type: 'user',
        item_id: reportedUserId,
        reporter_id: reporterId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });
      reset();
      onClose();
      Alert.alert(
        'Report Submitted',
        'Thank you. Our admin team will review this report shortly.',
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* header */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <Pressable onPress={handleClose} style={{ padding: 4 }}>
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Report User</Text>
          <View style={{ width: 34 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

            {/* banner */}
            <View style={[styles.banner, { backgroundColor: '#FFF3E0', borderColor: '#FFCC80' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#F57C00" style={{ marginRight: 10 }} />
              <Text style={styles.bannerText}>
                Reports are reviewed by our admin team. False reports may result in account action.
              </Text>
            </View>

            <Text style={[styles.userInfo, { color: colors.textSecondary }]}>
              Reporting <Text style={{ color: colors.textPrimary, fontFamily: 'DMSans_700Bold' }}>{reportedUserName}</Text>
            </Text>

            <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Reason for report *</Text>

            {/* reason chips */}
            {USER_REPORT_REASONS.map((r) => {
              const active = selectedReason === r;
              return (
                <Pressable
                  key={r}
                  style={[
                    styles.reasonRow,
                    { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accent + '12' : colors.surface },
                  ]}
                  onPress={() => setSelectedReason(r)}
                >
                  <View style={[styles.radio, { borderColor: active ? colors.accent : colors.border }]}>
                    {active && <View style={[styles.radioDot, { backgroundColor: colors.accent }]} />}
                  </View>
                  <Text style={[styles.reasonText, { color: colors.textPrimary }]}>{r}</Text>
                </Pressable>
              );
            })}

            {/* optional description */}
            <Text style={[styles.sectionLabel, { color: colors.textPrimary, marginTop: 20 }]}>
              Additional details <Text style={{ color: colors.textSecondary, fontFamily: 'DMSans_400Regular' }}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Describe the issue in more detail..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={300}
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>{description.length}/300</Text>

            {/* submit */}
            <Pressable
              style={[
                styles.submitBtn,
                {
                  backgroundColor: submitting ? colors.border : colors.primary,
                  opacity: submitting ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Report</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold' },
  body: { paddingHorizontal: 20, paddingVertical: 20 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: '#5D4037',
    lineHeight: 16,
  },
  userInfo: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionLabel: { fontSize: 13, fontFamily: 'DMSans_700Bold', marginBottom: 12 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  reasonText: { fontSize: 14, fontFamily: 'DMSans_400Regular' },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 100,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
  },
  charCount: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 4, textAlign: 'right' },
  submitBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: { color: '#FFF', fontSize: 15, fontFamily: 'DMSans_700Bold' },
});
