import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  Workflow,
  Play,
  Pause,
  Settings,
  Clock,
  Zap,
  Mail,
  Bell,
  Edit,
  Webhook,
  Plus,
  Search,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { WorkflowAutomation } from '@/types/erp';

export default function WorkflowsScreen() {
  const { workflowAutomations, updateWorkflowAutomation } = useERP();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'draft'>('all');

  const filteredWorkflows = workflowAutomations.filter((workflow) => {
    if (filterStatus !== 'all' && workflow.status !== filterStatus) return false;
    if (searchQuery) {
      return workflow.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#64748b';
      default:
        return '#f59e0b';
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'scheduled':
        return Clock;
      case 'event':
        return Zap;
      default:
        return Play;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'email':
        return Mail;
      case 'notification':
        return Bell;
      case 'webhook':
        return Webhook;
      default:
        return Edit;
    }
  };

  const WorkflowCard = ({ workflow }: { workflow: WorkflowAutomation }) => {
    const TriggerIcon = getTriggerIcon(workflow.triggerType);

    return (
      <View style={styles.workflowCard}>
        <View style={styles.workflowHeader}>
          <View style={styles.workflowTitleSection}>
            <View style={[styles.workflowIcon, { backgroundColor: '#8b5cf6' + '15' }]}>
              <TriggerIcon color="#8b5cf6" size={24} />
            </View>
            <View style={styles.workflowInfo}>
              <Text style={styles.workflowName}>{workflow.name}</Text>
              <Text style={styles.workflowDesc} numberOfLines={2}>
                {workflow.description}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(workflow.status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(workflow.status) }]}>
              {workflow.status}
            </Text>
          </View>
        </View>

        <View style={styles.workflowDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Trigger:</Text>
            <Text style={styles.detailValue}>{workflow.triggerType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Conditions:</Text>
            <Text style={styles.detailValue}>{workflow.conditions.length}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Actions:</Text>
            <Text style={styles.detailValue}>{workflow.actions.length}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Run Count:</Text>
            <Text style={styles.detailValue}>{workflow.runCount}</Text>
          </View>
        </View>

        {workflow.actions.length > 0 && (
          <View style={styles.actionsSection}>
            <Text style={styles.actionsTitle}>Actions:</Text>
            <View style={styles.actionsList}>
              {workflow.actions.slice(0, 4).map((action) => {
                const ActionIcon = getActionIcon(action.type);
                return (
                  <View key={action.id} style={styles.actionChip}>
                    <ActionIcon color="#64748b" size={14} />
                    <Text style={styles.actionChipText}>{action.type}</Text>
                  </View>
                );
              })}
              {workflow.actions.length > 4 && (
                <View style={styles.actionChip}>
                  <Text style={styles.actionChipText}>+{workflow.actions.length - 4}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.workflowFooter}>
          {workflow.lastRun && (
            <Text style={styles.lastRunText}>
              Last run: {new Date(workflow.lastRun).toLocaleString()}
            </Text>
          )}
          <View style={styles.workflowActions}>
            {workflow.status === 'active' ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.pauseButton]}
                onPress={() => {
                  updateWorkflowAutomation(workflow.id, { status: 'inactive' });
                  Alert.alert('Success', 'Workflow paused');
                }}
              >
                <Pause color="#ffffff" size={16} />
                <Text style={styles.actionButtonText}>Pause</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.activateButton]}
                onPress={() => {
                  updateWorkflowAutomation(workflow.id, { status: 'active' });
                  Alert.alert('Success', 'Workflow activated');
                }}
              >
                <Play color="#ffffff" size={16} />
                <Text style={styles.actionButtonText}>Activate</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.actionButton, styles.editButton]}>
              <Settings color="#ffffff" size={16} />
              <Text style={styles.actionButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const stats = {
    total: workflowAutomations.length,
    active: workflowAutomations.filter((w) => w.status === 'active').length,
    inactive: workflowAutomations.filter((w) => w.status === 'inactive').length,
    totalRuns: workflowAutomations.reduce((sum, w) => sum + w.runCount, 0),
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Workflow Automation',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '700' },
        }}
      />

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search color="#64748b" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search workflows..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statItem, styles.activeStat]}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statItem, styles.inactiveStat]}>
          <Text style={[styles.statValue, { color: '#64748b' }]}>{stats.inactive}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#2563eb' }]}>{stats.totalRuns}</Text>
          <Text style={styles.statLabel}>Total Runs</Text>
        </View>
      </View>

      <View style={styles.filterChips}>
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterChipText, filterStatus === 'all' && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'active' && styles.filterChipActive]}
          onPress={() => setFilterStatus('active')}
        >
          <Text style={[styles.filterChipText, filterStatus === 'active' && styles.filterChipTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'inactive' && styles.filterChipActive]}
          onPress={() => setFilterStatus('inactive')}
        >
          <Text style={[styles.filterChipText, filterStatus === 'inactive' && styles.filterChipTextActive]}>
            Inactive
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'draft' && styles.filterChipActive]}
          onPress={() => setFilterStatus('draft')}
        >
          <Text style={[styles.filterChipText, filterStatus === 'draft' && styles.filterChipTextActive]}>
            Draft
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredWorkflows.map((workflow) => (
          <WorkflowCard key={workflow.id} workflow={workflow} />
        ))}
        {filteredWorkflows.length === 0 && (
          <View style={styles.emptyState}>
            <Workflow color="#cbd5e1" size={48} />
            <Text style={styles.emptyStateText}>No workflows found</Text>
            <Text style={styles.emptyStateSubtext}>Create automated workflows to streamline your business</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Plus color="#ffffff" size={24} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  searchContainer: {
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
  activeStat: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#f1f5f9',
  },
  inactiveStat: {
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
  workflowCard: {
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
  workflowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workflowTitleSection: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  workflowIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workflowInfo: {
    flex: 1,
  },
  workflowName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  workflowDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  workflowDetails: {
    gap: 8,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  actionsSection: {
    marginBottom: 12,
  },
  actionsTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 8,
  },
  actionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionChipText: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  workflowFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  lastRunText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  workflowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
  },
  activateButton: {
    backgroundColor: '#10b981',
  },
  editButton: {
    backgroundColor: '#64748b',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
