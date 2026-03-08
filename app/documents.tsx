import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  Plus,
  Search,
  X,
  Folder,
  Calendar,
  User,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { useAuth } from '@/contexts/AuthContext';
import { Document } from '@/types/erp';

const CATEGORIES = ['All', 'Invoice', 'Contract', 'Report', 'Policy', 'Certificate', 'Receipt', 'Other'];

const getFileIcon = (type: string) => {
  if (type.includes('image')) return ImageIcon;
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet;
  return File;
};

export default function DocumentsScreen() {
  const { documents, addDocument } = useERP();
  const { currentUser } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const [form, setForm] = useState({
    name: '',
    type: 'application/pdf',
    category: 'Other',
    tags: '',
    relatedTo: '',
    relatedType: '',
  });

  const filtered = documents.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCategory = selectedCategory === 'All' || d.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleAdd = () => {
    if (!form.name) {
      Alert.alert('Error', 'Please enter document name');
      return;
    }

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      name: form.name,
      type: form.type,
      category: form.category,
      size: Math.floor(Math.random() * 5000000) + 100000,
      uploadedBy: currentUser?.fullName || 'System',
      uploadedAt: new Date().toISOString(),
      relatedTo: form.relatedTo || undefined,
      relatedType: form.relatedType || undefined,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      url: `https://erp.local/documents/${Date.now()}`,
    };

    addDocument(newDoc);
    setShowAddModal(false);
    setForm({ name: '', type: 'application/pdf', category: 'Other', tags: '', relatedTo: '', relatedType: '' });
    Alert.alert('Success', 'Document added');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const categoryStats = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === 'All' ? documents.length : documents.filter((d) => d.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Documents' }} />

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search color="#94a3b8" size={18} />
          <TextInput style={styles.searchInput} placeholder="Search documents..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Plus color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat} style={[styles.chip, selectedCategory === cat && styles.chipActive]} onPress={() => setSelectedCategory(cat)}>
            <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
              {cat} ({categoryStats[cat]})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Folder color="#cbd5e1" size={56} />
            <Text style={styles.emptyTitle}>No Documents</Text>
            <Text style={styles.emptySubtitle}>Add documents to manage them here</Text>
          </View>
        ) : (
          filtered.map((doc) => {
            const IconComp = getFileIcon(doc.type);
            return (
              <View key={doc.id} style={styles.docCard}>
                <View style={styles.docHeader}>
                  <View style={styles.docIcon}>
                    <IconComp color="#3b82f6" size={22} />
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                    <Text style={styles.docMeta}>{formatSize(doc.size)} · {doc.category}</Text>
                  </View>
                </View>
                <View style={styles.docFooter}>
                  <View style={styles.docFooterItem}>
                    <User color="#94a3b8" size={12} />
                    <Text style={styles.docFooterText}>{doc.uploadedBy}</Text>
                  </View>
                  <View style={styles.docFooterItem}>
                    <Calendar color="#94a3b8" size={12} />
                    <Text style={styles.docFooterText}>{new Date(doc.uploadedAt).toLocaleDateString()}</Text>
                  </View>
                </View>
                {doc.tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {doc.tags.map((tag, i) => (
                      <View key={i} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Document</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><X color="#64748b" size={24} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Document Name *</Text>
              <TextInput style={styles.input} placeholder="Enter document name" placeholderTextColor="#94a3b8" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />

              <Text style={styles.label}>Category</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <TouchableOpacity key={cat} style={[styles.catChip, form.category === cat && styles.catChipActive]} onPress={() => setForm({ ...form, category: cat })}>
                    <Text style={[styles.catText, form.category === cat && styles.catTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Tags (comma separated)</Text>
              <TextInput style={styles.input} placeholder="e.g. finance, 2024, important" placeholderTextColor="#94a3b8" value={form.tags} onChangeText={(v) => setForm({ ...form, tags: v })} />

              <Text style={styles.label}>Related To</Text>
              <TextInput style={styles.input} placeholder="Reference ID or name" placeholderTextColor="#94a3b8" value={form.relatedTo} onChangeText={(v) => setForm({ ...form, relatedTo: v })} />

              <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
                <Text style={styles.submitText}>Add Document</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#0f172a' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
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
  docCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  docHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  docIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  docInfo: { flex: 1 },
  docName: { fontSize: 15, fontWeight: '700' as const, color: '#0f172a' },
  docMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  docFooter: { flexDirection: 'row', gap: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  docFooterItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  docFooterText: { fontSize: 11, color: '#94a3b8' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 11, color: '#475569', fontWeight: '500' as const },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, color: '#0f172a' },
  label: { fontSize: 13, fontWeight: '600' as const, color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 14, height: 46, fontSize: 15, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f1f5f9' },
  catChipActive: { backgroundColor: '#3b82f6' },
  catText: { fontSize: 13, color: '#64748b', fontWeight: '500' as const },
  catTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#3b82f6', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 20 },
  submitText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
});
