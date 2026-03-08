import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ChevronLeft, Flashlight, FlashlightOff } from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const { products } = useERP();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'QR & Barcode Scanner',
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>We need camera permission to scan</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);

    const product = products.find((p) => p.barcode === data || p.sku === data || p.id === data);

    if (product) {
      Alert.alert(
        '✅ Product Found!',
        `Name: ${product.name}\nSKU: ${product.sku}\nBarcode: ${product.barcode || 'N/A'}\nCategory: ${product.category}\nStock: ${product.currentStock} ${product.unit}\nCost: ${product.costPrice}\nPrice: ${product.sellingPrice}\nStatus: ${product.status}`,
        [
          {
            text: 'View Details',
            onPress: () => {
              router.back();
              router.push('/inventory');
            },
          },
          {
            text: 'Scan Again',
            onPress: () => setScanned(false),
          },
          {
            text: 'Close',
            onPress: () => router.back(),
            style: 'cancel',
          },
        ]
      );
    } else {
      Alert.alert(
        '📱 Code Scanned',
        `Type: ${type}\nData: ${data}\n\nNo matching product found in inventory.\n\nThis code can be used to:\n• Create a new product\n• Link to existing product\n• Track assets\n• Employee check-in`,
        [
          {
            text: 'Create Product',
            onPress: () => {
              router.back();
              router.push('/inventory');
            },
          },
          {
            text: 'Scan Again',
            onPress: () => setScanned(false),
          },
          {
            text: 'Close',
            onPress: () => router.back(),
            style: 'cancel',
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'QR & Barcode Scanner',
          headerBackTitle: 'Back',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft color="#ffffff" size={24} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#0f172a',
          },
          headerTintColor: '#ffffff',
        }}
      />

      {Platform.OS !== 'web' ? (
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: [
              'qr',
              'ean13',
              'ean8',
              'upc_a',
              'upc_e',
              'code128',
              'code39',
              'code93',
              'codabar',
              'itf14',
            ],
          }}
          enableTorch={torchOn}
        >
          <View style={styles.overlay}>
            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            <View style={styles.instructions}>
              <Text style={styles.instructionsText}>
                Align barcode or QR code within the frame
              </Text>
            </View>

            <TouchableOpacity
              style={styles.torchButton}
              onPress={() => setTorchOn(!torchOn)}
            >
              {torchOn ? (
                <FlashlightOff color="#ffffff" size={28} />
              ) : (
                <Flashlight color="#ffffff" size={28} />
              )}
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        <View style={styles.webContainer}>
          <Text style={styles.webText}>Camera scanning is not available on web</Text>
          <Text style={styles.webSubtext}>Please use the mobile app to scan QR codes and barcodes</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const FRAME_SIZE = width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  backButton: {
    marginLeft: 8,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#2563eb',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  torchButton: {
    position: 'absolute',
    bottom: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  webText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  webSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
