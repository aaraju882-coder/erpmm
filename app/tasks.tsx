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
import { Stack, useRouter } from 'expo-router';
import { Plus, Search, X, Check, ChevronLeft } from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { Task } from '@/types/erp';

const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  urgent: '#7c3aed',
};

const STATUS_COLORS = {
  todo: '#64748b',
  'in-progress': '#3b82f6',
  review: '#f59e0b',
  done: '#10b981',
};

export default function TasksScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { tasks, employees, addTask, updateTask } = useERP();

  const TaskCard = ({ task }: { task: Task }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        Alert.alert('Update Task', task.title, [
          { text: 'Mark as Done', onPress: () => updateTask(task.id, { status: 'done' }) },
          { text: 'In Progress', onPress: () => updateTask(task.id, { status: 'in-progress' }) },
          { text: 'Cancel', style: 'cancel' },
        ]);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View
            style={[
              styles.priorityIndicator,
              { backgroundColor: PRIORITY_COLORS[task.priority] },
            ]}
          />
          <View style={styles.taskInfo}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskDescription} numberOfLines={2}>
              {task.description}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.taskFooter}>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[task.status] + '15' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[task.status] }]}>
            {task.status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.taskDate}>Due: {new Date(task.dueDate).toLocaleDateString()}</Text>
      </View>

      {task.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {task.tags.slice(0, 3).map((tag, idx) => (
            <View key={idx} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const CreateTaskModal = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
    const [selectedEmployee, setSelectedEmployee] = useState('');

    const handleCreate = () => {
      if (!title || !description || !selectedEmployee) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const newTask: Task = {
        id: Date.now().toString(),
        title,
        description,
        assignedTo: selectedEmployee,
        priority,
        status: 'todo',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        tags: [],
      };

      addTask(newTask);
      setShowModal(false);
      Alert.alert('Success', 'Task created successfully');
      setTitle('');
      setDescription('');
      setSelectedEmployee('');
    };

    return (
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Task</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Task title"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Task description"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Priority</Text>
                <View style={styles.priorityContainer}>
                  {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityChip,
                        { borderColor: PRIORITY_COLORS[p] },
                        priority === p && { backgroundColor: PRIORITY_COLORS[p] },
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Text
                        style={[
                          styles.priorityChipText,
                          { color: priority === p ? '#ffffff' : PRIORITY_COLORS[p] },
                        ]}
                      >
                        {p.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Assign To *</Text>
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
                  <Text style={styles.noDataText}>No employees. Add one in HR module.</Text>
                )}
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
                <Check color="#ffffff" size={20} />
                <Text style={styles.submitButtonText}>Create Task</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Tasks',
          headerBackTitle: 'Back',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft color="#0f172a" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.searchContainer}>
        <Search color="#64748b" size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {tasks.length > 0 ? (
          tasks
            .filter((task) => task.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((task) => <TaskCard key={task.id} task={task} />)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tasks yet</Text>
            <Text style={styles.emptyStateSubtext}>Create your first task to get started</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Plus color="#ffffff" size={28} />
      </TouchableOpacity>

      <CreateTaskModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backButton: {
    marginLeft: 8,
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
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  taskDate: {
    fontSize: 13,
    color: '#64748b',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600' as const,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#64748b',
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
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
  },
  priorityChipText: {
    fontSize: 12,
    fontWeight: '700' as const,
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
});
