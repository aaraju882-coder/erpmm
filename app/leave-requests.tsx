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
  CalendarDays,
  Plus,
  Search,
  X,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { useAuth } from '@/contexts/AuthContext';
import { LeaveRequest } from '@/types/erp';

const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
  'pending': { color: '#f59e0b', bg: '#fef3c7', label: 'Pending' },
  'approved': { color: '#10b981', bg: '#d1fae5', label: 'Approved' },
  'rejected': { color: '#ef4444', bg: '#fee2e2', label: 'Rejected' },
};

const TYPE_MAP: Record<string, { color: string; label: string }> = {
  'vacation': { color: '#3b82f6', label: 'Vacation' },
  'sick': { color: '#ef4444', label: 'Sick Leave' },
  'personal': { color: '#8b5cf6', label: 'Personal' },
  'unpaid': { color: '#64748b', label: 'Unpaid' },
};

export default function LeaveRequestsScreen() {
  const { leaveRequests, addLeaveRequest, updateLeaveRequest, employees } = useERP();
  const { currentUser, hasPermission } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const [form, setForm] = useState({
    type: 'vacation' as LeaveRequest['type'],
    startDate: '',
    endDate: '',
    reason: '',
  });

  const myEmployee = employees.find((e) => e.email === currentUser?.email);
  const myEmployeeId = myEmployee?.id || currentUser?.id;

  const filtered = leaveRequests.filter((r) => {
    const emp = employees.find((e) => e.id === r.employeeId);
    const matchSearch =
      (emp?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchAccess = canViewAll || r.employeeId === myEmployeeId;
    return matchSearch && matchStatus && matchAccess;
  }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleAdd = () => {
    if (!form.startDate || !form.endDate || !form.reason) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const myEmployee = employees.find((e) => e.email === currentUser?.email);

    const newRequest: LeaveRequest = {
      id: `leave-${Date.now()}`,
      employeeId: myEmployee?.id || currentUser?.id || '',
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      days,
      reason: form.reason,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    addLeaveRequest(newRequest);
    setShowAddModal(false);
    setForm({ type: 'vacation', startDate: '', endDate: '', reason: '' });
    Alert.alert('Success', 'Leave request submitted');
  };

  const handleApprove = (request: LeaveRequest) => {
    updateLeaveRequest(request.id, {
      status: 'approved',
      approvedBy: currentUser?.fullName || 'Admin',
    });
    Alert.alert('Approved', 'Leave request approved');
  };

  const handleReject = (request: LeaveRequest) => {
    updateLeaveRequest(request.id, {
      status: 'rejected',
      approvedBy: currentUser?.fullName || 'Admin',
    });
    Alert.alert('Rejected', 'Leave request rejected');
  };

  const canApprove = hasPermission('hr', 'admin');
  const canViewAll = hasPermission('hr', 'read');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Leave Requests' }} />

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
          <Text style={styles.statValue}>{leaveRequests.filter((r) => r.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
          <Text style={styles.statValue}>{leaveRequests.filter((r) => r.status === 'approved').length}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#ef4444' }]}>
          <Text style={styles.statValue}>{leaveRequests.filter((r) => r.status === 'rejected').length}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search color="#94a3b8" size={18} />
          <TextInput style={styles.searchInput} placeholder="Search requests..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Plus color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {['all', 'pending', 'approved', 'rejected'].map((s) => (
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
            <CalendarDays color="#cbd5e1" size={56} />
            <Text style={styles.emptyTitle}>No Leave Requests</Text>
            <Text style={styles.emptySubtitle}>Submit a new leave request</Text>
          </View>
        ) : (
          filtered.map((request) => {
            const emp = employees.find((e) => e.id === request.employeeId);
            const statusInfo = STATUS_MAP[request.status];
            const typeInfo = TYPE_MAP[request.type];
            return (
              <View key={request.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardAvatar}>
                    <User color="#3b82f6" size={20} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{emp?.name || 'Employee'}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: typeInfo?.color + '15' }]}>
                      <Text style={[styles.typeText, { color: typeInfo?.color }]}>{typeInfo?.label}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo?.bg }]}>
                    <Text style={[styles.statusText, { color: statusInfo?.color }]}>{statusInfo?.label}</Text>
                  </View>
                </View>

                <View style={styles.cardDates}>
                  <View style={styles.dateBlock}>
                    <Calendar color="#64748b" size={14} />
                    <Text style={styles.dateText}>{request.startDate} - {request.endDate}</Text>
                  </View>
                  <View style={styles.daysBlock}>
                    <Clock color="#64748b" size={14} />
                    <Text style={styles.daysText}>{request.days} day(s)</Text>
                  </View>
                </View>

                <Text style={styles.reason} numberOfLines={2}>{request.reason}</Text>

                {request.status === 'pending' && (
                  <View style={styles.actionRow}>
                    {canApprove ? (
                      <>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#d1fae5' }]} onPress={() => handleApprove(request)}>
                          <CheckCircle color="#10b981" size={16} />
                          <Text style={[styles.actionText, { color: '#10b981' }]}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} onPress={() => handleReject(request)}>
                          <XCircle color="#ef4444" size={16} />
                          <Text style={[styles.actionText, { color: '#ef4444' }]}>Reject</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <View style={styles.pendingNotice}>
                        <Clock color="#f59e0b" size={14} />
                        <Text style={styles.pendingNoticeText}>Awaiting admin approval</Text>
                      </View>
                    )}
                  </View>
                )}

                {request.approvedBy && (
                  <Text style={styles.approvedBy}>
                    {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.approvedBy}
                  </Text>
                )}
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
              <Text style={styles.modalTitle}>Request Leave</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><X color="#64748b" size={24} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Leave Type</Text>
              <View style={styles.typeGrid}>
                {(['vacation', 'sick', 'personal', 'unpaid'] as const).map((t) => (
                  <TouchableOpacity key={t} style={[styles.typeChip, form.type === t && { backgroundColor: TYPE_MAP[t].color }]} onPress={() => setForm({ ...form, type: t })}>
                    <Text style={[styles.typeChipText, form.type === t && { color: '#fff' }]}>{TYPE_MAP[t].label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Start Date *</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" value={form.startDate} onChangeText={(v) => setForm({ ...form, startDate: v })} />

              <Text style={styles.label}>End Date *</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" value={form.endDate} onChangeText={(v) => setForm({ ...form, endDate: v })} />

              <Text style={styles.label}>Reason *</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Reason for leave" placeholderTextColor="#94a3b8" value={form.reason} onChangeText={(v) => setForm({ ...form, reason: v })} multiline />

              <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
                <Text style={styles.submitText}>Submit Request</Text>
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
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  statValue: { fontSize: 22, fontWeight: '800' as const, color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#0f172a' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  filterRow: { maxHeight: 48, paddingLeft: 16 },
  filterContent: { gap: 8, paddingRight: 16, alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  chipText: { fontSize: 13, fontWeight: '600' as const, color: '#64748b' },
  chipTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, color: '#334155', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700' as const, color: '#0f172a' },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
  typeText: { fontSize: 11, fontWeight: '600' as const },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' as const },
  cardDates: { flexDirection: 'row', gap: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  dateBlock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, color: '#475569' },
  daysBlock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  daysText: { fontSize: 12, color: '#475569', fontWeight: '600' as const },
  reason: { fontSize: 13, color: '#64748b', marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  actionText: { fontSize: 13, fontWeight: '600' as const },
  approvedBy: { fontSize: 11, color: '#94a3b8', marginTop: 8, fontStyle: 'italic' as const },
  pendingNotice: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  pendingNoticeText: { fontSize: 12, color: '#92400e', fontWeight: '500' as const },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, color: '#0f172a' },
  label: { fontSize: 13, fontWeight: '600' as const, color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 14, height: 46, fontSize: 15, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' as const },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f5f9' },
  typeChipText: { fontSize: 13, fontWeight: '600' as const, color: '#64748b' },
  submitBtn: { backgroundColor: '#10b981', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 20 },
  submitText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
});
