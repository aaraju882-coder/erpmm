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
  Target,
  Plus,
  Search,
  X,
  User,
  TrendingUp,
  Award,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { SalesTarget } from '@/types/erp';

const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
  'active': { color: '#3b82f6', bg: '#dbeafe', label: 'Active' },
  'achieved': { color: '#10b981', bg: '#d1fae5', label: 'Achieved' },
  'missed': { color: '#ef4444', bg: '#fee2e2', label: 'Missed' },
  'overachieved': { color: '#8b5cf6', bg: '#ede9fe', label: 'Over-achieved' },
};

export default function SalesTargetsScreen() {
  const { salesTargets, addSalesTarget, employees } = useERP();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [form, setForm] = useState({
    salesPersonId: '',
    period: '',
    targetAmount: '',
    targetUnits: '',
  });

  const filtered = salesTargets.filter((t) => {
    const emp = employees.find((e) => e.id === t.salesPersonId);
    return (emp?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.period.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleAdd = () => {
    if (!form.targetAmount || !form.period) {
      Alert.alert('Error', 'Please fill period and target amount');
      return;
    }
    const newTarget: SalesTarget = {
      id: `st-${Date.now()}`,
      salesPersonId: form.salesPersonId || (employees[0]?.id ?? ''),
      period: form.period,
      targetAmount: parseFloat(form.targetAmount) || 0,
      achievedAmount: 0,
      targetUnits: parseInt(form.targetUnits) || 0,
      achievedUnits: 0,
      status: 'active',
    };
    addSalesTarget(newTarget);
    setShowAddModal(false);
    setForm({ salesPersonId: '', period: '', targetAmount: '', targetUnits: '' });
    Alert.alert('Success', 'Sales target added');
  };

  const getProgress = (achieved: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((achieved / target) * 100, 100);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Sales Targets' }} />

      <View style={styles.overviewRow}>
        <View style={styles.overviewCard}>
          <Target color="#3b82f6" size={24} />
          <Text style={styles.overviewValue}>{salesTargets.filter((t) => t.status === 'active').length}</Text>
          <Text style={styles.overviewLabel}>Active</Text>
        </View>
        <View style={styles.overviewCard}>
          <Award color="#10b981" size={24} />
          <Text style={styles.overviewValue}>{salesTargets.filter((t) => t.status === 'achieved' || t.status === 'overachieved').length}</Text>
          <Text style={styles.overviewLabel}>Achieved</Text>
        </View>
        <View style={styles.overviewCard}>
          <TrendingUp color="#f59e0b" size={24} />
          <Text style={styles.overviewValue}>
            ${salesTargets.reduce((s, t) => s + t.achievedAmount, 0).toLocaleString()}
          </Text>
          <Text style={styles.overviewLabel}>Total Sales</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search color="#94a3b8" size={18} />
          <TextInput style={styles.searchInput} placeholder="Search targets..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Plus color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Target color="#cbd5e1" size={56} />
            <Text style={styles.emptyTitle}>No Sales Targets</Text>
            <Text style={styles.emptySubtitle}>Set targets for your sales team</Text>
          </View>
        ) : (
          filtered.map((target) => {
            const emp = employees.find((e) => e.id === target.salesPersonId);
            const statusInfo = STATUS_MAP[target.status] || STATUS_MAP['active'];
            const amountProgress = getProgress(target.achievedAmount, target.targetAmount);
            return (
              <View key={target.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardAvatar}>
                    <User color="#3b82f6" size={20} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{emp?.name || 'Sales Person'}</Text>
                    <Text style={styles.cardPeriod}>{target.period}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Revenue Target</Text>
                    <Text style={styles.progressPercent}>{amountProgress.toFixed(0)}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${amountProgress}%`, backgroundColor: amountProgress >= 100 ? '#10b981' : '#3b82f6' }]} />
                  </View>
                  <View style={styles.progressValues}>
                    <Text style={styles.achievedText}>${target.achievedAmount.toLocaleString()}</Text>
                    <Text style={styles.targetText}>/ ${target.targetAmount.toLocaleString()}</Text>
                  </View>
                </View>

                {target.targetUnits > 0 && (
                  <View style={styles.unitsRow}>
                    <Text style={styles.unitsLabel}>Units: {target.achievedUnits} / {target.targetUnits}</Text>
                    <View style={styles.miniBar}>
                      <View style={[styles.miniFill, { width: `${getProgress(target.achievedUnits, target.targetUnits)}%` }]} />
                    </View>
                  </View>
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
              <Text style={styles.modalTitle}>New Sales Target</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><X color="#64748b" size={24} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Period *</Text>
              <TextInput style={styles.input} placeholder="e.g. 2026-03" placeholderTextColor="#94a3b8" value={form.period} onChangeText={(v) => setForm({ ...form, period: v })} />

              <Text style={styles.label}>Target Amount *</Text>
              <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#94a3b8" value={form.targetAmount} onChangeText={(v) => setForm({ ...form, targetAmount: v })} keyboardType="decimal-pad" />

              <Text style={styles.label}>Target Units</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor="#94a3b8" value={form.targetUnits} onChangeText={(v) => setForm({ ...form, targetUnits: v })} keyboardType="number-pad" />

              <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
                <Text style={styles.submitText}>Set Target</Text>
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
  overviewRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  overviewCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  overviewValue: { fontSize: 18, fontWeight: '800' as const, color: '#0f172a', marginTop: 6 },
  overviewLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#0f172a' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, color: '#334155', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700' as const, color: '#0f172a' },
  cardPeriod: { fontSize: 12, color: '#64748b', marginTop: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' as const },
  progressSection: { marginBottom: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: '#64748b' },
  progressPercent: { fontSize: 12, fontWeight: '700' as const, color: '#3b82f6' },
  progressBar: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressValues: { flexDirection: 'row', marginTop: 4, gap: 4 },
  achievedText: { fontSize: 14, fontWeight: '700' as const, color: '#0f172a' },
  targetText: { fontSize: 14, color: '#94a3b8' },
  unitsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  unitsLabel: { fontSize: 12, color: '#64748b', width: 120 },
  miniBar: { flex: 1, height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' },
  miniFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, color: '#0f172a' },
  label: { fontSize: 13, fontWeight: '600' as const, color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 14, height: 46, fontSize: 15, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  submitBtn: { backgroundColor: '#3b82f6', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 20 },
  submitText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
});
