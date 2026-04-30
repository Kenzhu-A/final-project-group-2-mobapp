// [REPORTS] reusable report form — used in GeneralPostCard and PetDetailsScreen
import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, Pressable, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

const PET_REASONS = [
  'Misleading information',
  'Animal cruelty concern',
  'Spam / duplicate listing',
  'Inappropriate content',
  'Other',
];

const POST_REASONS = [
  'Spam',
  'Inappropriate content',
  'Harassment / bullying',
  'Misleading information',
  'Other',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  reportType: 'pet_post' | 'community_post';
  itemId: string;
  reporterId: string; // [REPORTS] passed from parent — avoids AsyncStorage read inside modal
}

export default function ReportModal({ visible, onClose, reportType, itemId, reporterId }: Props) {
  const { colors } = useTheme();
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = reportType === 'pet_post' ? PET_REASONS : POST_REASONS;
  const label = reportType === 'pet_post' ? 'Pet Listing' : 'Post';

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
        report_type: reportType,
        item_id: String(itemId),
        reporter_id: reporterId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });
      reset();
      onClose();
      Alert.alert(
        'Report Submitted',
        `Thank you. Our admin team will review this ${label.toLowerCase()} shortly.`,
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Report {label}</Text>
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

            <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Reason for report *</Text>

            {/* reason chips */}
            {reasons.map((r) => {
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
                { backgroundColor: selectedReason ? colors.accent : colors.border },
              ]}
              onPress={handleSubmit}
              disabled={submitting || !selectedReason}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.submitText}>Submit Report</Text>
              )}
            </Pressable>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontFamily: 'DMSans_700Bold' },
  body: { padding: 20, paddingBottom: 40 },
  banner: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 24 },
  bannerText: { flex: 1, fontSize: 12, fontFamily: 'DMSans_400Regular', color: '#F57C00', lineHeight: 17 },
  sectionLabel: { fontSize: 14, fontFamily: 'DMSans_700Bold', marginBottom: 12 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  reasonText: { fontSize: 14, fontFamily: 'DMSans_400Regular' },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 100, fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 20 },
  charCount: { fontSize: 11, fontFamily: 'DMSans_400Regular', alignSelf: 'flex-end', marginTop: 4 },
  submitBtn: { marginTop: 28, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#FFF', fontSize: 15, fontFamily: 'DMSans_700Bold' },
});
