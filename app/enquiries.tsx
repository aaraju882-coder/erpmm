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
import { Plus, Search, X, Check, MessageSquare, ChevronLeft } from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { Enquiry, EnquiryFollowUp } from '@/types/erp';

const STATUS_COLORS = {
  new: '#3b82f6',
  open: '#06b6d4',
  'in-progress': '#f59e0b',
  resolved: '#10b981',
  closed: '#64748b',
};

export default function EnquiriesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<string>('');
  const { enquiries, enquiryFollowUps, customers, addEnquiry, updateEnquiry, addEnquiryFollowUp } = useERP();

  const EnquiryCard = ({ enquiry }: { enquiry: Enquiry }) => {
    const customer = customers.find((c) => c.id === enquiry.customerId);
    const followUps = enquiryFollowUps.filter((f) => f.enquiryId === enquiry.id);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          Alert.alert(
            enquiry.subject,
            `Status: ${enquiry.status}\nPriority: ${enquiry.priority}`,
            [
              {
                text: 'Add Follow-up',
                onPress: () => {
                  setSelectedEnquiry(enquiry.id);
                  setShowFollowUpModal(true);
                },
              },
              {
                text: 'Mark as Resolved',
                onPress: () => updateEnquiry(enquiry.id, { status: 'resolved' }),
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.priorityIndicator,
                {
                  backgroundColor:
                    enquiry.priority === 'high'
                      ? '#ef4444'
                      : enquiry.priority === 'medium'
                      ? '#f59e0b'
                      : '#10b981',
                },
              ]}
            />
            <View style={styles.enquiryInfo}>
              <Text style={styles.enquirySubject}>{enquiry.subject}</Text>
              <Text style={styles.customerName}>{customer?.name || 'Unknown Customer'}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[enquiry.status] + '15' },
            ]}
          >
            <Text style={[styles.statusText, { color: STATUS_COLORS[enquiry.status] }]}>
              {enquiry.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {enquiry.description}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {followUps.length} follow-up{followUps.length !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.footerText}>
            {new Date(enquiry.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const CreateEnquiryModal = () => {
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [selectedCustomer, setSelectedCustomer] = useState('');

    const handleCreate = () => {
      if (!subject || !description || !selectedCustomer) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const newEnquiry: Enquiry = {
        id: Date.now().toString(),
        customerId: selectedCustomer,
        subject,
        description,
        status: 'new',
        priority,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addEnquiry(newEnquiry);
      setShowModal(false);
      Alert.alert('Success', 'Enquiry created successfully');
      setSubject('');
      setDescription('');
      setSelectedCustomer('');
    };

    return (
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Enquiry</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Customer *</Text>
                {customers.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {customers.map((customer) => (
                      <TouchableOpacity
                        key={customer.id}
                        style={[
                          styles.chip,
                          selectedCustomer === customer.id && styles.chipSelected,
                        ]}
                        onPress={() => setSelectedCustomer(customer.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selectedCustomer === customer.id && styles.chipTextSelected,
                          ]}
                        >
                          {customer.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.noDataText}>No customers. Add one in CRM module.</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Subject *</Text>
                <TextInput
                  style={styles.input}
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Enquiry subject"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Detailed description..."
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Priority</Text>
                <View style={styles.priorityContainer}>
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.priorityChip, priority === p && styles.priorityChipSelected]}
                      onPress={() => setPriority(p)}
                    >
                      <Text
                        style={[
                          styles.priorityChipText,
                          priority === p && styles.priorityChipTextSelected,
                        ]}
                      >
                        {p.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
                <Check color="#ffffff" size={20} />
                <Text style={styles.submitButtonText}>Create Enquiry</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const FollowUpModal = () => {
    const [notes, setNotes] = useState('');

    const handleAdd = () => {
      if (!notes) {
        Alert.alert('Error', 'Please enter follow-up notes');
        return;
      }

      const followUp: EnquiryFollowUp = {
        id: Date.now().toString(),
        enquiryId: selectedEnquiry,
        notes,
        date: new Date().toISOString(),
        createdBy: 'Admin',
      };

      addEnquiryFollowUp(followUp);
      updateEnquiry(selectedEnquiry, { status: 'in-progress', updatedAt: new Date().toISOString() });
      setShowFollowUpModal(false);
      setNotes('');
      Alert.alert('Success', 'Follow-up added');
    };

    return (
      <Modal visible={showFollowUpModal} animationType="slide" transparent onRequestClose={() => setShowFollowUpModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Follow-up</Text>
              <TouchableOpacity onPress={() => setShowFollowUpModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Follow-up notes..."
                multiline
                numberOfLines={4}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleAdd}>
              <Check color="#ffffff" size={20} />
              <Text style={styles.submitButtonText}>Add Follow-up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Enquiries',
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
          placeholder="Search enquiries..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {enquiries.length > 0 ? (
          enquiries
            .filter((e) => e.subject.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((enquiry) => <EnquiryCard key={enquiry.id} enquiry={enquiry} />)
        ) : (
          <View style={styles.emptyState}>
            <MessageSquare color="#cbd5e1" size={48} />
            <Text style={styles.emptyStateText}>No enquiries yet</Text>
            <Text style={styles.emptyStateSubtext}>Customer enquiries will appear here</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Plus color="#ffffff" size={28} />
      </TouchableOpacity>

      <CreateEnquiryModal />
      <FollowUpModal />
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
    flex: 1,
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  enquiryInfo: {
    flex: 1,
  },
  enquirySubject: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#64748b',
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
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
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
    height: 100,
    textAlignVertical: 'top',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#2563eb',
  },
  chipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  priorityChipSelected: {
    backgroundColor: '#2563eb',
  },
  priorityChipText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#64748b',
  },
  priorityChipTextSelected: {
    color: '#ffffff',
  },
  noDataText: {
    fontSize: 14,
    color: '#94a3b8',
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
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
