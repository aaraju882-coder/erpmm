import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import {
  TrendingUp,
  FileText,
  ShoppingCart,
  DollarSign,
  Target,
  Award,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { SalesQuotation, SalesTarget, Commission } from '@/types/erp';

export default function SalesScreen() {
  const router = useRouter();
  const {
    salesQuotations,
    salesOrders,
    invoices,
    customers,
    salesTargets,
    commissions,
    updateSalesQuotation,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'overview' | 'quotations' | 'targets' | 'commissions'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const salesStats = useMemo(() => {
    const totalQuotations = salesQuotations.length;
    const acceptedQuotations = salesQuotations.filter((q) => q.status === 'accepted').length;
    const conversionRate = totalQuotations > 0 ? (acceptedQuotations / totalQuotations) * 100 : 0;
    
    const totalOrders = salesOrders.length;
    const totalRevenue = invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const pendingQuotations = salesQuotations.filter((q) => q.status === 'sent').length;
    const activeTargets = salesTargets.filter((t) => t.status === 'active').length;
    
    return {
      totalQuotations,
      acceptedQuotations,
      conversionRate,
      totalOrders,
      totalRevenue,
      pendingQuotations,
      activeTargets,
    };
  }, [salesQuotations, salesOrders, invoices, salesTargets]);

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color,
  }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Icon color={color} size={24} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const QuotationCard = ({ quotation }: { quotation: SalesQuotation }) => {
    const customer = customers.find((c) => c.id === quotation.customerId);
    
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'accepted':
          return '#10b981';
        case 'rejected':
          return '#ef4444';
        case 'expired':
          return '#64748b';
        case 'sent':
          return '#f59e0b';
        default:
          return '#94a3b8';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'accepted':
          return CheckCircle;
        case 'rejected':
        case 'expired':
          return XCircle;
        case 'sent':
          return Clock;
        default:
          return FileText;
      }
    };

    const StatusIcon = getStatusIcon(quotation.status);

    return (
      <TouchableOpacity style={styles.quotationCard}>
        <View style={styles.quotationHeader}>
          <View>
            <Text style={styles.quotationNumber}>{quotation.quotationNumber}</Text>
            <Text style={styles.quotationCustomer}>{customer?.name || 'Unknown'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(quotation.status) + '15' }]}>
            <StatusIcon color={getStatusColor(quotation.status)} size={14} />
            <Text style={[styles.statusText, { color: getStatusColor(quotation.status) }]}>
              {quotation.status}
            </Text>
          </View>
        </View>
        <View style={styles.quotationDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(quotation.date).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Valid Until:</Text>
            <Text style={styles.detailValue}>
              {new Date(quotation.validUntil).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.quotationAmount}>${quotation.total.toFixed(2)}</Text>
          </View>
        </View>
        {quotation.status === 'sent' && (
          <View style={styles.quotationActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => {
                updateSalesQuotation(quotation.id, { status: 'accepted' });
                Alert.alert('Success', 'Quotation accepted');
              }}
            >
              <CheckCircle color="#ffffff" size={16} />
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => {
                updateSalesQuotation(quotation.id, { status: 'rejected' });
                Alert.alert('Success', 'Quotation rejected');
              }}
            >
              <XCircle color="#ffffff" size={16} />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const TargetCard = ({ target }: { target: SalesTarget }) => {
    const progress = (target.achievedAmount / target.targetAmount) * 100;
    const unitsProgress = (target.achievedUnits / target.targetUnits) * 100;

    return (
      <View style={styles.targetCard}>
        <View style={styles.targetHeader}>
          <View style={[styles.targetIcon, { backgroundColor: '#8b5cf6' + '15' }]}>
            <Target color="#8b5cf6" size={24} />
          </View>
          <View style={styles.targetInfo}>
            <Text style={styles.targetPeriod}>{target.period}</Text>
            <Text style={styles.targetStatus}>{target.status}</Text>
          </View>
        </View>
        <View style={styles.targetProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Revenue Progress</Text>
            <Text style={styles.progressPercent}>{progress.toFixed(1)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          <View style={styles.progressValues}>
            <Text style={styles.progressValue}>${target.achievedAmount.toLocaleString()}</Text>
            <Text style={styles.progressTarget}>/ ${target.targetAmount.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.targetProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Units Progress</Text>
            <Text style={styles.progressPercent}>{unitsProgress.toFixed(1)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(unitsProgress, 100)}%`, backgroundColor: '#10b981' }]} />
          </View>
          <View style={styles.progressValues}>
            <Text style={styles.progressValue}>{target.achievedUnits} units</Text>
            <Text style={styles.progressTarget}>/ {target.targetUnits} units</Text>
          </View>
        </View>
      </View>
    );
  };

  const CommissionCard = ({ commission }: { commission: Commission }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'paid':
          return '#10b981';
        case 'approved':
          return '#2563eb';
        default:
          return '#f59e0b';
      }
    };

    return (
      <View style={styles.commissionCard}>
        <View style={styles.commissionHeader}>
          <View style={[styles.commissionIcon, { backgroundColor: '#ec4899' + '15' }]}>
            <Award color="#ec4899" size={20} />
          </View>
          <View style={styles.commissionInfo}>
            <Text style={styles.commissionType}>{commission.transactionType}</Text>
            <Text style={styles.commissionPeriod}>{commission.period}</Text>
          </View>
          <View style={[styles.commissionBadge, { backgroundColor: getStatusColor(commission.status) + '15' }]}>
            <Text style={[styles.commissionBadgeText, { color: getStatusColor(commission.status) }]}>
              {commission.status}
            </Text>
          </View>
        </View>
        <View style={styles.commissionDetails}>
          <View style={styles.commissionRow}>
            <Text style={styles.commissionLabel}>Transaction:</Text>
            <Text style={styles.commissionValue}>${commission.amount.toFixed(2)}</Text>
          </View>
          <View style={styles.commissionRow}>
            <Text style={styles.commissionLabel}>Rate:</Text>
            <Text style={styles.commissionValue}>{commission.rate}%</Text>
          </View>
          <View style={styles.commissionRow}>
            <Text style={styles.commissionLabel}>Commission:</Text>
            <Text style={styles.commissionAmount}>${commission.commissionAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.statsGrid}>
              <StatCard
                icon={FileText}
                title="Total Quotations"
                value={salesStats.totalQuotations}
                subtitle={`${salesStats.conversionRate.toFixed(1)}% conversion`}
                color="#2563eb"
              />
              <StatCard
                icon={ShoppingCart}
                title="Total Orders"
                value={salesStats.totalOrders}
                color="#10b981"
              />
              <StatCard
                icon={DollarSign}
                title="Total Revenue"
                value={`$${salesStats.totalRevenue.toLocaleString()}`}
                color="#8b5cf6"
              />
              <StatCard
                icon={Clock}
                title="Pending Quotations"
                value={salesStats.pendingQuotations}
                color="#f59e0b"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Quotations</Text>
              {salesQuotations.slice(0, 3).map((quotation) => (
                <QuotationCard key={quotation.id} quotation={quotation} />
              ))}
              {salesQuotations.length === 0 && (
                <View style={styles.emptyState}>
                  <FileText color="#cbd5e1" size={48} />
                  <Text style={styles.emptyStateText}>No quotations yet</Text>
                </View>
              )}
            </View>
          </ScrollView>
        );

      case 'quotations':
        return (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {salesQuotations.map((quotation) => (
              <QuotationCard key={quotation.id} quotation={quotation} />
            ))}
            {salesQuotations.length === 0 && (
              <View style={styles.emptyState}>
                <FileText color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>No quotations yet</Text>
              </View>
            )}
          </ScrollView>
        );

      case 'targets':
        return (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {salesTargets.map((target) => (
              <TargetCard key={target.id} target={target} />
            ))}
            {salesTargets.length === 0 && (
              <View style={styles.emptyState}>
                <Target color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>No sales targets set</Text>
              </View>
            )}
          </ScrollView>
        );

      case 'commissions':
        return (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {commissions.map((commission) => (
              <CommissionCard key={commission.id} commission={commission} />
            ))}
            {commissions.length === 0 && (
              <View style={styles.emptyState}>
                <Award color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>No commissions recorded</Text>
              </View>
            )}
          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Sales Management',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '700' },
        }}
      />

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search color="#64748b" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search quotations, orders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter color="#64748b" size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <TrendingUp color={activeTab === 'overview' ? '#2563eb' : '#64748b'} size={20} />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'quotations' && styles.tabActive]}
          onPress={() => setActiveTab('quotations')}
        >
          <FileText color={activeTab === 'quotations' ? '#2563eb' : '#64748b'} size={20} />
          <Text style={[styles.tabText, activeTab === 'quotations' && styles.tabTextActive]}>
            Quotations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'targets' && styles.tabActive]}
          onPress={() => setActiveTab('targets')}
        >
          <Target color={activeTab === 'targets' ? '#2563eb' : '#64748b'} size={20} />
          <Text style={[styles.tabText, activeTab === 'targets' && styles.tabTextActive]}>
            Targets
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'commissions' && styles.tabActive]}
          onPress={() => setActiveTab('commissions')}
        >
          <Award color={activeTab === 'commissions' ? '#2563eb' : '#64748b'} size={20} />
          <Text style={[styles.tabText, activeTab === 'commissions' && styles.tabTextActive]}>
            Commissions
          </Text>
        </TouchableOpacity>
      </View>

      {renderContent()}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/pos')}
      >
        <ShoppingCart color="#ffffff" size={24} />
      </TouchableOpacity>
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
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#0f172a',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  tabTextActive: {
    color: '#2563eb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#10b981',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 16,
  },
  quotationCard: {
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
  quotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  quotationNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  quotationCustomer: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  quotationDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    color: '#0f172a',
  },
  quotationAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#2563eb',
  },
  quotationActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  targetCard: {
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
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  targetIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  targetInfo: {
    flex: 1,
  },
  targetPeriod: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  targetStatus: {
    fontSize: 13,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  targetProgress: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#2563eb',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  progressValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  progressValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  progressTarget: {
    fontSize: 13,
    color: '#64748b',
  },
  commissionCard: {
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
  commissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  commissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commissionInfo: {
    flex: 1,
  },
  commissionType: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  commissionPeriod: {
    fontSize: 12,
    color: '#64748b',
  },
  commissionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  commissionBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  commissionDetails: {
    gap: 6,
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commissionLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  commissionValue: {
    fontSize: 13,
    color: '#0f172a',
  },
  commissionAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#ec4899',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
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
    elevation: 6,
  },
});
