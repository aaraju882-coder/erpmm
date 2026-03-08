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
  PiggyBank,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  X,
  Check,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { Budget } from '@/types/erp';

export default function BudgetsScreen() {
  const { budgets, addBudget } = useERP();
  const [showModal, setShowModal] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
  };

  const getStatusColor = (budget: Budget) => {
    const percentage = (budget.spent / budget.allocated) * 100;
    if (percentage >= 100) return '#ef4444';
    if (percentage >= 80) return '#f59e0b';
    return '#10b981';
  };

  const getBudgetStatus = (budget: Budget): string => {
    const percentage = (budget.spent / budget.allocated) * 100;
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 80) return 'warning';
    return 'good';
  };

  const BudgetCard = ({ budget }: { budget: Budget }) => {
    const remaining = budget.allocated - budget.spent;
    const percentage = Math.min(100, (budget.spent / budget.allocated) * 100);
    const status = getBudgetStatus(budget);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          Alert.alert(
            budget.name,
            `Category: ${budget.category}\nPeriod: ${budget.period}\nAllocated: ${formatCurrency(budget.allocated)}\nSpent: ${formatCurrency(budget.spent)}\nRemaining: ${formatCurrency(remaining)}\nProgress: ${percentage.toFixed(1)}%${budget.department ? `\nDepartment: ${budget.department}` : ''}`,
            [
              {
                text: 'Update',
                onPress: () => {
                  Alert.alert('Update Budget', 'Budget updated');
                },
              },
              { text: 'Close', style: 'cancel' },
            ]
          );
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.budgetIcon, { backgroundColor: getStatusColor(budget) + '15' }]}>
              <PiggyBank color={getStatusColor(budget)} size={20} />
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.cardTitle}>{budget.name}</Text>
              <Text style={styles.cardSubtitle}>{budget.category} • {budget.period}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(budget) }]}>
            <Text style={styles.statusText}>{status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Budget Usage</Text>
            <Text style={[styles.progressValue, { color: getStatusColor(budget) }]}>
              {percentage.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${percentage}%`, backgroundColor: getStatusColor(budget) },
              ]}
            />
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.cardFooterItem}>
            <Text style={styles.cardFooterLabel}>Allocated</Text>
            <Text style={styles.cardFooterValue}>{formatCurrency(budget.allocated)}</Text>
          </View>
          <View style={styles.cardFooterItem}>
            <Text style={styles.cardFooterLabel}>Spent</Text>
            <Text style={[styles.cardFooterValue, { color: getStatusColor(budget) }]}>
              {formatCurrency(budget.spent)}
            </Text>
          </View>
          <View style={styles.cardFooterItem}>
            <Text style={styles.cardFooterLabel}>Remaining</Text>
            <Text style={[styles.cardFooterValue, { color: remaining >= 0 ? '#10b981' : '#ef4444' }]}>
              {formatCurrency(Math.abs(remaining))}
            </Text>
          </View>
        </View>

        {budget.department && (
          <View style={styles.departmentTag}>
            <Text style={styles.departmentText}>{budget.department}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const CreateBudgetModal = () => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [allocated, setAllocated] = useState('');
    const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
    const [department, setDepartment] = useState('');

    const handleCreate = () => {
      if (!name || !category || !allocated) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const startDate = new Date();
      let endDate = new Date();
      
      if (period === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (period === 'quarterly') {
        endDate.setMonth(endDate.getMonth() + 3);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const newBudget: Budget = {
        id: Date.now().toString(),
        name,
        category,
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        allocated: parseFloat(allocated),
        spent: 0,
        department: department || undefined,
        status: 'active',
      };

      addBudget(newBudget);
      setShowModal(false);
      Alert.alert('Success', 'Budget created successfully');
      setName('');
      setCategory('');
      setAllocated('');
      setDepartment('');
    };

    return (
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Budget</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Budget Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Marketing Budget Q1"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category *</Text>
                <TextInput
                  style={styles.input}
                  value={category}
                  onChangeText={setCategory}
                  placeholder="Marketing, Operations, R&D"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Period *</Text>
                <View style={styles.periodButtons}>
                  {(['monthly', 'quarterly', 'yearly'] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.periodButton, period === p && styles.periodButtonActive]}
                      onPress={() => setPeriod(p)}
                    >
                      <Text style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Allocated Amount *</Text>
                <TextInput
                  style={styles.input}
                  value={allocated}
                  onChangeText={setAllocated}
                  placeholder="50000"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Department (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={department}
                  onChangeText={setDepartment}
                  placeholder="Sales, Engineering, etc."
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
                <Check color="#ffffff" size={20} />
                <Text style={styles.submitButtonText}>Create Budget</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const filteredBudgets = budgets.filter((budget) => {
    if (filterPeriod === 'all') return true;
    return budget.period === filterPeriod;
  });

  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const exceededCount = budgets.filter((b) => b.spent >= b.allocated).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Budgets',
          headerBackTitle: 'Back',
        }}
      />

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <TrendingUp color="#2563eb" size={20} />
          <Text style={[styles.statValue, { fontSize: 14 }]}>{formatCurrency(totalAllocated)}</Text>
          <Text style={styles.statLabel}>Allocated</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingDown color="#f59e0b" size={20} />
          <Text style={[styles.statValue, { fontSize: 14 }]}>{formatCurrency(totalSpent)}</Text>
          <Text style={styles.statLabel}>Spent</Text>
        </View>
        <View style={styles.statCard}>
          <AlertCircle color="#ef4444" size={20} />
          <Text style={styles.statValue}>{exceededCount}</Text>
          <Text style={styles.statLabel}>Exceeded</Text>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'monthly', 'quarterly', 'yearly'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.filterChip, filterPeriod === period && styles.filterChipActive]}
              onPress={() => setFilterPeriod(period)}
            >
              <Text style={[styles.filterChipText, filterPeriod === period && styles.filterChipTextActive]}>
                {period === 'all' ? 'All' : period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredBudgets.length > 0 ? (
          filteredBudgets.map((budget) => <BudgetCard key={budget.id} budget={budget} />)
        ) : (
          <View style={styles.emptyState}>
            <PiggyBank color="#cbd5e1" size={48} />
            <Text style={styles.emptyStateText}>No budgets found</Text>
            <Text style={styles.emptyStateSubtext}>Create your first budget to start tracking</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Plus color="#ffffff" size={28} />
      </TouchableOpacity>

      <CreateBudgetModal />
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
    textAlign: 'center',
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
  budgetIcon: {
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
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
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
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  departmentTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    marginTop: 8,
  },
  departmentText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600' as const,
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
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#2563eb',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  periodButtonTextActive: {
    color: '#ffffff',
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
