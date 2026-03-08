import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  BarChart3,
  ArrowRight,
  Warehouse,
  RefreshCw,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type TabType = 'overview' | 'tracking' | 'procurement' | 'logistics';

export default function SupplyChainScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const {
    shipmentTracking,
    purchaseOrders,
    vendors,
    products,
    warehouses,
    stockMovements,
    updateShipmentTracking,
  } = useERP();

  const stats = useMemo(() => {
    const inTransit = shipmentTracking.filter(s => s.status === 'in-transit').length;
    const delivered = shipmentTracking.filter(s => s.status === 'delivered').length;
    const pending = shipmentTracking.filter(s => s.status === 'pending').length;
    const failed = shipmentTracking.filter(s => s.status === 'failed').length;
    const pendingPO = purchaseOrders.filter(po => po.status === 'sent' || po.status === 'confirmed').length;
    const totalPOValue = purchaseOrders.filter(po => po.status !== 'cancelled').reduce((s, po) => s + po.total, 0);
    const lowStockCount = products.filter(p => p.currentStock <= p.minStock).length;
    const totalInventoryValue = products.reduce((s, p) => s + p.currentStock * p.costPrice, 0);

    return { inTransit, delivered, pending, failed, pendingPO, totalPOValue, lowStockCount, totalInventoryValue };
  }, [shipmentTracking, purchaseOrders, products]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const getShipmentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'in-transit': return '#3b82f6';
      case 'delivered': return '#10b981';
      case 'failed': return '#ef4444';
      case 'returned': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  const getPOStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#64748b';
      case 'sent': return '#3b82f6';
      case 'confirmed': return '#f59e0b';
      case 'received': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  const OverviewTab = () => (
    <View>
      <LinearGradient colors={['#1e40af', '#1d4ed8']} style={styles.overviewBanner}>
        <View style={styles.overviewBannerRow}>
          <View style={styles.overviewBannerItem}>
            <Truck color="#93c5fd" size={20} />
            <Text style={styles.overviewBannerValue}>{stats.inTransit}</Text>
            <Text style={styles.overviewBannerLabel}>In Transit</Text>
          </View>
          <View style={styles.overviewBannerDivider} />
          <View style={styles.overviewBannerItem}>
            <CheckCircle color="#86efac" size={20} />
            <Text style={styles.overviewBannerValue}>{stats.delivered}</Text>
            <Text style={styles.overviewBannerLabel}>Delivered</Text>
          </View>
          <View style={styles.overviewBannerDivider} />
          <View style={styles.overviewBannerItem}>
            <Clock color="#fcd34d" size={20} />
            <Text style={styles.overviewBannerValue}>{stats.pending}</Text>
            <Text style={styles.overviewBannerLabel}>Pending</Text>
          </View>
          <View style={styles.overviewBannerDivider} />
          <View style={styles.overviewBannerItem}>
            <AlertTriangle color="#fca5a5" size={20} />
            <Text style={styles.overviewBannerValue}>{stats.failed}</Text>
            <Text style={styles.overviewBannerLabel}>Failed</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.overviewGrid}>
        <TouchableOpacity style={styles.overviewCard} onPress={() => setActiveTab('procurement')}>
          <View style={[styles.overviewCardIcon, { backgroundColor: '#eff6ff' }]}>
            <Package color="#2563eb" size={22} />
          </View>
          <Text style={styles.overviewCardValue}>{stats.pendingPO}</Text>
          <Text style={styles.overviewCardLabel}>Pending POs</Text>
          <Text style={styles.overviewCardSub}>{formatCurrency(stats.totalPOValue)} total</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.overviewCard} onPress={() => router.push('/purchase-orders')}>
          <View style={[styles.overviewCardIcon, { backgroundColor: '#fef3c7' }]}>
            <BarChart3 color="#d97706" size={22} />
          </View>
          <Text style={styles.overviewCardValue}>{vendors.length}</Text>
          <Text style={styles.overviewCardLabel}>Active Vendors</Text>
          <Text style={styles.overviewCardSub}>{purchaseOrders.length} orders</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.overviewCard}>
          <View style={[styles.overviewCardIcon, { backgroundColor: '#fce7f3' }]}>
            <AlertTriangle color="#db2777" size={22} />
          </View>
          <Text style={styles.overviewCardValue}>{stats.lowStockCount}</Text>
          <Text style={styles.overviewCardLabel}>Low Stock</Text>
          <Text style={styles.overviewCardSub}>Items to reorder</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.overviewCard}>
          <View style={[styles.overviewCardIcon, { backgroundColor: '#ecfdf5' }]}>
            <Warehouse color="#059669" size={22} />
          </View>
          <Text style={styles.overviewCardValue}>{formatCurrency(stats.totalInventoryValue)}</Text>
          <Text style={styles.overviewCardLabel}>Inventory</Text>
          <Text style={styles.overviewCardSub}>{warehouses.length} warehouses</Text>
        </TouchableOpacity>
      </View>

      {products.filter(p => p.currentStock <= p.minStock).length > 0 && (
        <View style={styles.alertSection}>
          <Text style={styles.alertSectionTitle}>Reorder Alerts</Text>
          {products.filter(p => p.currentStock <= p.minStock).slice(0, 5).map(p => (
            <View key={p.id} style={styles.reorderItem}>
              <View style={styles.reorderDot} />
              <View style={styles.reorderInfo}>
                <Text style={styles.reorderName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.reorderSku}>{p.sku}</Text>
              </View>
              <View style={styles.reorderStock}>
                <Text style={styles.reorderStockValue}>{p.currentStock}/{p.minStock}</Text>
                <Text style={styles.reorderStockLabel}>Current/Min</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const TrackingTab = () => {
    const filteredShipments = shipmentTracking.filter(s =>
      s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.carrier.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View>
        {filteredShipments.length > 0 ? filteredShipments.map(shipment => (
          <TouchableOpacity
            key={shipment.id}
            style={styles.shipmentCard}
            onPress={() => {
              Alert.alert(
                'Update Shipment',
                `Tracking: ${shipment.trackingNumber}\nCarrier: ${shipment.carrier}\nStatus: ${shipment.status}`,
                [
                  { text: 'Mark In-Transit', onPress: () => updateShipmentTracking(shipment.id, { status: 'in-transit' }) },
                  { text: 'Mark Delivered', onPress: () => updateShipmentTracking(shipment.id, { status: 'delivered', deliveryDate: new Date().toISOString() }) },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
          >
            <View style={styles.shipmentHeader}>
              <View style={styles.shipmentHeaderLeft}>
                <Truck color={getShipmentStatusColor(shipment.status)} size={20} />
                <View>
                  <Text style={styles.shipmentTrackingNum}>{shipment.trackingNumber}</Text>
                  <Text style={styles.shipmentCarrier}>{shipment.carrier}</Text>
                </View>
              </View>
              <View style={[styles.shipmentStatus, { backgroundColor: getShipmentStatusColor(shipment.status) + '15' }]}>
                <Text style={[styles.shipmentStatusText, { color: getShipmentStatusColor(shipment.status) }]}>
                  {shipment.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.shipmentRoute}>
              <View style={styles.shipmentRoutePoint}>
                <MapPin color="#64748b" size={14} />
                <Text style={styles.shipmentRouteText} numberOfLines={1}>{shipment.origin}</Text>
              </View>
              <ArrowRight color="#94a3b8" size={14} />
              <View style={styles.shipmentRoutePoint}>
                <MapPin color="#0ea5e9" size={14} />
                <Text style={styles.shipmentRouteText} numberOfLines={1}>{shipment.destination}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )) : (
          <View style={styles.emptyState}>
            <Truck color="#cbd5e1" size={48} />
            <Text style={styles.emptyStateText}>No shipments found</Text>
            <Text style={styles.emptyStateSub}>Add shipments to track deliveries</Text>
          </View>
        )}
      </View>
    );
  };

  const ProcurementTab = () => {
    const filteredPOs = purchaseOrders.filter(po =>
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View>
        {filteredPOs.length > 0 ? filteredPOs.map(po => {
          const vendor = vendors.find(v => v.id === po.vendorId);
          return (
            <View key={po.id} style={styles.poCard}>
              <View style={styles.poHeader}>
                <View>
                  <Text style={styles.poNumber}>#{po.poNumber}</Text>
                  <Text style={styles.poVendor}>{vendor?.name || 'Unknown Vendor'}</Text>
                </View>
                <View style={[styles.poStatus, { backgroundColor: getPOStatusColor(po.status) + '15' }]}>
                  <Text style={[styles.poStatusText, { color: getPOStatusColor(po.status) }]}>
                    {po.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.poDivider} />
              <View style={styles.poFooter}>
                <View style={styles.poFooterItem}>
                  <Text style={styles.poFooterLabel}>Amount</Text>
                  <Text style={styles.poFooterValue}>{formatCurrency(po.total)}</Text>
                </View>
                <View style={styles.poFooterItem}>
                  <Text style={styles.poFooterLabel}>Items</Text>
                  <Text style={styles.poFooterValue}>{po.items.length}</Text>
                </View>
                <View style={styles.poFooterItem}>
                  <Text style={styles.poFooterLabel}>Expected</Text>
                  <Text style={styles.poFooterValue}>
                    {new Date(po.expectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
            </View>
          );
        }) : (
          <View style={styles.emptyState}>
            <Package color="#cbd5e1" size={48} />
            <Text style={styles.emptyStateText}>No purchase orders</Text>
            <Text style={styles.emptyStateSub}>Create POs in the procurement module</Text>
          </View>
        )}
      </View>
    );
  };

  const LogisticsTab = () => (
    <View>
      <View style={styles.logisticsSection}>
        <Text style={styles.logisticsSectionTitle}>Warehouse Utilization</Text>
        {warehouses.map(wh => {
          const whProducts = products.filter(p => p.warehouseId === wh.id);
          const totalItems = whProducts.reduce((s, p) => s + p.currentStock, 0);
          const utilization = wh.capacity > 0 ? (totalItems / wh.capacity) * 100 : 0;
          return (
            <View key={wh.id} style={styles.warehouseUtilCard}>
              <View style={styles.warehouseUtilHeader}>
                <View style={styles.warehouseUtilIcon}>
                  <Warehouse color="#8b5cf6" size={18} />
                </View>
                <View style={styles.warehouseUtilInfo}>
                  <Text style={styles.warehouseUtilName}>{wh.name}</Text>
                  <Text style={styles.warehouseUtilLoc}>{wh.location}</Text>
                </View>
                <Text style={[
                  styles.warehouseUtilPercent,
                  { color: utilization > 80 ? '#ef4444' : utilization > 60 ? '#f59e0b' : '#10b981' }
                ]}>
                  {utilization.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.utilizationBarBg}>
                <View style={[
                  styles.utilizationBarFill,
                  {
                    width: `${Math.min(utilization, 100)}%`,
                    backgroundColor: utilization > 80 ? '#ef4444' : utilization > 60 ? '#f59e0b' : '#10b981',
                  }
                ]} />
              </View>
              <View style={styles.warehouseUtilStats}>
                <Text style={styles.warehouseUtilStat}>{whProducts.length} products</Text>
                <Text style={styles.warehouseUtilStat}>{totalItems}/{wh.capacity} capacity</Text>
              </View>
            </View>
          );
        })}
        {warehouses.length === 0 && (
          <View style={styles.emptyState}>
            <Warehouse color="#cbd5e1" size={48} />
            <Text style={styles.emptyStateText}>No warehouses</Text>
            <Text style={styles.emptyStateSub}>Create warehouses in the Inventory module</Text>
          </View>
        )}
      </View>

      <View style={styles.logisticsSection}>
        <Text style={styles.logisticsSectionTitle}>Recent Stock Movements</Text>
        {stockMovements.length > 0 ? stockMovements.slice(-10).reverse().map(mv => {
          const product = products.find(p => p.id === mv.productId);
          return (
            <View key={mv.id} style={styles.movementCard}>
              <View style={[styles.movementIcon, {
                backgroundColor: mv.type === 'in' ? '#ecfdf5' : mv.type === 'out' ? '#fef2f2' : '#eff6ff'
              }]}>
                <RefreshCw color={mv.type === 'in' ? '#059669' : mv.type === 'out' ? '#ef4444' : '#2563eb'} size={16} />
              </View>
              <View style={styles.movementInfo}>
                <Text style={styles.movementProduct} numberOfLines={1}>{product?.name || 'Unknown'}</Text>
                <Text style={styles.movementDate}>
                  {new Date(mv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.movementQty}>
                <Text style={[styles.movementQtyValue, {
                  color: mv.type === 'in' ? '#059669' : mv.type === 'out' ? '#ef4444' : '#2563eb'
                }]}>
                  {mv.type === 'in' ? '+' : mv.type === 'out' ? '-' : ''}{mv.quantity}
                </Text>
                <Text style={styles.movementType}>{mv.type.toUpperCase()}</Text>
              </View>
            </View>
          );
        }) : (
          <View style={styles.emptyState}>
            <RefreshCw color="#cbd5e1" size={48} />
            <Text style={styles.emptyStateText}>No movements yet</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#0f172a" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supply Chain</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabsContainer}>
        {(['overview', 'tracking', 'procurement', 'logistics'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab !== 'overview' && (
        <View style={styles.searchContainer}>
          <Search color="#64748b" size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'tracking' && <TrackingTab />}
        {activeTab === 'procurement' && <ProcurementTab />}
        {activeTab === 'logistics' && <LogisticsTab />}
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
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#ffffff', alignItems: 'center' },
  tabActive: { backgroundColor: '#0f172a' },
  tabText: { fontSize: 12, fontWeight: '600' as const, color: '#64748b' },
  tabTextActive: { color: '#ffffff' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    marginHorizontal: 16, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginBottom: 12, gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a' },
  content: { flex: 1, paddingHorizontal: 16 },
  overviewBanner: { borderRadius: 18, padding: 20, marginBottom: 16 },
  overviewBannerRow: { flexDirection: 'row', alignItems: 'center' },
  overviewBannerItem: { flex: 1, alignItems: 'center', gap: 6 },
  overviewBannerDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.15)' },
  overviewBannerValue: { fontSize: 22, fontWeight: '800' as const, color: '#ffffff' },
  overviewBannerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '500' as const },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  overviewCard: {
    width: (width - 42) / 2, backgroundColor: '#ffffff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  overviewCardIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  overviewCardValue: { fontSize: 20, fontWeight: '800' as const, color: '#0f172a', marginBottom: 2 },
  overviewCardLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' as const },
  overviewCardSub: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  alertSection: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  alertSectionTitle: { fontSize: 16, fontWeight: '700' as const, color: '#0f172a', marginBottom: 14 },
  reorderItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f8fafc', gap: 10,
  },
  reorderDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  reorderInfo: { flex: 1 },
  reorderName: { fontSize: 14, fontWeight: '600' as const, color: '#0f172a' },
  reorderSku: { fontSize: 11, color: '#94a3b8' },
  reorderStock: { alignItems: 'flex-end' },
  reorderStockValue: { fontSize: 14, fontWeight: '700' as const, color: '#ef4444' },
  reorderStockLabel: { fontSize: 10, color: '#94a3b8' },
  shipmentCard: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  shipmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  shipmentHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  shipmentTrackingNum: { fontSize: 15, fontWeight: '700' as const, color: '#0f172a' },
  shipmentCarrier: { fontSize: 12, color: '#64748b' },
  shipmentStatus: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  shipmentStatusText: { fontSize: 10, fontWeight: '700' as const },
  shipmentRoute: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', borderRadius: 10, padding: 10 },
  shipmentRoutePoint: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  shipmentRouteText: { fontSize: 12, color: '#475569', flex: 1 },
  poCard: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  poHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  poNumber: { fontSize: 16, fontWeight: '700' as const, color: '#0f172a', marginBottom: 2 },
  poVendor: { fontSize: 13, color: '#64748b' },
  poStatus: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  poStatusText: { fontSize: 10, fontWeight: '700' as const },
  poDivider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 12 },
  poFooter: { flexDirection: 'row', gap: 12 },
  poFooterItem: { flex: 1 },
  poFooterLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 2 },
  poFooterValue: { fontSize: 14, fontWeight: '700' as const, color: '#0f172a' },
  logisticsSection: { marginBottom: 24 },
  logisticsSectionTitle: { fontSize: 16, fontWeight: '700' as const, color: '#0f172a', marginBottom: 12 },
  warehouseUtilCard: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  warehouseUtilHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  warehouseUtilIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  warehouseUtilInfo: { flex: 1 },
  warehouseUtilName: { fontSize: 15, fontWeight: '600' as const, color: '#0f172a' },
  warehouseUtilLoc: { fontSize: 12, color: '#94a3b8' },
  warehouseUtilPercent: { fontSize: 18, fontWeight: '800' as const },
  utilizationBarBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  utilizationBarFill: { height: '100%', borderRadius: 3 },
  warehouseUtilStats: { flexDirection: 'row', justifyContent: 'space-between' },
  warehouseUtilStat: { fontSize: 11, color: '#94a3b8' },
  movementCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    borderRadius: 12, padding: 14, marginBottom: 8, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  movementIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  movementInfo: { flex: 1 },
  movementProduct: { fontSize: 14, fontWeight: '600' as const, color: '#0f172a' },
  movementDate: { fontSize: 11, color: '#94a3b8' },
  movementQty: { alignItems: 'flex-end' },
  movementQtyValue: { fontSize: 15, fontWeight: '700' as const },
  movementType: { fontSize: 10, color: '#94a3b8', fontWeight: '600' as const },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyStateText: { fontSize: 16, fontWeight: '600' as const, color: '#64748b' },
  emptyStateSub: { fontSize: 13, color: '#94a3b8' },
});
