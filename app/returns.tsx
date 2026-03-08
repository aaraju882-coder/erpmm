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
  RotateCcw,
  Plus,
  Search,
  X,
  Package,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { ReturnOrder, ReturnItem } from '@/types/erp';

const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
  'pending': { color: '#f59e0b', bg: '#fef3c7', label: 'Pending' },
  'approved': { color: '#3b82f6', bg: '#dbeafe', label: 'Approved' },
  'rejected': { color: '#ef4444', bg: '#fee2e2', label: 'Rejected' },
  'processed': { color: '#10b981', bg: '#d1fae5', label: 'Processed' },
};

export default function ReturnsScreen() {
  const { returnOrders, addReturnOrder, updateReturnOrder, customers } = useERP();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnOrder | null>(null);

  const [form, setForm] = useState({
    originalOrderId: '',
    customerId: '',
    reason: '',
    refundAmount: '',
    refundMethod: 'original' as ReturnOrder['refundMethod'],
    notes: '',
    productId: '',
    quantity: '',
    itemReason: '',
    condition: 'used' as ReturnItem['condition'],
  });

  const filtered = returnOrders.filter((r) => {
    const customer = customers.find((c) => c.id === r.customerId);
    const matchSearch =
      r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleAdd = () => {
    if (!form.reason || !form.refundAmount) {
      Alert.alert('Error', 'Please fill in reason and refund amount');
      return;
    }

    const newReturn: ReturnOrder = {
      id: `ret-${Date.now()}`,
      returnNumber: `RET-${String(returnOrders.length + 1).padStart(4, '0')}`,
      originalOrderId: form.originalOrderId || `ORD-${Date.now()}`,
      customerId: form.customerId || (customers[0]?.id ?? ''),
      date: new Date().toISOString(),
      items: form.productId ? [{
        id: `ri-${Date.now()}`,
        productId: form.productId,
        quantity: parseInt(form.quantity) || 1,
        reason: form.itemReason || form.reason,
        condition: form.condition,
      }] : [],
      reason: form.reason,
      status: 'pending',
      refundAmount: parseFloat(form.refundAmount) || 0,
      refundMethod: form.refundMethod,
      notes: form.notes,
    };

    addReturnOrder(newReturn);
    setShowAddModal(false);
    setForm({ originalOrderId: '', customerId: '', reason: '', refundAmount: '', refundMethod: 'original', notes: '', productId: '', quantity: '', itemReason: '', condition: 'used' });
    Alert.alert('Success', 'Return order created');
  };

  const handleUpdateStatus = (ret: ReturnOrder, status: ReturnOrder['status']) => {
    updateReturnOrder(ret.id, { status });
    setSelectedReturn(null);
    Alert.alert('Updated', `Return ${STATUS_MAP[status]?.label}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Returns Management' }} />

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search color="#94a3b8" size={18} />
          <TextInput style={styles.searchInput} placeholder="Search returns..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Plus color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {['all', 'pending', 'approved', 'rejected', 'processed'].map((s) => (
          <TouchableOpacity key={s} style={[styles.chip, filterStatus === s && styles.chipActive]} onPress={() => setFilterStatus(s)}>
            <Text style={[styles.chipText, filterStatus === s && styles.chipTextActive]}>
              {s === 'all' ? 'All' : STATUS_MAP[s]?.label} ({s === 'all' ? returnOrders.length : returnOrders.filter((r) => r.status === s).length})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <RotateCcw color="#cbd5e1" size={56} />
            <Text style={styles.emptyTitle}>No Returns</Text>
            <Text style={styles.emptySubtitle}>No return orders found</Text>
          </View>
        ) : (
          filtered.map((ret) => {
            const customer = customers.find((c) => c.id === ret.customerId);
            const statusInfo = STATUS_MAP[ret.status] || STATUS_MAP['pending'];
            return (
              <TouchableOpacity key={ret.id} style={styles.card} onPress={() => setSelectedReturn(ret)}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIcon}>
                    <RotateCcw color="#8b5cf6" size={20} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{ret.returnNumber}</Text>
                    <Text style={styles.cardSubtitle}>{customer?.name || 'Unknown Customer'}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.badgeText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                  </View>
                </View>
                <View style={styles.cardDetails}>
                  <View style={styles.detailItem}>
                    <DollarSign color="#64748b" size={14} />
                    <Text style={styles.detailText}>${ret.refundAmount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Package color="#64748b" size={14} />
                    <Text style={styles.detailText}>{ret.items.length} item(s)</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Calendar color="#64748b" size={14} />
                    <Text style={styles.detailText}>{new Date(ret.date).toLocaleDateString()}</Text>
                  </View>
                </View>
                <Text style={styles.reason} numberOfLines={1}>Reason: {ret.reason}</Text>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Return</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><X color="#64748b" size={24} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Original Order ID</Text>
              <TextInput style={styles.input} placeholder="Order reference" placeholderTextColor="#94a3b8" value={form.originalOrderId} onChangeText={(v) => setForm({ ...form, originalOrderId: v })} />

              <Text style={styles.label}>Reason *</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Reason for return" placeholderTextColor="#94a3b8" value={form.reason} onChangeText={(v) => setForm({ ...form, reason: v })} multiline />

              <Text style={styles.label}>Refund Amount *</Text>
              <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#94a3b8" value={form.refundAmount} onChangeText={(v) => setForm({ ...form, refundAmount: v })} keyboardType="decimal-pad" />

              <Text style={styles.label}>Refund Method</Text>
              <View style={styles.methodRow}>
                {(['original', 'store-credit', 'exchange'] as const).map((m) => (
                  <TouchableOpacity key={m} style={[styles.methodChip, form.refundMethod === m && styles.methodChipActive]} onPress={() => setForm({ ...form, refundMethod: m })}>
                    <Text style={[styles.methodText, form.refundMethod === m && styles.methodTextActive]}>
                      {m === 'original' ? 'Original' : m === 'store-credit' ? 'Store Credit' : 'Exchange'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Notes</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Additional notes" placeholderTextColor="#94a3b8" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} multiline />

              <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
                <Text style={styles.submitText}>Create Return</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedReturn} animationType="slide" transparent onRequestClose={() => setSelectedReturn(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Return Details</Text>
              <TouchableOpacity onPress={() => setSelectedReturn(null)}><X color="#64748b" size={24} /></TouchableOpacity>
            </View>
            {selectedReturn && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.dRow}><Text style={styles.dLabel}>Return #</Text><Text style={styles.dValue}>{selectedReturn.returnNumber}</Text></View>
                <View style={styles.dRow}><Text style={styles.dLabel}>Reason</Text><Text style={styles.dValue}>{selectedReturn.reason}</Text></View>
                <View style={styles.dRow}><Text style={styles.dLabel}>Refund</Text><Text style={styles.dValue}>${selectedReturn.refundAmount.toFixed(2)}</Text></View>
                <View style={styles.dRow}><Text style={styles.dLabel}>Method</Text><Text style={styles.dValue}>{selectedReturn.refundMethod}</Text></View>
                <View style={styles.dRow}>
                  <Text style={styles.dLabel}>Status</Text>
                  <View style={[styles.badge, { backgroundColor: STATUS_MAP[selectedReturn.status]?.bg }]}>
                    <Text style={[styles.badgeText, { color: STATUS_MAP[selectedReturn.status]?.color }]}>{STATUS_MAP[selectedReturn.status]?.label}</Text>
                  </View>
                </View>

                {selectedReturn.status === 'pending' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#d1fae5' }]} onPress={() => handleUpdateStatus(selectedReturn, 'approved')}>
                      <CheckCircle color="#10b981" size={18} />
                      <Text style={[styles.actionText, { color: '#10b981' }]}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} onPress={() => handleUpdateStatus(selectedReturn, 'rejected')}>
                      <XCircle color="#ef4444" size={18} />
                      <Text style={[styles.actionText, { color: '#ef4444' }]}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {selectedReturn.status === 'approved' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#d1fae5', marginTop: 16 }]} onPress={() => handleUpdateStatus(selectedReturn, 'processed')}>
                    <CheckCircle color="#10b981" size={18} />
                    <Text style={[styles.actionText, { color: '#10b981' }]}>Mark Processed</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#0f172a' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center' },
  filterRow: { maxHeight: 48, paddingLeft: 16 },
  filterContent: { gap: 8, paddingRight: 16, alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  chipText: { fontSize: 13, fontWeight: '600' as const, color: '#64748b' },
  chipTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, color: '#334155', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700' as const, color: '#0f172a' },
  cardSubtitle: { fontSize: 13, color: '#64748b', marginTop: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' as const },
  cardDetails: { flexDirection: 'row', gap: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, color: '#475569' },
  reason: { fontSize: 12, color: '#64748b', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, color: '#0f172a' },
  label: { fontSize: 13, fontWeight: '600' as const, color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 14, height: 46, fontSize: 15, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' as const },
  methodRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  methodChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9' },
  methodChipActive: { backgroundColor: '#8b5cf6' },
  methodText: { fontSize: 13, fontWeight: '600' as const, color: '#64748b' },
  methodTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#8b5cf6', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 20 },
  submitText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
  dRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dLabel: { fontSize: 14, color: '#64748b' },
  dValue: { fontSize: 14, color: '#0f172a', fontWeight: '600' as const, maxWidth: '60%', textAlign: 'right' as const },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
  actionText: { fontSize: 14, fontWeight: '600' as const },
});
