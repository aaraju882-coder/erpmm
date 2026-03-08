import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { User, Company, UserPermissions, PermissionLevel } from '@/types/erp';

const STORAGE_KEYS = {
  USERS: 'erp_users',
  COMPANIES: 'erp_companies',
  CURRENT_USER: 'erp_current_user',
  SESSION: 'erp_session',
};

const FULL_ADMIN_PERMISSIONS: UserPermissions = {
  hr: 'admin',
  finance: 'admin',
  inventory: 'admin',
  crm: 'admin',
  sales: 'admin',
  purchase: 'admin',
  projects: 'admin',
  manufacturing: 'admin',
  reports: 'admin',
  settings: 'admin',
  users: 'admin',
};

const DEFAULT_SUPERUSER: User = {
  id: 'superuser-001',
  username: 'admin',
  password: 'Admin@123',
  email: 'admin@erp.com',
  fullName: 'Super Administrator',
  role: 'superuser',
  permissions: { ...FULL_ADMIN_PERMISSIONS },
  status: 'active',
  createdAt: new Date().toISOString(),
};

const getDefaultPermissions = useCallback((role: User['role']): UserPermissions => {
  switch (role) {
    case 'superuser':
    case 'admin':
      return { ...FULL_ADMIN_PERMISSIONS };
    case 'manager':
      return {
        hr: 'write',
        finance: 'write',
        inventory: 'write',
        crm: 'write',
        sales: 'write',
        purchase: 'write',
        projects: 'write',
        manufacturing: 'write',
        reports: 'read',
        settings: 'read',
        users: 'read',
      };
    case 'accountant':
      return {
        hr: 'read',
        finance: 'admin',
        inventory: 'read',
        crm: 'read',
        sales: 'read',
        purchase: 'write',
        projects: 'read',
        manufacturing: 'none',
        reports: 'write',
        settings: 'none',
        users: 'none',
      };
    case 'sales':
      return {
        hr: 'none',
        finance: 'read',
        inventory: 'read',
        crm: 'write',
        sales: 'write',
        purchase: 'none',
        projects: 'read',
        manufacturing: 'none',
        reports: 'read',
        settings: 'none',
        users: 'none',
      };
    case 'hr':
      return {
        hr: 'admin',
        finance: 'read',
        inventory: 'none',
        crm: 'read',
        sales: 'none',
        purchase: 'none',
        projects: 'read',
        manufacturing: 'none',
        reports: 'read',
        settings: 'none',
        users: 'read',
      };
    case 'employee':
    default:
      return {
        hr: 'read',
        finance: 'none',
        inventory: 'read',
        crm: 'read',
        sales: 'read',
        purchase: 'none',
        projects: 'read',
        manufacturing: 'none',
        reports: 'none',
        settings: 'none',
        users: 'none',
      };
  }
}, []);

const isAdminOrSuperuser = (user: User | null): boolean => {
  if (!user) return false;
  return user.role === 'superuser' || user.role === 'admin';
};

