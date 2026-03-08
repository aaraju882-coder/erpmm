import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CheckSquare,
  Phone,
  Bell,
  MessageSquare,
  ShoppingBag,
  Users as VendorsIcon,
  Scan,
  Settings,
  ChevronRight,
  FileText,
  Briefcase,
  Boxes,
  Clock,
  PiggyBank,
  DollarSign,
  FileBarChart,
  ShoppingCart,
  TrendingUp,
  Factory,
  CheckCircle,
  Workflow,
  History,
  UserCog,
  Truck,
  RotateCcw,
  Folder,
  BellRing,
  CalendarDays,
  ClipboardCheck,
  Percent,
  Target,
  Building,
  Shield,
  PieChart,
  Link,
  Car,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { useAuth } from '@/contexts/AuthContext';

export default function MoreScreen() {
  const router = useRouter();
  const { currentUser, hasPermission, isAdminOrSuperuser } = useAuth();
  const {
    tasks,
    contacts,
    reminders,
    enquiries,
    vendors,
    purchaseOrders,
    projects,
    assets,
    budgets,
    posTransactions,
    salesQuotations,
    productionOrders,
    qualityChecks,
    workflowAutomations,
    auditLogs,
    shipmentTracking,
    returnOrders,
    documents,
    notifications,
    leaveRequests,
    approvals,
    commissions,
    salesTargets,
  } = useERP();

  const pendingTasks = tasks.filter((t) => t.status !== 'done').length;
  const activeReminders = reminders.filter((r) => r.status === 'active').length;
  const openEnquiries = enquiries.filter((e) => !['resolved', 'closed'].includes(e.status)).length;
  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const pendingLeaves = leaveRequests.filter((r) => r.status === 'pending').length;
  const pendingApprovals = approvals.filter((a) => a.status === 'pending').length;

  const MenuItem = ({
    icon: Icon,
    title,
    subtitle,
    badge,
    onPress,
    color = '#2563eb',
  }: {
    icon: any;
    title: string;
    subtitle: string;
    badge?: number;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, { backgroundColor: color + '15' }]}>
          <Icon color={color} size={24} />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <ChevronRight color="#94a3b8" size={20} />
      </View>
    </TouchableOpacity>
  );

  const showAdmin = hasPermission('users', 'read') || isAdminOrSuperuser;
  const showSales = hasPermission('sales', 'read');
  const showPurchase = hasPermission('purchase', 'read');
  const showManufacturing = hasPermission('manufacturing', 'read');
  const showHR = hasPermission('hr', 'read');
  const showProjects = hasPermission('projects', 'read');
  const showFinance = hasPermission('finance', 'read');
  const showReports = hasPermission('reports', 'read');
  const showInventory = hasPermission('inventory', 'read');
  const showCRM = hasPermission('crm', 'read');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
        <Text style={styles.headerSubtitle}>
          {isAdminOrSuperuser ? 'Full access — All modules' : `Logged in as ${currentUser?.role ?? 'user'}`}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {showAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administration</Text>

            <MenuItem
              icon={UserCog}
              title="User Management"
              subtitle="Manage users and permissions"
              onPress={() => router.push('/users')}
              color="#dc2626"
            />

            <MenuItem
              icon={Building}
              title="Company Profile"
              subtitle="Manage company details"
              onPress={() => router.push('/company')}
              color="#1e40af"
            />

            <MenuItem
              icon={ClipboardCheck}
              title="Approvals"
              subtitle="Manage approval workflows"
              badge={pendingApprovals}
              onPress={() => router.push('/approvals')}
              color="#f59e0b"
            />

            <MenuItem
              icon={History}
              title="Audit Logs"
              subtitle="Track all system activities"
              badge={auditLogs.length}
              onPress={() => router.push('/audit-logs')}
              color="#64748b"
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Intelligence</Text>

          <MenuItem
            icon={PieChart}
            title="Analytics Dashboard"
            subtitle="KPIs, trends & business insights"
            onPress={() => router.push('/analytics')}
            color="#db2777"
          />

          <MenuItem
            icon={Link}
            title="Supply Chain"
            subtitle="Track logistics & procurement"
            badge={shipmentTracking.filter((s) => s.status === 'in-transit').length}
            onPress={() => router.push('/supply-chain')}
            color="#0891b2"
          />

          <MenuItem
            icon={Car}
            title="Fleet Management"
            subtitle="Vehicle tracking & maintenance"
            onPress={() => router.push('/fleet-management')}
            color="#7c3aed"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications & Alerts</Text>

          <MenuItem
            icon={BellRing}
            title="Notifications"
            subtitle="View all system notifications"
            badge={unreadNotifications}
            onPress={() => router.push('/notifications')}
            color="#3b82f6"
          />
        </View>

        {showSales && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sales & POS</Text>

            <MenuItem
              icon={ShoppingCart}
              title="Point of Sale"
              subtitle="Process sales transactions"
              badge={posTransactions.length}
              onPress={() => router.push('/pos')}
              color="#10b981"
            />

            <MenuItem
              icon={TrendingUp}
              title="Sales Management"
              subtitle="Quotations, targets & commissions"
              badge={salesQuotations.length}
              onPress={() => router.push('/sales')}
              color="#2563eb"
            />

            <MenuItem
              icon={Target}
              title="Sales Targets"
              subtitle="Track sales team performance"
              badge={salesTargets.filter((t) => t.status === 'active').length}
              onPress={() => router.push('/sales-targets')}
              color="#8b5cf6"
            />

            <MenuItem
              icon={Percent}
              title="Commissions"
              subtitle="Sales commissions tracking"
              badge={commissions.filter((c) => c.status === 'pending').length}
              onPress={() => router.push('/commissions')}
              color="#ec4899"
            />
          </View>
        )}

        {(showSales || showInventory) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping & Returns</Text>

            <MenuItem
              icon={Truck}
              title="Shipment Tracking"
              subtitle="Track shipments & deliveries"
              badge={shipmentTracking.filter((s) => s.status === 'in-transit').length}
              onPress={() => router.push('/shipments')}
              color="#0891b2"
            />

            <MenuItem
              icon={RotateCcw}
              title="Returns"
              subtitle="Manage product returns & refunds"
              badge={returnOrders.filter((r) => r.status === 'pending').length}
              onPress={() => router.push('/returns')}
              color="#7c3aed"
            />
          </View>
        )}

        {showManufacturing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Production & Quality</Text>

            <MenuItem
              icon={Factory}
              title="Manufacturing"
              subtitle="Production orders & BOM"
              badge={productionOrders.length}
              onPress={() => router.push('/manufacturing')}
              color="#8b5cf6"
            />

            <MenuItem
              icon={CheckCircle}
              title="Quality Control"
              subtitle="Quality checks & inspections"
              badge={qualityChecks.length}
              onPress={() => router.push('/quality-control')}
              color="#06b6d4"
            />
          </View>
        )}

        {showHR && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HR & Leave Management</Text>

            <MenuItem
              icon={CalendarDays}
              title="Leave Requests"
              subtitle="Submit & manage leave requests"
              badge={pendingLeaves}
              onPress={() => router.push('/leave-requests')}
              color="#10b981"
            />
          </View>
        )}

        {showProjects && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project & Task Management</Text>

            <MenuItem
              icon={Briefcase}
              title="Projects"
              subtitle="Manage projects and milestones"
              badge={projects.length}
              onPress={() => router.push('/projects')}
              color="#2563eb"
            />

            <MenuItem
              icon={CheckSquare}
              title="Tasks"
              subtitle="Manage team tasks and projects"
              badge={pendingTasks}
              onPress={() => router.push('/tasks')}
              color="#8b5cf6"
            />

            <MenuItem
              icon={Bell}
              title="Reminders"
              subtitle="Set and manage reminders"
              badge={activeReminders}
              onPress={() => router.push('/reminders')}
              color="#f59e0b"
            />
          </View>
        )}

        {showAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Automation</Text>

            <MenuItem
              icon={Workflow}
              title="Workflows"
              subtitle="Automate business processes"
              badge={workflowAutomations.filter((w) => w.status === 'active').length}
              onPress={() => router.push('/workflows')}
              color="#ec4899"
            />
          </View>
        )}

        {showCRM && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Communication</Text>

            <MenuItem
              icon={Phone}
              title="Contacts"
              subtitle="Manage your phonebook"
              badge={contacts.length}
              onPress={() => router.push('/contacts')}
              color="#06b6d4"
            />

            <MenuItem
              icon={MessageSquare}
              title="Enquiries"
              subtitle="Customer enquiries & follow-ups"
              badge={openEnquiries}
              onPress={() => router.push('/enquiries')}
              color="#ec4899"
            />
          </View>
        )}

        {showPurchase && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Procurement</Text>

            <MenuItem
              icon={VendorsIcon}
              title="Vendors"
              subtitle="Manage vendor relationships"
              badge={vendors.length}
              onPress={() => router.push('/vendors')}
              color="#10b981"
            />

            <MenuItem
              icon={ShoppingBag}
              title="Purchase Orders"
              subtitle="Track purchase orders"
              badge={purchaseOrders.length}
              onPress={() => router.push('/purchase-orders')}
              color="#3b82f6"
            />
          </View>
        )}

        {showFinance && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Asset & Finance Management</Text>

            <MenuItem
              icon={Boxes}
              title="Assets"
              subtitle="Track company assets"
              badge={assets.length}
              onPress={() => router.push('/assets')}
              color="#8b5cf6"
            />

            <MenuItem
              icon={Clock}
              title="Timesheets"
              subtitle="Track time and attendance"
              onPress={() => router.push('/timesheets')}
              color="#06b6d4"
            />

            <MenuItem
              icon={PiggyBank}
              title="Budgets"
              subtitle="Budget planning & tracking"
              badge={budgets.length}
              onPress={() => router.push('/budgets')}
              color="#10b981"
            />

            <MenuItem
              icon={DollarSign}
              title="Payroll"
              subtitle="Employee payroll management"
              onPress={() => router.push('/payroll')}
              color="#f59e0b"
            />

            <MenuItem
              icon={FileBarChart}
              title="Chart of Accounts"
              subtitle="Accounting chart management"
              onPress={() => router.push('/chart-of-accounts')}
              color="#ec4899"
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents & Tools</Text>

          <MenuItem
            icon={Folder}
            title="Documents"
            subtitle="Document management system"
            badge={documents.length}
            onPress={() => router.push('/documents')}
            color="#0d9488"
          />

          <MenuItem
            icon={Scan}
            title="QR & Barcode Scanner"
            subtitle="Scan products and documents"
            onPress={() => router.push('/scanner')}
            color="#ef4444"
          />

          {showReports && (
            <MenuItem
              icon={FileText}
              title="Reports"
              subtitle="Generate business reports"
              onPress={() => router.push('/reports')}
              color="#64748b"
            />
          )}

          <MenuItem
            icon={Settings}
            title="Settings"
            subtitle="App settings and preferences"
            onPress={() => router.push('/settings')}
            color="#64748b"
          />
        </View>

        {!isAdminOrSuperuser && (
          <View style={styles.accessNotice}>
            <Shield size={16} color="#94a3b8" />
            <Text style={styles.accessNoticeText}>
              Some modules may be hidden based on your access level. Contact your admin for more access.
            </Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748b',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  accessNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },
  accessNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 17,
  },
});
