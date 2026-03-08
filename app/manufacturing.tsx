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
import { Stack } from 'expo-router';
import {
  Factory,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Search,
  FileText,
  TrendingUp,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { ProductionOrder, BillOfMaterials } from '@/types/erp';

export default function ManufacturingScreen() {
  const {
    productionOrders,
    billOfMaterials,
    products,
    warehouses,
    updateProductionOrder,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'orders' | 'bom' | 'stats'>('orders');
  const [searchQuery, setSearchQuery] = useState('');

  const productionStats = useMemo(() => {
    const totalOrders = productionOrders.length;
    const inProgress = productionOrders.filter((o) => o.status === 'in-progress').length;
    const completed = productionOrders.filter((o) => o.status === 'completed').length;
    const delayed = productionOrders.filter((o) => o.status === 'on-hold').length;
    const planned = productionOrders.filter((o) => o.status === 'planned').length;

    const completionRate = totalOrders > 0 ? (completed / totalOrders) * 100 : 0;

    return {
      totalOrders,
      inProgress,
      completed,
      delayed,
      planned,
      completionRate,
    };
  }, [productionOrders]);

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

  const ProductionOrderCard = ({ order }: { order: ProductionOrder }) => {
    const product = products.find((p) => p.id === order.productId);
    const warehouse = warehouses.find((w) => w.id === order.warehouseId);

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed':
          return '#10b981';
        case 'in-progress':
          return '#2563eb';
        case 'on-hold':
          return '#f59e0b';
        case 'cancelled':
          return '#ef4444';
        default:
          return '#64748b';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'completed':
          return CheckCircle;
        case 'in-progress':
          return Play;
        case 'on-hold':
          return Pause;
        case 'cancelled':
          return XCircle;
        default:
          return Clock;
      }
    };

    const StatusIcon = getStatusIcon(order.status);
    const progress = (order.completedQuantity / order.quantity) * 100;

    return (
      <TouchableOpacity style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <Text style={styles.orderProduct}>{product?.name || 'Unknown Product'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
            <StatusIcon color={getStatusColor(order.status)} size={14} />
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Warehouse:</Text>
            <Text style={styles.detailValue}>{warehouse?.name || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(order.startDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>
              {order.completedQuantity} / {order.quantity}
            </Text>
          </View>
        </View>

        {order.status !== 'completed' && order.status !== 'cancelled' && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressPercent}>{progress.toFixed(1)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
            </View>
          </View>
        )}

        {order.status === 'planned' && (
          <View style={styles.orderActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={() => {
                updateProductionOrder(order.id, { status: 'in-progress' });
                Alert.alert('Success', 'Production order started');
              }}
            >
              <Play color="#ffffff" size={16} />
              <Text style={styles.actionButtonText}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                updateProductionOrder(order.id, { status: 'cancelled' });
                Alert.alert('Success', 'Production order cancelled');
              }}
            >
              <XCircle color="#ffffff" size={16} />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {order.status === 'in-progress' && (
          <View style={styles.orderActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.pauseButton]}
              onPress={() => {
                updateProductionOrder(order.id, { status: 'on-hold' });
                Alert.alert('Success', 'Production order paused');
              }}
            >
              <Pause color="#ffffff" size={16} />
              <Text style={styles.actionButtonText}>Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => {
                updateProductionOrder(order.id, {
                  status: 'completed',
                  completedQuantity: order.quantity,
                  endDate: new Date().toISOString(),
                });
                Alert.alert('Success', 'Production order completed');
              }}
            >
              <CheckCircle color="#ffffff" size={16} />
              <Text style={styles.actionButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        )}

        {order.status === 'on-hold' && (
          <View style={styles.orderActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.resumeButton]}
              onPress={() => {
                updateProductionOrder(order.id, { status: 'in-progress' });
                Alert.alert('Success', 'Production order resumed');
              }}
            >
              <Play color="#ffffff" size={16} />
              <Text style={styles.actionButtonText}>Resume</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const BOMCard = ({ bom }: { bom: BillOfMaterials }) => {
    const product = products.find((p) => p.id === bom.productId);

    return (
      <View style={styles.bomCard}>
        <View style={styles.bomHeader}>
          <View style={[styles.bomIcon, { backgroundColor: '#8b5cf6' + '15' }]}>
            <FileText color="#8b5cf6" size={24} />
          </View>
          <View style={styles.bomInfo}>
            <Text style={styles.bomProduct}>{product?.name || 'Unknown'}</Text>
            <Text style={styles.bomVersion}>Version {bom.version}</Text>
          </View>
          <View
            style={[
              styles.bomBadge,
              { backgroundColor: bom.status === 'active' ? '#10b981' + '15' : '#64748b' + '15' },
            ]}
          >
            <Text
              style={[
                styles.bomBadgeText,
                { color: bom.status === 'active' ? '#10b981' : '#64748b' },
              ]}
            >
              {bom.status}
            </Text>
          </View>
        </View>

        <Text style={styles.componentsTitle}>Components ({bom.components.length}):</Text>
        {bom.components.slice(0, 3).map((component) => {
          const componentProduct = products.find((p) => p.id === component.productId);
          return (
            <View key={component.id} style={styles.componentRow}>
              <Text style={styles.componentName}>{componentProduct?.name || 'Unknown'}</Text>
              <Text style={styles.componentQty}>
                {component.quantity} {component.unit}
              </Text>
            </View>
          );
        })}
        {bom.components.length > 3 && (
          <Text style={styles.moreComponents}>+{bom.components.length - 3} more components</Text>
        )}
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'orders':
        return (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {productionOrders.map((order) => (
              <ProductionOrderCard key={order.id} order={order} />
            ))}
            {productionOrders.length === 0 && (
              <View style={styles.emptyState}>
                <Factory color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>No production orders</Text>
              </View>
            )}
          </ScrollView>
        );

      case 'bom':
        return (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {billOfMaterials.map((bom) => (
              <BOMCard key={bom.id} bom={bom} />
            ))}
            {billOfMaterials.length === 0 && (
              <View style={styles.emptyState}>
                <FileText color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>No Bill of Materials defined</Text>
              </View>
            )}
          </ScrollView>
        );

      case 'stats':
        return (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.statsGrid}>
              <StatCard
                icon={Factory}
                title="Total Orders"
                value={productionStats.totalOrders}
                color="#2563eb"
              />
              <StatCard
                icon={Play}
                title="In Progress"
                value={productionStats.inProgress}
                color="#10b981"
              />
              <StatCard
                icon={CheckCircle}
                title="Completed"
                value={productionStats.completed}
                subtitle={`${productionStats.completionRate.toFixed(1)}% completion rate`}
                color="#8b5cf6"
              />
              <StatCard
                icon={Clock}
                title="Planned"
                value={productionStats.planned}
                color="#64748b"
              />
              <StatCard
                icon={Pause}
                title="On Hold"
                value={productionStats.delayed}
                color="#f59e0b"
              />
            </View>
          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Manufacturing',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '700' },
        }}
      />

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search color="#64748b" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search production orders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Factory color={activeTab === 'orders' ? '#2563eb' : '#64748b'} size={20} />
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bom' && styles.tabActive]}
          onPress={() => setActiveTab('bom')}
        >
          <FileText color={activeTab === 'bom' ? '#2563eb' : '#64748b'} size={20} />
          <Text style={[styles.tabText, activeTab === 'bom' && styles.tabTextActive]}>
            BOM
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
          onPress={() => setActiveTab('stats')}
        >
          <TrendingUp color={activeTab === 'stats' ? '#2563eb' : '#64748b'} size={20} />
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
            Statistics
          </Text>
        </TouchableOpacity>
      </View>

      {renderContent()}

      <TouchableOpacity style={styles.fab}>
        <Plus color="#ffffff" size={24} />
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
    padding: 16,
    backgroundColor: '#ffffff',
  },
  searchContainer: {
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
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  orderProduct: {
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
  orderDetails: {
    gap: 8,
    marginBottom: 12,
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
  progressSection: {
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
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
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
  startButton: {
    backgroundColor: '#10b981',
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
  },
  resumeButton: {
    backgroundColor: '#2563eb',
  },
  completeButton: {
    backgroundColor: '#8b5cf6',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  bomCard: {
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
  bomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bomIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bomInfo: {
    flex: 1,
  },
  bomProduct: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  bomVersion: {
    fontSize: 13,
    color: '#64748b',
  },
  bomBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bomBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  componentsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 12,
  },
  componentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  componentName: {
    fontSize: 14,
    color: '#64748b',
  },
  componentQty: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  moreComponents: {
    fontSize: 13,
    color: '#2563eb',
    marginTop: 8,
    fontWeight: '600' as const,
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
