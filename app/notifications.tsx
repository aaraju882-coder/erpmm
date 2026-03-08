import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  Bell,
  BellOff,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,

} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';


const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  'info': { color: '#3b82f6', bg: '#dbeafe', icon: Info },
  'warning': { color: '#f59e0b', bg: '#fef3c7', icon: AlertTriangle },
  'success': { color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
  'error': { color: '#ef4444', bg: '#fee2e2', icon: XCircle },
};

export default function NotificationsScreen() {
  const { notifications, markNotificationRead } = useERP();
  const [filterType, setFilterType] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = notifications.filter((n) => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !n.read;
    return n.type === filterType;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = notifications.filter((n) => !n.read).length;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const markAllRead = () => {
    notifications.filter((n) => !n.read).forEach((n) => markNotificationRead(n.id));
    Alert.alert('Done', 'All notifications marked as read');
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Notifications' }} />

      <View style={styles.topBar}>
        <View style={styles.unreadBadge}>
          <Bell color="#3b82f6" size={18} />
          <Text style={styles.unreadText}>{unreadCount} unread</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
            <CheckCheck color="#3b82f6" size={16} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {['all', 'unread', 'info', 'warning', 'success', 'error'].map((type) => (
          <TouchableOpacity key={type} style={[styles.chip, filterType === type && styles.chipActive]} onPress={() => setFilterType(type)}>
            <Text style={[styles.chipText, filterType === type && styles.chipTextActive]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <BellOff color="#cbd5e1" size={56} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>You are all caught up</Text>
          </View>
        ) : (
          filtered.map((notif) => {
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG['info'];
            const IconComp = config.icon;
            return (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notifCard, !notif.read && styles.notifUnread]}
                onPress={() => {
                  if (!notif.read) markNotificationRead(notif.id);
                }}
              >
                <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
                  <IconComp color={config.color} size={20} />
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <Text style={styles.notifTitle} numberOfLines={1}>{notif.title}</Text>
                    <Text style={styles.notifTime}>{getTimeAgo(notif.createdAt)}</Text>
                  </View>
                  <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
                </View>
                {!notif.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  unreadBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadText: { fontSize: 14, fontWeight: '600' as const, color: '#3b82f6' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#dbeafe' },
  markAllText: { fontSize: 13, fontWeight: '600' as const, color: '#3b82f6' },
  filterRow: { maxHeight: 48, paddingLeft: 16 },
  filterContent: { gap: 8, paddingRight: 16, alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { fontSize: 13, fontWeight: '600' as const, color: '#64748b' },
  chipTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, color: '#334155', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  notifCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  notifUnread: { backgroundColor: '#f0f9ff', borderLeftWidth: 3, borderLeftColor: '#3b82f6' },
  notifIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '700' as const, color: '#0f172a', flex: 1, marginRight: 8 },
  notifTime: { fontSize: 11, color: '#94a3b8' },
  notifMessage: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6', marginTop: 4, marginLeft: 4 },
});
