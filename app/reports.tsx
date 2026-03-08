import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Download,
} from 'lucide-react-native';
import { useERP, useERPStats } from '@/contexts/ERPContext';
import { LinearGradient } from 'expo-linear-gradient';



export default function ReportsScreen() {
  const stats = useERPStats();
  const { invoices, products, customers, employees } = useERP();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleExportReport = async () => {
    try {
      const reportData = {
        generatedDate: new Date().toISOString(),
        period: selectedPeriod,
        module: selectedModule,
        summary: {
          totalRevenue: stats.totalRevenue,
          totalExpenses: stats.totalExpenses,
          profit: stats.profit,
          totalCustomers: stats.totalCustomers,
          totalEmployees: stats.totalEmployees,
          totalProducts: stats.totalProducts,
        },
        monthlyRevenue,
        topProducts: topProducts.map(p => ({
          name: p.name,
          stock: p.currentStock,
          value: p.currentStock * p.sellingPrice,
        })),
        invoices: invoices.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          date: inv.date,
          total: inv.total,
          status: inv.status,
        })),
      };

      const jsonData = JSON.stringify(reportData, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `erp_report_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(`data:application/json;base64,${btoa(jsonData)}`, {
            mimeType: 'application/json',
            dialogTitle: 'Export Report',
          });
        }
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const monthlyRevenue = useMemo(() => {
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      
      const revenue = invoices
        .filter((inv) => {
          const invMonth = inv.date.substring(0, 7);
          return invMonth === monthKey && inv.status === 'paid';
        })
        .reduce((sum, inv) => sum + inv.total, 0);
      
      last6Months.push({
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        revenue,
      });
    }
    
    return last6Months;
  }, [invoices]);

  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.currentStock * b.sellingPrice) - (a.currentStock * a.sellingPrice))
      .slice(0, 5);
  }, [products]);

  const ReportCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string;
    change: string;
    icon: any;
    color: string;
  }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportCardHeader}>
        <View style={[styles.reportIcon, { backgroundColor: color + '15' }]}>
          <Icon color={color} size={24} />
        </View>
        <View style={styles.reportCardContent}>
          <Text style={styles.reportCardTitle}>{title}</Text>
          <Text style={styles.reportCardValue}>{value}</Text>
        </View>
      </View>
      <View style={styles.reportCardFooter}>
        <TrendingUp size={14} color="#10b981" />
        <Text style={styles.reportCardChange}>{change}</Text>
      </View>
    </View>
  );

  const SimpleBarChart = () => {
    const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Revenue Trend (Last 6 Months)</Text>
        <View style={styles.chart}>
          {monthlyRevenue.map((item, index) => {
            const height = (item.revenue / maxRevenue) * 180;
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View style={[styles.bar, { height: Math.max(height, 4) }]}>
                    <LinearGradient
                      colors={['#3b82f6', '#2563eb']}
                      style={styles.barGradient}
                    />
                  </View>
                </View>
                <Text style={styles.barLabel}>{item.month}</Text>
                <Text style={styles.barValue}>{formatCurrency(item.revenue)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Reports & Analytics',
          headerRight: () => (
            <TouchableOpacity style={styles.headerButton} onPress={handleExportReport}>
              <Download color="#2563eb" size={22} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.moduleSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moduleList}>
            {['all', 'finance', 'hr', 'inventory', 'sales', 'crm'].map((module) => (
              <TouchableOpacity
                key={module}
                style={[
                  styles.moduleChip,
                  selectedModule === module && styles.moduleChipActive,
                ]}
                onPress={() => setSelectedModule(module)}
              >
                <Text
                  style={[
                    styles.moduleChipText,
                    selectedModule === module && styles.moduleChipTextActive,
                  ]}
                >
                  {module.charAt(0).toUpperCase() + module.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.summarySection}>
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Net Profit</Text>
              <BarChart3 color="#ffffff" size={24} />
            </View>
            <Text style={styles.summaryValue}>{formatCurrency(stats.profit)}</Text>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryFooter}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Revenue</Text>
                <Text style={styles.summaryItemValue}>{formatCurrency(stats.totalRevenue)}</Text>
              </View>
              <View style={styles.summaryDividerVertical} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Expenses</Text>
                <Text style={styles.summaryItemValue}>{formatCurrency(stats.totalExpenses)}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.reportsGrid}>
          <ReportCard
            title="Total Customers"
            value={stats.totalCustomers.toString()}
            change="+12% from last month"
            icon={Users}
            color="#3b82f6"
          />
          <ReportCard
            title="Total Products"
            value={stats.totalProducts.toString()}
            change="+5% from last month"
            icon={Package}
            color="#f59e0b"
          />
          <ReportCard
            title="Sales Orders"
            value={stats.totalSalesOrders.toString()}
            change="+8% from last month"
            icon={ShoppingCart}
            color="#10b981"
          />
          <ReportCard
            title="Active Invoices"
            value={invoices.length.toString()}
            change="+3% from last month"
            icon={FileText}
            color="#ec4899"
          />
        </View>

        <SimpleBarChart />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Products by Inventory Value</Text>
          {topProducts.map((product, index) => {
            const value = product.currentStock * product.sellingPrice;
            return (
              <View key={product.id} style={styles.productRow}>
                <View style={styles.productInfo}>
                  <View style={styles.productRank}>
                    <Text style={styles.productRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productStock}>
                      Stock: {product.currentStock} {product.unit}
                    </Text>
                  </View>
                </View>
                <Text style={styles.productValue}>{formatCurrency(value)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Employees</Text>
              <Text style={styles.statValue}>{employees.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Customers</Text>
              <Text style={styles.statValue}>{customers.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Low Stock</Text>
              <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.lowStockProducts}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.pendingInvoices}</Text>
            </View>
          </View>
        </View>

        <View style={styles.exportSection}>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportReport}>
            <Download color="#2563eb" size={20} />
            <Text style={styles.exportButtonText}>Export Full Report</Text>
          </TouchableOpacity>
          <Text style={styles.exportNote}>
            💾 Exports detailed analytics including revenue trends, inventory, and customer data
          </Text>
        </View>
      </ScrollView>
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
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  periodButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  summarySection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  summaryCard: {
    borderRadius: 20,
    padding: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    fontWeight: '600' as const,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#ffffff',
    marginBottom: 20,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#ffffff',
    opacity: 0.2,
    marginBottom: 16,
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDividerVertical: {
    width: 1,
    backgroundColor: '#ffffff',
    opacity: 0.2,
  },
  summaryItemLabel: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 4,
  },
  summaryItemValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  reportsGrid: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportCardContent: {
    flex: 1,
  },
  reportCardTitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  reportCardValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  reportCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportCardChange: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600' as const,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 220,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    height: 180,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  bar: {
    width: 32,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barGradient: {
    flex: 1,
  },
  barLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
    fontWeight: '600' as const,
  },
  barValue: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 16,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  productRank: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productRankText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#2563eb',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  productStock: {
    fontSize: 12,
    color: '#64748b',
  },
  productValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#2563eb',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  exportSection: {
    padding: 16,
    paddingBottom: 32,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#2563eb',
  },
  exportNote: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  moduleSelector: {
    marginBottom: 16,
  },
  moduleList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  moduleChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  moduleChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  moduleChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  moduleChipTextActive: {
    color: '#2563eb',
  },
});
