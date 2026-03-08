import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Modal } from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { UserPermissions, PermissionLevel, User } from '@/types/erp';
import {
  User as UserIcon,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Search,
  X,
  Eye,
  EyeOff,
  Key,
  ChevronDown,
  ChevronUp,
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react-native';

const PERMISSION_MODULES: { key: keyof UserPermissions; label: string; color: string }[] = [
  { key: 'hr', label: 'HR & Attendance', color: '#0891b2' },
  { key: 'finance', label: 'Finance & Accounting', color: '#16a34a' },
  { key: 'inventory', label: 'Inventory & Warehouse', color: '#ea580c' },
  { key: 'crm', label: 'CRM & Customers', color: '#8b5cf6' },
  { key: 'sales', label: 'Sales & POS', color: '#2563eb' },
  { key: 'purchase', label: 'Purchase & Procurement', color: '#0d9488' },
  { key: 'projects', label: 'Projects & Tasks', color: '#7c3aed' },
  { key: 'manufacturing', label: 'Manufacturing & QC', color: '#b45309' },
  { key: 'reports', label: 'Reports & Analytics', color: '#64748b' },
  { key: 'settings', label: 'Settings & Config', color: '#475569' },
  { key: 'users', label: 'User Management', color: '#dc2626' },
];

const PERMISSION_LEVELS: { value: PermissionLevel; label: string; color: string; icon: string }[] = [
  { value: 'none', label: 'No Access', color: '#94a3b8', icon: 'x' },
  { value: 'read', label: 'View Only', color: '#3b82f6', icon: 'eye' },
  { value: 'write', label: 'Read & Write', color: '#f59e0b', icon: 'edit' },
  { value: 'admin', label: 'Full Control', color: '#10b981', icon: 'shield' },
];

const ROLES: { value: User['role']; label: string; color: string; description: string }[] = [
  { value: 'employee', label: 'Employee', color: '#64748b', description: 'Basic access to assigned modules' },
  { value: 'sales', label: 'Sales Rep', color: '#9333ea', description: 'CRM, Sales, and POS access' },
  { value: 'hr', label: 'HR Staff', color: '#0891b2', description: 'HR module full access' },
  { value: 'accountant', label: 'Accountant', color: '#16a34a', description: 'Finance and reports access' },
  { value: 'manager', label: 'Manager', color: '#2563eb', description: 'Write access to most modules' },
  { value: 'admin', label: 'Admin', color: '#ea580c', description: 'Full access to all modules' },
];

export default function UsersScreen() {
  const {
    currentUser,
    users,
    createUser,
    updateUser,
    deleteUser,
    updateUserPermissions,
    resetUserPassword,
    hasPermission,
    canManageUsers,
    canDeleteUsers,
    getDefaultPermissions,
    isAdminOrSuperuser,
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    phone: '',
    role: 'employee' as User['role'],
  });

  const [editPermissions, setEditPermissions] = useState<UserPermissions>({
    hr: 'none',
    finance: 'none',
    inventory: 'none',
    crm: 'none',
    sales: 'none',
    purchase: 'none',
    projects: 'none',
    manufacturing: 'none',
    reports: 'none',
    settings: 'none',
    users: 'none',
  });

  const [resetPassword, setResetPassword] = useState('');
  const [showResetPass, setShowResetPass] = useState(false);

  if (!currentUser || !hasPermission('users', 'read')) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'User Management', headerShown: true }} />
        <View style={styles.errorContainer}>
          <Shield size={64} color="#ef4444" />
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>You do not have permission to access user management</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleCreate = async () => {
    if (!formData.username || !formData.password || !formData.email || !formData.fullName) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    const result = await createUser({
      ...formData,
      permissions: getDefaultPermissions(formData.role),
      status: 'active',
    });

    if (result.success) {
      Alert.alert('Success', result.message);
      setShowCreateModal(false);
      resetForm();
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    const updates: Partial<User> = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
    };

    if (formData.role !== selectedUser.role) {
      updates.permissions = getDefaultPermissions(formData.role);
    }

    if (formData.password) {
      if (formData.password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
      updates.password = formData.password;
    }

    const result = await updateUser(selectedUser.id, updates);

    if (result.success) {
      Alert.alert('Success', result.message);
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleDelete = (user: User) => {
    if (!canDeleteUsers()) {
      Alert.alert('Access Denied', 'Only superuser can delete user accounts');
      return;
    }
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to permanently delete "${user.fullName}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteUser(user.id);
            if (result.success) {
              Alert.alert('Success', result.message);
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (user: User) => {
    if (!canManageUsers()) {
      Alert.alert('Access Denied', 'You do not have permission to change user status');
      return;
    }
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} "${user.fullName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            const result = await updateUser(user.id, { status: newStatus });
            if (result.success) {
              Alert.alert('Success', `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      email: user.email,
      fullName: user.fullName,
      phone: user.phone || '',
      role: user.role,
    });
    setShowEditModal(true);
  };

  const openPermissionsModal = (user: User) => {
    setSelectedUser(user);
    setEditPermissions({ ...user.permissions });
    setShowPermissionsModal(true);
  };

  const openResetPasswordModal = (user: User) => {
    setSelectedUser(user);
    setResetPassword('');
    setShowResetPass(false);
    setShowResetPasswordModal(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    const result = await updateUserPermissions(selectedUser.id, editPermissions);
    if (result.success) {
      Alert.alert('Success', result.message);
      setShowPermissionsModal(false);
      setSelectedUser(null);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (!resetPassword || resetPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    const result = await resetUserPassword(selectedUser.id, resetPassword);
    if (result.success) {
      Alert.alert('Success', result.message);
      setShowResetPasswordModal(false);
      setSelectedUser(null);
      setResetPassword('');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      email: '',
      fullName: '',
      phone: '',
      role: 'employee',
    });
    setShowPassword(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superuser': return '#dc2626';
      case 'admin': return '#ea580c';
      case 'manager': return '#2563eb';
      case 'accountant': return '#16a34a';
      case 'sales': return '#9333ea';
      case 'hr': return '#0891b2';
      default: return '#64748b';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#64748b';
      case 'suspended': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getPermissionLevelColor = (level: PermissionLevel) => {
    switch (level) {
      case 'admin': return '#10b981';
      case 'write': return '#f59e0b';
      case 'read': return '#3b82f6';
      default: return '#cbd5e1';
    }
  };

  const PermissionBadge = ({ level }: { level: PermissionLevel }) => (
    <View style={[styles.permBadge, { backgroundColor: getPermissionLevelColor(level) + '18', borderColor: getPermissionLevelColor(level) }]}>
      <Text style={[styles.permBadgeText, { color: getPermissionLevelColor(level) }]}>
        {level === 'admin' ? 'Full' : level === 'write' ? 'R/W' : level === 'read' ? 'View' : '—'}
      </Text>
    </View>
  );

  const UserForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <View style={styles.formContainer}>
      <TextInput
        style={styles.input}
        placeholder="Full Name *"
        placeholderTextColor="#999"
        value={formData.fullName}
        onChangeText={(text) => setFormData({ ...formData, fullName: text })}
      />
      <TextInput
        style={[styles.input, isEdit && styles.inputDisabled]}
        placeholder="Username *"
        placeholderTextColor="#999"
        value={formData.username}
        onChangeText={(text) => setFormData({ ...formData, username: text })}
        autoCapitalize="none"
        editable={!isEdit}
      />
      <TextInput
        style={styles.input}
        placeholder="Email *"
        placeholderTextColor="#999"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone"
        placeholderTextColor="#999"
        value={formData.phone}
        onChangeText={(text) => setFormData({ ...formData, phone: text })}
        keyboardType="phone-pad"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder={isEdit ? 'New Password (leave empty to keep)' : 'Password *'}
          placeholderTextColor="#999"
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIconForm}
        >
          {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
        </TouchableOpacity>
      </View>

      <View style={styles.roleSelector}>
        <Text style={styles.label}>Role *</Text>
        <View style={styles.roleGrid}>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role.value}
              style={[
                styles.roleCard,
                formData.role === role.value && { borderColor: role.color, backgroundColor: role.color + '08' },
              ]}
              onPress={() => setFormData({ ...formData, role: role.value })}
            >
              <View style={[styles.roleRadio, formData.role === role.value && { borderColor: role.color }]}>
                {formData.role === role.value && <View style={[styles.roleRadioInner, { backgroundColor: role.color }]} />}
              </View>
              <View style={styles.roleCardContent}>
                <Text style={[styles.roleCardTitle, formData.role === role.value && { color: role.color }]}>
                  {role.label}
                </Text>
                <Text style={styles.roleCardDesc}>{role.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.modalActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            if (isEdit) setShowEditModal(false);
            else setShowCreateModal(false);
            resetForm();
            setSelectedUser(null);
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={isEdit ? handleUpdate : handleCreate}
        >
          <Text style={styles.saveButtonText}>{isEdit ? 'Update User' : 'Create User'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const roleFilterOptions = ['all', 'superuser', 'admin', 'manager', 'accountant', 'sales', 'hr', 'employee'];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'User Management', headerShown: true }} />

      <View style={styles.instructionBanner}>
        <Shield size={20} color="#2563eb" />
        <View style={styles.instructionText}>
          <Text style={styles.instructionTitle}>
            {isAdminOrSuperuser ? 'Full Admin Access' : 'User Management'}
          </Text>
          <Text style={styles.instructionSubtitle}>
            {isAdminOrSuperuser
              ? 'You have full control over all users and permissions.'
              : 'View users and their access levels.'}
          </Text>
        </View>
      </View>

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {canManageUsers() && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            <UserPlus size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterBarContent}>
        {roleFilterOptions.map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.filterChip, filterRole === role && styles.filterChipActive]}
            onPress={() => setFilterRole(role)}
          >
            <Text style={[styles.filterChipText, filterRole === role && styles.filterChipTextActive]}>
              {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.countBar}>
        <Text style={styles.countText}>{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</Text>
        <Text style={styles.countSubtext}>
          {users.filter(u => u.status === 'active').length} active
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {filteredUsers.map((user) => {
          const isExpanded = expandedUser === user.id;
          const isSelf = user.id === currentUser?.id;

          return (
            <View key={user.id} style={[styles.userCard, isSelf && styles.userCardSelf]}>
              <TouchableOpacity
                style={styles.userHeader}
                onPress={() => setExpandedUser(isExpanded ? null : user.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.avatar, { backgroundColor: getRoleBadgeColor(user.role) }]}>
                  <UserIcon size={22} color="#fff" />
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>
                      {user.fullName}
                      {isSelf ? ' (You)' : ''}
                    </Text>
                  </View>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userUsername}>@{user.username}</Text>
                  <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: getRoleBadgeColor(user.role) }]}>
                      <Text style={styles.badgeText}>{user.role}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(user.status) }]}>
                      <Text style={styles.badgeText}>{user.status}</Text>
                    </View>
                  </View>
                </View>
                {isExpanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.expandedSection}>
                  <View style={styles.permissionsPreview}>
                    <Text style={styles.permPreviewTitle}>Module Permissions</Text>
                    <View style={styles.permGrid}>
                      {PERMISSION_MODULES.map((mod) => (
                        <View key={mod.key} style={styles.permRow}>
                          <Text style={styles.permModuleName}>{mod.label}</Text>
                          <PermissionBadge level={user.permissions?.[mod.key] ?? 'none'} />
                        </View>
                      ))}
                    </View>
                  </View>

                  {user.lastLogin && (
                    <Text style={styles.lastLoginText}>Last login: {new Date(user.lastLogin).toLocaleString()}</Text>
                  )}

                  {canManageUsers() && !isSelf && user.role !== 'superuser' && (
                    <View style={styles.userActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#eff6ff' }]}
                        onPress={() => openEditModal(user)}
                      >
                        <Edit size={16} color="#2563eb" />
                        <Text style={[styles.actionBtnText, { color: '#2563eb' }]}>Edit</Text>
                      </TouchableOpacity>

                      {isAdminOrSuperuser && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#f0fdf4' }]}
                          onPress={() => openPermissionsModal(user)}
                        >
                          <Shield size={16} color="#16a34a" />
                          <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>Permissions</Text>
                        </TouchableOpacity>
                      )}

                      {isAdminOrSuperuser && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#fefce8' }]}
                          onPress={() => openResetPasswordModal(user)}
                        >
                          <Key size={16} color="#ca8a04" />
                          <Text style={[styles.actionBtnText, { color: '#ca8a04' }]}>Reset PW</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: user.status === 'active' ? '#fef2f2' : '#f0fdf4' }]}
                        onPress={() => handleToggleStatus(user)}
                      >
                        {user.status === 'active' ? (
                          <>
                            <XCircle size={16} color="#dc2626" />
                            <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Deactivate</Text>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} color="#16a34a" />
                            <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>Activate</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      {canDeleteUsers() && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]}
                          onPress={() => handleDelete(user)}
                        >
                          <Trash2 size={16} color="#dc2626" />
                          <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Delete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {user.role === 'superuser' && !isSelf && (
                    <View style={styles.superuserNotice}>
                      <Lock size={14} color="#f59e0b" />
                      <Text style={styles.superuserNoticeText}>Superuser account cannot be modified</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Create User Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => { setShowCreateModal(false); resetForm(); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New User</Text>
              <TouchableOpacity onPress={() => { setShowCreateModal(false); resetForm(); }}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <UserForm />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User</Text>
              <TouchableOpacity onPress={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <UserForm isEdit />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Permissions Modal */}
      <Modal
        visible={showPermissionsModal}
        animationType="slide"
        transparent
        onRequestClose={() => { setShowPermissionsModal(false); setSelectedUser(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Permissions</Text>
                {selectedUser && (
                  <Text style={styles.modalSubtitle}>{selectedUser.fullName} ({selectedUser.role})</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => { setShowPermissionsModal(false); setSelectedUser(null); }}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {(selectedUser?.role === 'admin') && (
              <View style={styles.adminPermWarning}>
                <AlertTriangle size={16} color="#f59e0b" />
                <Text style={styles.adminPermWarningText}>Admin users have full access by default. Custom permissions apply after role change.</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.resetPermsButton}
              onPress={() => {
                if (selectedUser) {
                  setEditPermissions(getDefaultPermissions(selectedUser.role));
                }
              }}
            >
              <RefreshCw size={16} color="#3b82f6" />
              <Text style={styles.resetPermsText}>Reset to Role Defaults</Text>
            </TouchableOpacity>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {PERMISSION_MODULES.map((mod) => (
                <View key={mod.key} style={styles.permEditRow}>
                  <View style={styles.permEditHeader}>
                    <View style={[styles.permEditDot, { backgroundColor: mod.color }]} />
                    <Text style={styles.permEditLabel}>{mod.label}</Text>
                  </View>
                  <View style={styles.permLevelRow}>
                    {PERMISSION_LEVELS.map((level) => (
                      <TouchableOpacity
                        key={level.value}
                        style={[
                          styles.permLevelBtn,
                          editPermissions[mod.key] === level.value && {
                            backgroundColor: level.color + '15',
                            borderColor: level.color,
                          },
                        ]}
                        onPress={() =>
                          setEditPermissions({
                            ...editPermissions,
                            [mod.key]: level.value,
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.permLevelBtnText,
                            editPermissions[mod.key] === level.value && { color: level.color, fontWeight: '700' as const },
                          ]}
                        >
                          {level.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => { setShowPermissionsModal(false); setSelectedUser(null); }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSavePermissions}>
                  <Text style={styles.saveButtonText}>Save Permissions</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        visible={showResetPasswordModal}
        animationType="slide"
        transparent
        onRequestClose={() => { setShowResetPasswordModal(false); setSelectedUser(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentSmall}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Reset Password</Text>
                {selectedUser && (
                  <Text style={styles.modalSubtitle}>For: {selectedUser.fullName}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => { setShowResetPasswordModal(false); setSelectedUser(null); }}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.resetPassForm}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#999"
                  value={resetPassword}
                  onChangeText={setResetPassword}
                  secureTextEntry={!showResetPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowResetPass(!showResetPass)}
                  style={styles.eyeIconForm}
                >
                  {showResetPass ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => { setShowResetPasswordModal(false); setSelectedUser(null); }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleResetPassword}>
                  <Text style={styles.saveButtonText}>Reset Password</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  instructionBanner: {
    backgroundColor: '#eff6ff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  instructionText: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1e40af',
    marginBottom: 4,
  },
  instructionSubtitle: {
    fontSize: 13,
    color: '#3b82f6',
    lineHeight: 18,
  },
  header: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#1e293b',
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    backgroundColor: '#fff',
    maxHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    flexDirection: 'row',
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
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
    color: '#fff',
  },
  countBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  countText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#475569',
  },
  countSubtext: {
    fontSize: 13,
    color: '#94a3b8',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  userCardSelf: {
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 1,
  },
  userUsername: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 2,
    fontWeight: '500' as const,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#fff',
    textTransform: 'uppercase' as const,
  },
  expandedSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    padding: 14,
  },
  permissionsPreview: {
    marginBottom: 12,
  },
  permPreviewTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  permGrid: {
    gap: 4,
  },
  permRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  permModuleName: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  permBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 44,
    alignItems: 'center',
  },
  permBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  lastLoginText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
  },
  userActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  superuserNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    marginTop: 8,
  },
  superuserNoticeText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  modalContentSmall: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  modalScroll: {
    padding: 16,
  },
  formContainer: {
    gap: 14,
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
  inputDisabled: {
    backgroundColor: '#e2e8f0',
    color: '#94a3b8',
  },
  passwordContainer: {
    position: 'relative' as const,
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIconForm: {
    position: 'absolute' as const,
    right: 14,
    top: 14,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 8,
  },
  roleSelector: {
    marginTop: 4,
  },
  roleGrid: {
    gap: 8,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    gap: 10,
  },
  roleRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  roleCardContent: {
    flex: 1,
  },
  roleCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#334155',
  },
  roleCardDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingBottom: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#475569',
  },
  saveButton: {
    flex: 1.2,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  adminPermWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
  },
  adminPermWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500' as const,
  },
  resetPermsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
  },
  resetPermsText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600' as const,
  },
  permEditRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  permEditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  permEditDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  permEditLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1e293b',
  },
  permLevelRow: {
    flexDirection: 'row',
    gap: 6,
  },
  permLevelBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  permLevelBtnText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#94a3b8',
  },
  resetPassForm: {
    padding: 20,
    gap: 12,
  },
});
