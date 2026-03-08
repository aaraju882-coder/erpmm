import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  History,
  Search,
  Filter,
  User,
  Edit,
  Trash2,
  Plus,
  Eye,
  Calendar,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { AuditLog } from '@/types/erp';

export default function AuditLogsScreen() {
  const { auditLogs } = useERP();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');

  const modules = ['all', ...Array.from(new Set(auditLogs.map((log) => log.module)))];

  const filteredLogs = auditLogs.filter((log) => {
    if (filterModule !== 'all' && log.module !== filterModule) return false;
    if (searchQuery) {
      return (
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.module.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const getActionIcon = (action: string) => {
    if (action.toLowerCase().includes('create') || action.toLowerCase().includes('add')) {
      return Plus;
    }
    if (action.toLowerCase().includes('update') || action.toLowerCase().includes('edit')) {
      return Edit;
    }
    if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('remove')) {
      return Trash2;
    }
    if (action.toLowerCase().includes('view') || action.toLowerCase().includes('read')) {
      return Eye;
    }
    return History;
  };

  const getActionColor = (action: string) => {
    if (action.toLowerCase().includes('create') || action.toLowerCase().includes('add')) {
      return '#10b981';
    }
    if (action.toLowerCase().includes('update') || action.toLowerCase().includes('edit')) {
      return '#2563eb';
    }
    if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('remove')) {
      return '#ef4444';
    }
    return '#64748b';
  };

  const AuditLogCard = ({ log }: { log: AuditLog }) => {
    const ActionIcon = getActionIcon(log.action);
    const actionColor = getActionColor(log.action);

    return (
      <View style={styles.logCard}>
        <View style={styles.logHeader}>
          <View style={[styles.actionIcon, { backgroundColor: actionColor + '15' }]}>
            <ActionIcon color={actionColor} size={20} />
          </View>
          <View style={styles.logMainContent}>
            <View style={styles.logTitleRow}>
              <Text style={styles.logAction}>{log.action}</Text>
              <Text style={styles.logTimestamp}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            <View style={styles.logDetailsRow}>
              <View style={styles.logDetail}>
                <User color="#64748b" size={14} />
                <Text style={styles.logDetailText}>{log.userName}</Text>
              </View>
              <View style={styles.logDetail}>
                <Text style={styles.logModule}>{log.module}</Text>
              </View>
            </View>
            <View style={styles.logMetadata}>
              <Text style={styles.logMetaText}>
                {log.entityType} • {log.entityId.slice(0, 8)}
              </Text>
              {log.ipAddress && (
                <Text style={styles.logMetaText}>IP: {log.ipAddress}</Text>
              )}
            </View>
            {log.changes && Object.keys(log.changes).length > 0 && (
              <View style={styles.changesSection}>
                <Text style={styles.changesTitle}>Changes:</Text>
                {Object.entries(log.changes).slice(0, 3).map(([key, value]) => (
                  <View key={key} style={styles.changeRow}>
                    <Text style={styles.changeKey}>{key}:</Text>
                    <Text style={styles.changeValue} numberOfLines={1}>
                      {String(value)}
                    </Text>
                  </View>
                ))}
                {Object.keys(log.changes).length > 3 && (
                  <Text style={styles.moreChanges}>
                    +{Object.keys(log.changes).length - 3} more changes
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const stats = {
    total: auditLogs.length,
    today: auditLogs.filter((log) => {
      const logDate = new Date(log.timestamp);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    }).length,
    thisWeek: auditLogs.filter((log) => {
      const logDate = new Date(log.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logDate >= weekAgo;
    }).length,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Audit Logs',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '700' },
        }}
      />

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search color="#64748b" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search logs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter color="#64748b" size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <History color="#2563eb" size={20} />
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Logs</Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <Calendar color="#10b981" size={20} />
          <View style={styles.statContent}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.today}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <Calendar color="#8b5cf6" size={20} />
          <View style={styles.statContent}>
            <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{stats.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterChipsContainer}
        contentContainerStyle={styles.filterChipsContent}
      >
        {modules.map((module) => (
          <TouchableOpacity
            key={module}
            style={[styles.filterChip, filterModule === module && styles.filterChipActive]}
            onPress={() => setFilterModule(module)}
          >
            <Text
              style={[styles.filterChipText, filterModule === module && styles.filterChipTextActive]}
            >
              {module === 'all' ? 'All' : module}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredLogs.map((log) => (
          <AuditLogCard key={log.id} log={log} />
        ))}
        {filteredLogs.length === 0 && (
          <View style={styles.emptyState}>
            <History color="#cbd5e1" size={48} />
            <Text style={styles.emptyStateText}>No audit logs found</Text>
          </View>
        )}
      </ScrollView>
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
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#0f172a',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#2563eb',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  filterChipsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterChipsContent: {
    padding: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
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
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  logCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  logHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logMainContent: {
    flex: 1,
  },
  logTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  logAction: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0f172a',
    flex: 1,
  },
  logTimestamp: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 8,
  },
  logDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  logDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logDetailText: {
    fontSize: 13,
    color: '#64748b',
  },
  logModule: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#2563eb',
    backgroundColor: '#2563eb' + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    textTransform: 'capitalize',
  },
  logMetadata: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  logMetaText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  changesSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  changesTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 6,
  },
  changeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  changeKey: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
    minWidth: 80,
  },
  changeValue: {
    fontSize: 12,
    color: '#0f172a',
    flex: 1,
  },
  moreChanges: {
    fontSize: 11,
    color: '#2563eb',
    marginTop: 4,
    fontWeight: '600' as const,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
  },
});
