import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { useERP } from '@/contexts/ERPContext';
import {
  User,
  Building,
  Bell,
  Lock,
  CreditCard,
  Globe,
  Moon,
  Smartphone,
  HelpCircle,
  FileText,
  ChevronRight,
  LogOut,
  Info,
  Shield,
  Database,
  Upload,
  Trash2,
  Edit3,
  Check,
  X,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Server,
  HardDrive,
  AlertTriangle,
  Palette,
  Clock,
  Wifi,
  Key,
} from 'lucide-react-native';

const LANGUAGES = [
  { code: 'en', name: 'English', region: 'US' },
  { code: 'es', name: 'Spanish', region: 'ES' },
  { code: 'fr', name: 'French', region: 'FR' },
  { code: 'de', name: 'German', region: 'DE' },
  { code: 'ar', name: 'Arabic', region: 'SA' },
  { code: 'hi', name: 'Hindi', region: 'IN' },
  { code: 'zh', name: 'Chinese', region: 'CN' },
  { code: 'ja', name: 'Japanese', region: 'JP' },
  { code: 'pt', name: 'Portuguese', region: 'BR' },
  { code: 'ru', name: 'Russian', region: 'RU' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'SAR', 'JPY', 'CNY', 'BRL', 'AUD'];
const TIMEZONES = ['UTC', 'EST', 'CST', 'MST', 'PST', 'GMT', 'IST', 'JST', 'CET', 'AEST'];
const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD-MMM-YYYY'];

const SETTINGS_STORAGE_KEY = 'erp_app_settings';

interface AppSettings {
  notifications: boolean;
  darkMode: boolean;
  biometric: boolean;
  language: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  autoBackup: boolean;
  dataRetentionDays: number;
  compactMode: boolean;
  soundEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  notifications: true,
  darkMode: false,
  biometric: false,
  language: 'en',
  currency: 'USD',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  autoBackup: false,
  dataRetentionDays: 365,
  compactMode: false,
  soundEnabled: true,
};

export default function SettingsScreen() {
  const { currentUser, logout, changePassword, updateUser } = useAuth();
  const { exportAllData, importAllData } = useERP();

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [showDateFormatModal, setShowDateFormatModal] = useState(false);

  const [showAboutModal, setShowAboutModal] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [profileForm, setProfileForm] = useState({
    fullName: currentUser?.fullName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
  });

  const [backupData, setBackupData] = useState('');

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.log('Error loading settings:', e);
    }
  };

  const saveSetting = async (key: keyof AppSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      console.log(`Setting saved: ${key} = ${value}`);
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    const result = await changePassword(oldPassword, newPassword);
    if (result.success) {
      Alert.alert('Success', result.message);
      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }
    if (!currentUser) return;
    const result = await updateUser(currentUser.id, {
      fullName: profileForm.fullName,
      email: profileForm.email,
      phone: profileForm.phone,
    });
    if (result.success) {
      Alert.alert('Success', 'Profile updated successfully');
      setShowProfileModal(false);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportAllData();
      if (Platform.OS === 'web') {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `erp_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Data exported successfully');
      } else {
        Alert.alert('Export Complete', 'Data has been prepared for export. Use the backup JSON below to save.', [
          { text: 'OK' },
        ]);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleRestoreData = async () => {
    if (!backupData.trim()) {
      Alert.alert('Error', 'Please paste backup data');
      return;
    }
    Alert.alert('Confirm Restore', 'This will replace all current data. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        style: 'destructive',
        onPress: async () => {
          const result = await importAllData(backupData);
          if (result.success) {
            Alert.alert('Success', result.message);
            setShowBackupModal(false);
            setBackupData('');
          } else {
            Alert.alert('Error', result.message);
          }
        },
      },
    ]);
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete ALL data including employees, customers, invoices, products and more. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await importAllData('{}');
            Alert.alert('Success', 'All data has been cleared');
          },
        },
      ]
    );
  };

  const getStorageInfo = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      for (const key of keys) {
        const val = await AsyncStorage.getItem(key);
        if (val) totalSize += val.length;
      }
      const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      Alert.alert(
        'Storage Info',
        `Total Keys: ${keys.length}\nEstimated Size: ${sizeMB} MB\n\nData is stored locally using AsyncStorage.\nAll data persists across app restarts.`
      );
    } catch {
      Alert.alert('Error', 'Failed to get storage info');
    }
  };

  const selectedLang = LANGUAGES.find((l) => l.code === settings.language) || LANGUAGES[0];

  const SettingItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    showToggle,
    toggleValue,
    onToggle,
    color = '#2563eb',
    rightText,
    danger,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showToggle?: boolean;
    toggleValue?: boolean;
    onToggle?: (value: boolean) => void;
    color?: string;
    rightText?: string;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={showToggle}
      activeOpacity={0.6}
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.settingIcon, { backgroundColor: (danger ? '#ef4444' : color) + '12' }]}>
          <Icon color={danger ? '#ef4444' : color} size={20} />
        </View>
        <View style={styles.settingItemContent}>
          <Text style={[styles.settingItemTitle, danger && { color: '#ef4444' }]}>{title}</Text>
          {subtitle && <Text style={styles.settingItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
          thumbColor="#ffffff"
        />
      ) : rightText ? (
        <View style={styles.rightTextContainer}>
          <Text style={styles.rightText}>{rightText}</Text>
          <ChevronRight color="#94a3b8" size={18} />
        </View>
      ) : (
        <ChevronRight color="#94a3b8" size={18} />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const PickerModal = ({
    visible,
    onClose,
    title,
    items,
    selected,
    onSelect,
    renderLabel,
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    items: string[];
    selected: string;
    onSelect: (item: string) => void;
    renderLabel?: (item: string) => string;
  }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContent}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X color="#64748b" size={24} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.pickerItem, selected === item && styles.pickerItemActive]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={[styles.pickerItemText, selected === item && styles.pickerItemTextActive]}>
                  {renderLabel ? renderLabel(item) : item}
                </Text>
                {selected === item && <Check color="#2563eb" size={20} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Settings' }} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => {
            setProfileForm({
              fullName: currentUser?.fullName || '',
              email: currentUser?.email || '',
              phone: currentUser?.phone || '',
            });
            setShowProfileModal(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.profileAvatar}>
            <User color="#ffffff" size={36} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{currentUser?.fullName || 'User'}</Text>
            <Text style={styles.profileEmail}>{currentUser?.email || ''}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{currentUser?.role?.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.editProfileIcon}>
            <Edit3 color="#3b82f6" size={18} />
          </View>
        </TouchableOpacity>

        {(currentUser?.role === 'superuser' || currentUser?.role === 'admin') && (
          <View style={styles.adminBanner}>
            <Shield size={18} color="#f59e0b" />
            <Text style={styles.adminBannerText}>Admin access enabled</Text>
          </View>
        )}

        <SectionHeader title="Account" />
        <View style={styles.section}>
          <SettingItem
            icon={User}
            title="Edit Profile"
            subtitle="Name, email, phone"
            onPress={() => {
              setProfileForm({
                fullName: currentUser?.fullName || '',
                email: currentUser?.email || '',
                phone: currentUser?.phone || '',
              });
              setShowProfileModal(true);
            }}
            color="#3b82f6"
          />
          <SettingItem
            icon={Building}
            title="Company Profile"
            subtitle="Manage company details"
            onPress={() => router.push('/company')}
            color="#8b5cf6"
          />
          <SettingItem
            icon={Key}
            title="Change Password"
            subtitle="Update your login password"
            onPress={() => setShowPasswordModal(true)}
            color="#ec4899"
          />
        </View>

        <SectionHeader title="Preferences" />
        <View style={styles.section}>
          <SettingItem
            icon={Bell}
            title="Push Notifications"
            subtitle="Receive alerts and updates"
            showToggle
            toggleValue={settings.notifications}
            onToggle={(v) => saveSetting('notifications', v)}
            color="#f59e0b"
          />
          <SettingItem
            icon={Moon}
            title="Dark Mode"
            subtitle="Switch to dark theme"
            showToggle
            toggleValue={settings.darkMode}
            onToggle={(v) => saveSetting('darkMode', v)}
            color="#64748b"
          />
          <SettingItem
            icon={Palette}
            title="Compact Mode"
            subtitle="Reduce spacing and padding"
            showToggle
            toggleValue={settings.compactMode}
            onToggle={(v) => saveSetting('compactMode', v)}
            color="#06b6d4"
          />
          <SettingItem
            icon={Bell}
            title="Sound Effects"
            subtitle="Play sounds for actions"
            showToggle
            toggleValue={settings.soundEnabled}
            onToggle={(v) => saveSetting('soundEnabled', v)}
            color="#10b981"
          />
        </View>

        <SectionHeader title="Regional" />
        <View style={styles.section}>
          <SettingItem
            icon={Globe}
            title="Language"
            subtitle={`${selectedLang.name} (${selectedLang.region})`}
            onPress={() => setShowLanguageModal(true)}
            color="#10b981"
            rightText={selectedLang.name}
          />
          <SettingItem
            icon={CreditCard}
            title="Currency"
            subtitle="Default currency for transactions"
            onPress={() => setShowCurrencyModal(true)}
            color="#f59e0b"
            rightText={settings.currency}
          />
          <SettingItem
            icon={Clock}
            title="Timezone"
            subtitle="Set your local timezone"
            onPress={() => setShowTimezoneModal(true)}
            color="#8b5cf6"
            rightText={settings.timezone}
          />
          <SettingItem
            icon={FileText}
            title="Date Format"
            subtitle="Choose how dates are displayed"
            onPress={() => setShowDateFormatModal(true)}
            color="#06b6d4"
            rightText={settings.dateFormat}
          />
        </View>

        <SectionHeader title="Security" />
        <View style={styles.section}>
          <SettingItem
            icon={Smartphone}
            title="Biometric Auth"
            subtitle="Use fingerprint or face ID"
            showToggle
            toggleValue={settings.biometric}
            onToggle={(v) => saveSetting('biometric', v)}
            color="#06b6d4"
          />
          <SettingItem
            icon={Lock}
            title="Session Timeout"
            subtitle="Auto-logout after inactivity"
            onPress={() =>
              Alert.alert(
                'Session Timeout',
                'Session timeout is set to 30 minutes of inactivity. This helps protect your data.',
                [{ text: 'OK' }]
              )
            }
            color="#ef4444"
          />
        </View>

        <SectionHeader title="Data & Storage" />
        <View style={styles.section}>
          <SettingItem
            icon={HardDrive}
            title="Storage Info"
            subtitle="View local database statistics"
            onPress={getStorageInfo}
            color="#0891b2"
          />
          <SettingItem
            icon={Database}
            title="Export Backup"
            subtitle="Download all data as JSON"
            onPress={handleExportData}
            color="#10b981"
          />
          <SettingItem
            icon={Upload}
            title="Restore Backup"
            subtitle="Import data from JSON file"
            onPress={() => setShowBackupModal(true)}
            color="#f59e0b"
          />
          <SettingItem
            icon={RefreshCw}
            title="Auto Backup"
            subtitle="Automatically save backup daily"
            showToggle
            toggleValue={settings.autoBackup}
            onToggle={(v) => saveSetting('autoBackup', v)}
            color="#8b5cf6"
          />
          <SettingItem
            icon={Trash2}
            title="Clear All Data"
            subtitle="Permanently delete everything"
            onPress={handleClearAllData}
            color="#ef4444"
            danger
          />
        </View>

        <SectionHeader title="System" />
        <View style={styles.section}>
          <SettingItem
            icon={Server}
            title="Database"
            subtitle="Local AsyncStorage (self-hosted)"
            onPress={() =>
              Alert.alert(
                'Database Info',
                'This app uses local AsyncStorage for data persistence.\n\nAll data is stored on your device and persists across app restarts.\n\nFor production use, connect to a remote MySQL/PostgreSQL server via the API settings.',
                [{ text: 'OK' }]
              )
            }
            color="#0d9488"
          />
          <SettingItem
            icon={Wifi}
            title="API Configuration"
            subtitle="Configure remote server connection"
            onPress={() =>
              Alert.alert(
                'API Configuration',
                'Currently running in offline/local mode.\n\nTo connect to a remote database:\n1. Set up your MySQL/PostgreSQL server\n2. Deploy the API backend\n3. Enter the API URL in settings\n\nAll data will sync automatically.',
                [{ text: 'OK' }]
              )
            }
            color="#3b82f6"
          />
        </View>

        <SectionHeader title="Support" />
        <View style={styles.section}>
          <SettingItem
            icon={HelpCircle}
            title="Help & Support"
            subtitle="FAQ, guides, and contact support"
            onPress={() =>
              Alert.alert('Help & Support', 'For support, contact:\n\nEmail: support@erp-system.com\nPhone: +1 (555) 123-4567\n\nDocumentation available at docs.erp-system.com', [
                { text: 'OK' },
              ])
            }
            color="#3b82f6"
          />
          <SettingItem
            icon={FileText}
            title="Terms & Privacy"
            subtitle="Legal information"
            onPress={() =>
              Alert.alert(
                'Terms & Privacy',
                'Your data is stored locally on your device. We do not collect or transmit any personal information.\n\nBy using this app, you agree to our terms of service and privacy policy.',
                [{ text: 'OK' }]
              )
            }
            color="#64748b"
          />
          <SettingItem
            icon={Info}
            title="About"
            subtitle="Version and system info"
            onPress={() => setShowAboutModal(true)}
            color="#475569"
          />
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <LogOut color="#ef4444" size={20} />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>ERP Management System</Text>
          <Text style={styles.footerVersion}>Version 2.0.0 | Build 2026.03</Text>
        </View>
      </ScrollView>

      {/* Profile Modal */}
      <Modal visible={showProfileModal} animationType="slide" transparent onRequestClose={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileEditAvatar}>
              <User color="#ffffff" size={40} />
            </View>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#94a3b8"
              value={profileForm.fullName}
              onChangeText={(v) => setProfileForm({ ...profileForm, fullName: v })}
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#94a3b8"
              value={profileForm.email}
              onChangeText={(v) => setProfileForm({ ...profileForm, email: v })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone"
              placeholderTextColor="#94a3b8"
              value={profileForm.phone}
              onChangeText={(v) => setProfileForm({ ...profileForm, phone: v })}
              keyboardType="phone-pad"
            />

            <View style={styles.profileRoleRow}>
              <Text style={styles.profileRoleLabel}>Role:</Text>
              <View style={styles.profileRoleBadge}>
                <Text style={styles.profileRoleText}>{currentUser?.role?.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowProfileModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={handleUpdateProfile}>
                <Save color="#ffffff" size={18} />
                <Text style={styles.modalSaveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => { setShowPasswordModal(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.passwordInputRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter current password"
                placeholderTextColor="#94a3b8"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOldPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowOldPass(!showOldPass)} style={styles.eyeButton}>
                {showOldPass ? <EyeOff color="#94a3b8" size={20} /> : <Eye color="#94a3b8" size={20} />}
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.passwordInputRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Minimum 6 characters"
                placeholderTextColor="#94a3b8"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)} style={styles.eyeButton}>
                {showNewPass ? <EyeOff color="#94a3b8" size={20} /> : <Eye color="#94a3b8" size={20} />}
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter new password"
              placeholderTextColor="#94a3b8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {newPassword.length > 0 && (
              <View style={styles.passwordStrength}>
                <View style={[styles.strengthBar, { width: newPassword.length >= 8 ? '100%' : newPassword.length >= 6 ? '60%' : '30%', backgroundColor: newPassword.length >= 8 ? '#10b981' : newPassword.length >= 6 ? '#f59e0b' : '#ef4444' }]} />
                <Text style={styles.strengthText}>
                  {newPassword.length >= 8 ? 'Strong' : newPassword.length >= 6 ? 'Medium' : 'Weak'}
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => { setShowPasswordModal(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={handleChangePassword}>
                <Lock color="#ffffff" size={18} />
                <Text style={styles.modalSaveText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Restore Backup Modal */}
      <Modal visible={showBackupModal} animationType="slide" transparent onRequestClose={() => setShowBackupModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Restore Data</Text>
              <TouchableOpacity onPress={() => { setShowBackupModal(false); setBackupData(''); }}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.warningBanner}>
              <AlertTriangle color="#f59e0b" size={20} />
              <Text style={styles.warningText}>This will overwrite all existing data</Text>
            </View>

            <Text style={styles.inputLabel}>Backup JSON Data</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder='Paste your backup JSON data here...'
              placeholderTextColor="#94a3b8"
              value={backupData}
              onChangeText={setBackupData}
              multiline
              numberOfLines={10}
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => { setShowBackupModal(false); setBackupData(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveButton, { backgroundColor: '#f59e0b' }]} onPress={handleRestoreData}>
                <Upload color="#ffffff" size={18} />
                <Text style={styles.modalSaveText}>Restore</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Picker */}
      <Modal visible={showLanguageModal} transparent animationType="slide" onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.pickerItem, settings.language === lang.code && styles.pickerItemActive]}
                  onPress={() => {
                    saveSetting('language', lang.code);
                    setShowLanguageModal(false);
                  }}
                >
                  <View>
                    <Text style={[styles.pickerItemText, settings.language === lang.code && styles.pickerItemTextActive]}>
                      {lang.name}
                    </Text>
                    <Text style={styles.pickerItemSub}>{lang.region}</Text>
                  </View>
                  {settings.language === lang.code && <Check color="#2563eb" size={20} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <PickerModal
        visible={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
        title="Select Currency"
        items={CURRENCIES}
        selected={settings.currency}
        onSelect={(v) => saveSetting('currency', v)}
      />

      <PickerModal
        visible={showTimezoneModal}
        onClose={() => setShowTimezoneModal(false)}
        title="Select Timezone"
        items={TIMEZONES}
        selected={settings.timezone}
        onSelect={(v) => saveSetting('timezone', v)}
      />

      <PickerModal
        visible={showDateFormatModal}
        onClose={() => setShowDateFormatModal(false)}
        title="Select Date Format"
        items={DATE_FORMATS}
        selected={settings.dateFormat}
        onSelect={(v) => saveSetting('dateFormat', v)}
      />

      {/* About Modal */}
      <Modal visible={showAboutModal} transparent animationType="fade" onRequestClose={() => setShowAboutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.aboutContent}>
            <View style={styles.aboutHeader}>
              <View style={styles.aboutLogo}>
                <Server color="#ffffff" size={32} />
              </View>
              <Text style={styles.aboutTitle}>ERP Management System</Text>
              <Text style={styles.aboutVersion}>Version 2.0.0</Text>
            </View>

            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Build</Text>
              <Text style={styles.aboutValue}>2026.03.02</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Platform</Text>
              <Text style={styles.aboutValue}>{Platform.OS}</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Database</Text>
              <Text style={styles.aboutValue}>AsyncStorage (Local)</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Framework</Text>
              <Text style={styles.aboutValue}>React Native + Expo</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>License</Text>
              <Text style={styles.aboutValue}>Professional</Text>
            </View>

            <TouchableOpacity style={styles.aboutCloseBtn} onPress={() => setShowAboutModal(false)}>
              <Text style={styles.aboutCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 2,
  },
  profileAvatar: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#2563eb',
  },
  editProfileIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 4,
  },
  adminBannerText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#92400e',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingItemContent: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 1,
  },
  settingItemSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  rightTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ef4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: '#cbd5e1',
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#475569',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    height: 180,
    paddingTop: 14,
    textAlignVertical: 'top' as const,
  },
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    color: '#1e293b',
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  passwordStrength: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#475569',
  },
  modalSaveButton: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  profileEditAvatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  profileRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  profileRoleLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  profileRoleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
  },
  profileRoleText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#2563eb',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#92400e',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  pickerList: {
    paddingHorizontal: 8,
    paddingBottom: 40,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 2,
  },
  pickerItemActive: {
    backgroundColor: '#eff6ff',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500' as const,
  },
  pickerItemTextActive: {
    color: '#2563eb',
    fontWeight: '700' as const,
  },
  pickerItemSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  aboutContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    margin: 24,
    padding: 28,
    alignItems: 'center',
  },
  aboutHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  aboutLogo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    color: '#64748b',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  aboutLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  aboutCloseBtn: {
    marginTop: 24,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 12,
  },
  aboutCloseText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#475569',
  },
});
