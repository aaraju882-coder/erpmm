import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  Building,
  Plus,
  X,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
  CreditCard,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';


const SUB_STATUS: Record<string, { color: string; bg: string; label: string }> = {
  'trial': { color: '#f59e0b', bg: '#fef3c7', label: 'Trial' },
  'active': { color: '#10b981', bg: '#d1fae5', label: 'Active' },
  'suspended': { color: '#ef4444', bg: '#fee2e2', label: 'Suspended' },
  'cancelled': { color: '#64748b', bg: '#f1f5f9', label: 'Cancelled' },
};

export default function CompanyScreen() {
  const { currentUser, companies, createCompany } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
  });

  const handleAdd = async () => {
    if (!form.name || !form.email) {
      Alert.alert('Error', 'Please fill company name and email');
      return;
    }
    const result = await createCompany({
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      taxId: form.taxId,
      adminUserId: currentUser?.id || '',
      subscriptionStatus: 'trial',
    });
    if (result.success) {
      Alert.alert('Success', result.message);
      setShowAddModal(false);
      setForm({ name: '', email: '', phone: '', address: '', taxId: '' });
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const isSuperUser = currentUser?.role === 'superuser';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Company Profile' }} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {companies.length === 0 ? (
          <View style={styles.emptyState}>
            <Building color="#cbd5e1" size={56} />
            <Text style={styles.emptyTitle}>No Company</Text>
            <Text style={styles.emptySubtitle}>Set up your company profile</Text>
            {isSuperUser && (
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddModal(true)}>
                <Plus color="#fff" size={18} />
                <Text style={styles.emptyBtnText}>Create Company</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          companies.map((company) => {
            const subInfo = SUB_STATUS[company.subscriptionStatus] || SUB_STATUS['trial'];
            return (
              <View key={company.id} style={styles.companyCard}>
                <View style={styles.companyHeader}>
                  <View style={styles.companyAvatar}>
                    <Building color="#3b82f6" size={28} />
                  </View>
                  <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{company.name}</Text>
                    <View style={[styles.subBadge, { backgroundColor: subInfo.bg }]}>
                      <Text style={[styles.subText, { color: subInfo.color }]}>{subInfo.label}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Mail color="#64748b" size={16} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Email</Text>
                      <Text style={styles.detailValue}>{company.email}</Text>
                    </View>
                  </View>

                  {company.phone && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIcon}>
                        <Phone color="#64748b" size={16} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Phone</Text>
                        <Text style={styles.detailValue}>{company.phone}</Text>
                      </View>
                    </View>
                  )}

                  {company.address && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIcon}>
                        <MapPin color="#64748b" size={16} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Address</Text>
                        <Text style={styles.detailValue}>{company.address}</Text>
                      </View>
                    </View>
                  )}

                  {company.taxId && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIcon}>
                        <Shield color="#64748b" size={16} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Tax ID</Text>
                        <Text style={styles.detailValue}>{company.taxId}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Calendar color="#64748b" size={16} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Created</Text>
                      <Text style={styles.detailValue}>{new Date(company.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <CreditCard color="#64748b" size={16} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Subscription</Text>
                      <Text style={styles.detailValue}>{company.subscriptionStatus.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {companies.length > 0 && isSuperUser && (
          <TouchableOpacity style={styles.addMoreBtn} onPress={() => setShowAddModal(true)}>
            <Plus color="#3b82f6" size={18} />
            <Text style={styles.addMoreText}>Add Another Company</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Company</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><X color="#64748b" size={24} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fLabel}>Company Name *</Text>
              <TextInput style={styles.input} placeholder="Enter company name" placeholderTextColor="#94a3b8" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />

              <Text style={styles.fLabel}>Email *</Text>
              <TextInput style={styles.input} placeholder="company@example.com" placeholderTextColor="#94a3b8" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />

              <Text style={styles.fLabel}>Phone</Text>
              <TextInput style={styles.input} placeholder="Phone number" placeholderTextColor="#94a3b8" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />

              <Text style={styles.fLabel}>Address</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Company address" placeholderTextColor="#94a3b8" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} multiline />

              <Text style={styles.fLabel}>Tax ID</Text>
              <TextInput style={styles.input} placeholder="Tax registration number" placeholderTextColor="#94a3b8" value={form.taxId} onChangeText={(v) => setForm({ ...form, taxId: v })} />

              <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
                <Text style={styles.submitText}>Create Company</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, color: '#334155', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
  emptyBtnText: { fontSize: 15, fontWeight: '600' as const, color: '#fff' },
  companyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  companyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  companyAvatar: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  companyInfo: { flex: 1 },
  companyName: { fontSize: 20, fontWeight: '800' as const, color: '#0f172a' },
  subBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  subText: { fontSize: 12, fontWeight: '600' as const },
  detailSection: { gap: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 1 },
  detailValue: { fontSize: 14, fontWeight: '600' as const, color: '#0f172a' },
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  addMoreText: { fontSize: 14, fontWeight: '600' as const, color: '#3b82f6' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, color: '#0f172a' },
  fLabel: { fontSize: 13, fontWeight: '600' as const, color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 14, height: 46, fontSize: 15, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' as const },
  submitBtn: { backgroundColor: '#3b82f6', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 20 },
  submitText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
});
