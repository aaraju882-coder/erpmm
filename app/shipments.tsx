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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  Truck,
  Plus,
  Search,
  MapPin,
  Calendar,
  X,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { ShipmentTracking } from '@/types/erp';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  'pending': { color: '#f59e0b', bg: '#fef3c7', label: 'Pending' },
  'in-transit': { color: '#3b82f6', bg: '#dbeafe', label: 'In Transit' },
  'delivered': { color: '#10b981', bg: '#d1fae5', label: 'Delivered' },
  'failed': { color: '#ef4444', bg: '#fee2e2', label: 'Failed' },
  'returned': { color: '#8b5cf6', bg: '#ede9fe', label: 'Returned' },
};

export default function ShipmentsScreen() {
  const { shipmentTracking, addShipmentTracking, updateShipmentTracking } = useERP();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentTracking | null>(null);

  const [form, setForm] = useState({
    orderId: '',
    trackingNumber: '',
    carrier: '',
    origin: '',
    destination: '',
    notes: '',
  });

  const filteredShipments = shipmentTracking.filter((s) => {
    const matchSearch =
      s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.carrier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleAdd = () => {
    if (!form.trackingNumber || !form.carrier || !form.destination) {
      Alert.alert('Error', 'Please fill in tracking number, carrier, and destination');
      return;
    }

    const newShipment: ShipmentTracking = {
      id: `ship-${Date.now()}`,
      orderId: form.orderId || `ORD-${Date.now()}`,
      trackingNumber: form.trackingNumber,
      carrier: form.carrier,
      status: 'pending',
      origin: form.origin,
      destination: form.destination,
      notes: form.notes,
    };

    addShipmentTracking(newShipment);
    setShowAddModal(false);
    setForm({ orderId: '', trackingNumber: '', carrier: '', origin: '', destination: '', notes: '' });
    Alert.alert('Success', 'Shipment created successfully');
  };

  const handleUpdateStatus = (shipment: ShipmentTracking, newStatus: ShipmentTracking['status']) => {
    const updates: Partial<ShipmentTracking> = { status: newStatus };
    if (newStatus === 'in-transit') updates.shippedDate = new Date().toISOString();
    if (newStatus === 'delivered') updates.deliveryDate = new Date().toISOString();
    updateShipmentTracking(shipment.id, updates);
    setSelectedShipment(null);
    Alert.alert('Updated', `Shipment status changed to ${STATUS_CONFIG[newStatus]?.label}`);
  };

  const statusCounts = {
    all: shipmentTracking.length,
    pending: shipmentTracking.filter((s) => s.status === 'pending').length,
    'in-transit': shipmentTracking.filter((s) => s.status === 'in-transit').length,
    delivered: shipmentTracking.filter((s) => s.status === 'delivered').length,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Shipment Tracking' }} />

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search color="#94a3b8" size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shipments..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {(['all', 'pending', 'in-transit', 'delivered'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>
              {status === 'all' ? 'All' : STATUS_CONFIG[status]?.label} ({statusCounts[status]})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredShipments.length === 0 ? (
          <View style={styles.emptyState}>
            <Truck color="#cbd5e1" size={56} />
            <Text style={styles.emptyTitle}>No Shipments</Text>
            <Text style={styles.emptySubtitle}>Create a new shipment to start tracking</Text>
          </View>
        ) : (
          filteredShipments.map((shipment) => {
            const statusInfo = STATUS_CONFIG[shipment.status] || STATUS_CONFIG['pending'];
            return (
              <TouchableOpacity
                key={shipment.id}
                style={styles.shipmentCard}
                onPress={() => setSelectedShipment(shipment)}
              >
                <View style={styles.shipmentHeader}>
                  <View style={styles.shipmentIcon}>
                    <Truck color="#3b82f6" size={22} />
                  </View>
                  <View style={styles.shipmentInfo}>
                    <Text style={styles.shipmentTracking}>{shipment.trackingNumber}</Text>
                    <Text style={styles.shipmentCarrier}>{shipment.carrier}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                  </View>
                </View>

                <View style={styles.shipmentRoute}>
                  <View style={styles.routePoint}>
                    <MapPin color="#10b981" size={14} />
                    <Text style={styles.routeText} numberOfLines={1}>{shipment.origin || 'Origin'}</Text>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routePoint}>
                    <MapPin color="#ef4444" size={14} />
                    <Text style={styles.routeText} numberOfLines={1}>{shipment.destination}</Text>
                  </View>
                </View>

                {(shipment.shippedDate || shipment.deliveryDate) && (
                  <View style={styles.shipmentDates}>
                    {shipment.shippedDate && (
                      <View style={styles.dateItem}>
                        <Calendar color="#64748b" size={12} />
                        <Text style={styles.dateText}>Shipped: {new Date(shipment.shippedDate).toLocaleDateString()}</Text>
                      </View>
                    )}
                    {shipment.deliveryDate && (
                      <View style={styles.dateItem}>
                        <CheckCircle color="#10b981" size={12} />
                        <Text style={styles.dateText}>Delivered: {new Date(shipment.deliveryDate).toLocaleDateString()}</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Shipment</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Order ID</Text>
              <TextInput style={styles.input} placeholder="Order reference" placeholderTextColor="#94a3b8" value={form.orderId} onChangeText={(v) => setForm({ ...form, orderId: v })} />

              <Text style={styles.label}>Tracking Number *</Text>
              <TextInput style={styles.input} placeholder="e.g. 1Z999AA..." placeholderTextColor="#94a3b8" value={form.trackingNumber} onChangeText={(v) => setForm({ ...form, trackingNumber: v })} />

              <Text style={styles.label}>Carrier *</Text>
              <TextInput style={styles.input} placeholder="e.g. FedEx, UPS, DHL" placeholderTextColor="#94a3b8" value={form.carrier} onChangeText={(v) => setForm({ ...form, carrier: v })} />

              <Text style={styles.label}>Origin</Text>
              <TextInput style={styles.input} placeholder="Ship from location" placeholderTextColor="#94a3b8" value={form.origin} onChangeText={(v) => setForm({ ...form, origin: v })} />

              <Text style={styles.label}>Destination *</Text>
              <TextInput style={styles.input} placeholder="Ship to location" placeholderTextColor="#94a3b8" value={form.destination} onChangeText={(v) => setForm({ ...form, destination: v })} />

              <Text style={styles.label}>Notes</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Additional notes" placeholderTextColor="#94a3b8" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} multiline numberOfLines={3} />

              <TouchableOpacity style={styles.submitButton} onPress={handleAdd}>
                <Text style={styles.submitText}>Create Shipment</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedShipment} animationType="slide" transparent onRequestClose={() => setSelectedShipment(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Shipment Details</Text>
              <TouchableOpacity onPress={() => setSelectedShipment(null)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            {selectedShipment && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tracking #</Text>
                  <Text style={styles.detailValue}>{selectedShipment.trackingNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Carrier</Text>
                  <Text style={styles.detailValue}>{selectedShipment.carrier}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_CONFIG[selectedShipment.status]?.bg }]}>
                    <Text style={[styles.statusText, { color: STATUS_CONFIG[selectedShipment.status]?.color }]}>
                      {STATUS_CONFIG[selectedShipment.status]?.label}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Origin</Text>
                  <Text style={styles.detailValue}>{selectedShipment.origin || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Destination</Text>
                  <Text style={styles.detailValue}>{selectedShipment.destination}</Text>
                </View>
                {selectedShipment.notes && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.detailValue}>{selectedShipment.notes}</Text>
                  </View>
                )}

                <Text style={styles.actionTitle}>Update Status</Text>
                <View style={styles.actionGrid}>
                  {selectedShipment.status === 'pending' && (
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#dbeafe' }]} onPress={() => handleUpdateStatus(selectedShipment, 'in-transit')}>
                      <Truck color="#3b82f6" size={18} />
                      <Text style={[styles.actionButtonText, { color: '#3b82f6' }]}>Mark In Transit</Text>
                    </TouchableOpacity>
                  )}
                  {selectedShipment.status === 'in-transit' && (
                    <>
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#d1fae5' }]} onPress={() => handleUpdateStatus(selectedShipment, 'delivered')}>
                        <CheckCircle color="#10b981" size={18} />
                        <Text style={[styles.actionButtonText, { color: '#10b981' }]}>Mark Delivered</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#fee2e2' }]} onPress={() => handleUpdateStatus(selectedShipment, 'failed')}>
                        <AlertTriangle color="#ef4444" size={18} />
                        <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Mark Failed</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {selectedShipment.status === 'failed' && (
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ede9fe' }]} onPress={() => handleUpdateStatus(selectedShipment, 'returned')}>
                      <RotateCcw color="#8b5cf6" size={18} />
                      <Text style={[styles.actionButtonText, { color: '#8b5cf6' }]}>Mark Returned</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#0f172a' },
  addButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  filterRow: { maxHeight: 48, paddingLeft: 16 },
  filterContent: { gap: 8, paddingRight: 16, alignItems: 'center' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  filterChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  filterChipText: { fontSize: 13, fontWeight: '600' as const, color: '#64748b' },
  filterChipTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, color: '#334155', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  shipmentCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  shipmentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  shipmentIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  shipmentInfo: { flex: 1 },
  shipmentTracking: { fontSize: 15, fontWeight: '700' as const, color: '#0f172a' },
  shipmentCarrier: { fontSize: 13, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' as const },
  shipmentRoute: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  routeLine: { height: 1, flex: 0.3, backgroundColor: '#cbd5e1' },
  routeText: { fontSize: 12, color: '#475569' },
  shipmentDates: { flexDirection: 'row', gap: 16, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11, color: '#64748b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, color: '#0f172a' },
  label: { fontSize: 13, fontWeight: '600' as const, color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 14, height: 46, fontSize: 15, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' as const },
  submitButton: { backgroundColor: '#3b82f6', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 20 },
  submitText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' as const },
  detailValue: { fontSize: 14, color: '#0f172a', fontWeight: '600' as const, maxWidth: '60%', textAlign: 'right' as const },
  actionTitle: { fontSize: 16, fontWeight: '700' as const, color: '#0f172a', marginTop: 20, marginBottom: 12 },
  actionGrid: { gap: 10, marginBottom: 20 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12 },
  actionButtonText: { fontSize: 14, fontWeight: '600' as const },
});
