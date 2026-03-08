import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  Animated,
  Dimensions,
  StyleSheet,
  Alert,
  ScrollView,
  Vibration,
} from 'react-native';
import { LogIn, LogOut, ArrowRight, QrCode, MapPin, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Employee, Attendance } from '@/types/erp';

interface SlideAttendanceProps {
  employees: Employee[];
  attendance: Attendance[];
  onCheckIn: (attendance: Omit<Attendance, 'id'>) => void;
  onCheckOut: (id: string, updates: Partial<Attendance>) => void;
  allowAdminOverride?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SlideAttendance({
  employees,
  attendance,
  onCheckIn,
  onCheckOut,
  allowAdminOverride = false,
}: SlideAttendanceProps) {
  const router = useRouter();
  const { currentUser, canManageAttendance, canMarkOwnAttendance, isAdminOrSuperuser } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const slideWidth = SCREEN_WIDTH - 64 - 80;

  const getTodayRecord = useCallback((employeeId: string): Attendance | undefined => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.find((a) => a.employeeId === employeeId && a.date === today);
  }, [attendance]);

  const isCheckedIn = useCallback((employeeId: string): boolean => {
    const record = getTodayRecord(employeeId);
    return !!record && !record.checkOut;
  }, [getTodayRecord]);

  const isCheckedOut = useCallback((employeeId: string): boolean => {
    const record = getTodayRecord(employeeId);
    return !!record && !!record.checkOut;
  }, [getTodayRecord]);

  const getStatusText = useCallback((employeeId: string): string => {
    const record = getTodayRecord(employeeId);
    if (!record) return 'Not checked in';
    if (record.checkOut) return `Out at ${record.checkOut}`;
    return `In at ${record.checkIn}`;
  }, [getTodayRecord]);

  const getStatusColor = useCallback((employeeId: string): string => {
    const record = getTodayRecord(employeeId);
    if (!record) return '#94a3b8';
    if (record.checkOut) return '#10b981';
    return '#f59e0b';
  }, [getTodayRecord]);

