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
import { Stack } from 'expo-router';
import {
  ShoppingBag,
  Plus,
  Search,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { PurchaseOrder } from '@/types/erp';

export default function PurchaseOrdersScreen() {
  const { purchaseOrders, vendors, addPurchaseOrder, products } = useERP();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const filteredOrders = purchaseOrders.filter((order) => {
    const matchesSearch =
      order.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendors.find((v) => v.id === order.vendorId)?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      draft: '#94a3b8',
      sent: '#3b82f6',
      confirmed: '#f59e0b',
      received: '#10b981',
      cancelled: '#ef4444',
    };
    return colors[status] || '#64748b';
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: any } = {
      draft: Clock,
      sent: Calendar,
      confirmed: CheckCircle,
      received: CheckCircle,
      cancelled: XCircle,
    };
    return icons[status] || Clock;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;  
  };

  const handleAddPurchaseOrder = () => {
    if (vendors.length === 0) {
      Alert.alert('No Vendors', 'Please add vendors first before creating purchase orders.');
      return;
    }
    if (products.length === 0) {
      Alert.alert('No Products', 'Please add products first before creating purchase orders.');
      return;
    }
    
    const newPO: PurchaseOrder = {
      id: Date.now().toString(),
      poNumber: `PO-${Date.now().toString().slice(-6)}`,
      vendorId: vendors[0].id,
      date: new Date().toISOString().split('T')[0],
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [
        {
          id: '1',
          productId: products[0].id,
          description: products[0].name,
          quantity: 1,
          unitPrice: products[0].costPrice,
          total: products[0].costPrice,
        },
      ],
      subtotal: products[0].costPrice,
      tax: products[0].costPrice * 0.1,
      total: products[0].costPrice * 1.1,
      status: 'draft',
      notes: 'New purchase order',
    };

    addPurchaseOrder(newPO);
    setShowAddModal(false);
  };

  const renderOrderCard = (order: PurchaseOrder) => {
    const vendor = vendors.find((v) => v.id === order.vendorId);
    const StatusIcon = getStatusIcon(order.status);

    return (
      <TouchableOpacity
        key={order.id}
        style={styles.orderCard}
        onPress={() => {
          setSelectedOrder(order);
          setShowDetailsModal(true);
        }}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderNumber}>{order.poNumber}</Text>
            <Text style={styles.vendorName}>{vendor?.name || 'Unknown Vendor'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
            <StatusIcon color={getStatusColor(order.status)} size={14} />
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.orderDivider} />

        <View style={styles.orderDetails}>
          <View style={styles.orderDetailRow}>
            <Calendar color="#64748b" size={16} />
            <Text style={styles.orderDetailText}>Order Date: {order.date}</Text>
          </View>
          <View style={styles.orderDetailRow}>
            <Calendar color="#64748b" size={16} />
            <Text style={styles.orderDetailText}>Expected: {order.expectedDate}</Text>
          </View>
          <View style={styles.orderDetailRow}>
            <DollarSign color="#64748b" size={16} />
            <Text style={styles.orderDetailText}>Total: {formatCurrency(order.total)}</Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.itemsCount}>{order.items.length} item(s)</Text>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => {
              setSelectedOrder(order);
              setShowDetailsModal(true);
            }}
          >
            <Eye color="#2563eb" size={16} />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Purchase Orders',
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.headerButton}>
              <Plus color="#2563eb" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search color="#94a3b8" size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search purchase orders..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', 'draft', 'sent', 'confirmed', 'received', 'cancelled'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filterStatus === status && styles.filterChipActive,
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === status && styles.filterChipTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          style={styles.ordersList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ordersListContent}
        >
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <ShoppingBag color="#cbd5e1" size={64} />
              <Text style={styles.emptyStateText}>No Purchase Orders</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery || filterStatus !== 'all'
                  ? 'No orders match your filters'
                  : 'Create your first purchase order'}
              </Text>
              {searchQuery === '' && filterStatus === 'all' && (
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Plus color="#ffffff" size={20} />
                  <Text style={styles.emptyStateButtonText}>Create Purchase Order</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredOrders.map(renderOrderCard)
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
              <Text style={styles.modalTitle}>Create Purchase Order</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <XCircle color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              A new purchase order will be created with default values. You can edit the details after creation.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleAddPurchaseOrder}
              >
                <Text style={styles.modalButtonPrimaryText}>Create Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedOrder.poNumber}</Text>
                  <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                    <XCircle color="#64748b" size={24} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.detailsScroll}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Vendor</Text>
                    <Text style={styles.detailValue}>
                      {vendors.find((v) => v.id === selectedOrder.vendorId)?.name || 'Unknown'}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) + '15' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(selectedOrder.status) }]}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Order Date</Text>
                    <Text style={styles.detailValue}>{selectedOrder.date}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Expected Date</Text>
                    <Text style={styles.detailValue}>{selectedOrder.expectedDate}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Items</Text>
                    {selectedOrder.items.map((item) => (
                      <View key={item.id} style={styles.itemRow}>
                        <Text style={styles.itemDescription}>{item.description}</Text>
                        <Text style={styles.itemDetails}>
                          {item.quantity} x {formatCurrency(item.unitPrice)} = {formatCurrency(item.total)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.totalSection}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Subtotal</Text>
                      <Text style={styles.totalValue}>{formatCurrency(selectedOrder.subtotal)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Tax</Text>
                      <Text style={styles.totalValue}>{formatCurrency(selectedOrder.tax)}</Text>
                    </View>
                    <View style={styles.totalDivider} />
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabelFinal}>Total</Text>
                      <Text style={styles.totalValueFinal}>{formatCurrency(selectedOrder.total)}</Text>
                    </View>
                  </View>

                  {selectedOrder.notes && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Notes</Text>
                      <Text style={styles.detailValue}>{selectedOrder.notes}</Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
  ordersList: {
    flex: 1,
  },
  ordersListContent: {
    padding: 16,
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
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  vendorName: {
    fontSize: 14,
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
  orderDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 12,
  },
  orderDetails: {
    gap: 8,
    marginBottom: 12,
  },
  orderDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderDetailText: {
    fontSize: 14,
    color: '#64748b',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  itemsCount: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewButtonText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600' as const,
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
    maxHeight: '80%',
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
  modalDescription: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 22,
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
  detailsScroll: {
    maxHeight: 500,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#0f172a',
    lineHeight: 24,
  },
  itemRow: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 13,
    color: '#64748b',
  },
  totalSection: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  totalLabelFinal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  totalValueFinal: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#2563eb',
  },
});
