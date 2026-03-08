import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  X,
  DollarSign,
  CreditCard,
  Smartphone,
  Trash2,
  User,
  CheckCircle,
  ScanLine,
  QrCode,
  Package,
  Tag,
  ChevronLeft,
  Percent,
  Receipt,
  ArrowRight,
  Hash,
  Clock,
  AlertCircle,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { useAuth } from '@/contexts/AuthContext';
import { POSTransaction, POSTransactionItem, Product } from '@/types/erp';
import { generateBarcodeURL, generateProductQR } from '@/utils/qrcode';

interface CartItem extends POSTransactionItem {
  productData: Product;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function POSScreen() {
  const router = useRouter();
  const { products, customers, addPOSTransaction, updateProduct, posTransactions } = useERP();
  const { currentUser } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [lastTransaction, setLastTransaction] = useState<POSTransaction | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const activeProducts = useMemo(() => {
    return products.filter((p) => p.status === 'active' && p.currentStock > 0);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return activeProducts;
    const query = searchQuery.toLowerCase();
    return activeProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }, [activeProducts, searchQuery]);

  const discountAmount = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const pct = parseFloat(discountPercent) || 0;
    return subtotal * (pct / 100);
  }, [cart, discountPercent]);

  const cartTotal = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = (subtotal - discountAmount) * 0.1;
    const total = subtotal - discountAmount + tax;
    return { subtotal, tax, discount: discountAmount, total: Math.max(0, total) };
  }, [cart, discountAmount]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const animatePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 50 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
  }, [scaleAnim]);

  const addToCart = useCallback((product: Product) => {
    animatePress();
    setCart((prev) => {
      const existingItem = prev.find((item) => item.productId === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.currentStock) {
          Alert.alert('Stock Limit', `Only ${product.currentStock} units available`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      const newItem: CartItem = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.sellingPrice,
        discount: 0,
        total: product.sellingPrice,
        productData: product,
      };
      return [...prev, newItem];
    });
  }, [animatePress]);

  const handleBarcodeLookup = useCallback(() => {
    if (!manualBarcode.trim()) return;
    const product = products.find(
      (p) =>
        p.barcode === manualBarcode.trim() ||
        p.sku === manualBarcode.trim() ||
        p.id === manualBarcode.trim()
    );
    if (product) {
      if (product.status !== 'active') {
        Alert.alert('Unavailable', 'This product is inactive');
        return;
      }
      if (product.currentStock <= 0) {
        Alert.alert('Out of Stock', 'This product is out of stock');
        return;
      }
      addToCart(product);
      setManualBarcode('');
      setShowBarcodeInput(false);
    } else {
      Alert.alert('Not Found', `No product matches code: ${manualBarcode}`);
    }
  }, [manualBarcode, products, addToCart]);

  const updateQuantity = useCallback((itemId: string, change: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === itemId) {
            const newQuantity = item.quantity + change;
            if (newQuantity <= 0) return null;
            if (newQuantity > item.productData.currentStock) {
              Alert.alert('Stock Limit', `Only ${item.productData.currentStock} units available`);
              return item;
            }
            return { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const clearCart = () => {
    if (cart.length === 0) return;
    Alert.alert('Clear Cart', 'Remove all items from cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { setCart([]); setSelectedCustomer(''); setDiscountPercent(''); } },
    ]);
  };

  const processPayment = () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }
    const paid = parseFloat(amountPaid) || 0;
    if (paymentMethod === 'cash' && paid < cartTotal.total) {
      Alert.alert('Error', 'Insufficient payment amount');
      return;
    }
    const finalPaid = paymentMethod === 'cash' ? paid : cartTotal.total;
    const change = finalPaid - cartTotal.total;
    const customer = customers.find((c) => c.id === selectedCustomer);

    const transaction: POSTransaction = {
      id: Date.now().toString(),
      transactionNumber: `POS-${Date.now()}`,
      date: new Date().toISOString(),
      customerId: selectedCustomer || undefined,
      customerName: customer?.name,
      items: cart.map(({ productData, ...item }) => item),
      subtotal: cartTotal.subtotal,
      tax: cartTotal.tax,
      discount: cartTotal.discount,
      total: cartTotal.total,
      amountPaid: finalPaid,
      change: Math.max(0, change),
      paymentMethod,
      status: 'completed',
      cashierId: currentUser?.id || 'current-user',
      terminalId: 'terminal-1',
      createdAt: new Date().toISOString(),
    };

    addPOSTransaction(transaction);

    cart.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        updateProduct(product.id, { currentStock: product.currentStock - item.quantity });
      }
    });

    setLastTransaction(transaction);
    setShowPaymentModal(false);
    setShowReceiptModal(true);
    setCart([]);
    setSelectedCustomer('');
    setAmountPaid('');
    setDiscountPercent('');
    setActiveTab('products');
  };

  const quickAmounts = useMemo(() => {
    const total = cartTotal.total;
    const rounded = Math.ceil(total);
    const amounts: number[] = [];
    if (rounded > 0) amounts.push(rounded);
    const next5 = Math.ceil(total / 5) * 5;
    if (next5 > rounded) amounts.push(next5);
    const next10 = Math.ceil(total / 10) * 10;
    if (next10 > next5) amounts.push(next10);
    const next50 = Math.ceil(total / 50) * 50;
    if (next50 > next10) amounts.push(next50);
    return amounts.slice(0, 4);
  }, [cartTotal.total]);

  const ProductCard = useCallback(({ product }: { product: Product }) => {
    const inCart = cart.find((item) => item.productId === product.id);
    const lowStock = product.currentStock <= product.minStock;

    return (
      <TouchableOpacity
        style={[styles.productCard, inCart && styles.productCardInCart]}
        onPress={() => addToCart(product)}
        onLongPress={() => { setSelectedProduct(product); setShowProductDetailModal(true); }}
        activeOpacity={0.7}
      >
        <View style={styles.productCardTop}>
          <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(product.category) }]} />
          <Text style={styles.productCategory} numberOfLines={1}>{product.category}</Text>
          {lowStock && (
            <View style={styles.lowStockBadge}>
              <AlertCircle color="#f59e0b" size={10} />
            </View>
          )}
        </View>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.productSKU}>{product.sku}</Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>${product.sellingPrice.toFixed(2)}</Text>
          <View style={styles.stockInfo}>
            <Text style={[styles.productStock, lowStock && { color: '#f59e0b' }]}>
              {product.currentStock}
            </Text>
          </View>
        </View>
        {inCart && (
          <View style={styles.inCartBadge}>
            <Text style={styles.inCartText}>{inCart.quantity}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [cart, addToCart]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Point of Sale</Text>
          <Text style={styles.headerSubtitle}>{new Date().toLocaleDateString()}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction} onPress={() => setShowHistoryModal(true)}>
            <Clock color="#64748b" size={22} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => router.push('/scanner')}
          >
            <ScanLine color="#64748b" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mobile Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.tabActive]}
          onPress={() => setActiveTab('products')}
        >
          <Package color={activeTab === 'products' ? '#2563eb' : '#94a3b8'} size={18} />
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cart' && styles.tabActive]}
          onPress={() => setActiveTab('cart')}
        >
          <ShoppingCart color={activeTab === 'cart' ? '#2563eb' : '#94a3b8'} size={18} />
          <Text style={[styles.tabText, activeTab === 'cart' && styles.tabTextActive]}>
            Cart{cartItemCount > 0 ? ` (${cartItemCount})` : ''}
          </Text>
          {cartItemCount > 0 && <View style={styles.cartDot} />}
        </TouchableOpacity>
      </View>

      {activeTab === 'products' ? (
        <View style={styles.productsPanel}>
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Search color="#94a3b8" size={18} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search name, SKU, barcode..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X color="#94a3b8" size={18} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.barcodeBtn, showBarcodeInput && styles.barcodeBtnActive]}
              onPress={() => setShowBarcodeInput(!showBarcodeInput)}
            >
              <QrCode color={showBarcodeInput ? '#ffffff' : '#2563eb'} size={20} />
            </TouchableOpacity>
          </View>

          {showBarcodeInput && (
            <View style={styles.barcodeInputRow}>
              <View style={styles.barcodeInputContainer}>
                <Hash color="#94a3b8" size={16} />
                <TextInput
                  style={styles.barcodeInput}
                  placeholder="Enter barcode or SKU..."
                  placeholderTextColor="#94a3b8"
                  value={manualBarcode}
                  onChangeText={setManualBarcode}
                  autoFocus
                  returnKeyType="search"
                  onSubmitEditing={handleBarcodeLookup}
                />
              </View>
              <TouchableOpacity style={styles.barcodeLookupBtn} onPress={handleBarcodeLookup}>
                <ArrowRight color="#ffffff" size={18} />
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.productsCount}>
            {filteredProducts.length} products available
          </Text>

          <ScrollView style={styles.productsGrid} showsVerticalScrollIndicator={false}>
            <View style={styles.productsContainer}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {filteredProducts.length === 0 && (
                <View style={styles.emptyProducts}>
                  <Package color="#cbd5e1" size={48} />
                  <Text style={styles.emptyText}>No products found</Text>
                  <Text style={styles.emptySubtext}>Try a different search or scan a barcode</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {cartItemCount > 0 && (
            <TouchableOpacity
              style={styles.viewCartFAB}
              onPress={() => setActiveTab('cart')}
              activeOpacity={0.8}
            >
              <ShoppingCart color="#ffffff" size={20} />
              <Text style={styles.viewCartText}>
                View Cart ({cartItemCount}) - ${cartTotal.total.toFixed(2)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.cartPanel}>
          <TouchableOpacity
            style={styles.customerButton}
            onPress={() => setShowCustomerModal(true)}
          >
            <User color="#64748b" size={18} />
            <Text style={styles.customerButtonText}>
              {selectedCustomer
                ? customers.find((c) => c.id === selectedCustomer)?.name
                : 'Walk-in Customer'}
            </Text>
            <ChevronLeft color="#94a3b8" size={16} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          {cart.length > 0 && (
            <View style={styles.cartActions}>
              <TouchableOpacity onPress={clearCart} style={styles.clearCartBtn}>
                <Trash2 color="#ef4444" size={16} />
                <Text style={styles.clearCartText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={cart}
            keyExtractor={(item) => item.id}
            style={styles.cartList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={styles.cartItemTop}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName} numberOfLines={1}>{item.productName}</Text>
                    <Text style={styles.cartItemSku}>{item.sku}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeFromCart(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X color="#ef4444" size={18} />
                  </TouchableOpacity>
                </View>
                <View style={styles.cartItemBottom}>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity style={styles.qtyButton} onPress={() => updateQuantity(item.id, -1)}>
                      <Minus color="#475569" size={14} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.qtyButton} onPress={() => updateQuantity(item.id, 1)}>
                      <Plus color="#475569" size={14} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cartItemPricing}>
                    <Text style={styles.cartItemUnitPrice}>${item.unitPrice.toFixed(2)} ea</Text>
                    <Text style={styles.cartItemTotal}>${item.total.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyCart}>
                <ShoppingCart color="#cbd5e1" size={56} />
                <Text style={styles.emptyCartTitle}>Cart is empty</Text>
                <Text style={styles.emptyCartSub}>Add products to start a sale</Text>
                <TouchableOpacity style={styles.browseBtn} onPress={() => setActiveTab('products')}>
                  <Text style={styles.browseBtnText}>Browse Products</Text>
                </TouchableOpacity>
              </View>
            }
          />

          {cart.length > 0 && (
            <View style={styles.cartFooter}>
              <View style={styles.discountRow}>
                <Percent color="#64748b" size={16} />
                <TextInput
                  style={styles.discountInput}
                  placeholder="Discount %"
                  placeholderTextColor="#94a3b8"
                  value={discountPercent}
                  onChangeText={setDiscountPercent}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.summarySection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>${cartTotal.subtotal.toFixed(2)}</Text>
                </View>
                {cartTotal.discount > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: '#10b981' }]}>Discount</Text>
                    <Text style={[styles.totalValue, { color: '#10b981' }]}>-${cartTotal.discount.toFixed(2)}</Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax (10%)</Text>
                  <Text style={styles.totalValue}>${cartTotal.tax.toFixed(2)}</Text>
                </View>
                <View style={[styles.totalRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>Total</Text>
                  <Text style={styles.grandTotalValue}>${cartTotal.total.toFixed(2)}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={() => {
                  setAmountPaid(cartTotal.total.toFixed(2));
                  setShowPaymentModal(true);
                }}
                activeOpacity={0.8}
              >
                <CheckCircle color="#ffffff" size={20} />
                <Text style={styles.checkoutButtonText}>Checkout ${cartTotal.total.toFixed(2)}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Customer Modal */}
      <Modal visible={showCustomerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Customer</Text>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.customerOption, !selectedCustomer && styles.customerOptionActive]}
              onPress={() => { setSelectedCustomer(''); setShowCustomerModal(false); }}
            >
              <User color="#64748b" size={20} />
              <Text style={styles.customerOptionText}>Walk-in Customer</Text>
            </TouchableOpacity>
            <FlatList
              data={customers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.customerOption, selectedCustomer === item.id && styles.customerOptionActive]}
                  onPress={() => { setSelectedCustomer(item.id); setShowCustomerModal(false); }}
                >
                  <View>
                    <Text style={styles.customerName}>{item.name}</Text>
                    <Text style={styles.customerEmail}>{item.email}</Text>
                  </View>
                  {selectedCustomer === item.id && <CheckCircle color="#2563eb" size={20} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentTotalSection}>
              <Text style={styles.paymentLabel}>Amount Due</Text>
              <Text style={styles.paymentTotal}>${cartTotal.total.toFixed(2)}</Text>
            </View>

            <Text style={styles.sectionLabel}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              {([
                { key: 'cash' as const, icon: DollarSign, label: 'Cash' },
                { key: 'card' as const, icon: CreditCard, label: 'Card' },
                { key: 'mobile' as const, icon: Smartphone, label: 'Mobile' },
              ]).map((method) => (
                <TouchableOpacity
                  key={method.key}
                  style={[styles.paymentMethodButton, paymentMethod === method.key && styles.paymentMethodActive]}
                  onPress={() => setPaymentMethod(method.key)}
                >
                  <method.icon color={paymentMethod === method.key ? '#ffffff' : '#64748b'} size={22} />
                  <Text style={[styles.paymentMethodText, paymentMethod === method.key && styles.paymentMethodTextActive]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {paymentMethod === 'cash' && (
              <>
                <Text style={styles.sectionLabel}>Amount Received</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="decimal-pad"
                  value={amountPaid}
                  onChangeText={setAmountPaid}
                />

                <View style={styles.quickAmounts}>
                  {quickAmounts.map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      style={styles.quickAmountBtn}
                      onPress={() => setAmountPaid(amount.toFixed(2))}
                    >
                      <Text style={styles.quickAmountText}>${amount.toFixed(0)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {parseFloat(amountPaid) >= cartTotal.total && (
                  <View style={styles.changeSection}>
                    <Text style={styles.changeLabel}>Change Due</Text>
                    <Text style={styles.changeValue}>
                      ${(parseFloat(amountPaid) - cartTotal.total).toFixed(2)}
                    </Text>
                  </View>
                )}
              </>
            )}

            <TouchableOpacity style={styles.processButton} onPress={processPayment} activeOpacity={0.8}>
              <CheckCircle color="#ffffff" size={20} />
              <Text style={styles.processButtonText}>Complete Sale</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal visible={showReceiptModal} transparent animationType="fade">
        <View style={styles.receiptOverlay}>
          <View style={styles.receiptContent}>
            <View style={styles.receiptSuccess}>
              <View style={styles.successCircle}>
                <CheckCircle color="#ffffff" size={40} />
              </View>
              <Text style={styles.receiptSuccessText}>Payment Successful!</Text>
            </View>

            {lastTransaction && (
              <View style={styles.receiptBody}>
                <Text style={styles.receiptNumber}>{lastTransaction.transactionNumber}</Text>
                <Text style={styles.receiptDate}>{new Date(lastTransaction.date).toLocaleString()}</Text>

                <View style={styles.receiptDivider} />

                {lastTransaction.items.map((item) => (
                  <View key={item.id} style={styles.receiptItem}>
                    <Text style={styles.receiptItemName}>{item.productName} x{item.quantity}</Text>
                    <Text style={styles.receiptItemPrice}>${item.total.toFixed(2)}</Text>
                  </View>
                ))}

                <View style={styles.receiptDivider} />

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Subtotal</Text>
                  <Text style={styles.receiptValue}>${lastTransaction.subtotal.toFixed(2)}</Text>
                </View>
                {lastTransaction.discount > 0 && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Discount</Text>
                    <Text style={[styles.receiptValue, { color: '#10b981' }]}>-${lastTransaction.discount.toFixed(2)}</Text>
                  </View>
                )}
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Tax</Text>
                  <Text style={styles.receiptValue}>${lastTransaction.tax.toFixed(2)}</Text>
                </View>
                <View style={[styles.receiptRow, { marginTop: 8 }]}>
                  <Text style={styles.receiptTotalLabel}>Total</Text>
                  <Text style={styles.receiptTotalValue}>${lastTransaction.total.toFixed(2)}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Paid ({lastTransaction.paymentMethod})</Text>
                  <Text style={styles.receiptValue}>${lastTransaction.amountPaid.toFixed(2)}</Text>
                </View>
                {lastTransaction.change > 0 && (
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { fontWeight: '700' as const }]}>Change</Text>
                    <Text style={[styles.receiptValue, { fontWeight: '700' as const, color: '#10b981' }]}>
                      ${lastTransaction.change.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.receiptCloseBtn} onPress={() => setShowReceiptModal(false)}>
              <Text style={styles.receiptCloseText}>New Sale</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Product Detail Modal */}
      <Modal visible={showProductDetailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Product Details</Text>
              <TouchableOpacity onPress={() => setShowProductDetailModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            {selectedProduct && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.productDetailHeader}>
                  <Text style={styles.productDetailName}>{selectedProduct.name}</Text>
                  <Text style={styles.productDetailCategory}>{selectedProduct.category}</Text>
                </View>

                <View style={styles.productDetailGrid}>
                  <View style={styles.productDetailCell}>
                    <Tag color="#2563eb" size={16} />
                    <Text style={styles.detailCellLabel}>SKU</Text>
                    <Text style={styles.detailCellValue}>{selectedProduct.sku}</Text>
                  </View>
                  <View style={styles.productDetailCell}>
                    <DollarSign color="#10b981" size={16} />
                    <Text style={styles.detailCellLabel}>Price</Text>
                    <Text style={styles.detailCellValue}>${selectedProduct.sellingPrice.toFixed(2)}</Text>
                  </View>
                  <View style={styles.productDetailCell}>
                    <Package color="#f59e0b" size={16} />
                    <Text style={styles.detailCellLabel}>Stock</Text>
                    <Text style={styles.detailCellValue}>{selectedProduct.currentStock} {selectedProduct.unit}</Text>
                  </View>
                  <View style={styles.productDetailCell}>
                    <DollarSign color="#64748b" size={16} />
                    <Text style={styles.detailCellLabel}>Cost</Text>
                    <Text style={styles.detailCellValue}>${selectedProduct.costPrice.toFixed(2)}</Text>
                  </View>
                </View>

                {selectedProduct.barcode && (
                  <View style={styles.barcodeSection}>
                    <Text style={styles.barcodeSectionTitle}>Barcode</Text>
                    <Image
                      source={{ uri: generateBarcodeURL(selectedProduct.barcode) }}
                      style={styles.barcodeImage}
                      contentFit="contain"
                    />
                    <Text style={styles.barcodeText}>{selectedProduct.barcode}</Text>
                  </View>
                )}

                <View style={styles.qrSection}>
                  <Text style={styles.barcodeSectionTitle}>QR Code</Text>
                  <Image
                    source={{ uri: generateProductQR(selectedProduct.id, selectedProduct.sku, selectedProduct.name) }}
                    style={styles.qrImage}
                    contentFit="contain"
                  />
                </View>

                <TouchableOpacity
                  style={styles.addToCartDetailBtn}
                  onPress={() => { addToCart(selectedProduct); setShowProductDetailModal(false); }}
                >
                  <Plus color="#ffffff" size={20} />
                  <Text style={styles.addToCartDetailText}>Add to Cart</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={showHistoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={posTransactions.slice(-20).reverse()}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <View style={styles.emptyCart}>
                  <Receipt color="#cbd5e1" size={48} />
                  <Text style={styles.emptyCartTitle}>No transactions yet</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyNumber}>{item.transactionNumber}</Text>
                    <Text style={styles.historyDate}>{new Date(item.date).toLocaleString()}</Text>
                    <Text style={styles.historyItems}>{item.items.length} items | {item.paymentMethod}</Text>
                  </View>
                  <Text style={styles.historyTotal}>${item.total.toFixed(2)}</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Electronics: '#3b82f6',
    Food: '#10b981',
    Clothing: '#ec4899',
    Office: '#f59e0b',
    Hardware: '#64748b',
  };
  return colors[category] || '#8b5cf6';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  tabActive: {
    backgroundColor: '#eff6ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#2563eb',
  },
  cartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  productsPanel: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  barcodeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  barcodeBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  barcodeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  barcodeInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  barcodeInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  barcodeLookupBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsCount: {
    fontSize: 12,
    color: '#94a3b8',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  productsGrid: {
    flex: 1,
  },
  productsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    width: (SCREEN_WIDTH - 36) / 2 - 4,
    margin: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  productCardInCart: {
    borderColor: '#3b82f6',
    backgroundColor: '#fafbff',
  },
  productCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  productCategory: {
    fontSize: 11,
    color: '#94a3b8',
    flex: 1,
  },
  lowStockBadge: {
    padding: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 4,
    lineHeight: 18,
  },
  productSKU: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 10,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#0f172a',
  },
  stockInfo: {},
  productStock: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600' as const,
  },
  inCartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inCartText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  viewCartFAB: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  viewCartText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  cartPanel: {
    flex: 1,
  },
  customerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  customerButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    fontWeight: '500' as const,
  },
  cartActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  clearCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  clearCartText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#ef4444',
  },
  cartList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  cartItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cartItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  cartItemSku: {
    fontSize: 12,
    color: '#94a3b8',
  },
  cartItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qtyButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0f172a',
    minWidth: 28,
    textAlign: 'center' as const,
  },
  cartItemPricing: {
    alignItems: 'flex-end',
  },
  cartItemUnitPrice: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCartTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginTop: 16,
  },
  emptyCartSub: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 4,
  },
  browseBtn: {
    marginTop: 20,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  browseBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563eb',
  },
  emptyProducts: {
    alignItems: 'center',
    paddingVertical: 60,
    width: '100%',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 4,
  },
  cartFooter: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  discountInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  summarySection: {
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
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
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#2563eb',
  },
  checkoutButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
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
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  customerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  customerOptionActive: {
    backgroundColor: '#eff6ff',
  },
  customerOptionText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '500' as const,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 13,
    color: '#64748b',
  },
  paymentTotalSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  paymentTotal: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#0f172a',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#475569',
    marginLeft: 20,
    marginTop: 16,
    marginBottom: 10,
  },
  paymentMethods: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  paymentMethodButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  paymentMethodActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
    marginTop: 6,
  },
  paymentMethodTextActive: {
    color: '#ffffff',
  },
  amountInput: {
    marginHorizontal: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    textAlign: 'center' as const,
  },
  quickAmounts: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 12,
  },
  quickAmountBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#475569',
  },
  changeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
  },
  changeLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#15803d',
  },
  changeValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#15803d',
  },
  processButton: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  processButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  receiptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  receiptContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
  },
  receiptSuccess: {
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 28,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptSuccessText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  receiptBody: {
    padding: 20,
  },
  receiptNumber: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563eb',
    textAlign: 'center' as const,
  },
  receiptDate: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center' as const,
    marginTop: 2,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  receiptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  receiptItemName: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  receiptItemPrice: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  receiptLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  receiptTotalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  receiptTotalValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#2563eb',
  },
  receiptCloseBtn: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  receiptCloseText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  productDetailHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  productDetailName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  productDetailCategory: {
    fontSize: 14,
    color: '#64748b',
  },
  productDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  productDetailCell: {
    width: '47%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  detailCellLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  detailCellValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  barcodeSection: {
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 12,
  },
  barcodeSectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 10,
  },
  barcodeImage: {
    width: 200,
    height: 80,
  },
  barcodeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginTop: 8,
    letterSpacing: 2,
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 16,
  },
  qrImage: {
    width: 150,
    height: 150,
  },
  addToCartDetailBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
  },
  addToCartDetailText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyLeft: {},
  historyNumber: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  historyDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  historyItems: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  historyTotal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#10b981',
  },
});
