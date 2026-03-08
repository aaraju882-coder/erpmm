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
import {
  Plus,
  Search,
  Users,
  Clock,
  Calendar,
  X,
  Check,
  Mail,
  Phone,
  DollarSign,
  LogIn,
  LogOut,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { useAuth } from '@/contexts/AuthContext';
import { Employee, LeaveRequest } from '@/types/erp';
import { useRouter } from 'expo-router';
import SlideAttendance from '@/components/SlideAttendance';
import { Image } from 'expo-image';
import { generateEmployeeQR } from '@/utils/qrcode';

type TabType = 'employees' | 'attendance' | 'leaves';

export default function HRScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showEmployeeQR, setShowEmployeeQR] = useState(false);
  const [selectedEmployeeForQR, setSelectedEmployeeForQR] = useState<Employee | null>(null);
  const {
    employees,
    attendance,
    leaveRequests,
    addEmployee,
    deleteEmployee,
    addAttendance,
    updateAttendance,
    addLeaveRequest,
    updateLeaveRequest,
  } = useERP();
  const { canApproveLeave, canManageAttendance } = useAuth();

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#64748b';
      case 'on-leave':
        return '#f59e0b';
      case 'approved':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      case 'present':
        return '#10b981';
      case 'absent':
        return '#ef4444';
      case 'late':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  const EmployeeCard = ({ employee }: { employee: Employee }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        Alert.alert(
          employee.name,
          `Position: ${employee.position}\nDepartment: ${employee.department}\nSalary: ${formatCurrency(employee.salary)}\nJoin Date: ${formatDate(employee.joinDate)}`,
          [
            {
              text: 'View QR Code',
              onPress: () => {
                setSelectedEmployeeForQR(employee);
                setShowEmployeeQR(true);
              },
            },
            {
              text: 'Mark Attendance',
              onPress: () => {
                const today = new Date().toISOString().split('T')[0];
                const existingAttendance = attendance.find(
                  (a) => a.employeeId === employee.id && a.date === today
                );

                if (existingAttendance) {
                  Alert.alert('Already Marked', 'Attendance already recorded for today');
                  return;
                }

                addAttendance({
                  id: Date.now().toString(),
                  employeeId: employee.id,
                  date: today,
                  checkIn: new Date().toLocaleTimeString(),
                  status: 'present',
                });
                Alert.alert('Success', 'Attendance marked as present');
              },
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                Alert.alert('Confirm Delete', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', onPress: () => deleteEmployee(employee.id) },
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
          <View style={[styles.employeeAvatar, { backgroundColor: getStatusColor(employee.status) }]}>
            <Text style={styles.employeeAvatarText}>{employee.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.cardTitle}>{employee.name}</Text>
            <Text style={styles.cardSubtitle}>{employee.position}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(employee.status) + '15' },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(employee.status) }]}>
            {employee.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.employeeInfo}>
        <View style={styles.employeeInfoRow}>
          <Mail color="#64748b" size={16} />
          <Text style={styles.employeeInfoText}>{employee.email}</Text>
        </View>
        <View style={styles.employeeInfoRow}>
          <Phone color="#64748b" size={16} />
          <Text style={styles.employeeInfoText}>{employee.phone}</Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardFooter}>
        <View style={styles.cardFooterItem}>
          <Text style={styles.cardFooterLabel}>Department</Text>
          <Text style={styles.cardFooterValue}>{employee.department}</Text>
        </View>
        <View style={styles.cardFooterItem}>
          <Text style={styles.cardFooterLabel}>Salary</Text>
          <Text style={styles.cardFooterValue}>{formatCurrency(employee.salary)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const LeaveRequestCard = ({ request }: { request: LeaveRequest }) => {
    const employee = employees.find((e) => e.id === request.employeeId);

    const handlePress = () => {
      if (request.status === 'pending') {
        if (!canApproveLeave()) {
          Alert.alert(
            'Access Denied',
            'Only HR Admin can approve or reject leave requests.',
            [{ text: 'OK' }]
          );
          return;
        }
        Alert.alert('Leave Request', `${employee?.name} - ${request.type}`, [
          {
            text: 'Approve',
            onPress: () => updateLeaveRequest(request.id, { status: 'approved' }),
          },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: () => updateLeaveRequest(request.id, { status: 'rejected' }),
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
      }
    };

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{employee?.name || 'Unknown'}</Text>
            <Text style={styles.cardSubtitle}>{request.type.toUpperCase()} Leave</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(request.status) + '15' },
            ]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
              {request.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.cardDescription} numberOfLines={2}>
          {request.reason}
        </Text>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.cardFooterItem}>
            <Text style={styles.cardFooterLabel}>From</Text>
            <Text style={styles.cardFooterValue}>{formatDate(request.startDate)}</Text>
          </View>
          <View style={styles.cardFooterItem}>
            <Text style={styles.cardFooterLabel}>To</Text>
            <Text style={styles.cardFooterValue}>{formatDate(request.endDate)}</Text>
          </View>
          <View style={styles.cardFooterItem}>
            <Text style={styles.cardFooterLabel}>Days</Text>
            <Text style={styles.cardFooterValue}>{request.days}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const CreateEmployeeModal = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [position, setPosition] = useState('');
    const [department, setDepartment] = useState('');
    const [salary, setSalary] = useState('');

    const handleCreate = () => {
      if (!name || !email || !phone || !position || !department || !salary) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const newEmployee: Employee = {
        id: Date.now().toString(),
        name,
        email,
        phone,
        position,
        department,
        salary: parseFloat(salary),
        joinDate: new Date().toISOString(),
        status: 'active',
      };

      addEmployee(newEmployee);
      setShowEmployeeModal(false);
      Alert.alert('Success', 'Employee added successfully');
      setName('');
      setEmail('');
      setPhone('');
      setPosition('');
      setDepartment('');
      setSalary('');
    };

    return (
      <Modal
        visible={showEmployeeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEmployeeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Employee</Text>
              <TouchableOpacity onPress={() => setShowEmployeeModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="John Doe"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="john@company.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone *</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 234 567 8900"
                  keyboardType="phone-pad"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Position *</Text>
                <TextInput
                  style={styles.input}
                  value={position}
                  onChangeText={setPosition}
                  placeholder="Software Engineer"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Department *</Text>
                <TextInput
                  style={styles.input}
                  value={department}
                  onChangeText={setDepartment}
                  placeholder="Engineering"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Salary *</Text>
                <TextInput
                  style={styles.input}
                  value={salary}
                  onChangeText={setSalary}
                  placeholder="50000.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
                <Check color="#ffffff" size={20} />
                <Text style={styles.submitButtonText}>Add Employee</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const CreateLeaveModal = () => {
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [type, setType] = useState<'vacation' | 'sick' | 'personal' | 'unpaid'>('vacation');
    const [reason, setReason] = useState('');
    const [days, setDays] = useState('');

    const handleCreate = () => {
      if (!selectedEmployee || !reason || !days) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const daysCount = parseInt(days);
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + daysCount - 1);

      const newLeaveRequest: LeaveRequest = {
        id: Date.now().toString(),
        employeeId: selectedEmployee,
        type,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: daysCount,
        reason,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };

      addLeaveRequest(newLeaveRequest);
      setShowLeaveModal(false);
      Alert.alert('Success', 'Leave request submitted');
      setSelectedEmployee('');
      setReason('');
      setDays('');
    };

    return (
      <Modal
        visible={showLeaveModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Leave</Text>
              <TouchableOpacity onPress={() => setShowLeaveModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Employee *</Text>
                {employees.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {employees.map((employee) => (
                      <TouchableOpacity
                        key={employee.id}
                        style={[
                          styles.employeeChip,
                          selectedEmployee === employee.id && styles.employeeChipSelected,
                        ]}
                        onPress={() => setSelectedEmployee(employee.id)}
                      >
                        <Text
                          style={[
                            styles.employeeChipText,
                            selectedEmployee === employee.id && styles.employeeChipTextSelected,
                          ]}
                        >
                          {employee.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.noDataText}>No employees. Add one first.</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Leave Type *</Text>
                <View style={styles.typeContainer}>
                  {(['vacation', 'sick', 'personal', 'unpaid'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeChip, type === t && styles.typeChipSelected]}
                      onPress={() => setType(t)}
                    >
                      <Text
                        style={[styles.typeChipText, type === t && styles.typeChipTextSelected]}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Number of Days *</Text>
                <TextInput
                  style={styles.input}
                  value={days}
                  onChangeText={setDays}
                  placeholder="5"
                  keyboardType="number-pad"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Reason *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Enter reason for leave..."
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
                <Check color="#ffffff" size={20} />
                <Text style={styles.submitButtonText}>Submit Request</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const activeEmployees = employees.filter((e) => e.status === 'active').length;
  const pendingLeaves = leaveRequests.filter((r) => r.status === 'pending').length;
  const todayAttendance = attendance.filter(
    (a) => a.date === new Date().toISOString().split('T')[0]
  ).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Human Resources</Text>
        </View>
        <TouchableOpacity
          style={styles.payrollButton}
          onPress={() => router.push('/payroll')}
        >
          <DollarSign color="#ffffff" size={18} />
          <Text style={styles.payrollButtonText}>Payroll</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Users color="#2563eb" size={20} />
          <Text style={styles.statValue}>{activeEmployees}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Clock color="#10b981" size={20} />
          <Text style={styles.statValue}>{todayAttendance}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Calendar color="#f59e0b" size={20} />
          <Text style={styles.statValue}>{pendingLeaves}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'employees' && styles.activeTab]}
          onPress={() => setActiveTab('employees')}
        >
          <Text style={[styles.tabText, activeTab === 'employees' && styles.activeTabText]}>
            Employees
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'attendance' && styles.activeTab]}
          onPress={() => setActiveTab('attendance')}
        >
          <Text style={[styles.tabText, activeTab === 'attendance' && styles.activeTabText]}>
            Attendance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaves' && styles.activeTab]}
          onPress={() => setActiveTab('leaves')}
        >
          <Text style={[styles.tabText, activeTab === 'leaves' && styles.activeTabText]}>
            Leaves
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
        {activeTab === 'employees' && (
          <>
            {employees.length > 0 ? (
              employees
                .filter((emp) => emp.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((employee) => <EmployeeCard key={employee.id} employee={employee} />)
            ) : (
              <View style={styles.emptyState}>
                <Users color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>No employees yet</Text>
                <Text style={styles.emptyStateSubtext}>Add your first employee to get started</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'attendance' && (
          <>
            <SlideAttendance
              employees={employees}
              attendance={attendance}
              onCheckIn={(data) => addAttendance({ ...data, id: Date.now().toString() })}
              onCheckOut={updateAttendance}
              allowAdminOverride={canManageAttendance()}
            />
            {attendance.length > 0 ? (
              attendance
                .filter((a) => a.date === new Date().toISOString().split('T')[0])
                .map((record) => {
                  const employee = employees.find((e) => e.id === record.employeeId);
                  return (
                    <View key={record.id} style={styles.attendanceCard}>
                      <View style={styles.attendanceHeader}>
                        <Text style={styles.attendanceName}>{employee?.name || 'Unknown'}</Text>
                        <View style={[styles.attendanceStatusBadge, { backgroundColor: getStatusColor(record.status) + '15' }]}>
                          <Text style={[styles.attendanceStatusText, { color: getStatusColor(record.status) }]}>
                            {record.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.attendanceTimeRow}>
                        <View style={styles.attendanceTime}>
                          <LogIn color="#10b981" size={16} />
                          <Text style={styles.attendanceTimeLabel}>In: {record.checkIn}</Text>
                        </View>
                        {record.checkOut && (
                          <View style={styles.attendanceTime}>
                            <LogOut color="#ef4444" size={16} />
                            <Text style={styles.attendanceTimeLabel}>Out: {record.checkOut}</Text>
                          </View>
                        )}
                      </View>
                      {record.hoursWorked && (
                        <Text style={styles.hoursWorked}>Hours: {record.hoursWorked.toFixed(2)}</Text>
                      )}
                    </View>
                  );
                })
            ) : (
              <View style={styles.emptyState}>
                <Clock color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>No attendance today</Text>
                <Text style={styles.emptyStateSubtext}>Slide to check in when you arrive</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'leaves' && (
          <>
            {leaveRequests.length > 0 ? (
              leaveRequests.map((request) => <LeaveRequestCard key={request.id} request={request} />)
            ) : (
              <View style={styles.emptyState}>
                <Calendar color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>No leave requests</Text>
                <Text style={styles.emptyStateSubtext}>Leave requests will appear here</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (activeTab === 'employees') {
            setShowEmployeeModal(true);
          } else if (activeTab === 'leaves') {
            if (employees.length === 0) {
              Alert.alert('No Employees', 'Please add an employee first', [
                { text: 'Add Employee', onPress: () => setShowEmployeeModal(true) },
                { text: 'Cancel', style: 'cancel' },
              ]);
            } else {
              setShowLeaveModal(true);
            }
          }
        }}
      >
        <Plus color="#ffffff" size={28} />
      </TouchableOpacity>

      <CreateEmployeeModal />
      <CreateLeaveModal />
      {selectedEmployeeForQR && (
        <Modal
          visible={showEmployeeQR}
          animationType="slide"
          transparent
          onRequestClose={() => setShowEmployeeQR(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.qrModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedEmployeeForQR.name}</Text>
                <TouchableOpacity onPress={() => setShowEmployeeQR(false)}>
                  <X color="#64748b" size={24} />
                </TouchableOpacity>
              </View>

              <View style={styles.qrCodeSection}>
                <Image
                  source={{ uri: generateEmployeeQR(selectedEmployeeForQR.id, selectedEmployeeForQR.name) }}
                  style={styles.qrCodeImage}
                  contentFit="contain"
                />
                <Text style={styles.qrCodeText}>Employee ID: {selectedEmployeeForQR.id}</Text>
                <Text style={styles.qrCodeSubtext}>Scan for attendance check-in/out</Text>
              </View>

              <View style={styles.employeeQRInfo}>
                <View style={styles.qrInfoRow}>
                  <Text style={styles.qrInfoLabel}>Position:</Text>
                  <Text style={styles.qrInfoValue}>{selectedEmployeeForQR.position}</Text>
                </View>
                <View style={styles.qrInfoRow}>
                  <Text style={styles.qrInfoLabel}>Department:</Text>
                  <Text style={styles.qrInfoValue}>{selectedEmployeeForQR.department}</Text>
                </View>
                <View style={styles.qrInfoRow}>
                  <Text style={styles.qrInfoLabel}>Email:</Text>
                  <Text style={styles.qrInfoValue}>{selectedEmployeeForQR.email}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeQRButton}
                onPress={() => setShowEmployeeQR(false)}
              >
                <Text style={styles.closeQRButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#0f172a',
  },
  payrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  payrollButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#ffffff',
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  employeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employeeAvatarText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#ffffff',
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  employeeInfo: {
    gap: 8,
    marginBottom: 12,
  },
  employeeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  employeeInfoText: {
    fontSize: 14,
    color: '#64748b',
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
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
    fontSize: 15,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  employeeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  employeeChipSelected: {
    backgroundColor: '#2563eb',
  },
  employeeChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  employeeChipTextSelected: {
    color: '#ffffff',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  typeChipSelected: {
    backgroundColor: '#2563eb',
  },
  typeChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  typeChipTextSelected: {
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
  slideContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  employeeSelector: {
    marginBottom: 16,
  },
  employeeSelectorLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 12,
  },
  employeeList: {
    flexDirection: 'row',
  },
  employeeSelectChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  employeeSelectChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  employeeSelectText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  employeeSelectTextActive: {
    color: '#2563eb',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  slideTrack: {
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f1f5f9',
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  slideTrackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slideInstructionsText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  slideButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 5,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
  },
  qrButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563eb',
  },
  attendanceCard: {
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
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attendanceName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  attendanceStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  attendanceStatusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  attendanceTimeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  attendanceTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attendanceTimeLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  hoursWorked: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563eb',
    marginTop: 8,
  },
  qrModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  qrCodeSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  qrCodeImage: {
    width: 250,
    height: 250,
    marginBottom: 16,
  },
  qrCodeText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  qrCodeSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  employeeQRInfo: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  qrInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  qrInfoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  qrInfoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600' as const,
  },
  closeQRButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeQRButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
});
