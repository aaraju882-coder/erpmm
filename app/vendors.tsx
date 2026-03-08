import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Building,
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { Vendor } from '@/types/erp';

export default function VendorsScreen() {
  const { vendors, addVendor } = useERP();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    paymentTerms: 'Net 30',
  });

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || vendor.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAddVendor = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      return;
    }

    const newVendor: Vendor = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      address: formData.address,
      status: 'active',
      paymentTerms: formData.paymentTerms,
      totalPurchases: 0,
    };

    addVendor(newVendor);
    setShowAddModal(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      paymentTerms: 'Net 30',
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderVendorCard = (vendor: Vendor) => {
    const StatusIcon = vendor.status === 'active' ? CheckCircle : XCircle;
    const statusColor = vendor.status === 'active' ? '#10b981' : '#ef4444';

    return (
      <TouchableOpacity
        key={vendor.id}
        style={styles.vendorCard}
        onPress={() => {
          setSelectedVendor(vendor);
          setShowDetailsModal(true);
        }}
      >
        <View style={styles.vendorHeader}>
          <View style={styles.vendorHeaderLeft}>
            <View style={[styles.vendorAvatar, { backgroundColor: statusColor + '15' }]}>
              <Building color={statusColor} size={24} />
            </View>
            <View style={styles.vendorInfo}>
              <Text style={styles.vendorName}>{vendor.name}</Text>
              <Text style={styles.vendorCompany}>{vendor.company}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <StatusIcon color={statusColor} size={14} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.vendorDivider} />

        <View style={styles.vendorDetails}>
          <View style={styles.vendorDetailRow}>
            <Mail color="#64748b" size={16} />
            <Text style={styles.vendorDetailText} numberOfLines={1}>{vendor.email}</Text>
          </View>
          <View style={styles.vendorDetailRow}>
            <Phone color="#64748b" size={16} />
            <Text style={styles.vendorDetailText}>{vendor.phone}</Text>
          </View>
          <View style={styles.vendorDetailRow}>
            <MapPin color="#64748b" size={16} />
            <Text style={styles.vendorDetailText} numberOfLines={1}>{vendor.address || 'No address'}</Text>
          </View>
        </View>

        <View style={styles.vendorFooter}>
          <View style={styles.purchasesContainer}>
            <DollarSign color="#2563eb" size={16} />
            <Text style={styles.purchasesText}>
              Total: {formatCurrency(vendor.totalPurchases)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => {
              setSelectedVendor(vendor);
              setShowDetailsModal(true);
            }}
          >
            <Eye color="#2563eb" size={16} />
            <Text style={styles.viewButtonText}>View</Text>
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
          headerTitle: 'Vendors',
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
              placeholder="Search vendors..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', 'active', 'inactive'].map((status) => (
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
          style={styles.vendorsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.vendorsListContent}
        >
          {filteredVendors.length === 0 ? (
            <View style={styles.emptyState}>
              <Users color="#cbd5e1" size={64} />
              <Text style={styles.emptyStateText}>No Vendors</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery || filterStatus !== 'all'
                  ? 'No vendors match your filters'
                  : 'Add your first vendor'}
              </Text>
              {searchQuery === '' && filterStatus === 'all' && (
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Plus color="#ffffff" size={20} />
                  <Text style={styles.emptyStateButtonText}>Add Vendor</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredVendors.map(renderVendorCard)
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
              <Text style={styles.modalTitle}>Add Vendor</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <XCircle color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Vendor Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter vendor name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Company</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Company name"
                  value={formData.company}
                  onChangeText={(text) => setFormData({ ...formData, company: text })}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="vendor@example.com"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Address</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputMultiline]}
                  placeholder="Full address"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Payment Terms</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Net 30"
                  value={formData.paymentTerms}
                  onChangeText={(text) => setFormData({ ...formData, paymentTerms: text })}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButtonPrimary,
                  (!formData.name || !formData.email || !formData.phone) && styles.modalButtonDisabled,
                ]}
                onPress={handleAddVendor}
                disabled={!formData.name || !formData.email || !formData.phone}
              >
                <Text style={styles.modalButtonPrimaryText}>Add Vendor</Text>
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
            {selectedVendor && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedVendor.name}</Text>
                  <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                    <XCircle color="#64748b" size={24} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.detailsScroll}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Company</Text>
                    <Text style={styles.detailValue}>{selectedVendor.company}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            (selectedVendor.status === 'active' ? '#10b981' : '#ef4444') + '15',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: selectedVendor.status === 'active' ? '#10b981' : '#ef4444' },
                        ]}
                      >
                        {selectedVendor.status.charAt(0).toUpperCase() + selectedVendor.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{selectedVendor.email}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.detailValue}>{selectedVendor.phone}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Address</Text>
                    <Text style={styles.detailValue}>{selectedVendor.address || 'Not provided'}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Payment Terms</Text>
                    <Text style={styles.detailValue}>{selectedVendor.paymentTerms}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Total Purchases</Text>
                    <Text style={styles.detailValueLarge}>
                      {formatCurrency(selectedVendor.totalPurchases)}
                    </Text>
                  </View>
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
  vendorsList: {
    flex: 1,
  },
  vendorsListContent: {
    padding: 16,
  },
  vendorCard: {
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
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vendorHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vendorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  vendorCompany: {
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
  vendorDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 12,
  },
  vendorDetails: {
    gap: 8,
    marginBottom: 12,
  },
  vendorDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vendorDetailText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  vendorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  purchasesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  purchasesText: {
    fontSize: 14,
    color: '#2563eb',
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
    maxHeight: '90%',
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
  formScroll: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
  modalButtonDisabled: {
    opacity: 0.5,
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
  detailValueLarge: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#2563eb',
  },
});
