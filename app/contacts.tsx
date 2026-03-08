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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Plus, Search, X, Check, Phone, Mail, Star, ChevronLeft } from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { Contact } from '@/types/erp';

export default function ContactsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { contacts, addContact, updateContact, deleteContact } = useERP();

  const ContactCard = ({ contact }: { contact: Contact }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        Alert.alert(contact.name, `${contact.phone}\n${contact.email}`, [
          {
            text: 'Call',
            onPress: () => Linking.openURL(`tel:${contact.phone}`),
          },
          {
            text: 'Email',
            onPress: () => Linking.openURL(`mailto:${contact.email}`),
          },
          {
            text: contact.isFavorite ? 'Remove Favorite' : 'Add to Favorites',
            onPress: () => updateContact(contact.id, { isFavorite: !contact.isFavorite }),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert('Delete Contact', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', onPress: () => deleteContact(contact.id) },
              ]);
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{contact.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.contactInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.contactName}>{contact.name}</Text>
            {contact.isFavorite && <Star color="#f59e0b" size={16} fill="#f59e0b" />}
          </View>
          {contact.company && <Text style={styles.contactCompany}>{contact.company}</Text>}
          {contact.position && <Text style={styles.contactPosition}>{contact.position}</Text>}
        </View>
      </View>

      <View style={styles.contactDetails}>
        <View style={styles.detailRow}>
          <Phone color="#64748b" size={16} />
          <Text style={styles.detailText}>{contact.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Mail color="#64748b" size={16} />
          <Text style={styles.detailText}>{contact.email}</Text>
        </View>
      </View>

      {contact.category && (
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{contact.category}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const CreateContactModal = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [company, setCompany] = useState('');
    const [position, setPosition] = useState('');
    const [category, setCategory] = useState('');

    const handleCreate = () => {
      if (!name || !phone) {
        Alert.alert('Error', 'Name and phone are required');
        return;
      }

      const newContact: Contact = {
        id: Date.now().toString(),
        name,
        phone,
        email,
        company,
        position,
        category: category || 'General',
        isFavorite: false,
      };

      addContact(newContact);
      setShowModal(false);
      Alert.alert('Success', 'Contact added successfully');
      setName('');
      setPhone('');
      setEmail('');
      setCompany('');
      setPosition('');
      setCategory('');
    };

    return (
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Contact</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="John Doe"
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
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="john@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Company</Text>
                <TextInput
                  style={styles.input}
                  value={company}
                  onChangeText={setCompany}
                  placeholder="Company Name"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Position</Text>
                <TextInput
                  style={styles.input}
                  value={position}
                  onChangeText={setPosition}
                  placeholder="CEO, Manager, etc."
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={category}
                  onChangeText={setCategory}
                  placeholder="Business, Personal, etc."
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
                <Check color="#ffffff" size={20} />
                <Text style={styles.submitButtonText}>Add Contact</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const favoriteContacts = contacts.filter((c) => c.isFavorite);
  const regularContacts = contacts.filter((c) => !c.isFavorite);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Contacts',
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
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {favoriteContacts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorites</Text>
            {favoriteContacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </View>
        )}

        <View style={styles.section}>
          {favoriteContacts.length > 0 && <Text style={styles.sectionTitle}>All Contacts</Text>}
          {regularContacts.length > 0 ? (
            regularContacts
              .filter(
                (c) =>
                  c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.phone.includes(searchQuery)
              )
              .map((contact) => <ContactCard key={contact.id} contact={contact} />)
          ) : contacts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No contacts yet</Text>
              <Text style={styles.emptyStateSubtext}>Add your first contact to get started</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Plus color="#ffffff" size={28} />
      </TouchableOpacity>

      <CreateContactModal />
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  contactInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contactName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  contactCompany: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  contactPosition: {
    fontSize: 13,
    color: '#94a3b8',
  },
  contactDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
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
