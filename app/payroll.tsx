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
  DollarSign,
  Plus,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  User,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';

interface PayrollRecord {
  id: string;
  employeeId: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
  paymentDate?: string;
}

export default function PayrollScreen() {
  const { employees } = useERP();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);


  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const processPayroll = () => {
    const newRecords: PayrollRecord[] = employees
      .filter((emp) => emp.status === 'active')
      .map((emp) => {
        const allowances = emp.salary * 0.2;
        const deductions = emp.salary * 0.15;
        const netSalary = emp.salary + allowances - deductions;

        return {
          id: `${emp.id}-${selectedMonth}`,
          employeeId: emp.id,
          month: selectedMonth,
          basicSalary: emp.salary,
          allowances,
          deductions,
          netSalary,
          status: 'processed' as const,
          paymentDate: new Date().toISOString().split('T')[0],
        };
      });

    setPayrollRecords(newRecords);
    setShowProcessModal(false);
    Alert.alert('Success', 'Payroll processed successfully for all employees');
  };

  const totalPayroll = payrollRecords.reduce((sum, record) => sum + record.netSalary, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Payroll Management',
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowProcessModal(true)} style={styles.headerButton}>
              <Plus color="#2563eb" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryLabel}>Total Payroll</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalPayroll)}</Text>
            </View>
            <View style={styles.summaryIcon}>
              <DollarSign color="#ffffff" size={28} />
            </View>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Processed</Text>
              <Text style={styles.summaryStatValue}>
                {payrollRecords.filter((r) => r.status === 'processed').length}
              </Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Paid</Text>
              <Text style={styles.summaryStatValue}>
                {payrollRecords.filter((r) => r.status === 'paid').length}
              </Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Employees</Text>
              <Text style={styles.summaryStatValue}>{employees.filter((e) => e.status === 'active').length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.monthSelector}>
          <Calendar color="#64748b" size={20} />
          <TextInput
            style={styles.monthInput}
            value={selectedMonth}
            onChangeText={setSelectedMonth}
            placeholder="YYYY-MM"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search color="#94a3b8" size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search employees..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {payrollRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <DollarSign color="#cbd5e1" size={64} />
              <Text style={styles.emptyStateText}>No Payroll Records</Text>
              <Text style={styles.emptyStateSubtext}>
                Process payroll for {selectedMonth} to generate records
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setShowProcessModal(true)}
              >
                <Plus color="#ffffff" size={20} />
                <Text style={styles.emptyStateButtonText}>Process Payroll</Text>
              </TouchableOpacity>
            </View>
          ) : (
            payrollRecords.map((record) => {
              const employee = employees.find((e) => e.id === record.employeeId);
              if (!employee) return null;

              const statusColor = record.status === 'paid' ? '#10b981' : '#f59e0b';
              const StatusIcon = record.status === 'paid' ? CheckCircle : Clock;

              return (
                <View key={record.id} style={styles.payrollCard}>
                  <View style={styles.payrollHeader}>
                    <View style={styles.employeeInfo}>
                      <View style={styles.employeeAvatar}>
                        <User color="#ffffff" size={20} />
                      </View>
                      <View>
                        <Text style={styles.employeeName}>{employee.name}</Text>
                        <Text style={styles.employeePosition}>{employee.position}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                      <StatusIcon color={statusColor} size={14} />
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.payrollDivider} />

                  <View style={styles.payrollDetails}>
                    <View style={styles.payrollRow}>
                      <Text style={styles.payrollLabel}>Basic Salary</Text>
                      <Text style={styles.payrollValue}>{formatCurrency(record.basicSalary)}</Text>
                    </View>
                    <View style={styles.payrollRow}>
                      <Text style={styles.payrollLabel}>Allowances</Text>
                      <Text style={[styles.payrollValue, { color: '#10b981' }]}>
                        +{formatCurrency(record.allowances)}
                      </Text>
                    </View>
                    <View style={styles.payrollRow}>
                      <Text style={styles.payrollLabel}>Deductions</Text>
                      <Text style={[styles.payrollValue, { color: '#ef4444' }]}>
                        -{formatCurrency(record.deductions)}
                      </Text>
                    </View>
                    <View style={styles.payrollDivider} />
                    <View style={styles.payrollRow}>
                      <Text style={styles.payrollLabelFinal}>Net Salary</Text>
                      <Text style={styles.payrollValueFinal}>{formatCurrency(record.netSalary)}</Text>
                    </View>
                  </View>

                  {record.paymentDate && (
                    <View style={styles.payrollFooter}>
                      <Calendar color="#64748b" size={14} />
                      <Text style={styles.paymentDate}>Paid on: {record.paymentDate}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      <Modal
        visible={showProcessModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProcessModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Process Payroll</Text>
              <TouchableOpacity onPress={() => setShowProcessModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Process payroll for all active employees for {selectedMonth}?
            </Text>

            <View style={styles.processInfo}>
              <View style={styles.processInfoRow}>
                <Text style={styles.processInfoLabel}>Active Employees:</Text>
                <Text style={styles.processInfoValue}>
                  {employees.filter((e) => e.status === 'active').length}
                </Text>
              </View>
              <View style={styles.processInfoRow}>
                <Text style={styles.processInfoLabel}>Period:</Text>
                <Text style={styles.processInfoValue}>{selectedMonth}</Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowProcessModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={processPayroll}>
                <Text style={styles.modalButtonPrimaryText}>Process Payroll</Text>
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
  summaryCard: {
    backgroundColor: '#2563eb',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#ffffff',
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  monthInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600' as const,
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
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  payrollCard: {
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
  payrollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  employeePosition: {
    fontSize: 13,
    color: '#64748b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  payrollDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  payrollDetails: {
    gap: 8,
  },
  payrollRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payrollLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  payrollValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  payrollLabelFinal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  payrollValueFinal: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#2563eb',
  },
  payrollFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 6,
  },
  paymentDate: {
    fontSize: 12,
    color: '#64748b',
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
  modalClose: {
    fontSize: 24,
    color: '#64748b',
  },
  modalDescription: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 22,
  },
  processInfo: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  processInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  processInfoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  processInfoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
});
