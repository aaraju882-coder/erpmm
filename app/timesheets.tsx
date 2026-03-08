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
import { Stack } from 'expo-router';
import {
  Clock,
  Plus,
  Calendar,
  TrendingUp,
  DollarSign,
  X,
  Check,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { TimeEntry } from '@/types/erp';

export default function TimesheetsScreen() {
  const { timeEntries, employees, projects, addTimeEntry } = useERP();
  const [showModal, setShowModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('week');

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
  };

  const TimeEntryCard = ({ entry }: { entry: TimeEntry }) => {
    const employee = employees.find((e) => e.id === entry.employeeId);
    const project = entry.projectId ? projects.find((p) => p.id === entry.projectId) : null;
    const amount = entry.billable && entry.rate ? entry.hours * entry.rate : 0;

    return (
      <TouchableOpacity style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.timeIcon, { backgroundColor: entry.billable ? '#10b98115' : '#64748b15' }]}>
              <Clock color={entry.billable ? '#10b981' : '#64748b'} size={20} />
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.cardTitle}>{employee?.name || 'Unknown'}</Text>
              <Text style={styles.cardSubtitle}>{project?.name || entry.description}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: entry.billable ? '#10b981' : '#64748b' }]}>
            <Text style={styles.statusText}>{entry.billable ? 'BILLABLE' : 'NON-BILLABLE'}</Text>
          </View>
        </View>

        <Text style={styles.description}>{entry.description}</Text>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.cardFooterItem}>
            <Text style={styles.cardFooterLabel}>Date</Text>
            <Text style={styles.cardFooterValue}>{new Date(entry.date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.cardFooterItem}>
            <Text style={styles.cardFooterLabel}>Hours</Text>
            <Text style={styles.cardFooterValue}>{entry.hours}h</Text>
          </View>
          {entry.billable && entry.rate && (
            <View style={styles.cardFooterItem}>
              <Text style={styles.cardFooterLabel}>Amount</Text>
              <Text style={[styles.cardFooterValue, { color: '#10b981' }]}>{formatCurrency(amount)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const CreateTimeEntryModal = () => {
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [hours, setHours] = useState('');
    const [description, setDescription] = useState('');
    const [billable, setBillable] = useState(true);
    const [rate, setRate] = useState('');

    const handleCreate = () => {
      if (!selectedEmployee || !hours || !description) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        employeeId: selectedEmployee,
        date: new Date().toISOString(),
        hours: parseFloat(hours),
        description,
        billable,
        rate: rate ? parseFloat(rate) : undefined,
        status: 'submitted',
      };

      addTimeEntry(newEntry);
      setShowModal(false);
      Alert.alert('Success', 'Time entry added successfully');
      setSelectedEmployee('');
      setHours('');
      setDescription('');
      setRate('');
    };

    return (
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Time Entry</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Employee *</Text>
                {employees.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {employees.map((employee) => (
                      <TouchableOpacity
                        key={employee.id}
                        style={[
                          styles.employeeChip,
                          selectedEmployee === employee.id && styles.employeeChipSelected,
                        ]}
                        onPress={() => setSelectedEmployee(employee.id)}
                      >
                        <Text
                          style={[
                            styles.employeeChipText,
                            selectedEmployee === employee.id && styles.employeeChipTextSelected,
                          ]}
                        >
                          {employee.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.noDataText}>No employees available</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Hours *</Text>
                <TextInput
                  style={styles.input}
                  value={hours}
                  onChangeText={setHours}
                  placeholder="8"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Work description..."
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.billableRow}>
                  <Text style={styles.label}>Billable</Text>
                  <TouchableOpacity
                    style={[styles.toggle, billable && styles.toggleActive]}
                    onPress={() => setBillable(!billable)}
                  >
                    <View style={[styles.toggleCircle, billable && styles.toggleCircleActive]} />
                  </TouchableOpacity>
                </View>
              </View>

              {billable && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Hourly Rate</Text>
                  <TextInput
                    style={styles.input}
                    value={rate}
                    onChangeText={setRate}
                    placeholder="50"
                    keyboardType="decimal-pad"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              )}

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
                <Check color="#ffffff" size={20} />
                <Text style={styles.submitButtonText}>Add Time Entry</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);
  const billableHours = timeEntries.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0);
  const totalRevenue = timeEntries
    .filter((e) => e.billable && e.rate)
    .reduce((sum, e) => sum + e.hours * (e.rate || 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Timesheets',
          headerBackTitle: 'Back',
        }}
      />

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Clock color="#2563eb" size={20} />
          <Text style={styles.statValue}>{totalHours}h</Text>
          <Text style={styles.statLabel}>Total Hours</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp color="#10b981" size={20} />
          <Text style={styles.statValue}>{billableHours}h</Text>
          <Text style={styles.statLabel}>Billable</Text>
        </View>
        <View style={styles.statCard}>
          <DollarSign color="#8b5cf6" size={20} />
          <Text style={[styles.statValue, { fontSize: 14 }]}>{formatCurrency(totalRevenue)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['week', 'month', 'year'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.filterChip, selectedPeriod === period && styles.filterChipActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[styles.filterChipText, selectedPeriod === period && styles.filterChipTextActive]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {timeEntries.length > 0 ? (
          timeEntries.map((entry) => <TimeEntryCard key={entry.id} entry={entry} />)
        ) : (
          <View style={styles.emptyState}>
            <Clock color="#cbd5e1" size={48} />
            <Text style={styles.emptyStateText}>No time entries</Text>
            <Text style={styles.emptyStateSubtext}>Add your first time entry to start tracking</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Plus color="#ffffff" size={28} />
      </TouchableOpacity>

      <CreateTimeEntryModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  cardFooterItem: {
    flex: 1,
  },
  cardFooterLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  cardFooterValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#0f172a',
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
    flex: 1,
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
  employeeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  employeeChipSelected: {
    backgroundColor: '#2563eb',
  },
  employeeChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  employeeChipTextSelected: {
    color: '#ffffff',
  },
  noDataText: {
    fontSize: 14,
    color: '#94a3b8',
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  billableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#2563eb',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
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
