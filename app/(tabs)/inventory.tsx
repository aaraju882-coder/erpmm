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
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Package,
  Plus,
  Search,
  Warehouse,
  TrendingDown,
  Scan,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { Product, Warehouse as WarehouseType } from '@/types/erp';
import { useRouter } from 'expo-router';
import { generateProductQR, generateBarcodeURL } from '@/utils/qrcode';

type TabType = 'products' | 'warehouses' | 'movements';

export default function InventoryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { products, warehouses, addProduct, updateProduct, addWarehouse, deleteProduct } = useERP();

  const lowStockProducts = products.filter((p) => p.currentStock <= p.minStock);

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const warehouse = warehouses.find((w) => w.id === product.warehouseId);
    const isLowStock = product.currentStock <= product.minStock;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          Alert.alert(
            product.name,
            `SKU: ${product.sku}\nBarcode: ${product.barcode || 'Not set'}\nStock: ${product.currentStock} ${product.unit}\nPrice: ${formatCurrency(product.sellingPrice)}`,
            [
              {
                text: 'View QR/Barcode',
                onPress: () => {
                  setSelectedProduct(product);
                  setShowQRModal(true);
                },
              },
              {
                text: 'Adjust Stock',
                onPress: () => {
                  Alert.prompt(
                    'Adjust Stock',
                    'Enter new stock quantity:',
                    (text) => {
                      const newStock = parseInt(text);
                      if (!isNaN(newStock)) {
                        updateProduct(product.id, { currentStock: newStock });
                      }
                    },
                    'plain-text',
                    product.currentStock.toString()
                  );
                },
              },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  Alert.alert('Confirm Delete', 'Are you sure?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', onPress: () => deleteProduct(product.id) },
                  ]);
                },
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.productIcon, isLowStock && styles.productIconWarning]}>
              {isLowStock ? (
                <AlertTriangle color="#ef4444" size={20} />
              ) : (
                <Package color="#2563eb" size={20} />
              )}
            </View>
            <View>
              <Text style={styles.cardTitle}>{product.name}</Text>
              <Text style={styles.cardSubtitle}>SKU: {product.sku}</Text>
            </View>
          </View>
          {product.barcode && (
            <View style={styles.barcodeBadge}>
              <Scan color="#64748b" size={14} />
            </View>
          )}
        </View>

        <View style={styles.productDetails}>
          <View style={styles.productDetailItem}>
            <Text style={styles.productDetailLabel}>Stock</Text>
            <Text style={[styles.productDetailValue, isLowStock && styles.productDetailWarning]}>
              {product.currentStock} {product.unit}
            </Text>
          </View>
          <View style={styles.productDetailItem}>
            <Text style={styles.productDetailLabel}>Price</Text>
            <Text style={styles.productDetailValue}>{formatCurrency(product.sellingPrice)}</Text>
          </View>
          <View style={styles.productDetailItem}>
            <Text style={styles.productDetailLabel}>Warehouse</Text>
            <Text style={styles.productDetailValue} numberOfLines={1}>
              {warehouse?.name || 'N/A'}
            </Text>
          </View>
        </View>

        {isLowStock && (
          <View style={styles.warningBanner}>
            <AlertTriangle color="#ef4444" size={16} />
            <Text style={styles.warningText}>Low stock - Reorder soon</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const WarehouseCard = ({ warehouse }: { warehouse: WarehouseType }) => {
    const warehouseProducts = products.filter((p) => p.warehouseId === warehouse.id);
    const totalItems = warehouseProducts.reduce((sum, p) => sum + p.currentStock, 0);

    return (
      <TouchableOpacity style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.warehouseIcon}>
              <Warehouse color="#8b5cf6" size={20} />
            </View>
            <View>
              <Text style={styles.cardTitle}>{warehouse.name}</Text>
              <Text style={styles.cardSubtitle}>{warehouse.location}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  warehouse.status === 'active' ? '#10b98115' : '#64748b15',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: warehouse.status === 'active' ? '#10b981' : '#64748b' },
              ]}
            >
              {warehouse.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.warehouseStats}>
          <View style={styles.warehouseStat}>
            <Text style={styles.warehouseStatValue}>{warehouseProducts.length}</Text>
            <Text style={styles.warehouseStatLabel}>Products</Text>
          </View>
          <View style={styles.warehouseStat}>
            <Text style={styles.warehouseStatValue}>{totalItems}</Text>
            <Text style={styles.warehouseStatLabel}>Total Items</Text>
          </View>
          <View style={styles.warehouseStat}>
            <Text style={styles.warehouseStatValue}>{warehouse.capacity}</Text>
            <Text style={styles.warehouseStatLabel}>Capacity</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const CreateProductModal = () => {
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [barcode, setBarcode] = useState('');
    const [category, setCategory] = useState('');
    const [unit, setUnit] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');
    const [stock, setStock] = useState('');
    const [minStock, setMinStock] = useState('');
    const [selectedWarehouse, setSelectedWarehouse] = useState('');

    const handleCreate = () => {
      if (!name || !sku || !unit || !costPrice || !sellingPrice || !stock || !selectedWarehouse) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const newProduct: Product = {
        id: Date.now().toString(),
        name,
        sku,
        barcode,
        category: category || 'General',
        description: '',
        unit,
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
        currentStock: parseInt(stock),
        minStock: parseInt(minStock) || 10,
        warehouseId: selectedWarehouse,
        status: 'active',
      };

      addProduct(newProduct);
      setShowProductModal(false);
      Alert.alert('Success', 'Product added successfully');
      setName('');
      setSku('');
      setBarcode('');
      setCategory('');
      setUnit('');
      setCostPrice('');
      setSellingPrice('');
      setStock('');
      setMinStock('');
      setSelectedWarehouse('');
    };

    return (
      <Modal
        visible={showProductModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollContent} bounces={false}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Product</Text>
                <TouchableOpacity onPress={() => setShowProductModal(false)}>
                  <X color="#64748b" size={24} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter product name"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>SKU *</Text>
                  <TextInput
                    style={styles.input}
                    value={sku}
                    onChangeText={setSku}
                    placeholder="SKU-001"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Barcode</Text>
                  <TextInput
                    style={styles.input}
                    value={barcode}
                    onChangeText={setBarcode}
                    placeholder="123456789"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Category</Text>
                  <TextInput
                    style={styles.input}
                    value={category}
                    onChangeText={setCategory}
                    placeholder="Electronics"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Unit *</Text>
                  <TextInput
                    style={styles.input}
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="pcs"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Cost Price *</Text>
                  <TextInput
                    style={styles.input}
                    value={costPrice}
                    onChangeText={setCostPrice}
                    placeholder="100.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Selling Price *</Text>
                  <TextInput
                    style={styles.input}
                    value={sellingPrice}
                    onChangeText={setSellingPrice}
                    placeholder="150.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Stock *</Text>
                  <TextInput
                    style={styles.input}
                    value={stock}
                    onChangeText={setStock}
                    placeholder="100"
                    keyboardType="number-pad"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Min Stock</Text>
                  <TextInput
                    style={styles.input}
                    value={minStock}
                    onChangeText={setMinStock}
                    placeholder="10"
                    keyboardType="number-pad"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Warehouse *</Text>
                {warehouses.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {warehouses.map((warehouse) => (
                      <TouchableOpacity
                        key={warehouse.id}
                        style={[
                          styles.warehouseChip,
                          selectedWarehouse === warehouse.id && styles.warehouseChipSelected,
                        ]}
                        onPress={() => setSelectedWarehouse(warehouse.id)}
                      >
                        <Text
                          style={[
                            styles.warehouseChipText,
                            selectedWarehouse === warehouse.id && styles.warehouseChipTextSelected,
                          ]}
                        >
                          {warehouse.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.noDataText}>No warehouses. Create one first.</Text>
                )}
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
                <Check color="#ffffff" size={20} />
                <Text style={styles.submitButtonText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const CreateWarehouseModal = () => {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [capacity, setCapacity] = useState('');
    const [manager, setManager] = useState('');

    const handleCreate = () => {
      if (!name || !location || !capacity || !manager) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const newWarehouse: WarehouseType = {
        id: Date.now().toString(),
        name,
        location,
        capacity: parseInt(capacity),
        manager,
        status: 'active',
      };

      addWarehouse(newWarehouse);
      setShowWarehouseModal(false);
      Alert.alert('Success', 'Warehouse created successfully');
      setName('');
      setLocation('');
      setCapacity('');
      setManager('');
    };

    return (
      <Modal
        visible={showWarehouseModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowWarehouseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Warehouse</Text>
              <TouchableOpacity onPress={() => setShowWarehouseModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Warehouse Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Main Warehouse"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="123 Business St, City"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Capacity</Text>
              <TextInput
                style={styles.input}
                value={capacity}
                onChangeText={setCapacity}
                placeholder="10000"
                keyboardType="number-pad"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Manager</Text>
              <TextInput
                style={styles.input}
                value={manager}
                onChangeText={setManager}
                placeholder="Manager Name"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
              <Check color="#ffffff" size={20} />
              <Text style={styles.submitButtonText}>Create Warehouse</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Package color="#2563eb" size={20} />
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingDown color="#ef4444" size={20} />
          <Text style={styles.statValue}>{lowStockProducts.length}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
        <View style={styles.statCard}>
          <Warehouse color="#8b5cf6" size={20} />
          <Text style={styles.statValue}>{warehouses.length}</Text>
          <Text style={styles.statLabel}>Warehouses</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.activeTab]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'warehouses' && styles.activeTab]}
          onPress={() => setActiveTab('warehouses')}
        >
          <Text style={[styles.tabText, activeTab === 'warehouses' && styles.activeTabText]}>
            Warehouses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'movements' && styles.activeTab]}
          onPress={() => setActiveTab('movements')}
        >
          <Text style={[styles.tabText, activeTab === 'movements' && styles.activeTabText]}>
            Movements
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search color="#64748b" size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'products' && (
          <>
            {products.length > 0 ? (
              products
                .filter((product) =>
                  product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  product.sku.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((product) => <ProductCard key={product.id} product={product} />)
            ) : (
              <View style={styles.emptyState}>
                <Package color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>No products yet</Text>
                <Text style={styles.emptyStateSubtext}>Add your first product to get started</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'warehouses' && (
          <>
            {warehouses.length > 0 ? (
              warehouses.map((warehouse) => <WarehouseCard key={warehouse.id} warehouse={warehouse} />)
            ) : (
              <View style={styles.emptyState}>
                <Warehouse color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>No warehouses yet</Text>
                <Text style={styles.emptyStateSubtext}>Create your first warehouse</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'movements' && (
          <View style={styles.emptyState}>
            <Package color="#cbd5e1" size={48} />
            <Text style={styles.emptyStateText}>Stock Movements</Text>
            <Text style={styles.emptyStateSubtext}>Track your stock movements here</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (activeTab === 'products') {
            if (warehouses.length === 0) {
              Alert.alert('No Warehouses', 'Please create a warehouse first', [
                { text: 'Create Warehouse', onPress: () => setShowWarehouseModal(true) },
                { text: 'Cancel', style: 'cancel' },
              ]);
            } else {
              setShowProductModal(true);
            }
          } else if (activeTab === 'warehouses') {
            setShowWarehouseModal(true);
          }
        }}
      >
        <Plus color="#ffffff" size={28} />
      </TouchableOpacity>

      <CreateProductModal />
      <CreateWarehouseModal />
      <QRCodeModal />
    </SafeAreaView>
  );

  function QRCodeModal() {
    if (!selectedProduct) return null;

    const qrURL = generateProductQR(selectedProduct.id, selectedProduct.sku, selectedProduct.name);
    const barcodeURL = selectedProduct.barcode
      ? generateBarcodeURL(selectedProduct.barcode)
      : generateBarcodeURL(selectedProduct.sku);

    return (
      <Modal
        visible={showQRModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.qrSection}>
                <Text style={styles.qrSectionTitle}>QR Code</Text>
                <View style={styles.qrImageContainer}>
                  <Image
                    source={{ uri: qrURL }}
                    style={styles.qrImage}
                    contentFit="contain"
                  />
                </View>
                <Text style={styles.qrDescription}>Scan to view product details</Text>
              </View>

              <View style={styles.qrSection}>
                <Text style={styles.qrSectionTitle}>Barcode</Text>
                <View style={styles.barcodeImageContainer}>
                  <Image
                    source={{ uri: barcodeURL }}
                    style={styles.barcodeImage}
                    contentFit="contain"
                  />
                </View>
                <Text style={styles.qrDescription}>
                  {selectedProduct.barcode || selectedProduct.sku}
                </Text>
              </View>

              <View style={styles.productInfoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>SKU:</Text>
                  <Text style={styles.infoValue}>{selectedProduct.sku}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Stock:</Text>
                  <Text style={styles.infoValue}>{selectedProduct.currentStock} {selectedProduct.unit}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Price:</Text>
                  <Text style={styles.infoValue}>{formatCurrency(selectedProduct.sellingPrice)}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => {
                  setShowQRModal(false);
                  router.push('/scanner');
                }}
              >
                <Scan color="#2563eb" size={20} />
                <Text style={styles.scanButtonText}>Scan Products</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }
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
    fontSize: 20,
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  activeTabText: {
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
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  productIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productIconWarning: {
    backgroundColor: '#fef2f2',
  },
  warehouseIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  barcodeBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  productDetailItem: {
    flex: 1,
  },
  productDetailLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '600' as const,
  },
  productDetailValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  productDetailWarning: {
    color: '#ef4444',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600' as const,
  },
  warehouseStats: {
    flexDirection: 'row',
    gap: 16,
  },
  warehouseStat: {
    flex: 1,
    alignItems: 'center',
  },
  warehouseStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  warehouseStatLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
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
  modalScrollContent: {
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
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
  formRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
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
  warehouseChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  warehouseChipSelected: {
    backgroundColor: '#2563eb',
  },
  warehouseChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  warehouseChipTextSelected: {
    color: '#ffffff',
  },
  noDataText: {
    fontSize: 14,
    color: '#94a3b8',
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
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
  qrModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 16,
  },
  qrImageContainer: {
    width: 250,
    height: 250,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  barcodeImageContainer: {
    width: 300,
    height: 120,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  barcodeImage: {
    width: '100%',
    height: '100%',
  },
  qrDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  productInfoSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '700' as const,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#dbeafe',
    paddingVertical: 16,
    borderRadius: 12,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#2563eb',
  },
});
