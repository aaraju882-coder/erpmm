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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  Percent,
  Plus,
  Search,
  X,
  User,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { Commission } from '@/types/erp';

const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
  'pending': { color: '#f59e0b', bg: '#fef3c7', label: 'Pending' },
  'approved': { color: '#3b82f6', bg: '#dbeafe', label: 'Approved' },
  'paid': { color: '#10b981', bg: '#d1fae5', label: 'Paid' },
};

export default function CommissionsScreen() {
  const { commissions, addCommission, employees } = useERP();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const [form, setForm] = useState({
    salesPersonId: '',
    transactionId: '',
    transactionType: 'invoice' as Commission['transactionType'],
    amount: '',
    rate: '',
  });

  const filtered = commissions.filter((c) => {
    const emp = employees.find((e) => e.id === c.salesPersonId);
    const matchSearch =
      (emp?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.transactionId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPending = commissions.filter((c) => c.status === 'pending').reduce((s, c) => s + c.commissionAmount, 0);
  const totalPaid = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleAdd = () => {
    if (!form.amount || !form.rate) {
      Alert.alert('Error', 'Please fill amount and rate');
      return;
    }
    const amount = parseFloat(form.amount);
    const rate = parseFloat(form.rate);
    const newCommission: Commission = {
      id: `comm-${Date.now()}`,
      salesPersonId: form.salesPersonId || (employees[0]?.id ?? ''),
      transactionId: form.transactionId || `TXN-${Date.now()}`,
      transactionType: form.transactionType,
      amount,
      rate,
      commissionAmount: amount * (rate / 100),
      status: 'pending',
      period: new Date().toISOString().slice(0, 7),
    };
    addCommission(newCommission);
    setShowAddModal(false);
    setForm({ salesPersonId: '', transactionId: '', transactionType: 'invoice', amount: '', rate: '' });
    Alert.alert('Success', 'Commission added');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Commissions' }} />

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
          <Text style={styles.statValue}>${totalPending.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
          <Text style={styles.statValue}>${totalPaid.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Paid Out</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search color="#94a3b8" size={18} />
          <TextInput style={styles.searchInput} placeholder="Search commissions..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Plus color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {['all', 'pending', 'approved', 'paid'].map((s) => (
          <TouchableOpacity key={s} style={[styles.chip, filterStatus === s && styles.chipActive]} onPress={() => setFilterStatus(s)}>
            <Text style={[styles.chipText, filterStatus === s && styles.chipTextActive]}>
              {s === 'all' ? 'All' : STATUS_MAP[s]?.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Percent color="#cbd5e1" size={56} />
            <Text style={styles.emptyTitle}>No Commissions</Text>
            <Text style={styles.emptySubtitle}>Add commissions for sales team</Text>
          </View>
        ) : (
          filtered.map((comm) => {
            const emp = employees.find((e) => e.id === comm.salesPersonId);
            const statusInfo = STATUS_MAP[comm.status] || STATUS_MAP['pending'];
            return (
              <View key={comm.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardAvatar}>
                    <User color="#ec4899" size={20} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{emp?.name || 'Sales Person'}</Text>
                    <Text style={styles.cardRef}>{comm.transactionType.toUpperCase()} · {comm.transactionId}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                  </View>
                </View>
                <View style={styles.cardDetails}>
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Sale Amount</Text>
                    <Text style={styles.detailValue}>${comm.amount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Rate</Text>
                    <Text style={styles.detailValue}>{comm.rate}%</Text>
                  </View>
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Commission</Text>
                    <Text style={[styles.detailValue, { color: '#10b981', fontWeight: '800' as const }]}>${comm.commissionAmount.toFixed(2)}</Text>
                  </View>
                </View>
                <Text style={styles.period}>Period: {comm.period}</Text>
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Commission</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><X color="#64748b" size={24} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Transaction Type</Text>
              <View style={styles.typeRow}>
                {(['invoice', 'order', 'quotation'] as const).map((t) => (
                  <TouchableOpacity key={t} style={[styles.typeChip, form.transactionType === t && styles.typeChipActive]} onPress={() => setForm({ ...form, transactionType: t })}>
                    <Text style={[styles.typeText, form.transactionType === t && styles.typeTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Transaction ID</Text>
              <TextInput style={styles.input} placeholder="Reference" placeholderTextColor="#94a3b8" value={form.transactionId} onChangeText={(v) => setForm({ ...form, transactionId: v })} />

              <Text style={styles.label}>Sale Amount *</Text>
              <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#94a3b8" value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} keyboardType="decimal-pad" />

              <Text style={styles.label}>Commission Rate (%) *</Text>
              <TextInput style={styles.input} placeholder="e.g. 5" placeholderTextColor="#94a3b8" value={form.rate} onChangeText={(v) => setForm({ ...form, rate: v })} keyboardType="decimal-pad" />

              <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
                <Text style={styles.submitText}>Add Commission</Text>
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
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  statValue: { fontSize: 20, fontWeight: '800' as const, color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#0f172a' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#ec4899', justifyContent: 'center', alignItems: 'center' },
  filterRow: { maxHeight: 48, paddingLeft: 16 },
  filterContent: { gap: 8, paddingRight: 16, alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#ec4899', borderColor: '#ec4899' },
  chipText: { fontSize: 13, fontWeight: '600' as const, color: '#64748b' },
  chipTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, color: '#334155', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fce7f3', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700' as const, color: '#0f172a' },
  cardRef: { fontSize: 12, color: '#64748b', marginTop: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' as const },
  cardDetails: { flexDirection: 'row', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  detailBlock: { flex: 1, alignItems: 'center' },
  detailLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '700' as const, color: '#0f172a' },
  period: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, color: '#0f172a' },
  label: { fontSize: 13, fontWeight: '600' as const, color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 14, height: 46, fontSize: 15, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f5f9' },
  typeChipActive: { backgroundColor: '#ec4899' },
  typeText: { fontSize: 13, fontWeight: '600' as const, color: '#64748b' },
  typeTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#ec4899', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 20 },
  submitText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
});
