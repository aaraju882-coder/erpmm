import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Plus, Search, X, Check, Bell, Calendar, ChevronLeft } from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { Reminder } from '@/types/erp';

const TYPE_COLORS = {
  meeting: '#3b82f6',
  task: '#8b5cf6',
  call: '#06b6d4',
  payment: '#f59e0b',
  other: '#64748b',
};

export default function RemindersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { reminders, addReminder, updateReminder } = useERP();

  const ReminderCard = ({ reminder }: { reminder: Reminder }) => {
    const isPast = new Date(`${reminder.date}T${reminder.time}`) < new Date();

    return (
      <TouchableOpacity
        style={[styles.card, reminder.status === 'completed' && styles.cardCompleted]}
        onPress={() => {
          if (reminder.status === 'active') {
            Alert.alert('Mark as Completed?', reminder.title, [
              {
                text: 'Complete',
                onPress: () => updateReminder(reminder.id, { status: 'completed' }),
              },
              {
                text: 'Cancel',
                onPress: () => updateReminder(reminder.id, { status: 'cancelled' }),
              },
              { text: 'Close', style: 'cancel' },
            ]);
          }
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.typeIcon,
                { backgroundColor: TYPE_COLORS[reminder.type] + '15' },
              ]}
            >
              <Bell color={TYPE_COLORS[reminder.type]} size={20} />
            </View>
            <View style={styles.reminderInfo}>
              <Text style={styles.reminderTitle}>{reminder.title}</Text>
              {reminder.description && (
                <Text style={styles.reminderDescription} numberOfLines={2}>
                  {reminder.description}
                </Text>
              )}
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  reminder.status === 'active'
                    ? isPast
                      ? '#ef444415'
                      : '#10b98115'
                    : '#64748b15',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    reminder.status === 'active'
                      ? isPast
                        ? '#ef4444'
                        : '#10b981'
                      : '#64748b',
                },
              ]}
            >
              {reminder.status === 'active'
                ? isPast
                  ? 'OVERDUE'
                  : 'ACTIVE'
                : reminder.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.reminderFooter}>
          <View style={styles.dateTimeContainer}>
            <Calendar color="#64748b" size={16} />
            <Text style={styles.dateTimeText}>
              {new Date(reminder.date).toLocaleDateString()} at {reminder.time}
            </Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{reminder.type}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const CreateReminderModal = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'meeting' | 'task' | 'call' | 'payment' | 'other'>('meeting');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('09:00');

    const handleCreate = () => {
      if (!title || !date || !time) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const newReminder: Reminder = {
        id: Date.now().toString(),
        title,
        description,
        date,
        time,
        type,
        status: 'active',
      };

      addReminder(newReminder);
      setShowModal(false);
      Alert.alert('Success', 'Reminder created successfully');
      setTitle('');
      setDescription('');
      setType('meeting');
    };

    return (
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Reminder</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Meeting with client"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Additional details..."
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.typeContainer}>
                  {(['meeting', 'task', 'call', 'payment', 'other'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeChip,
                        { borderColor: TYPE_COLORS[t] },
                        type === t && { backgroundColor: TYPE_COLORS[t] },
                      ]}
                      onPress={() => setType(t)}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          { color: type === t ? '#ffffff' : TYPE_COLORS[t] },
                        ]}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Time *</Text>
                <TextInput
                  style={styles.input}
                  value={time}
                  onChangeText={setTime}
                  placeholder="HH:MM"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
                <Check color="#ffffff" size={20} />
                <Text style={styles.submitButtonText}>Create Reminder</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const activeReminders = reminders.filter((r) => r.status === 'active');
  const completedReminders = reminders.filter((r) => r.status === 'completed');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Reminders',
          headerBackTitle: 'Back',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft color="#0f172a" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.searchContainer}>
        <Search color="#64748b" size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search reminders..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeReminders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Reminders</Text>
            {activeReminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))}
          </View>
        )}

        {completedReminders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed</Text>
            {completedReminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))}
          </View>
        )}

        {reminders.length === 0 && (
          <View style={styles.emptyState}>
            <Bell color="#cbd5e1" size={48} />
            <Text style={styles.emptyStateText}>No reminders yet</Text>
            <Text style={styles.emptyStateSubtext}>Create your first reminder</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Plus color="#ffffff" size={28} />
      </TouchableOpacity>

      <CreateReminderModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backButton: {
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCompleted: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  reminderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  typeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
