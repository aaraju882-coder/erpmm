import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  BookOpen,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Calendar,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { AccountingEntry } from '@/types/erp';

export default function ChartOfAccountsScreen() {
  const { accountingEntries, addAccountingEntry } = useERP();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    account: '',
    description: '',
    debit: '',
    credit: '',
    type: 'income' as 'income' | 'expense' | 'asset' | 'liability' | 'equity',
    reference: '',
  });

  const accountCategories = [
    { id: 'income', name: 'Income', color: '#10b981', icon: ArrowUpRight },
    { id: 'expense', name: 'Expenses', color: '#ef4444', icon: ArrowDownRight },
    { id: 'asset', name: 'Assets', color: '#3b82f6', icon: TrendingUp },
    { id: 'liability', name: 'Liabilities', color: '#f59e0b', icon: TrendingDown },
    { id: 'equity', name: 'Equity', color: '#8b5cf6', icon: DollarSign },
  ];

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const filteredEntries = accountingEntries.filter((entry) => {
    const matchesSearch =
      entry.account.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || entry.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const calculateBalance = (type: string) => {
    const entries = accountingEntries.filter((e) => e.type === type);
    const total = entries.reduce((sum, e) => sum + (e.debit - e.credit), 0);
    return total;
  };

  const handleAddEntry = () => {
    if (!formData.account || !formData.description || (!formData.debit && !formData.credit)) {
      return;
    }

    const debit = parseFloat(formData.debit) || 0;
    const credit = parseFloat(formData.credit) || 0;
    const balance = debit - credit;

    const newEntry: AccountingEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      account: formData.account,
      description: formData.description,
      debit,
      credit,
      balance,
      type: formData.type,
      reference: formData.reference,
    };

    addAccountingEntry(newEntry);
    setShowAddModal(false);
    setFormData({
      account: '',
      description: '',
      debit: '',
      credit: '',
      type: 'income',
      reference: '',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Chart of Accounts',
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.headerButton}>
              <Plus color="#2563eb" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.content}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {accountCategories.map((category) => {
            const CategoryIcon = category.icon;
            const balance = calculateBalance(category.id);
            
            return (
              <View key={category.id} style={styles.categoryCard}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
                  <CategoryIcon color={category.color} size={24} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={[styles.categoryBalance, { color: category.color }]}>
                  {formatCurrency(Math.abs(balance))}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search color="#94a3b8" size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search accounts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', ...accountCategories.map((c) => c.id)].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                filterType === type && styles.filterChipActive,
              ]}
              onPress={() => setFilterType(type)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterType === type && styles.filterChipTextActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          style={styles.entriesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.entriesListContent}
        >
          {filteredEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen color="#cbd5e1" size={64} />
              <Text style={styles.emptyStateText}>No Accounting Entries</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery || filterType !== 'all'
                  ? 'No entries match your filters'
                  : 'Add your first accounting entry'}
              </Text>
              {searchQuery === '' && filterType === 'all' && (
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Plus color="#ffffff" size={20} />
                  <Text style={styles.emptyStateButtonText}>Add Entry</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredEntries.map((entry) => {
              const category = accountCategories.find((c) => c.id === entry.type);
              const CategoryIcon = category?.icon || FileText;
              const categoryColor = category?.color || '#64748b';

              return (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryHeaderLeft}>
                      <View style={[styles.entryIcon, { backgroundColor: categoryColor + '15' }]}>
                        <CategoryIcon color={categoryColor} size={20} />
                      </View>
                      <View style={styles.entryInfo}>
                        <Text style={styles.entryAccount}>{entry.account}</Text>
                        <Text style={styles.entryDescription} numberOfLines={1}>
                          {entry.description}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.entryAmounts}>
                      {entry.debit > 0 && (
                        <Text style={styles.debitAmount}>+{formatCurrency(entry.debit)}</Text>
                      )}
                      {entry.credit > 0 && (
                        <Text style={styles.creditAmount}>-{formatCurrency(entry.credit)}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.entryFooter}>
                    <View style={styles.entryFooterItem}>
                      <Calendar color="#64748b" size={14} />
                      <Text style={styles.entryFooterText}>{entry.date}</Text>
                    </View>
                    {entry.reference && (
                      <View style={styles.entryFooterItem}>
                        <FileText color="#64748b" size={14} />
                        <Text style={styles.entryFooterText}>{entry.reference}</Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: categoryColor + '15' },
                      ]}
                    >
                      <Text style={[styles.typeBadgeText, { color: categoryColor }]}>
                        {entry.type}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Accounting Entry</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <XCircle color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Account Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Sales Revenue, Office Supplies"
                  value={formData.account}
                  onChangeText={(text) => setFormData({ ...formData, account: text })}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description *</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputMultiline]}
                  placeholder="Enter description"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={2}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Account Type *</Text>
                <View style={styles.typeButtons}>
                  {accountCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.typeButton,
                        formData.type === cat.id && styles.typeButtonActive,
                        formData.type === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '15' },
                      ]}
                      onPress={() => setFormData({ ...formData, type: cat.id as any })}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          formData.type === cat.id && { color: cat.color },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Debit</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0.00"
                    value={formData.debit}
                    onChangeText={(text) => setFormData({ ...formData, debit: text })}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.formLabel}>Credit</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0.00"
                    value={formData.credit}
                    onChangeText={(text) => setFormData({ ...formData, credit: text })}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Reference (Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Invoice #, Receipt #, etc."
                  value={formData.reference}
                  onChangeText={(text) => setFormData({ ...formData, reference: text })}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButtonPrimary,
                  (!formData.account || !formData.description) && styles.modalButtonDisabled,
                ]}
                onPress={handleAddEntry}
                disabled={!formData.account || !formData.description}
              >
                <Text style={styles.modalButtonPrimaryText}>Add Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  categoriesScroll: {
    maxHeight: 140,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 4,
  },
  categoryBalance: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 50,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  entriesList: {
    flex: 1,
  },
  entriesListContent: {
    padding: 16,
  },
  entryCard: {
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
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  entryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  entryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  entryInfo: {
    flex: 1,
  },
  entryAccount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  entryDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  entryAmounts: {
    alignItems: 'flex-end',
  },
  debitAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#10b981',
  },
  creditAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ef4444',
  },
  entryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  entryFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  entryFooterText: {
    fontSize: 12,
    color: '#64748b',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  modalContainer: {
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  formScroll: {
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formInputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  typeButtonActive: {
    borderWidth: 2,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
});
