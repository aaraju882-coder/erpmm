import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Wallet,
  CreditCard,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type PeriodType = 'today' | 'week' | 'month' | 'year';

export default function AnalyticsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodType>('month');
  const {
    invoices,
    expenses,
    customers,
    products,
    employees,
    salesOrders,
    posTransactions,
    leads,
    purchaseOrders,
  } = useERP();

  const analytics = useMemo(() => {
    const now = new Date();
    const filterByPeriod = (dateStr: string) => {
      const date = new Date(dateStr);
      switch (period) {
        case 'today':
          return date.toDateString() === now.toDateString();
        case 'week': {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return date >= weekAgo;
        }
        case 'month': {
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }
        case 'year':
          return date.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    };

    const periodInvoices = invoices.filter(i => filterByPeriod(i.date));
    const periodExpenses = expenses.filter(e => filterByPeriod(e.date));
    const periodSales = salesOrders.filter(o => filterByPeriod(o.date));
    const periodPOS = posTransactions.filter(t => filterByPeriod(t.date));

    const revenue = periodInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
    const expenseTotal = periodExpenses.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0);
    const posRevenue = periodPOS.filter(t => t.status === 'completed').reduce((s, t) => s + t.total, 0);
    const orderValue = periodSales.reduce((s, o) => s + o.total, 0);

    const paidInvoices = periodInvoices.filter(i => i.status === 'paid').length;
    const overdueInvoices = periodInvoices.filter(i => i.status === 'overdue').length;

    const topProducts = products.map(p => {
      const soldQty = periodPOS.reduce((sum, t) => {
        return sum + t.items.filter(item => item.productId === p.id).reduce((s, item) => s + item.quantity, 0);
      }, 0);
      return { ...p, soldQty };
    }).sort((a, b) => b.soldQty - a.soldQty).slice(0, 5);

    const leadsByStage = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map(stage => ({
      stage,
      count: leads.filter(l => l.stage === stage).length,
      value: leads.filter(l => l.stage === stage).reduce((s, l) => s + l.value, 0),
    }));

    const expenseByCategory: Record<string, number> = {};
    periodExpenses.forEach(e => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });

    const topExpenseCategories = Object.entries(expenseByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    const customerGrowth = customers.filter(c => filterByPeriod(c.createdAt)).length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;

    return {
      revenue,
      expenseTotal,
      profit: revenue - expenseTotal,
      posRevenue,
      orderValue,
      paidInvoices,
      overdueInvoices,
      totalInvoices: periodInvoices.length,
      topProducts,
      leadsByStage,
      topExpenseCategories,
      customerGrowth,
      activeCustomers,
      avgOrderValue: periodSales.length > 0 ? orderValue / periodSales.length : 0,
      totalOrders: periodSales.length,
      totalPOSTransactions: periodPOS.length,
    };
  }, [period, invoices, expenses, customers, products, salesOrders, posTransactions, leads]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      new: '#3b82f6', contacted: '#8b5cf6', qualified: '#06b6d4',
      proposal: '#f59e0b', negotiation: '#ec4899', won: '#10b981', lost: '#ef4444',
    };
    return colors[stage] || '#64748b';
  };

  const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${Math.min((value / Math.max(max, 1)) * 100, 100)}%`, backgroundColor: color }]} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#0f172a" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.periodSelector}>
        {(['today', 'week', 'month', 'year'] as PeriodType[]).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient colors={['#0ea5e9', '#0284c7']} style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Revenue</Text>
              <Text style={styles.summaryValue}>{formatCurrency(analytics.revenue)}</Text>
              <View style={styles.summaryTrend}>
                <ArrowUpRight color="#34d399" size={14} />
                <Text style={styles.summaryTrendText}>+{analytics.paidInvoices} invoices</Text>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={styles.summaryValue}>{formatCurrency(analytics.expenseTotal)}</Text>
              <View style={styles.summaryTrend}>
                <ArrowDownRight color="#fbbf24" size={14} />
                <Text style={styles.summaryTrendText}>{analytics.topExpenseCategories.length} categories</Text>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Net Profit</Text>
              <Text style={[styles.summaryValue, analytics.profit >= 0 ? { color: '#34d399' } : { color: '#f87171' }]}>
                {formatCurrency(analytics.profit)}
              </Text>
              <View style={styles.summaryTrend}>
                {analytics.profit >= 0 ? <TrendingUp color="#34d399" size={14} /> : <TrendingDown color="#f87171" size={14} />}
                <Text style={styles.summaryTrendText}>
                  {analytics.revenue > 0 ? `${((analytics.profit / analytics.revenue) * 100).toFixed(0)}% margin` : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#ecfdf5' }]}>
              <ShoppingCart color="#059669" size={18} />
            </View>
            <Text style={styles.kpiValue}>{analytics.totalPOSTransactions}</Text>
            <Text style={styles.kpiLabel}>POS Sales</Text>
            <Text style={styles.kpiSub}>{formatCurrency(analytics.posRevenue)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#eff6ff' }]}>
              <CreditCard color="#2563eb" size={18} />
            </View>
            <Text style={styles.kpiValue}>{analytics.totalOrders}</Text>
            <Text style={styles.kpiLabel}>Orders</Text>
            <Text style={styles.kpiSub}>{formatCurrency(analytics.avgOrderValue)} avg</Text>
          </View>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#fef3c7' }]}>
              <Users color="#d97706" size={18} />
            </View>
            <Text style={styles.kpiValue}>{analytics.activeCustomers}</Text>
            <Text style={styles.kpiLabel}>Customers</Text>
            <Text style={styles.kpiSub}>+{analytics.customerGrowth} new</Text>
          </View>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#fce7f3' }]}>
              <Target color="#db2777" size={18} />
            </View>
            <Text style={styles.kpiValue}>{analytics.overdueInvoices}</Text>
            <Text style={styles.kpiLabel}>Overdue</Text>
            <Text style={styles.kpiSub}>of {analytics.totalInvoices} total</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <BarChart3 color="#0f172a" size={18} />
            <Text style={styles.sectionCardTitle}>Sales Pipeline</Text>
          </View>
          {analytics.leadsByStage.map(item => (
            <View key={item.stage} style={styles.pipelineRow}>
              <View style={styles.pipelineLabel}>
                <View style={[styles.pipelineDot, { backgroundColor: getStageColor(item.stage) }]} />
                <Text style={styles.pipelineName}>{item.stage.charAt(0).toUpperCase() + item.stage.slice(1)}</Text>
              </View>
              <View style={styles.pipelineBar}>
                <ProgressBar
                  value={item.count}
                  max={Math.max(...analytics.leadsByStage.map(l => l.count), 1)}
                  color={getStageColor(item.stage)}
                />
              </View>
              <View style={styles.pipelineStats}>
                <Text style={styles.pipelineCount}>{item.count}</Text>
                <Text style={styles.pipelineValue}>{formatCurrency(item.value)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Package color="#0f172a" size={18} />
            <Text style={styles.sectionCardTitle}>Top Products</Text>
          </View>
          {analytics.topProducts.length > 0 ? analytics.topProducts.map((p, idx) => (
            <View key={p.id} style={styles.topProductRow}>
              <View style={styles.topProductRank}>
                <Text style={styles.topProductRankText}>{idx + 1}</Text>
              </View>
              <View style={styles.topProductInfo}>
                <Text style={styles.topProductName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.topProductSku}>{p.sku}</Text>
              </View>
              <View style={styles.topProductStats}>
                <Text style={styles.topProductQty}>{p.soldQty} sold</Text>
                <Text style={styles.topProductPrice}>{formatCurrency(p.sellingPrice)}</Text>
              </View>
            </View>
          )) : (
            <Text style={styles.emptyText}>No sales data for this period</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Wallet color="#0f172a" size={18} />
            <Text style={styles.sectionCardTitle}>Expense Breakdown</Text>
          </View>
          {analytics.topExpenseCategories.length > 0 ? analytics.topExpenseCategories.map((cat, idx) => (
            <View key={cat.category} style={styles.expenseRow}>
              <View style={[styles.expenseDot, { backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'][idx % 5] }]} />
              <Text style={styles.expenseCat} numberOfLines={1}>{cat.category}</Text>
              <View style={styles.expenseBarWrap}>
                <ProgressBar
                  value={cat.amount}
                  max={analytics.topExpenseCategories[0]?.amount || 1}
                  color={['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'][idx % 5]}
                />
              </View>
              <Text style={styles.expenseAmount}>{formatCurrency(cat.amount)}</Text>
            </View>
          )) : (
            <Text style={styles.emptyText}>No expenses for this period</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Activity color="#0f172a" size={18} />
            <Text style={styles.sectionCardTitle}>Business Health</Text>
          </View>
          <View style={styles.healthGrid}>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Collection Rate</Text>
              <Text style={styles.healthValue}>
                {analytics.totalInvoices > 0
                  ? `${((analytics.paidInvoices / analytics.totalInvoices) * 100).toFixed(0)}%`
                  : 'N/A'}
              </Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Inventory Value</Text>
              <Text style={styles.healthValue}>
                {formatCurrency(products.reduce((s, p) => s + p.currentStock * p.costPrice, 0))}
              </Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Payable to Vendors</Text>
              <Text style={styles.healthValue}>
                {formatCurrency(purchaseOrders.filter(po => po.status !== 'cancelled').reduce((s, po) => s + po.total, 0))}
              </Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Workforce Size</Text>
              <Text style={styles.healthValue}>{employees.filter(e => e.status === 'active').length}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#ffffff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' as const, color: '#0f172a' },
  periodSelector: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16,
  },
  periodBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#ffffff', alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: '#0f172a' },
  periodBtnText: { fontSize: 13, fontWeight: '600' as const, color: '#64748b' },
  periodBtnTextActive: { color: '#ffffff' },
  content: { paddingHorizontal: 16 },
  summaryCard: { borderRadius: 20, padding: 20, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 48, backgroundColor: 'rgba(255,255,255,0.2)' },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' as const, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '800' as const, color: '#ffffff', marginBottom: 4 },
  summaryTrend: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  summaryTrendText: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '500' as const },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  kpiCard: {
    width: (width - 42) / 2, backgroundColor: '#ffffff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  kpiValue: { fontSize: 22, fontWeight: '800' as const, color: '#0f172a', marginBottom: 2 },
  kpiLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' as const },
  kpiSub: { fontSize: 11, color: '#64748b', fontWeight: '500' as const, marginTop: 4 },
  sectionCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  sectionCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionCardTitle: { fontSize: 16, fontWeight: '700' as const, color: '#0f172a' },
  pipelineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  pipelineLabel: { width: 100, flexDirection: 'row', alignItems: 'center', gap: 6 },
  pipelineDot: { width: 8, height: 8, borderRadius: 4 },
  pipelineName: { fontSize: 12, color: '#475569', fontWeight: '500' as const },
  pipelineBar: { flex: 1 },
  pipelineStats: { width: 70, alignItems: 'flex-end' },
  pipelineCount: { fontSize: 13, fontWeight: '700' as const, color: '#0f172a' },
  pipelineValue: { fontSize: 10, color: '#94a3b8' },
  progressBarBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  topProductRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  topProductRank: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  topProductRankText: { fontSize: 12, fontWeight: '700' as const, color: '#475569' },
  topProductInfo: { flex: 1 },
  topProductName: { fontSize: 14, fontWeight: '600' as const, color: '#0f172a' },
  topProductSku: { fontSize: 11, color: '#94a3b8' },
  topProductStats: { alignItems: 'flex-end' },
  topProductQty: { fontSize: 13, fontWeight: '700' as const, color: '#0f172a' },
  topProductPrice: { fontSize: 11, color: '#94a3b8' },
  expenseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  expenseDot: { width: 8, height: 8, borderRadius: 4 },
  expenseCat: { width: 80, fontSize: 12, color: '#475569', fontWeight: '500' as const },
  expenseBarWrap: { flex: 1 },
  expenseAmount: { width: 60, fontSize: 12, fontWeight: '700' as const, color: '#0f172a', textAlign: 'right' as const },
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  healthItem: {
    width: (width - 60) / 2, backgroundColor: '#f8fafc', borderRadius: 12, padding: 14,
  },
  healthLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '500' as const, marginBottom: 6 },
  healthValue: { fontSize: 18, fontWeight: '700' as const, color: '#0f172a' },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' as const, paddingVertical: 16 },
});