const PERMISSION_HIERARCHY: Record<PermissionLevel, number> = {
  'none': 0,
  'read': 1,
  'write': 2,
  'admin': 3,
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const [usersData, companiesData, sessionData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USERS),
        AsyncStorage.getItem(STORAGE_KEYS.COMPANIES),
        AsyncStorage.getItem(STORAGE_KEYS.SESSION),
      ]);

      let loadedUsers: User[] = usersData ? JSON.parse(usersData) : [];

      if (loadedUsers.length === 0) {
        loadedUsers = [DEFAULT_SUPERUSER];
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(loadedUsers));
      }

      loadedUsers = loadedUsers.map((u) => {
        if (u.role === 'superuser' || u.role === 'admin') {
          return { ...u, permissions: { ...FULL_ADMIN_PERMISSIONS } };
        }
        if (!u.permissions) {
          return { ...u, permissions: getDefaultPermissions(u.role) };
        }
        return u;
      });

      setUsers(loadedUsers);
      setCompanies(companiesData ? JSON.parse(companiesData) : []);

      if (sessionData) {
        const session = JSON.parse(sessionData);
        const user = loadedUsers.find((u: User) => u.id === session.userId);
        if (user && user.status === 'active') {
          const resolvedUser = (user.role === 'superuser' || user.role === 'admin')
            ? { ...user, permissions: { ...FULL_ADMIN_PERMISSIONS } }
            : user;
          setCurrentUser(resolvedUser);
          setIsAuthenticated(true);
          console.log(`Session restored for: ${resolvedUser.fullName} (${resolvedUser.role})`);
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const persistUsers = useCallback(async (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const latestUsers: User[] = storedData ? JSON.parse(storedData) : users;

      const user = latestUsers.find(
        (u) => (u.username === username || u.email === username) && u.password === password
      );

      if (!user) {
        console.log(`Login failed: invalid credentials for "${username}"`);
        return { success: false, message: 'Invalid username or password' };
      }

      if (user.status !== 'active') {
        console.log(`Login failed: account ${user.status} for "${username}"`);
        return { success: false, message: 'Account is inactive or suspended. Contact your administrator.' };
      }

      const resolvedPermissions = (user.role === 'superuser' || user.role === 'admin')
        ? { ...FULL_ADMIN_PERMISSIONS }
        : (user.permissions || getDefaultPermissions(user.role));

      const updatedUser: User = {
        ...user,
        permissions: resolvedPermissions,
        lastLogin: new Date().toISOString(),
      };

      const updatedUsers = latestUsers.map((u) => (u.id === user.id ? updatedUser : u));
      await persistUsers(updatedUsers);

      setCurrentUser(updatedUser);
      setIsAuthenticated(true);

      const session = { userId: user.id, timestamp: new Date().toISOString() };
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

      console.log(`Login successful: ${updatedUser.fullName} (${updatedUser.role})`);
      return { success: true, message: 'Login successful' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }, [users, persistUsers]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
      setCurrentUser(null);
      setIsAuthenticated(false);
      console.log('User logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const createUser = useCallback(async (userData: Omit<User, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser) {
        return { success: false, message: 'You must be logged in to create users' };
      }

      if (!isAdminOrSuperuser(currentUser) && currentUser.permissions?.users !== 'admin') {
        console.log(`Create user denied: ${currentUser.fullName} (${currentUser.role}) lacks permission`);
        return { success: false, message: 'You do not have permission to create users. Only Admin or Superuser can manage users.' };
      }

      const existingUser = users.find(
        (u) => u.username === userData.username || u.email === userData.email
      );

      if (existingUser) {
        return { success: false, message: 'Username or email already exists' };
      }

      if (!userData.username || !userData.password || !userData.email || !userData.fullName) {
        return { success: false, message: 'All required fields must be filled' };
      }

      if (userData.password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
      }

      if (userData.role === 'superuser' && currentUser.role !== 'superuser') {
        return { success: false, message: 'Only superuser can create another superuser account' };
      }

      const resolvedPermissions = (userData.role === 'superuser' || userData.role === 'admin')
        ? { ...FULL_ADMIN_PERMISSIONS }
        : (userData.permissions || getDefaultPermissions(userData.role));

      const newUser: User = {
        ...userData,
        permissions: resolvedPermissions,
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
      };

      const updatedUsers = [...users, newUser];
      await persistUsers(updatedUsers);

      console.log(`User created: ${newUser.fullName} (${newUser.role}) by ${currentUser.fullName}`);
      return { success: true, message: `User "${newUser.fullName}" created successfully. Username: ${newUser.username}` };
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, message: 'Failed to create user' };
    }
  }, [currentUser, users, persistUsers]);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser) {
        return { success: false, message: 'You must be logged in' };
      }

      const isSelfUpdate = currentUser.id === userId;
      const isAdmin = isAdminOrSuperuser(currentUser);
      const hasUserAdminPerm = currentUser.permissions?.users === 'admin';

      if (!isSelfUpdate && !isAdmin && !hasUserAdminPerm) {
        console.log(`Update user denied: ${currentUser.fullName} cannot update user ${userId}`);
        return { success: false, message: 'You do not have permission to update other users' };
      }

      if (isSelfUpdate && !isAdmin) {
        const allowedSelfFields: (keyof User)[] = ['fullName', 'email', 'phone', 'avatar', 'password'];
        const attemptedFields = Object.keys(updates) as (keyof User)[];
        const disallowed = attemptedFields.filter(f => !allowedSelfFields.includes(f));
        if (disallowed.length > 0) {
          console.log(`Self-update blocked fields: ${disallowed.join(', ')}`);
          return { success: false, message: 'You can only update your profile information (name, email, phone)' };
        }
      }

      if (updates.role === 'superuser' && currentUser.role !== 'superuser') {
        return { success: false, message: 'Only superuser can assign superuser role' };
      }

      if (updates.role && !isSelfUpdate) {
        if (updates.role === 'superuser' || updates.role === 'admin') {
          updates.permissions = { ...FULL_ADMIN_PERMISSIONS };
        } else if (!updates.permissions) {
          updates.permissions = getDefaultPermissions(updates.role);
        }
      }

      if (isSelfUpdate && !isAdmin && (updates.role || updates.permissions)) {
        return { success: false, message: 'You cannot change your own role or permissions' };
      }

      const targetUser = users.find(u => u.id === userId);
      if (targetUser && targetUser.role === 'superuser' && currentUser.role !== 'superuser') {
        return { success: false, message: 'Only a superuser can modify another superuser account' };
      }

      const updatedUsers = users.map((u) => (u.id === userId ? { ...u, ...updates } : u));
      await persistUsers(updatedUsers);

      if (isSelfUpdate) {
        const updatedSelf = updatedUsers.find(u => u.id === userId);
        if (updatedSelf) {
          const resolvedSelf = isAdminOrSuperuser(updatedSelf)
            ? { ...updatedSelf, permissions: { ...FULL_ADMIN_PERMISSIONS } }
            : updatedSelf;
          setCurrentUser(resolvedSelf);
        }
      }

      console.log(`User updated: ${userId} by ${currentUser.fullName}`);
      return { success: true, message: 'User updated successfully' };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, message: 'Failed to update user' };
    }
  }, [currentUser, users, persistUsers]);

  const deleteUser = useCallback(async (userId: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser) {
        return { success: false, message: 'You must be logged in' };
      }

      if (currentUser.role !== 'superuser') {
        return { success: false, message: 'Only superuser can delete users' };
      }

      if (userId === currentUser.id) {
        return { success: false, message: 'Cannot delete your own account' };
      }

      if (userId === 'superuser-001') {
        return { success: false, message: 'Cannot delete the default superuser account' };
      }

      const targetUser = users.find(u => u.id === userId);
      const updatedUsers = users.filter((u) => u.id !== userId);
      await persistUsers(updatedUsers);

      console.log(`User deleted: ${targetUser?.fullName || userId} by ${currentUser.fullName}`);
      return { success: true, message: `User "${targetUser?.fullName}" deleted successfully` };
    } catch (error) {
      console.error('Delete user error:', error);
      return { success: false, message: 'Failed to delete user' };
    }
  }, [currentUser, users, persistUsers]);

  const updateUserPermissions = useCallback(async (
    userId: string,
    permissions: UserPermissions
  ): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser) {
        return { success: false, message: 'You must be logged in' };
      }

      if (!isAdminOrSuperuser(currentUser)) {
        return { success: false, message: 'Only admin or superuser can modify permissions' };
      }

      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) {
        return { success: false, message: 'User not found' };
      }

      if (targetUser.role === 'superuser') {
        return { success: false, message: 'Cannot modify superuser permissions. Superuser always has full access.' };
      }

      if (targetUser.role === 'admin' && currentUser.role !== 'superuser') {
        return { success: false, message: 'Only superuser can modify admin permissions' };
      }

      const updatedUsers = users.map((u) =>
        u.id === userId ? { ...u, permissions } : u
      );
      await persistUsers(updatedUsers);

      console.log(`Permissions updated for user ${targetUser.fullName} by ${currentUser.fullName}`);
      return { success: true, message: `Permissions updated for "${targetUser.fullName}"` };
    } catch (error) {
      console.error('Update permissions error:', error);
      return { success: false, message: 'Failed to update permissions' };
    }
  }, [currentUser, users, persistUsers]);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser) {
        return { success: false, message: 'No user logged in' };
      }

      if (currentUser.password !== oldPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }

      if (newPassword.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
      }

      const updatedUser = { ...currentUser, password: newPassword };
      const updatedUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
      await persistUsers(updatedUsers);
      setCurrentUser(updatedUser);

      console.log(`Password changed for: ${currentUser.fullName}`);
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Failed to change password' };
    }
  }, [currentUser, users, persistUsers]);

  const resetUserPassword = useCallback(async (userId: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser || !isAdminOrSuperuser(currentUser)) {
        return { success: false, message: 'Only admin or superuser can reset passwords' };
      }

      if (newPassword.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
      }

      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) {
        return { success: false, message: 'User not found' };
      }

      if (targetUser.role === 'superuser' && currentUser.role !== 'superuser') {
        return { success: false, message: 'Only superuser can reset another superuser password' };
      }

      const updatedUsers = users.map((u) =>
        u.id === userId ? { ...u, password: newPassword } : u
      );
      await persistUsers(updatedUsers);

      console.log(`Password reset for ${targetUser.fullName} by ${currentUser.fullName}`);
      return { success: true, message: `Password reset for "${targetUser.fullName}"` };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, message: 'Failed to reset password' };
    }
  }, [currentUser, users, persistUsers]);

  const createCompany = useCallback(async (companyData: Omit<Company, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser || !isAdminOrSuperuser(currentUser)) {
        return { success: false, message: 'Only admin or superuser can create companies' };
      }

      const newCompany: Company = {
        ...companyData,
        id: `company-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      const updatedCompanies = [...companies, newCompany];
      setCompanies(updatedCompanies);
      await AsyncStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies));

      console.log(`Company created: ${newCompany.name} by ${currentUser.fullName}`);
      return { success: true, message: 'Company created successfully' };
    } catch (error) {
      console.error('Create company error:', error);
      return { success: false, message: 'Failed to create company' };
    }
  }, [currentUser, companies]);

  const hasPermission = useCallback((module: keyof UserPermissions, requiredLevel: PermissionLevel): boolean => {
    if (!currentUser) return false;

    if (currentUser.role === 'superuser' || currentUser.role === 'admin') {
      return true;
    }

    const userLevel = currentUser.permissions?.[module] ?? 'none';
    return PERMISSION_HIERARCHY[userLevel] >= PERMISSION_HIERARCHY[requiredLevel];
  }, [currentUser]);

  const canManageUsers = useCallback((): boolean => {
    if (!currentUser) return false;
    return isAdminOrSuperuser(currentUser) || currentUser.permissions?.users === 'admin';
  }, [currentUser]);

  const canDeleteUsers = useCallback((): boolean => {
    if (!currentUser) return false;
    return currentUser.role === 'superuser';
  }, [currentUser]);

  const canApproveLeave = useCallback((): boolean => {
    if (!currentUser) return false;
    return isAdminOrSuperuser(currentUser) || currentUser.permissions?.hr === 'admin';
  }, [currentUser]);

  const canManageAttendance = useCallback((): boolean => {
    if (!currentUser) return false;
    return isAdminOrSuperuser(currentUser) || currentUser.permissions?.hr === 'admin' || currentUser.permissions?.hr === 'write';
  }, [currentUser]);

  const canMarkOwnAttendance = useCallback((): boolean => {
    if (!currentUser) return false;
    return currentUser.status === 'active';
  }, [currentUser]);

  const getUsersByRole = useCallback((role?: User['role']): User[] => {
    if (!role) return users;
    return users.filter(u => u.role === role);
  }, [users]);

  const getActiveUsers = useCallback((): User[] => {
    return users.filter(u => u.status === 'active');
  }, [users]);

  const value = useMemo(() => ({
    currentUser,
    isAuthenticated,
    isLoading,
    users,
    companies,
    login,
    logout,
    createUser,
    updateUser,
    deleteUser,
    updateUserPermissions,
    changePassword,
    resetUserPassword,
    createCompany,
    hasPermission,
    canManageUsers,
    canDeleteUsers,
    canApproveLeave,
    canManageAttendance,
    canMarkOwnAttendance,
    getDefaultPermissions,
    getUsersByRole,
    getActiveUsers,
    isAdminOrSuperuser: isAdminOrSuperuser(currentUser),
    hasAdminAccess: isAdminOrSuperuser(currentUser) || currentUser?.permissions?.users === 'admin',
  }), [
    currentUser,
    isAuthenticated,
    isLoading,
    users,
    companies,
    login,
    logout,
    createUser,
    updateUser,
    deleteUser,
    updateUserPermissions,
    changePassword,
    resetUserPassword,
    createCompany,
    hasPermission,
    canManageUsers,
    canDeleteUsers,
    canApproveLeave,
    canManageAttendance,
    canMarkOwnAttendance,
    getUsersByRole,
    getActiveUsers,
  ]);

  return value;
});
