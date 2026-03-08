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
  Users,
  Plus,
  Search,
  Target,
  DollarSign,
  X,
  Check,
  Mail,
  Phone,
} from 'lucide-react-native';
import { useERP } from '@/contexts/ERPContext';
import { Customer, Lead } from '@/types/erp';

type TabType = 'customers' | 'leads' | 'opportunities';

const LEAD_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;

export default function CRMScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const { customers, leads, addCustomer, addLead, updateLead } = useERP();

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      new: '#3b82f6',
      contacted: '#8b5cf6',
      qualified: '#06b6d4',
      proposal: '#f59e0b',
      negotiation: '#ec4899',
      won: '#10b981',
      lost: '#ef4444',
    };
    return colors[stage] || '#64748b';
  };

  const CustomerCard = ({ customer }: { customer: Customer }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        Alert.alert(
          customer.name,
          `Email: ${customer.email}\nPhone: ${customer.phone}\nCompany: ${customer.company}\nTotal Revenue: ${formatCurrency(customer.totalRevenue)}`,
          [
            {
              text: 'Edit',
              onPress: () => {
                Alert.alert('Edit Customer', 'Edit functionality coming soon');
              },
            },
            { text: 'Close', style: 'cancel' },
          ]
        );
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerAvatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.cardTitle}>{customer.name}</Text>
            <Text style={styles.cardSubtitle}>{customer.company}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: customer.status === 'active' ? '#10b98115' : '#64748b15' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: customer.status === 'active' ? '#10b981' : '#64748b' },
            ]}
          >
            {customer.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.customerInfo}>
        <View style={styles.customerInfoRow}>
          <Mail color="#64748b" size={16} />
          <Text style={styles.customerInfoText}>{customer.email}</Text>
        </View>
        <View style={styles.customerInfoRow}>
          <Phone color="#64748b" size={16} />
          <Text style={styles.customerInfoText}>{customer.phone}</Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardFooter}>
        <View style={styles.cardFooterItem}>
          <Text style={styles.cardFooterLabel}>Revenue</Text>
          <Text style={styles.cardFooterValue}>{formatCurrency(customer.totalRevenue)}</Text>
        </View>
        <View style={styles.cardFooterItem}>
          <Text style={styles.cardFooterLabel}>Type</Text>
          <Text style={styles.cardFooterValue}>{customer.type}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const LeadCard = ({ lead }: { lead: Lead }) => {
    const customer = customers.find((c) => c.id === lead.customerId);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          Alert.alert(
            'Update Lead Stage',
            `Current stage: ${lead.stage}`,
            [
              ...LEAD_STAGES.map((stage) => ({
                text: stage.charAt(0).toUpperCase() + stage.slice(1),
                onPress: () => updateLead(lead.id, { stage }),
              })),
              { text: 'Cancel', style: 'cancel' as const }
            ]
          );
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.leadIcon, { backgroundColor: getStageColor(lead.stage) + '15' }]}>
              <Target color={getStageColor(lead.stage)} size={20} />
            </View>
            <View>
              <Text style={styles.cardTitle}>{lead.title}</Text>
              <Text style={styles.cardSubtitle}>{customer?.name || 'Unknown Customer'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.leadDetails}>
          <View style={[styles.stageBadge, { backgroundColor: getStageColor(lead.stage) }]}>
            <Text style={styles.stageText}>{lead.stage.toUpperCase()}</Text>
          </View>
          <View style={styles.probabilityContainer}>
            <Text style={styles.probabilityText}>{lead.probability}% probability</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.cardFooterItem}>
            <Text style={styles.cardFooterLabel}>Value</Text>
            <Text style={styles.cardFooterValue}>{formatCurrency(lead.value)}</Text>
          </View>
          <View style={styles.cardFooterItem}>
            <Text style={styles.cardFooterLabel}>Source</Text>
            <Text style={styles.cardFooterValue}>{lead.source}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const CreateCustomerModal = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [company, setCompany] = useState('');
    const [address, setAddress] = useState('');

    const handleCreate = () => {
      if (!name || !email || !phone || !company) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const newCustomer: Customer = {
        id: Date.now().toString(),
        name,
        email,
        phone,
        company,
        address,
        status: 'active',
        type: 'customer',
        createdAt: new Date().toISOString(),
        totalRevenue: 0,
      };

      addCustomer(newCustomer);
      setShowCustomerModal(false);
      Alert.alert('Success', 'Customer added successfully');
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setAddress('');
    };

    return (
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCustomerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Customer</Text>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
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
                <Text style={styles.label}>Email *</Text>
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
                <Text style={styles.label}>Company *</Text>
                <TextInput
                  style={styles.input}
                  value={company}
                  onChangeText={setCompany}
                  placeholder="Acme Inc"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="123 Business St, City"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
                <Check color="#ffffff" size={20} />
                <Text style={styles.submitButtonText}>Add Customer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const CreateLeadModal = () => {
    const [title, setTitle] = useState('');
    const [value, setValue] = useState('');
    const [source, setSource] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');

    const handleCreate = () => {
      if (!title || !value || !source || !selectedCustomer) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const newLead: Lead = {
        id: Date.now().toString(),
        customerId: selectedCustomer,
        title,
        value: parseFloat(value),
        stage: 'new',
        probability: 20,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        source,
        createdAt: new Date().toISOString(),
      };

      addLead(newLead);
      setShowLeadModal(false);
      Alert.alert('Success', 'Lead created successfully');
      setTitle('');
      setValue('');
      setSource('');
      setSelectedCustomer('');
    };

    return (
      <Modal
        visible={showLeadModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLeadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Lead</Text>
              <TouchableOpacity onPress={() => setShowLeadModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Lead Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Website Redesign Project"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Customer *</Text>
                {customers.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {customers.map((customer) => (
                      <TouchableOpacity
                        key={customer.id}
                        style={[
                          styles.customerChip,
                          selectedCustomer === customer.id && styles.customerChipSelected,
                        ]}
                        onPress={() => setSelectedCustomer(customer.id)}
                      >
                        <Text
                          style={[
                            styles.customerChipText,
                            selectedCustomer === customer.id && styles.customerChipTextSelected,
                          ]}
                        >
                          {customer.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.noDataText}>No customers. Add one first.</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Estimated Value *</Text>
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={setValue}
                  placeholder="50000.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Source *</Text>
                <TextInput
                  style={styles.input}
                  value={source}
                  onChangeText={setSource}
                  placeholder="Website, Referral, Cold Call, etc."
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
                <Check color="#ffffff" size={20} />
                <Text style={styles.submitButtonText}>Create Lead</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const activeLeads = leads.filter((l) => !['won', 'lost'].includes(l.stage));
  const wonLeads = leads.filter((l) => l.stage === 'won');
  const totalPipelineValue = activeLeads.reduce((sum, l) => sum + l.value, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CRM</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Users color="#2563eb" size={20} />
          <Text style={styles.statValue}>{customers.length}</Text>
          <Text style={styles.statLabel}>Customers</Text>
        </View>
        <View style={styles.statCard}>
          <Target color="#8b5cf6" size={20} />
          <Text style={styles.statValue}>{activeLeads.length}</Text>
          <Text style={styles.statLabel}>Active Leads</Text>
        </View>
        <View style={styles.statCard}>
          <DollarSign color="#10b981" size={20} />
          <Text style={styles.statValue}>{formatCurrency(totalPipelineValue)}</Text>
          <Text style={styles.statLabel}>Pipeline</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'customers' && styles.activeTab]}
          onPress={() => setActiveTab('customers')}
        >
          <Text style={[styles.tabText, activeTab === 'customers' && styles.activeTabText]}>
            Customers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leads' && styles.activeTab]}
          onPress={() => setActiveTab('leads')}
        >
          <Text style={[styles.tabText, activeTab === 'leads' && styles.activeTabText]}>
            Leads
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'opportunities' && styles.activeTab]}
          onPress={() => setActiveTab('opportunities')}
        >
          <Text style={[styles.tabText, activeTab === 'opportunities' && styles.activeTabText]}>
            Pipeline
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
        {activeTab === 'customers' && (
          <>
            {customers.length > 0 ? (
              customers
                .filter((customer) =>
                  customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  customer.company.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((customer) => <CustomerCard key={customer.id} customer={customer} />)
            ) : (
              <View style={styles.emptyState}>
                <Users color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>No customers yet</Text>
                <Text style={styles.emptyStateSubtext}>Add your first customer to get started</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'leads' && (
          <>
            {leads.length > 0 ? (
              leads
                .filter((lead) => lead.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((lead) => <LeadCard key={lead.id} lead={lead} />)
            ) : (
              <View style={styles.emptyState}>
                <Target color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>No leads yet</Text>
                <Text style={styles.emptyStateSubtext}>Create your first lead opportunity</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'opportunities' && (
          <View style={styles.pipelineContainer}>
            <View style={styles.pipelineCard}>
              <Text style={styles.pipelineTitle}>Sales Pipeline Overview</Text>
              <View style={styles.pipelineStats}>
                <View style={styles.pipelineStat}>
                  <Text style={styles.pipelineStatValue}>{activeLeads.length}</Text>
                  <Text style={styles.pipelineStatLabel}>Active Leads</Text>
                </View>
                <View style={styles.pipelineStat}>
                  <Text style={styles.pipelineStatValue}>{wonLeads.length}</Text>
                  <Text style={styles.pipelineStatLabel}>Won Deals</Text>
                </View>
                <View style={styles.pipelineStat}>
                  <Text style={styles.pipelineStatValue}>{formatCurrency(totalPipelineValue)}</Text>
                  <Text style={styles.pipelineStatLabel}>Pipeline Value</Text>
                </View>
              </View>
            </View>

            {LEAD_STAGES.slice(0, -2).map((stage) => {
              const stageLeads = leads.filter((l) => l.stage === stage);
              const stageValue = stageLeads.reduce((sum, l) => sum + l.value, 0);
              return (
                <View key={stage} style={styles.stageCard}>
                  <View style={styles.stageHeader}>
                    <View style={[styles.stageIndicator, { backgroundColor: getStageColor(stage) }]} />
                    <Text style={styles.stageTitle}>{stage.toUpperCase()}</Text>
                  </View>
                  <View style={styles.stageContent}>
                    <Text style={styles.stageCount}>{stageLeads.length} leads</Text>
                    <Text style={styles.stageValue}>{formatCurrency(stageValue)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (activeTab === 'customers') {
            setShowCustomerModal(true);
          } else if (activeTab === 'leads') {
            if (customers.length === 0) {
              Alert.alert('No Customers', 'Please add a customer first', [
                { text: 'Add Customer', onPress: () => setShowCustomerModal(true) },
                { text: 'Cancel', style: 'cancel' },
              ]);
            } else {
              setShowLeadModal(true);
            }
          }
        }}
      >
        <Plus color="#ffffff" size={28} />
      </TouchableOpacity>

      <CreateCustomerModal />
      <CreateLeadModal />
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
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#0f172a',
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
    fontSize: 16,
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
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerAvatarText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  cardHeaderInfo: {
    flex: 1,
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
  customerInfo: {
    gap: 8,
    marginBottom: 12,
  },
  customerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerInfoText: {
    fontSize: 14,
    color: '#64748b',
  },
  leadIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leadDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stageText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  probabilityContainer: {
    flex: 1,
  },
  probabilityText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600' as const,
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
  pipelineContainer: {
    paddingBottom: 20,
  },
  pipelineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pipelineTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 16,
  },
  pipelineStats: {
    flexDirection: 'row',
    gap: 16,
  },
  pipelineStat: {
    flex: 1,
    alignItems: 'center',
  },
  pipelineStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  pipelineStatLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  stageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stageIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  stageTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  stageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stageCount: {
    fontSize: 13,
    color: '#64748b',
  },
  stageValue: {
    fontSize: 16,
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
  customerChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  customerChipSelected: {
    backgroundColor: '#2563eb',
  },
  customerChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  customerChipTextSelected: {
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
