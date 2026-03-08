import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ShoppingBag,
  CalendarDays,
  DollarSign,
  User,

} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { useAuth } from '@/contexts/AuthContext';
import { ApprovalWorkflow } from '@/types/erp';

const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
  'pending': { color: '#f59e0b', bg: '#fef3c7', label: 'Pending' },
  'approved': { color: '#10b981', bg: '#d1fae5', label: 'Approved' },
  'rejected': { color: '#ef4444', bg: '#fee2e2', label: 'Rejected' },
  'cancelled': { color: '#64748b', bg: '#f1f5f9', label: 'Cancelled' },
};

const TYPE_ICON: Record<string, { icon: any; color: string; label: string }> = {
  'leave': { icon: CalendarDays, color: '#3b82f6', label: 'Leave Request' },
  'expense': { icon: DollarSign, color: '#10b981', label: 'Expense' },
  'purchase': { icon: ShoppingBag, color: '#8b5cf6', label: 'Purchase Order' },
  'timesheet': { icon: Clock, color: '#f59e0b', label: 'Timesheet' },
  'invoice': { icon: FileText, color: '#ec4899', label: 'Invoice' },
};

export default function ApprovalsScreen() {
  const { approvals, updateApproval, employees } = useERP();
  const { currentUser } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [filterType, setFilterType] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = approvals.filter((a) => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchType = filterType === 'all' || a.type === filterType;
    return matchStatus && matchType;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleApprove = (approval: ApprovalWorkflow) => {
    updateApproval(approval.id, {
      status: 'approved',
      updatedAt: new Date().toISOString(),
      comments: `Approved by ${currentUser?.fullName}`,
    });
    Alert.alert('Approved', 'Request has been approved');
  };

  const handleReject = (approval: ApprovalWorkflow) => {
    updateApproval(approval.id, {
      status: 'rejected',
      updatedAt: new Date().toISOString(),
      comments: `Rejected by ${currentUser?.fullName}`,
    });
    Alert.alert('Rejected', 'Request has been rejected');
  };

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Approvals' }} />

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Clock color="#f59e0b" size={24} />
          </View>
          <Text style={styles.summaryValue}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <CheckCircle color="#10b981" size={24} />
          </View>
          <Text style={styles.summaryValue}>{approvals.filter((a) => a.status === 'approved').length}</Text>
          <Text style={styles.summaryLabel}>Approved</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <XCircle color="#ef4444" size={24} />
          </View>
          <Text style={styles.summaryValue}>{approvals.filter((a) => a.status === 'rejected').length}</Text>
          <Text style={styles.summaryLabel}>Rejected</Text>
        </View>
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow} contentContainerStyle={styles.filterContent}>
        {['all', 'leave', 'expense', 'purchase', 'timesheet', 'invoice'].map((t) => (
          <TouchableOpacity key={t} style={[styles.typeChip, filterType === t && styles.typeChipActive]} onPress={() => setFilterType(t)}>
            <Text style={[styles.typeChipText, filterType === t && styles.typeChipTextActive]}>
              {t === 'all' ? 'All Types' : TYPE_ICON[t]?.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <ClipboardCheck color="#cbd5e1" size={56} />
            <Text style={styles.emptyTitle}>No Approvals</Text>
            <Text style={styles.emptySubtitle}>No pending approval requests</Text>
          </View>
        ) : (
          filtered.map((approval) => {
            const typeInfo = TYPE_ICON[approval.type] || TYPE_ICON['leave'];
            const statusInfo = STATUS_MAP[approval.status] || STATUS_MAP['pending'];
            const IconComp = typeInfo.icon;
            const requester = employees.find((e) => e.id === approval.requestedBy);
            return (
              <View key={approval.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: typeInfo.color + '15' }]}>
                    <IconComp color={typeInfo.color} size={22} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardType}>{typeInfo.label}</Text>
                    <Text style={styles.cardRequester}>
                      <User color="#64748b" size={12} /> {requester?.name || approval.requestedBy}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                  </View>
                </View>

                <View style={styles.cardMeta}>
                  <Text style={styles.metaText}>Ref: {approval.referenceId}</Text>
                  <Text style={styles.metaText}>{new Date(approval.createdAt).toLocaleDateString()}</Text>
                </View>

                {approval.comments && (
                  <Text style={styles.comments}>{approval.comments}</Text>
                )}

                {approval.status === 'pending' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#d1fae5' }]} onPress={() => handleApprove(approval)}>
                      <CheckCircle color="#10b981" size={16} />
                      <Text style={[styles.actionText, { color: '#10b981' }]}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} onPress={() => handleReject(approval)}>
                      <XCircle color="#ef4444" size={16} />
                      <Text style={[styles.actionText, { color: '#ef4444' }]}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  summaryIcon: { marginBottom: 6 },
  summaryValue: { fontSize: 22, fontWeight: '800' as const, color: '#0f172a' },
  summaryLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  filterRow: { maxHeight: 48, paddingLeft: 16, marginTop: 12 },
  typeRow: { maxHeight: 40, paddingLeft: 16, marginBottom: 4 },
  filterContent: { gap: 8, paddingRight: 16, alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  chipText: { fontSize: 13, fontWeight: '600' as const, color: '#64748b' },
  chipTextActive: { color: '#fff' },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f1f5f9' },
  typeChipActive: { backgroundColor: '#3b82f6' },
  typeChipText: { fontSize: 12, fontWeight: '500' as const, color: '#64748b' },
  typeChipTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, color: '#334155', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardType: { fontSize: 15, fontWeight: '700' as const, color: '#0f172a' },
  cardRequester: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' as const },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  metaText: { fontSize: 12, color: '#94a3b8' },
  comments: { fontSize: 13, color: '#64748b', marginTop: 4, fontStyle: 'italic' as const },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  actionText: { fontSize: 13, fontWeight: '600' as const },
});
