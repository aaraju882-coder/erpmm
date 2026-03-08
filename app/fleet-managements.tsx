import React, { useState, useMemo } from 'react';
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
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Car,
  Fuel,
  Wrench,
  MapPin,
  Plus,
  Search,
  X,
  Check,
  TrendingUp,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  type: 'car' | 'truck' | 'van' | 'motorcycle';
  status: 'active' | 'maintenance' | 'inactive';
  assignedTo?: string;
  mileage: number;
  fuelType: string;
  lastService?: string;
  nextService?: string;
  insuranceExpiry?: string;
  notes?: string;
}

interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  cost: number;
  mileage: number;
  station?: string;
}

interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: string;
  type: 'routine' | 'repair' | 'inspection' | 'emergency';
  description: string;
  cost: number;
  status: 'scheduled' | 'in-progress' | 'completed';
  vendor?: string;
}

const STORAGE_KEY_VEHICLES = 'erp_fleet_vehicles';
const STORAGE_KEY_FUEL = 'erp_fleet_fuel';
const STORAGE_KEY_MAINTENANCE = 'erp_fleet_maintenance';

type TabType = 'vehicles' | 'fuel' | 'maintenance';

export default function FleetManagementScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('vehicles');
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [, setIsLoaded] = useState(false);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vehicleData, fuelData, maintenanceData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_VEHICLES),
        AsyncStorage.getItem(STORAGE_KEY_FUEL),
        AsyncStorage.getItem(STORAGE_KEY_MAINTENANCE),
      ]);
      setVehicles(vehicleData ? JSON.parse(vehicleData) : []);
      setFuelLogs(fuelData ? JSON.parse(fuelData) : []);
      setMaintenanceRecords(maintenanceData ? JSON.parse(maintenanceData) : []);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading fleet data:', error);
      setIsLoaded(true);
    }
  };

  const saveVehicles = async (data: Vehicle[]) => {
    setVehicles(data);
    await AsyncStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(data));
  };

  const saveFuelLogs = async (data: FuelLog[]) => {
    setFuelLogs(data);
    await AsyncStorage.setItem(STORAGE_KEY_FUEL, JSON.stringify(data));
  };

  const saveMaintenanceRecords = async (data: MaintenanceRecord[]) => {
    setMaintenanceRecords(data);
    await AsyncStorage.setItem(STORAGE_KEY_MAINTENANCE, JSON.stringify(data));
  };

  const stats = useMemo(() => {
    const activeVehicles = vehicles.filter(v => v.status === 'active').length;
    const inMaintenance = vehicles.filter(v => v.status === 'maintenance').length;
    const totalFuelCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
    const totalMaintenanceCost = maintenanceRecords.reduce((s, m) => s + m.cost, 0);
    const scheduledMaintenance = maintenanceRecords.filter(m => m.status === 'scheduled').length;
    return { activeVehicles, inMaintenance, totalFuelCost, totalMaintenanceCost, scheduledMaintenance };
  }, [vehicles, fuelLogs, maintenanceRecords]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'maintenance': return '#f59e0b';
      case 'inactive': return '#64748b';
      case 'scheduled': return '#3b82f6';
      case 'in-progress': return '#f59e0b';
      case 'completed': return '#10b981';
      default: return '#64748b';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'truck': return '🚛';
      case 'van': return '🚐';
      case 'motorcycle': return '🏍️';
      default: return '🚗';
    }
  };

  const AddVehicleModal = () => {
    const [name, setName] = useState('');
    const [plate, setPlate] = useState('');
    const [type, setType] = useState<Vehicle['type']>('car');
    const [fuelType, setFuelType] = useState('Gasoline');
    const [mileage, setMileage] = useState('');

    const handleAdd = async () => {
      if (!name || !plate) {
        Alert.alert('Error', 'Name and plate number are required');
        return;
      }
      const newVehicle: Vehicle = {
        id: Date.now().toString(),
        name,
        plateNumber: plate,
        type,
        status: 'active',
        mileage: parseInt(mileage) || 0,
        fuelType,
      };
      await saveVehicles([...vehicles, newVehicle]);
      setShowVehicleModal(false);
      Alert.alert('Success', 'Vehicle added');
    };

    return (
      <Modal visible={showVehicleModal} animationType="slide" transparent onRequestClose={() => setShowVehicleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Vehicle</Text>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Vehicle Name *</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Toyota Camry 2024" placeholderTextColor="#94a3b8" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Plate Number *</Text>
                <TextInput style={styles.input} value={plate} onChangeText={setPlate} placeholder="ABC-1234" placeholderTextColor="#94a3b8" autoCapitalize="characters" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.typeRow}>
                  {(['car', 'truck', 'van', 'motorcycle'] as const).map(t => (
                    <TouchableOpacity key={t} style={[styles.typeChip, type === t && styles.typeChipActive]} onPress={() => setType(t)}>
                      <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                        {getTypeIcon(t)} {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Fuel Type</Text>
                <TextInput style={styles.input} value={fuelType} onChangeText={setFuelType} placeholder="Gasoline" placeholderTextColor="#94a3b8" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Current Mileage</Text>
                <TextInput style={styles.input} value={mileage} onChangeText={setMileage} placeholder="50000" keyboardType="number-pad" placeholderTextColor="#94a3b8" />
              </View>
              <TouchableOpacity style={styles.submitButton} onPress={handleAdd}>
                <Check color="#ffffff" size={20} />
                <Text style={styles.submitButtonText}>Add Vehicle</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const AddFuelModal = () => {
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [liters, setLiters] = useState('');
    const [cost, setCost] = useState('');
    const [currentMileage, setCurrentMileage] = useState('');

    const handleAdd = async () => {
      if (!selectedVehicle || !liters || !cost) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }
      const newLog: FuelLog = {
        id: Date.now().toString(),
        vehicleId: selectedVehicle,
        date: new Date().toISOString(),
        liters: parseFloat(liters),
        cost: parseFloat(cost),
        mileage: parseInt(currentMileage) || 0,
      };
      await saveFuelLogs([...fuelLogs, newLog]);
      if (currentMileage) {
        const updatedVehicles = vehicles.map(v =>
          v.id === selectedVehicle ? { ...v, mileage: parseInt(currentMileage) } : v
        );
        await saveVehicles(updatedVehicles);
      }
      setShowFuelModal(false);
      Alert.alert('Success', 'Fuel log added');
    };

    return (
      <Modal visible={showFuelModal} animationType="slide" transparent onRequestClose={() => setShowFuelModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Fuel</Text>
              <TouchableOpacity onPress={() => setShowFuelModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Vehicle *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {vehicles.map(v => (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.selectChip, selectedVehicle === v.id && styles.selectChipActive]}
                      onPress={() => setSelectedVehicle(v.id)}
                    >
                      <Text style={[styles.selectChipText, selectedVehicle === v.id && styles.selectChipTextActive]}>
                        {v.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Liters *</Text>
                <TextInput style={styles.input} value={liters} onChangeText={setLiters} placeholder="40" keyboardType="decimal-pad" placeholderTextColor="#94a3b8" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Cost *</Text>
                <TextInput style={styles.input} value={cost} onChangeText={setCost} placeholder="60.00" keyboardType="decimal-pad" placeholderTextColor="#94a3b8" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Current Mileage</Text>
                <TextInput style={styles.input} value={currentMileage} onChangeText={setCurrentMileage} placeholder="51000" keyboardType="number-pad" placeholderTextColor="#94a3b8" />
              </View>
              <TouchableOpacity style={styles.submitButton} onPress={handleAdd}>
                <Check color="#ffffff" size={20} />
                <Text style={styles.submitButtonText}>Log Fuel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const AddMaintenanceModal = () => {
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [mType, setMType] = useState<MaintenanceRecord['type']>('routine');
    const [description, setDescription] = useState('');
    const [cost, setCost] = useState('');

    const handleAdd = async () => {
      if (!selectedVehicle || !description) {
        Alert.alert('Error', 'Please fill required fields');
        return;
      }
      const newRecord: MaintenanceRecord = {
        id: Date.now().toString(),
        vehicleId: selectedVehicle,
        date: new Date().toISOString(),
        type: mType,
        description,
        cost: parseFloat(cost) || 0,
        status: 'scheduled',
      };
      await saveMaintenanceRecords([...maintenanceRecords, newRecord]);
      setShowMaintenanceModal(false);
      Alert.alert('Success', 'Maintenance record added');
    };

    return (
      <Modal visible={showMaintenanceModal} animationType="slide" transparent onRequestClose={() => setShowMaintenanceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Maintenance</Text>
              <TouchableOpacity onPress={() => setShowMaintenanceModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Vehicle *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {vehicles.map(v => (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.selectChip, selectedVehicle === v.id && styles.selectChipActive]}
                      onPress={() => setSelectedVehicle(v.id)}
                    >
                      <Text style={[styles.selectChipText, selectedVehicle === v.id && styles.selectChipTextActive]}>
                        {v.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.typeRow}>
                  {(['routine', 'repair', 'inspection', 'emergency'] as const).map(t => (
                    <TouchableOpacity key={t} style={[styles.typeChip, mType === t && styles.typeChipActive]} onPress={() => setMType(t)}>
                      <Text style={[styles.typeChipText, mType === t && styles.typeChipTextActive]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Oil change, tire rotation..." multiline placeholderTextColor="#94a3b8" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Estimated Cost</Text>
                <TextInput style={styles.input} value={cost} onChangeText={setCost} placeholder="150.00" keyboardType="decimal-pad" placeholderTextColor="#94a3b8" />
              </View>
              <TouchableOpacity style={styles.submitButton} onPress={handleAdd}>
                <Check color="#ffffff" size={20} />
                <Text style={styles.submitButtonText}>Add Record</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#0f172a" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fleet Management</Text>
        <View style={{ width: 40 }} />
      </View>

      <LinearGradient colors={['#7c3aed', '#6d28d9']} style={styles.statsBanner}>
        <View style={styles.statsRow}>
          <View style={styles.statsItem}>
            <Car color="#c4b5fd" size={18} />
            <Text style={styles.statsValue}>{stats.activeVehicles}</Text>
            <Text style={styles.statsLabel}>Active</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsItem}>
            <Wrench color="#fcd34d" size={18} />
            <Text style={styles.statsValue}>{stats.inMaintenance}</Text>
            <Text style={styles.statsLabel}>In Service</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsItem}>
            <Fuel color="#86efac" size={18} />
            <Text style={styles.statsValue}>{formatCurrency(stats.totalFuelCost)}</Text>
            <Text style={styles.statsLabel}>Fuel Cost</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsItem}>
            <TrendingUp color="#93c5fd" size={18} />
            <Text style={styles.statsValue}>{formatCurrency(stats.totalMaintenanceCost)}</Text>
            <Text style={styles.statsLabel}>Maint. Cost</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabsContainer}>
        {(['vehicles', 'fuel', 'maintenance'] as TabType[]).map(tab => (
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {activeTab === 'vehicles' && (
          <>
            {vehicles.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())).map(vehicle => (
              <TouchableOpacity
                key={vehicle.id}
                style={styles.vehicleCard}
                onPress={() => {
                  Alert.alert(vehicle.name, `Plate: ${vehicle.plateNumber}\nMileage: ${vehicle.mileage.toLocaleString()} km\nFuel: ${vehicle.fuelType}`, [
                    { text: 'Set Active', onPress: async () => { await saveVehicles(vehicles.map(v => v.id === vehicle.id ? { ...v, status: 'active' } : v)); } },
                    { text: 'Set Maintenance', onPress: async () => { await saveVehicles(vehicles.map(v => v.id === vehicle.id ? { ...v, status: 'maintenance' } : v)); } },
                    { text: 'Delete', style: 'destructive', onPress: async () => { await saveVehicles(vehicles.filter(v => v.id !== vehicle.id)); } },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }}
              >
                <View style={styles.vehicleCardHeader}>
                  <View style={styles.vehicleCardLeft}>
                    <Text style={styles.vehicleEmoji}>{getTypeIcon(vehicle.type)}</Text>
                    <View>
                      <Text style={styles.vehicleName}>{vehicle.name}</Text>
                      <Text style={styles.vehiclePlate}>{vehicle.plateNumber}</Text>
                    </View>
                  </View>
                  <View style={[styles.vehicleStatus, { backgroundColor: getStatusColor(vehicle.status) + '15' }]}>
                    <Text style={[styles.vehicleStatusText, { color: getStatusColor(vehicle.status) }]}>
                      {vehicle.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.vehicleStats}>
                  <View style={styles.vehicleStat}>
                    <MapPin color="#94a3b8" size={14} />
                    <Text style={styles.vehicleStatText}>{vehicle.mileage.toLocaleString()} km</Text>
                  </View>
                  <View style={styles.vehicleStat}>
                    <Fuel color="#94a3b8" size={14} />
                    <Text style={styles.vehicleStatText}>{vehicle.fuelType}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {vehicles.length === 0 && (
              <View style={styles.emptyState}>
                <Car color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>No vehicles yet</Text>
                <Text style={styles.emptyStateSub}>Add your first vehicle to get started</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'fuel' && (
          <>
            {fuelLogs.slice().reverse().map(log => {
              const vehicle = vehicles.find(v => v.id === log.vehicleId);
              return (
                <View key={log.id} style={styles.fuelCard}>
                  <View style={styles.fuelCardIcon}>
                    <Fuel color="#059669" size={18} />
                  </View>
                  <View style={styles.fuelCardInfo}>
                    <Text style={styles.fuelCardVehicle}>{vehicle?.name || 'Unknown'}</Text>
                    <Text style={styles.fuelCardDate}>
                      {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.fuelCardStats}>
                    <Text style={styles.fuelCardLiters}>{log.liters}L</Text>
                    <Text style={styles.fuelCardCost}>${log.cost.toFixed(2)}</Text>
                  </View>
                </View>
              );
            })}
            {fuelLogs.length === 0 && (
              <View style={styles.emptyState}>
                <Fuel color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>No fuel logs</Text>
                <Text style={styles.emptyStateSub}>Log fuel to track consumption</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'maintenance' && (
          <>
            {maintenanceRecords.slice().reverse().map(record => {
              const vehicle = vehicles.find(v => v.id === record.vehicleId);
              return (
                <TouchableOpacity
                  key={record.id}
                  style={styles.maintenanceCard}
                  onPress={() => {
                    Alert.alert('Update Status', record.description, [
                      { text: 'In Progress', onPress: async () => { await saveMaintenanceRecords(maintenanceRecords.map(m => m.id === record.id ? { ...m, status: 'in-progress' } : m)); } },
                      { text: 'Completed', onPress: async () => { await saveMaintenanceRecords(maintenanceRecords.map(m => m.id === record.id ? { ...m, status: 'completed' } : m)); } },
                      { text: 'Cancel', style: 'cancel' },
                    ]);
                  }}
                >
                  <View style={styles.maintenanceHeader}>
                    <View style={styles.maintenanceLeft}>
                      <View style={[styles.maintenanceIcon, {
                        backgroundColor: record.type === 'emergency' ? '#fef2f2' : record.type === 'repair' ? '#fef3c7' : '#ecfdf5',
                      }]}>
                        <Wrench color={record.type === 'emergency' ? '#ef4444' : record.type === 'repair' ? '#d97706' : '#059669'} size={16} />
                      </View>
                      <View>
                        <Text style={styles.maintenanceVehicle}>{vehicle?.name || 'Unknown'}</Text>
                        <Text style={styles.maintenanceType}>{record.type.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={[styles.maintenanceStatus, { backgroundColor: getStatusColor(record.status) + '15' }]}>
                      <Text style={[styles.maintenanceStatusText, { color: getStatusColor(record.status) }]}>
                        {record.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.maintenanceDesc} numberOfLines={2}>{record.description}</Text>
                  <View style={styles.maintenanceFooter}>
                    <Text style={styles.maintenanceCost}>${record.cost.toFixed(2)}</Text>
                    <Text style={styles.maintenanceDate}>
                      {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {maintenanceRecords.length === 0 && (
              <View style={styles.emptyState}>
                <Wrench color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>No maintenance records</Text>
                <Text style={styles.emptyStateSub}>Schedule maintenance to keep fleet healthy</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (activeTab === 'vehicles') setShowVehicleModal(true);
          else if (activeTab === 'fuel') {
            if (vehicles.length === 0) {
              Alert.alert('No Vehicles', 'Add a vehicle first');
            } else {
              setShowFuelModal(true);
            }
          } else {
            if (vehicles.length === 0) {
              Alert.alert('No Vehicles', 'Add a vehicle first');
            } else {
              setShowMaintenanceModal(true);
            }
          }
        }}
      >
        <Plus color="#ffffff" size={26} />
      </TouchableOpacity>

      <AddVehicleModal />
      <AddFuelModal />
      <AddMaintenanceModal />
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
  statsBanner: { borderRadius: 18, padding: 18, marginHorizontal: 16, marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statsItem: { flex: 1, alignItems: 'center', gap: 4 },
  statsDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)' },
  statsValue: { fontSize: 18, fontWeight: '800' as const, color: '#ffffff' },
  statsLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '500' as const },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#ffffff', alignItems: 'center' },
  tabActive: { backgroundColor: '#7c3aed' },
  tabText: { fontSize: 13, fontWeight: '600' as const, color: '#64748b' },
  tabTextActive: { color: '#ffffff' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    marginHorizontal: 16, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginBottom: 12, gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a' },
  content: { flex: 1, paddingHorizontal: 16 },
  vehicleCard: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  vehicleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  vehicleCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleEmoji: { fontSize: 28 },
  vehicleName: { fontSize: 16, fontWeight: '700' as const, color: '#0f172a' },
  vehiclePlate: { fontSize: 13, color: '#64748b', fontWeight: '600' as const },
  vehicleStatus: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  vehicleStatusText: { fontSize: 10, fontWeight: '700' as const },
  vehicleStats: { flexDirection: 'row', gap: 20 },
  vehicleStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vehicleStatText: { fontSize: 13, color: '#64748b' },
  fuelCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    borderRadius: 14, padding: 14, marginBottom: 8, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  fuelCardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center' },
  fuelCardInfo: { flex: 1 },
  fuelCardVehicle: { fontSize: 15, fontWeight: '600' as const, color: '#0f172a' },
  fuelCardDate: { fontSize: 12, color: '#94a3b8' },
  fuelCardStats: { alignItems: 'flex-end' },
  fuelCardLiters: { fontSize: 15, fontWeight: '700' as const, color: '#0f172a' },
  fuelCardCost: { fontSize: 12, color: '#059669', fontWeight: '600' as const },
  maintenanceCard: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  maintenanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  maintenanceLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  maintenanceIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  maintenanceVehicle: { fontSize: 15, fontWeight: '600' as const, color: '#0f172a' },
  maintenanceType: { fontSize: 10, color: '#94a3b8', fontWeight: '600' as const },
  maintenanceStatus: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  maintenanceStatusText: { fontSize: 10, fontWeight: '700' as const },
  maintenanceDesc: { fontSize: 13, color: '#475569', marginBottom: 10 },
  maintenanceFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  maintenanceCost: { fontSize: 14, fontWeight: '700' as const, color: '#0f172a' },
  maintenanceDate: { fontSize: 12, color: '#94a3b8' },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyStateText: { fontSize: 16, fontWeight: '600' as const, color: '#64748b' },
  emptyStateSub: { fontSize: 13, color: '#94a3b8' },
  fab: {
    position: 'absolute', right: 16, bottom: 16, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '700' as const, color: '#0f172a' },
  formGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600' as const, color: '#0f172a', marginBottom: 8 },
  input: {
    backgroundColor: '#f1f5f9', borderRadius: 12, padding: 14, fontSize: 15, color: '#0f172a',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  typeChipActive: { backgroundColor: '#7c3aed' },
  typeChipText: { fontSize: 13, color: '#64748b', fontWeight: '600' as const },
  typeChipTextActive: { color: '#ffffff' },
  selectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8 },
  selectChipActive: { backgroundColor: '#7c3aed' },
  selectChipText: { fontSize: 13, color: '#64748b', fontWeight: '600' as const },
  selectChipTextActive: { color: '#ffffff' },
  submitButton: {
    backgroundColor: '#7c3aed', borderRadius: 12, padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
  },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' as const },
});