  const handleCheckInOut = useCallback(async () => {
    if (!selectedEmployee || isProcessing) return;

    setIsProcessing(true);
    Vibration.vibrate(50);

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const existingRecord = getTodayRecord(selectedEmployee.id);

    try {
      if (existingRecord && !existingRecord.checkOut) {
        const checkInTime = new Date(`${today}T${existingRecord.checkIn}`);
        const hoursWorked = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

        onCheckOut(existingRecord.id, {
          checkOut: timeString,
          status: 'checked-out',
          hoursWorked: Math.round(hoursWorked * 100) / 100,
        });

        Alert.alert(
          'Checked Out',
          `${selectedEmployee.name} checked out successfully!\nHours worked: ${hoursWorked.toFixed(2)}`,
          [{ text: 'OK' }]
        );
      } else if (!existingRecord) {
        const hour = now.getHours();
        const status = hour < 9 ? 'present' : hour < 10 ? 'late' : 'half-day';

        onCheckIn({
          employeeId: selectedEmployee.id,
          date: today,
          checkIn: timeString,
          status,
          location: 'Office',
        });

        Alert.alert(
          'Checked In',
          `${selectedEmployee.name} checked in at ${timeString}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Already Completed', 'Attendance already completed for today');
      }
    } finally {
      setIsProcessing(false);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee, isProcessing, getTodayRecord, onCheckIn, onCheckOut, slideAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isProcessing && !!selectedEmployee,
      onMoveShouldSetPanResponder: () => !isProcessing && !!selectedEmployee,
      onPanResponderGrant: () => {
        Vibration.vibrate(20);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0 && gestureState.dx <= slideWidth) {
          slideAnim.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > slideWidth * 0.75) {
          Animated.spring(slideAnim, {
            toValue: slideWidth,
            useNativeDriver: true,
          }).start(() => {
            void handleCheckInOut();
          });
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const canSelectEmployee = (employee: Employee): boolean => {
    if (isAdminOrSuperuser || allowAdminOverride) return true;
    if (!canMarkOwnAttendance()) return false;
    const myEmployee = employees.find((e) => e.email === currentUser?.email);
    return employee.id === myEmployee?.id || employee.email === currentUser?.email;
  };

  const showAccessDenied = () => {
    Vibration.vibrate([0, 100, 50, 100]);
    Alert.alert(
      'Access Denied',
      'You can only mark your own attendance. Contact HR admin for assistance.',
      [{ text: 'OK' }]
    );
  };

  const getSlideText = (): string => {
    if (!selectedEmployee) return 'Select employee first';
    if (isCheckedOut(selectedEmployee.id)) return 'Already completed';
    if (isCheckedIn(selectedEmployee.id)) return 'Slide to Check Out';
    return 'Slide to Check In';
  };

  const getSlideIcon = () => {
    if (!selectedEmployee) return null;
    if (isCheckedIn(selectedEmployee.id) && !isCheckedOut(selectedEmployee.id)) {
      return <LogOut color="#ffffff" size={24} />;
    }
    return <LogIn color="#ffffff" size={24} />;
  };

  const getSlideColors = () => {
    if (!selectedEmployee) return { bg: '#e2e8f0', button: '#94a3b8' };
    if (isCheckedOut(selectedEmployee.id)) return { bg: '#d1fae5', button: '#10b981' };
    if (isCheckedIn(selectedEmployee.id)) return { bg: '#fef3c7', button: '#f59e0b' };
    return { bg: '#dbeafe', button: '#2563eb' };
  };

  const colors = getSlideColors();
  const availableEmployees = employees.filter((emp) => emp.status === 'active');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Clock color="#64748b" size={18} />
        <Text style={styles.headerText}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      <View style={styles.employeeSelector}>
        <Text style={styles.selectorLabel}>Select Employee</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.employeeList}
          contentContainerStyle={styles.employeeListContent}
        >
          {availableEmployees.map((emp) => {
            const isSelected = selectedEmployee?.id === emp.id;
            const canSelect = canSelectEmployee(emp);
            const statusColor = getStatusColor(emp.id);

            return (
              <TouchableOpacity
                key={emp.id}
                style={[
                  styles.employeeChip,
                  isSelected && styles.employeeChipActive,
                  !canSelect && styles.employeeChipDisabled,
                ]}
                onPress={() => {
                  if (canSelect) {
                    setSelectedEmployee(emp);
                    Animated.timing(slideAnim, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: true,
                    }).start();
                  } else {
                    showAccessDenied();
                  }
                }}
                activeOpacity={canSelect ? 0.7 : 1}
              >
                <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                <Text
                  style={[
                    styles.employeeChipText,
                    isSelected && styles.employeeChipTextActive,
                    !canSelect && styles.employeeChipTextDisabled,
                  ]}
                  numberOfLines={1}
                >
                  {emp.name.split(' ')[0]}
                </Text>
                <Text style={styles.statusText} numberOfLines={1}>
                  {getStatusText(emp.id)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.slideSection}>
        <View
          style={[
            styles.slideTrack,
            { backgroundColor: colors.bg },
            (!selectedEmployee || isCheckedOut(selectedEmployee.id)) && styles.slideTrackDisabled,
          ]}
        >
          <View style={styles.slideTrackBackground}>
            <View style={styles.slideInstructions}>
              {!selectedEmployee ? (
                <Text style={styles.instructionsText}>Select an employee</Text>
              ) : isCheckedOut(selectedEmployee.id) ? (
                <>
                  <Clock color="#10b981" size={18} />
                  <Text style={[styles.instructionsText, { color: '#10b981' }]}>
                    Completed for today
                  </Text>
                </>
              ) : (
                <>
                  {isCheckedIn(selectedEmployee.id) ? (
                    <LogOut color="#92400e" size={18} />
                  ) : (
                    <LogIn color="#1e40af" size={18} />
                  )}
                  <Text
                    style={[
                      styles.instructionsText,
                      { color: isCheckedIn(selectedEmployee.id) ? '#92400e' : '#1e40af' },
                    ]}
                  >
                    {getSlideText()}
                  </Text>
                  <ArrowRight
                    color={isCheckedIn(selectedEmployee.id) ? '#92400e' : '#1e40af'}
                    size={18}
                  />
                </>
              )}
            </View>
          </View>

          <Animated.View
            style={[
              styles.slideButton,
              { backgroundColor: colors.button },
              {
                transform: [{ translateX: slideAnim }],
                opacity: selectedEmployee && !isCheckedOut(selectedEmployee.id) ? 1 : 0.5,
              },
            ]}
            {...(selectedEmployee && !isCheckedOut(selectedEmployee.id) ? panResponder.panHandlers : {})}
          >
            {getSlideIcon()}
          </Animated.View>
        </View>

        <Text style={styles.hintText}>
          {!selectedEmployee
            ? 'Tap an employee above to begin'
            : isCheckedOut(selectedEmployee.id)
            ? 'See you tomorrow!'
            : 'Swipe the button to confirm'}
        </Text>
      </View>

      <TouchableOpacity style={styles.qrButton} onPress={() => router.push('/scanner')}>
        <QrCode color="#2563eb" size={20} />
        <Text style={styles.qrButtonText}>Scan QR Code for Attendance</Text>
      </TouchableOpacity>

      {(isAdminOrSuperuser || canManageAttendance()) && (
        <View style={styles.adminNotice}>
          <MapPin color="#2563eb" size={14} />
          <Text style={styles.adminNoticeText}>
            Admin Mode: You can mark attendance for all employees
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  employeeSelector: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  employeeList: {
    flexDirection: 'row',
  },
  employeeListContent: {
    gap: 10,
    paddingRight: 8,
  },
  employeeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    minWidth: 100,
    maxWidth: 140,
  },
  employeeChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  employeeChipDisabled: {
    opacity: 0.5,
  },
  employeeChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  employeeChipTextActive: {
    color: '#2563eb',
  },
  employeeChipTextDisabled: {
    color: '#94a3b8',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  statusText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  slideSection: {
    marginBottom: 16,
  },
  slideTrack: {
    height: 64,
    borderRadius: 32,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slideTrackDisabled: {
    opacity: 0.7,
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
  instructionsText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1e40af',
  },
  slideButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 4,
    top: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500' as const,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  qrButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563eb',
  },
  adminNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  adminNoticeText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500' as const,
  },
});
