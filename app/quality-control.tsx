import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Image as ImageIcon,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { QualityCheck } from '@/types/erp';

export default function QualityControlScreen() {
  const { qualityChecks, products, employees } = useERP();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'passed' | 'failed' | 'conditional'>('all');

  const filteredChecks = qualityChecks.filter((check) => {
    if (filterType !== 'all' && check.status !== filterType) return false;
    if (searchQuery) {
      const product = products.find((p) => p.id === check.referenceId);
      return product?.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return CheckCircle;
      case 'failed':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const QualityCheckCard = ({ check }: { check: QualityCheck }) => {
    const inspector = employees.find((e) => e.id === check.inspectorId);
    const StatusIcon = getStatusIcon(check.status);
    const passedParams = check.parameters.filter((p) => p.status === 'pass').length;

    return (
      <View style={styles.checkCard}>
        <View style={styles.checkHeader}>
          <View>
            <Text style={styles.checkType}>{check.type.replace('-', ' ').toUpperCase()}</Text>
            <Text style={styles.checkRef}>{check.referenceType}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(check.status) + '15' }]}>
            <StatusIcon color={getStatusColor(check.status)} size={16} />
            <Text style={[styles.statusText, { color: getStatusColor(check.status) }]}>
              {check.status}
            </Text>
          </View>
        </View>

        <View style={styles.checkDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Inspector:</Text>
            <Text style={styles.detailValue}>{inspector?.name || 'Unknown'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(check.date).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Parameters:</Text>
            <Text style={styles.detailValue}>
              {passedParams}/{check.parameters.length} passed
            </Text>
          </View>
        </View>

        {check.parameters.length > 0 && (
          <View style={styles.parametersSection}>
            <Text style={styles.parametersTitle}>Parameters:</Text>
            {check.parameters.slice(0, 3).map((param) => (
              <View key={param.id} style={styles.parameterRow}>
                <View style={styles.parameterLeft}>
                  {param.status === 'pass' ? (
                    <CheckCircle color="#10b981" size={16} />
                  ) : (
                    <XCircle color="#ef4444" size={16} />
                  )}
                  <Text style={styles.parameterName}>{param.name}</Text>
                </View>
                <Text style={styles.parameterValue}>
                  {param.actualValue} {param.unit || ''}
                </Text>
              </View>
            ))}
            {check.parameters.length > 3 && (
              <Text style={styles.moreParameters}>
                +{check.parameters.length - 3} more parameters
              </Text>
            )}
          </View>
        )}

        {check.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{check.notes}</Text>
          </View>
        )}

        {check.images && check.images.length > 0 && (
          <View style={styles.imagesSection}>
            <ImageIcon color="#64748b" size={16} />
            <Text style={styles.imagesText}>{check.images.length} images attached</Text>
          </View>
        )}
      </View>
    );
  };

  const stats = {
    total: qualityChecks.length,
    passed: qualityChecks.filter((c) => c.status === 'passed').length,
    failed: qualityChecks.filter((c) => c.status === 'failed').length,
    conditional: qualityChecks.filter((c) => c.status === 'conditional').length,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Quality Control',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '700' },
        }}
      />

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search color="#64748b" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search quality checks..."
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
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statItem, styles.passedStat]}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.passed}</Text>
          <Text style={styles.statLabel}>Passed</Text>
        </View>
        <View style={[styles.statItem, styles.failedStat]}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.failed}</Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.conditional}</Text>
          <Text style={styles.statLabel}>Conditional</Text>
        </View>
      </View>

      <View style={styles.filterChips}>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'passed' && styles.filterChipActive]}
          onPress={() => setFilterType('passed')}
        >
          <Text style={[styles.filterChipText, filterType === 'passed' && styles.filterChipTextActive]}>
            Passed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'failed' && styles.filterChipActive]}
          onPress={() => setFilterType('failed')}
        >
          <Text style={[styles.filterChipText, filterType === 'failed' && styles.filterChipTextActive]}>
            Failed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'conditional' && styles.filterChipActive]}
          onPress={() => setFilterType('conditional')}
        >
          <Text style={[styles.filterChipText, filterType === 'conditional' && styles.filterChipTextActive]}>
            Conditional
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredChecks.map((check) => (
          <QualityCheckCard key={check.id} check={check} />
        ))}
        {filteredChecks.length === 0 && (
          <View style={styles.emptyState}>
            <CheckCircle color="#cbd5e1" size={48} />
            <Text style={styles.emptyStateText}>No quality checks found</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  passedStat: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#f1f5f9',
  },
  failedStat: {
    borderRightWidth: 1,
    borderColor: '#f1f5f9',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  filterChips: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#ffffff',
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
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  checkCard: {
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
  checkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkType: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  checkRef: {
    fontSize: 13,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  checkDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    color: '#0f172a',
  },
  parametersSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginBottom: 12,
  },
  parametersTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 12,
  },
  parameterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  parameterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  parameterName: {
    fontSize: 13,
    color: '#64748b',
  },
  parameterValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  moreParameters: {
    fontSize: 13,
    color: '#2563eb',
    marginTop: 8,
    fontWeight: '600' as const,
  },
  notesSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#0f172a',
    lineHeight: 18,
  },
  imagesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  imagesText: {
    fontSize: 12,
    color: '#64748b',
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
