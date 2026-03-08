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
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Wrench,
  X,
  Check,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { Asset } from '@/types/erp';

export default function AssetsScreen() {
  const { assets, employees, addAsset } = useERP();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: '#10b981',
      maintenance: '#f59e0b',
      retired: '#64748b',
      sold: '#8b5cf6',
    };
    return colors[status] || '#64748b';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return CheckCircle;
      case 'maintenance':
        return Wrench;
      case 'retired':
      case 'sold':
        return AlertTriangle;
      default:
        return Boxes;
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
  };

  const calculateDepreciation = (asset: Asset): number => {
    const years = (new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return Math.min(asset.purchasePrice, years * asset.depreciation);
  };

  const AssetCard = ({ asset }: { asset: Asset }) => {
    const assignedEmployee = asset.assignedTo ? employees.find((e) => e.id === asset.assignedTo) : null;
    const Icon = getStatusIcon(asset.status);
    const totalDepreciation = calculateDepreciation(asset);
    const currentValue = Math.max(0, asset.purchasePrice - totalDepreciation);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          Alert.alert(
            asset.name,
            `Serial: ${asset.serialNumber}\nCategory: ${asset.category}\nLocation: ${asset.location}\nPurchase: ${formatCurrency(asset.purchasePrice)}\nCurrent Value: ${formatCurrency(currentValue)}\nDepreciation: ${formatCurrency(totalDepreciation)}${assignedEmployee ? `\nAssigned to: ${assignedEmployee.name}` : ''}${asset.warranty ? `\nWarranty: ${asset.warranty}` : ''}`,
            [
              {
                text: 'Update Status',
                onPress: () => {
                  Alert.alert('Update Status', 'Asset status updated');
                },
              },
              { text: 'Close', style: 'cancel' },
            ]
          );
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.assetIcon, { backgroundColor: getStatusColor(asset.status) + '15' }]}>
              <Icon color={getStatusColor(asset.status)} size={20} />
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.cardTitle}>{asset.name}</Text>
              <Text style={styles.cardSubtitle}>{asset.category}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(asset.status) }]}>
            <Text style={styles.statusText}>{asset.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.assetDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Serial Number</Text>
            <Text style={styles.detailValue}>{asset.serialNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{asset.location}</Text>
          </View>
          {assignedEmployee && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Assigned To</Text>
              <Text style={styles.detailValue}>{assignedEmployee.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.cardFooterItem}>
            <Text style={styles.cardFooterLabel}>Purchase Price</Text>
            <Text style={styles.cardFooterValue}>{formatCurrency(asset.purchasePrice)}</Text>
          </View>
          <View style={styles.cardFooterItem}>
            <Text style={styles.cardFooterLabel}>Current Value</Text>
            <Text style={[styles.cardFooterValue, { color: '#10b981' }]}>
              {formatCurrency(currentValue)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const CreateAssetModal = () => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [location, setLocation] = useState('');
    const [depreciation, setDepreciation] = useState('');

    const handleCreate = () => {
      if (!name || !category || !serialNumber || !purchasePrice || !location) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const newAsset: Asset = {
        id: Date.now().toString(),
        name,
        category,
        serialNumber,
        purchaseDate: new Date().toISOString(),
        purchasePrice: parseFloat(purchasePrice),
        currentValue: parseFloat(purchasePrice),
        depreciation: depreciation ? parseFloat(depreciation) : 0,
        status: 'active',
        location,
      };

      addAsset(newAsset);
      setShowModal(false);
      Alert.alert('Success', 'Asset added successfully');
      setName('');
      setCategory('');
      setSerialNumber('');
      setPurchasePrice('');
      setLocation('');
      setDepreciation('');
    };

    return (
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Asset</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Asset Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="MacBook Pro 16"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category *</Text>
                <TextInput
                  style={styles.input}
                  value={category}
                  onChangeText={setCategory}
                  placeholder="Electronics, Furniture, Vehicle"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Serial Number *</Text>
                <TextInput
                  style={styles.input}
                  value={serialNumber}
                  onChangeText={setSerialNumber}
                  placeholder="SN12345678"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Purchase Price *</Text>
                <TextInput
                  style={styles.input}
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                  placeholder="2500"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Location *</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Office - Floor 3"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Annual Depreciation</Text>
                <TextInput
                  style={styles.input}
                  value={depreciation}
                  onChangeText={setDepreciation}
                  placeholder="500 (per year)"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
                <Check color="#ffffff" size={20} />
                <Text style={styles.submitButtonText}>Add Asset</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || asset.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalValue = assets.reduce((sum, a) => {
    const depreciation = calculateDepreciation(a);
    return sum + Math.max(0, a.purchasePrice - depreciation);
  }, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Assets',
          headerBackTitle: 'Back',
        }}
      />

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Boxes color="#2563eb" size={20} />
          <Text style={styles.statValue}>{assets.length}</Text>
          <Text style={styles.statLabel}>Total Assets</Text>
        </View>
        <View style={styles.statCard}>
          <CheckCircle color="#10b981" size={20} />
          <Text style={styles.statValue}>{assets.filter((a) => a.status === 'active').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { fontSize: 14 }]}>{formatCurrency(totalValue)}</Text>
          <Text style={styles.statLabel}>Total Value</Text>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'active', 'maintenance', 'retired', 'sold'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.searchContainer}>
        <Search color="#64748b" size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search assets..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredAssets.length > 0 ? (
          filteredAssets.map((asset) => <AssetCard key={asset.id} asset={asset} />)
        ) : (
          <View style={styles.emptyState}>
            <Boxes color="#cbd5e1" size={48} />
            <Text style={styles.emptyStateText}>No assets found</Text>
            <Text style={styles.emptyStateSubtext}>Add your first asset to start tracking</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Plus color="#ffffff" size={28} />
      </TouchableOpacity>

      <CreateAssetModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assetIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  assetDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600' as const,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  cardFooterItem: {
    flex: 1,
  },
  cardFooterLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  cardFooterValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#0f172a',
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
    elevation: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
