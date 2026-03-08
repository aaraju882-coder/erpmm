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
import {
  FileText,
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  Calendar,
  X,
  Check,
  BookOpen,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { Invoice, Expense } from '@/types/erp';
import { useRouter } from 'expo-router';

type TabType = 'invoices' | 'expenses' | 'accounting';

export default function FinanceScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const { invoices, expenses, customers, addInvoice, addExpense, updateInvoice, updateExpense } = useERP();

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#10b981';
      case 'sent':
        return '#3b82f6';
      case 'overdue':
        return '#ef4444';
      case 'draft':
        return '#64748b';
      case 'approved':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const InvoiceCard = ({ invoice }: { invoice: Invoice }) => {
    const customer = customers.find((c) => c.id === invoice.customerId);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          Alert.alert(
            'Invoice Actions',
            `Invoice #${invoice.invoiceNumber}`,
            [
              {
                text: 'Mark as Paid',
                onPress: () => updateInvoice(invoice.id, { status: 'paid' }),
              },
              {
                text: 'Mark as Sent',
                onPress: () => updateInvoice(invoice.id, { status: 'sent' }),
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>#{invoice.invoiceNumber}</Text>
            <Text style={styles.cardSubtitle}>{customer?.name || 'Unknown Customer'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(invoice.status) }]}>
              {invoice.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.cardFooter}>
          <View style={styles.cardFooterItem}>
            <Text style={styles.cardFooterLabel}>Amount</Text>
            <Text style={styles.cardFooterValue}>{formatCurrency(invoice.total)}</Text>
          </View>
          <View style={styles.cardFooterItem}>
            <Text style={styles.cardFooterLabel}>Due Date</Text>
            <Text style={styles.cardFooterValue}>{formatDate(invoice.dueDate)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ExpenseCard = ({ expense }: { expense: Expense }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        Alert.alert(
          'Expense Actions',
          `${expense.category} - ${formatCurrency(expense.amount)}`,
          [
            {
              text: 'Approve',
              onPress: () => updateExpense(expense.id, { status: 'approved' }),
            },
            {
              text: 'Mark as Paid',
              onPress: () => updateExpense(expense.id, { status: 'paid' }),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{expense.category}</Text>
          <Text style={styles.cardSubtitle}>{expense.vendor}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(expense.status) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(expense.status) }]}>
            {expense.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.cardDescription} numberOfLines={2}>
        {expense.description}
      </Text>
      <View style={styles.cardDivider} />
      <View style={styles.cardFooter}>
        <View style={styles.cardFooterItem}>
          <Text style={styles.cardFooterLabel}>Amount</Text>
          <Text style={styles.cardFooterValue}>{formatCurrency(expense.amount)}</Text>
        </View>
        <View style={styles.cardFooterItem}>
          <Text style={styles.cardFooterLabel}>Date</Text>
          <Text style={styles.cardFooterValue}>{formatDate(expense.date)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const QuickCreateInvoice = () => {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');

    const handleCreate = () => {
      if (!invoiceNumber || !amount || !selectedCustomer) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const newInvoice: Invoice = {
        id: Date.now().toString(),
        invoiceNumber,
        customerId: selectedCustomer,
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: [],
        subtotal: parseFloat(amount),
        tax: parseFloat(amount) * 0.1,
        discount: 0,
        total: parseFloat(amount) * 1.1,
        status: 'draft',
      };

      addInvoice(newInvoice);
      setShowInvoiceModal(false);
      setInvoiceNumber('');
      setAmount('');
      setSelectedCustomer('');
      Alert.alert('Success', 'Invoice created successfully');
    };

    return (
      <Modal
        visible={showInvoiceModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Invoice</Text>
              <TouchableOpacity onPress={() => setShowInvoiceModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Invoice Number</Text>
              <TextInput
                style={styles.input}
                value={invoiceNumber}
                onChangeText={setInvoiceNumber}
                placeholder="INV-001"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Customer</Text>
              <View style={styles.pickerContainer}>
                {customers.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {customers.map((customer) => (
                      <TouchableOpacity
                        key={customer.id}
                        style={[
                          styles.customerChip,
                          selectedCustomer === customer.id && styles.customerChipSelected,
                        ]}
                        onPress={() => setSelectedCustomer(customer.id)}
                      >
                        <Text
                          style={[
                            styles.customerChipText,
                            selectedCustomer === customer.id && styles.customerChipTextSelected,
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
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="1000.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
              <Check color="#ffffff" size={20} />
              <Text style={styles.submitButtonText}>Create Invoice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const QuickCreateExpense = () => {
    const [category, setCategory] = useState('');
    const [vendor, setVendor] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    const handleCreate = () => {
      if (!category || !vendor || !amount) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const newExpense: Expense = {
        id: Date.now().toString(),
        category,
        vendor,
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        description,
        paymentMethod: 'Cash',
        status: 'pending',
        createdBy: 'Admin',
      };

      addExpense(newExpense);
      setShowExpenseModal(false);
      setCategory('');
      setVendor('');
      setAmount('');
      setDescription('');
      Alert.alert('Success', 'Expense created successfully');
    };

    return (
      <Modal
        visible={showExpenseModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowExpenseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Expense</Text>
              <TouchableOpacity onPress={() => setShowExpenseModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder="Office Supplies"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Vendor</Text>
              <TextInput
                style={styles.input}
                value={vendor}
                onChangeText={setVendor}
                placeholder="Vendor Name"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="500.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description..."
                multiline
                numberOfLines={3}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
              <Check color="#ffffff" size={20} />
              <Text style={styles.submitButtonText}>Record Expense</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const totalRevenue = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const totalExpenses = expenses.filter((e) => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
  const profit = totalRevenue - totalExpenses;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Finance</Text>
        </View>
        <TouchableOpacity
          style={styles.chartButton}
          onPress={() => router.push('/chart-of-accounts')}
        >
          <BookOpen color="#ffffff" size={18} />
          <Text style={styles.chartButtonText}>Ledger</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <DollarSign color="#10b981" size={20} />
          <Text style={styles.statValue}>{formatCurrency(totalRevenue)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp color="#ef4444" size={20} />
          <Text style={styles.statValue}>{formatCurrency(totalExpenses)}</Text>
          <Text style={styles.statLabel}>Expenses</Text>
        </View>
        <View style={styles.statCard}>
          <Calendar color="#8b5cf6" size={20} />
          <Text style={styles.statValue}>{formatCurrency(profit)}</Text>
          <Text style={styles.statLabel}>Profit</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'invoices' && styles.activeTab]}
          onPress={() => setActiveTab('invoices')}
        >
          <Text style={[styles.tabText, activeTab === 'invoices' && styles.activeTabText]}>
            Invoices
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'accounting' && styles.activeTab]}
          onPress={() => setActiveTab('accounting')}
        >
          <Text style={[styles.tabText, activeTab === 'accounting' && styles.activeTabText]}>
            Ledger
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search color="#64748b" size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'invoices' && (
          <>
            {invoices.length > 0 ? (
              invoices
                .filter((inv) =>
                  inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((invoice) => <InvoiceCard key={invoice.id} invoice={invoice} />)
            ) : (
              <View style={styles.emptyState}>
                <FileText color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>No invoices yet</Text>
                <Text style={styles.emptyStateSubtext}>Create your first invoice to get started</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'expenses' && (
          <>
            {expenses.length > 0 ? (
              expenses
                .filter((exp) =>
                  exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  exp.vendor.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((expense) => <ExpenseCard key={expense.id} expense={expense} />)
            ) : (
              <View style={styles.emptyState}>
                <DollarSign color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>No expenses recorded</Text>
                <Text style={styles.emptyStateSubtext}>Record your first expense</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'accounting' && (
          <View style={styles.emptyState}>
            <FileText color="#cbd5e1" size={48} />
            <Text style={styles.emptyStateText}>Accounting Ledger</Text>
            <Text style={styles.emptyStateSubtext}>
              Total Revenue: {formatCurrency(totalRevenue)}{'\n'}
              Total Expenses: {formatCurrency(totalExpenses)}{'\n'}
              Net Profit: {formatCurrency(profit)}
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (activeTab === 'invoices') {
            setShowInvoiceModal(true);
          } else if (activeTab === 'expenses') {
            setShowExpenseModal(true);
          }
        }}
      >
        <Plus color="#ffffff" size={28} />
      </TouchableOpacity>

      <QuickCreateInvoice />
      <QuickCreateExpense />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#0f172a',
  },
  chartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  chartButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#ffffff',
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  activeTabText: {
    color: '#ffffff',
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
  cardTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
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
    fontSize: 15,
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
  pickerContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  customerChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  customerChipSelected: {
    backgroundColor: '#2563eb',
  },
  customerChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  customerChipTextSelected: {
    color: '#ffffff',
  },
  noDataText: {
    fontSize: 14,
    color: '#94a3b8',
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
