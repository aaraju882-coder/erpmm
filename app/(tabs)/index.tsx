import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  FileText,
  AlertCircle,
  Briefcase,
  Target,
  ShoppingCart,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  BarChart3,
  Zap,
  ChevronRight,
  CircleDollarSign,
  Wallet,
  PieChart,
} from 'lucide-react-native';
import { useERP, useERPStats } from '@/contexts/ERPContext';
import { useAuth } from '@/contexts/AuthContext';
import { Employee } from '@/types/erp';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const stats = useERPStats();
  const { isLoaded, employees, attendance, invoices, expenses, salesOrders, posTransactions, addAttendance, updateAttendance } = useERP();
  const { currentUser } = useAuth();
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (isLoaded) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [isLoaded, fadeAnim, slideAnim]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  useEffect(() => {
    if (currentUser && employees.length > 0) {
      const emp = employees.find(e => e.email === currentUser.email);
      setMyEmployee(emp || null);
    }
  }, [currentUser, employees]);

  const handleQuickAttendance = useCallback(() => {
    if (!myEmployee) {
      Alert.alert('Not Found', 'No employee profile linked to your account');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const existingAttendance = attendance.find(
      (a) => a.employeeId === myEmployee.id && a.date === today
    );
    if (existingAttendance && !existingAttendance.checkOut) {
      const checkOutTime = new Date();
      const checkInTime = new Date(`${today}T${existingAttendance.checkIn}`);
      const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      updateAttendance(existingAttendance.id, {
        checkOut: checkOutTime.toLocaleTimeString('en-US', { hour12: false }),
        status: 'checked-out',
        hoursWorked: Math.round(hoursWorked * 100) / 100,
      });
      Alert.alert('Check Out', `Checked out!\nHours: ${hoursWorked.toFixed(2)} hrs`);
    } else if (existingAttendance && existingAttendance.checkOut) {
      Alert.alert('Done', 'Attendance already completed for today');
    } else {
      addAttendance({
        id: Date.now().toString(),
        employeeId: myEmployee.id,
        date: today,
        checkIn: new Date().toLocaleTimeString('en-US', { hour12: false }),
        status: 'checked-in',
      });
      Alert.alert('Check In', 'Checked in successfully!');
    }
  }, [myEmployee, attendance, addAttendance, updateAttendance]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const formatCurrencyFull = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const todayRevenue = invoices
    .filter(i => i.status === 'paid' && i.date.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((sum, i) => sum + i.total, 0);

  const todaySales = posTransactions
    .filter(t => t.status === 'completed' && t.date.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((sum, t) => sum + t.total, 0);

  const pendingOrdersCount = salesOrders.filter(o => o.status === 'confirmed' || o.status === 'processing').length;

  const MiniBarChart = ({ data, color }: { data: number[]; color: string }) => {
    const maxVal = Math.max(...data, 1);
    return (
      <View style={styles.miniChart}>
        {data.map((val, idx) => (
          <View
            key={idx}
            style={[
              styles.miniBar,
              {
                height: Math.max((val / maxVal) * 32, 3),
                backgroundColor: color,
                opacity: idx === data.length - 1 ? 1 : 0.4 + (idx / data.length) * 0.6,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Activity color="#0ea5e9" size={32} />
          <Text style={styles.loadingText}>Loading ERP System...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const recentInvoiceAmounts = invoices.slice(-7).map(i => i.total);
  const recentExpenseAmounts = expenses.slice(-7).map(e => e.amount);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.userName}>{currentUser?.fullName || 'User'}</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => router.push('/notifications')}
            >
              <Bell color="#475569" size={22} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
          <View style={styles.roleBadge}>
            <Zap color="#0ea5e9" size={12} />
            <Text style={styles.roleText}>{currentUser?.role?.toUpperCase()}</Text>
          </View>
        </View>

        {myEmployee && (
          <TouchableOpacity style={styles.attendanceStrip} onPress={handleQuickAttendance} activeOpacity={0.7}>
            <View style={styles.attendanceStripLeft}>
              <View style={styles.attendancePulse}>
                <Clock size={20} color="#059669" />
              </View>
              <View>
                <Text style={styles.attendanceStripTitle}>Quick Attendance</Text>
                <Text style={styles.attendanceStripSub}>
                  {attendance.find(a => a.employeeId === myEmployee.id && a.date === new Date().toISOString().split('T')[0])
                    ? attendance.find(a => a.employeeId === myEmployee.id && a.date === new Date().toISOString().split('T')[0])?.checkOut
                      ? '✓ Completed today'
                      : 'Tap to check out'
                    : 'Tap to check in'}
                </Text>
              </View>
            </View>
            <ChevronRight color="#059669" size={20} />
          </TouchableOpacity>
        )}

        <LinearGradient
          colors={['#0f172a', '#1e293b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.revenueCard}
        >
          <View style={styles.revenueHeader}>
            <View>
              <Text style={styles.revenueLabel}>Total Revenue</Text>
              <Text style={styles.revenueAmount}>{formatCurrencyFull(stats.totalRevenue)}</Text>
            </View>
            <View style={styles.revenueBadge}>
              <CircleDollarSign color="#34d399" size={28} />
            </View>
          </View>

          <View style={styles.revenueMetrics}>
            <View style={styles.revenueMetric}>
              <View style={styles.revenueMetricIcon}>
                <ArrowDownRight color="#f87171" size={14} />
              </View>
              <View>
                <Text style={styles.revenueMetricLabel}>Expenses</Text>
                <Text style={styles.revenueMetricValue}>{formatCurrency(stats.totalExpenses)}</Text>
              </View>
            </View>
            <View style={styles.revenueMetricDivider} />
            <View style={styles.revenueMetric}>
              <View style={[styles.revenueMetricIcon, { backgroundColor: '#34d39920' }]}>
                <ArrowUpRight color="#34d399" size={14} />
              </View>
              <View>
                <Text style={styles.revenueMetricLabel}>Net Profit</Text>
                <Text style={[styles.revenueMetricValue, { color: '#34d399' }]}>{formatCurrency(stats.profit)}</Text>
              </View>
            </View>
            <View style={styles.revenueMetricDivider} />
            <View style={styles.revenueMetric}>
              <View style={[styles.revenueMetricIcon, { backgroundColor: '#60a5fa20' }]}>
                <ShoppingCart color="#60a5fa" size={14} />
              </View>
              <View>
                <Text style={styles.revenueMetricLabel}>Today POS</Text>
                <Text style={[styles.revenueMetricValue, { color: '#60a5fa' }]}>{formatCurrency(todaySales)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/pos')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#ecfdf5' }]}>
              <ShoppingCart color="#059669" size={20} />
            </View>
            <Text style={styles.quickActionText}>POS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/sales')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#eff6ff' }]}>
              <TrendingUp color="#2563eb" size={20} />
            </View>
            <Text style={styles.quickActionText}>Sales</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/reports')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#fef3c7' }]}>
              <BarChart3 color="#d97706" size={20} />
            </View>
            <Text style={styles.quickActionText}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/analytics')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#fce7f3' }]}>
              <PieChart color="#db2777" size={20} />
            </View>
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricsGrid}>
          <TouchableOpacity style={[styles.metricCard, { width: CARD_WIDTH }]} onPress={() => router.push('/contacts')}>
            <View style={styles.metricTop}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#eff6ff' }]}>
                <Users color="#2563eb" size={20} />
              </View>
              <MiniBarChart data={[3, 5, 4, 7, 6, 8, 9]} color="#2563eb" />
            </View>
            <Text style={styles.metricValue}>{stats.totalCustomers}</Text>
            <Text style={styles.metricTitle}>Customers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.metricCard, { width: CARD_WIDTH }]} onPress={() => {}}>
            <View style={styles.metricTop}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#fef3c7' }]}>
                <Package color="#d97706" size={20} />
              </View>
              <MiniBarChart data={[6, 4, 7, 5, 8, 6, 7]} color="#d97706" />
            </View>
            <Text style={styles.metricValue}>{stats.totalProducts}</Text>
            <Text style={styles.metricTitle}>Products</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.metricCard, { width: CARD_WIDTH }]} onPress={() => {}}>
            <View style={styles.metricTop}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#ecfdf5' }]}>
                <Briefcase color="#059669" size={20} />
              </View>
              <MiniBarChart data={[2, 3, 4, 3, 5, 4, 6]} color="#059669" />
            </View>
            <Text style={styles.metricValue}>{stats.totalEmployees}</Text>
            <Text style={styles.metricTitle}>Employees</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.metricCard, { width: CARD_WIDTH }]} onPress={() => {}}>
            <View style={styles.metricTop}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#fce7f3' }]}>
                <Target color="#db2777" size={20} />
              </View>
              <MiniBarChart data={[1, 3, 2, 5, 4, 3, 6]} color="#db2777" />
            </View>
            <Text style={styles.metricValue}>{stats.activeLeads}</Text>
            <Text style={styles.metricTitle}>Active Leads</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Revenue Trend</Text>
            <TouchableOpacity onPress={() => router.push('/reports')}>
              <Text style={styles.seeAllText}>View Reports</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.trendCard}>
            <View style={styles.trendRow}>
              <View style={styles.trendItem}>
                <View style={styles.trendIconWrap}>
                  <Wallet color="#059669" size={18} />
                </View>
                <View>
                  <Text style={styles.trendLabel}>Invoices (Last 7)</Text>
                  <View style={styles.trendValueRow}>
                    <MiniBarChart data={recentInvoiceAmounts.length > 0 ? recentInvoiceAmounts : [0]} color="#059669" />
                  </View>
                </View>
              </View>
              <View style={styles.trendItem}>
                <View style={[styles.trendIconWrap, { backgroundColor: '#fef2f2' }]}>
                  <TrendingDown color="#ef4444" size={18} />
                </View>
                <View>
                  <Text style={styles.trendLabel}>Expenses (Last 7)</Text>
                  <View style={styles.trendValueRow}>
                    <MiniBarChart data={recentExpenseAmounts.length > 0 ? recentExpenseAmounts : [0]} color="#ef4444" />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alerts</Text>
          </View>
          <View style={styles.alertsGrid}>
            {stats.pendingInvoices > 0 && (
              <View style={styles.alertItem}>
                <View style={[styles.alertDot, { backgroundColor: '#f59e0b' }]} />
                <FileText color="#f59e0b" size={16} />
                <Text style={styles.alertText}>{stats.pendingInvoices} pending invoices</Text>
              </View>
            )}
            {stats.lowStockProducts > 0 && (
              <View style={styles.alertItem}>
                <View style={[styles.alertDot, { backgroundColor: '#ef4444' }]} />
                <AlertCircle color="#ef4444" size={16} />
                <Text style={styles.alertText}>{stats.lowStockProducts} low stock items</Text>
              </View>
            )}
            {stats.pendingLeaveRequests > 0 && (
              <View style={styles.alertItem}>
                <View style={[styles.alertDot, { backgroundColor: '#8b5cf6' }]} />
                <Briefcase color="#8b5cf6" size={16} />
                <Text style={styles.alertText}>{stats.pendingLeaveRequests} leave requests</Text>
              </View>
            )}
            {stats.pendingTasks > 0 && (
              <View style={styles.alertItem}>
                <View style={[styles.alertDot, { backgroundColor: '#0ea5e9' }]} />
                <Target color="#0ea5e9" size={16} />
                <Text style={styles.alertText}>{stats.pendingTasks} pending tasks</Text>
              </View>
            )}
            {pendingOrdersCount > 0 && (
              <View style={styles.alertItem}>
                <View style={[styles.alertDot, { backgroundColor: '#10b981' }]} />
                <ShoppingCart color="#10b981" size={16} />
                <Text style={styles.alertText}>{pendingOrdersCount} orders to process</Text>
              </View>
            )}
            {stats.pendingInvoices === 0 && stats.lowStockProducts === 0 && stats.pendingLeaveRequests === 0 && stats.pendingTasks === 0 && pendingOrdersCount === 0 && (
              <View style={styles.noAlerts}>
                <Text style={styles.noAlertsText}>All clear — no alerts</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <ShoppingCart color="#64748b" size={18} />
              <Text style={styles.overviewValue}>{stats.totalSalesOrders}</Text>
              <Text style={styles.overviewLabel}>Orders</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <FileText color="#64748b" size={18} />
              <Text style={styles.overviewValue}>{stats.pendingInvoices}</Text>
              <Text style={styles.overviewLabel}>Pending</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Activity color="#64748b" size={18} />
              <Text style={styles.overviewValue}>{posTransactions.length}</Text>
              <Text style={styles.overviewLabel}>POS Sales</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <DollarSign color="#64748b" size={18} />
              <Text style={styles.overviewValue}>{formatCurrency(todayRevenue)}</Text>
              <Text style={styles.overviewLabel}>Today Rev</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  userName: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#0ea5e9',
    letterSpacing: 0.5,
  },
  attendanceStrip: {
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  attendanceStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attendancePulse: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendanceStripTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#065f46',
  },
  attendanceStripSub: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500' as const,
  },
  revenueCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500' as const,
    marginBottom: 6,
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  revenueBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#34d39915',
    justifyContent: 'center',
    alignItems: 'center',
  },
  revenueMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  revenueMetric: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  revenueMetricIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f8717120',
    justifyContent: 'center',
    alignItems: 'center',
  },
  revenueMetricLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500' as const,
  },
  revenueMetricValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  revenueMetricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#334155',
    marginHorizontal: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#475569',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  metricIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 36,
  },
  miniBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 3,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: '#0f172a',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  metricTitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  seeAllText: {
    fontSize: 13,
    color: '#0ea5e9',
    fontWeight: '600' as const,
  },
  trendCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  trendRow: {
    flexDirection: 'row',
    gap: 16,
  },
  trendItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trendIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  trendValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertsGrid: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  alertText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500' as const,
    flex: 1,
  },
  noAlerts: {
    padding: 20,
    alignItems: 'center',
  },
  noAlertsText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  overviewGrid: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 8,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  overviewDivider: {
    width: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  overviewLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500' as const,
  },
});
