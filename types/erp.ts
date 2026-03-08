export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  joinDate: string;
  status: 'active' | 'inactive' | 'on-leave';
  avatar?: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'checked-in' | 'checked-out';
  location?: string;
  notes?: string;
  hoursWorked?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  status: 'active' | 'inactive';
  type: 'lead' | 'customer' | 'partner';
  createdAt: string;
  totalRevenue: number;
}

export interface Lead {
  id: string;
  customerId: string;
  title: string;
  value: number;
  stage: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  probability: number;
  expectedCloseDate: string;
  source: string;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  description: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  warehouseId: string;
  status: 'active' | 'inactive';
  image?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  manager: string;
  status: 'active' | 'inactive';
}

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: number;
  date: string;
  reference?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  vendor: string;
  description: string;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  receipt?: string;
  createdBy: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'quotation' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  date: string;
  expectedDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  notes?: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  status: 'active' | 'inactive';
  paymentTerms: string;
  totalPurchases: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'vacation' | 'sick' | 'personal' | 'unpaid';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  submittedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'review' | 'done';
  dueDate: string;
  createdAt: string;
  tags: string[];
}

export interface Enquiry {
  id: string;
  customerId: string;
  subject: string;
  description: string;
  status: 'new' | 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryFollowUp {
  id: string;
  enquiryId: string;
  notes: string;
  date: string;
  nextFollowUpDate?: string;
  createdBy: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  company?: string;
  position?: string;
  category: string;
  notes?: string;
  isFavorite: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'meeting' | 'task' | 'call' | 'payment' | 'other';
  relatedTo?: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface AccountingEntry {
  id: string;
  date: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: 'income' | 'expense' | 'asset' | 'liability' | 'equity';
  reference?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  budget: number;
  spent: number;
  progress: number;
  managerId: string;
  teamMembers: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  completedAt?: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  depreciation: number;
  status: 'active' | 'maintenance' | 'retired' | 'sold';
  assignedTo?: string;
  location: string;
  warranty?: string;
  notes?: string;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  projectId?: string;
  taskId?: string;
  date: string;
  hours: number;
  description: string;
  billable: boolean;
  rate?: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

export interface Budget {
  id: string;
  name: string;
  category: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  allocated: number;
  spent: number;
  department?: string;
  status: 'active' | 'exceeded' | 'closed';
}

export interface PayrollEntry {
  id: string;
  employeeId: string;
  period: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  overtime: number;
  bonus: number;
  netSalary: number;
  status: 'draft' | 'processed' | 'paid';
  paymentDate?: string;
  paymentMethod?: string;
}

export interface ApprovalWorkflow {
  id: string;
  type: 'leave' | 'expense' | 'purchase' | 'timesheet' | 'invoice';
  referenceId: string;
  requestedBy: string;
  approvers: string[];
  currentApprover: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  relatedTo?: string;
  relatedType?: string;
  tags: string[];
  url: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface POSTransaction {
  id: string;
  transactionNumber: string;
  date: string;
  customerId?: string;
  customerName?: string;
  items: POSTransactionItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'split';
  status: 'completed' | 'voided' | 'refunded';
  cashierId: string;
  terminalId: string;
  notes?: string;
  createdAt: string;
}

export interface POSTransactionItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface POSTerminal {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
  assignedTo?: string;
  lastTransaction?: string;
}

export interface SalesQuotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  date: string;
  validUntil: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  notes?: string;
  terms?: string;
  createdBy: string;
  convertedToOrderId?: string;
}

export interface SalesTarget {
  id: string;
  salesPersonId: string;
  period: string;
  targetAmount: number;
  achievedAmount: number;
  targetUnits: number;
  achievedUnits: number;
  status: 'active' | 'achieved' | 'missed' | 'overachieved';
}

export interface Commission {
  id: string;
  salesPersonId: string;
  transactionId: string;
  transactionType: 'invoice' | 'order' | 'quotation';
  amount: number;
  rate: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid';
  period: string;
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  productId: string;
  quantity: number;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled' | 'on-hold';
  startDate: string;
  endDate?: string;
  completedQuantity: number;
  warehouseId: string;
  bomId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

export interface BillOfMaterials {
  id: string;
  productId: string;
  components: BOMComponent[];
  version: string;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface BOMComponent {
  id: string;
  productId: string;
  quantity: number;
  unit: string;
  wastagePercentage: number;
}

export interface QualityCheck {
  id: string;
  type: 'incoming' | 'in-process' | 'final' | 'random';
  referenceId: string;
  referenceType: 'product' | 'production-order' | 'purchase-order';
  inspectorId: string;
  date: string;
  status: 'passed' | 'failed' | 'conditional';
  parameters: QualityParameter[];
  notes?: string;
  images?: string[];
}

export interface QualityParameter {
  id: string;
  name: string;
  expectedValue: string;
  actualValue: string;
  status: 'pass' | 'fail';
  unit?: string;
}

export interface WorkflowAutomation {
  id: string;
  name: string;
  description: string;
  triggerType: 'manual' | 'scheduled' | 'event';
  triggerEvent?: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  status: 'active' | 'inactive' | 'draft';
  lastRun?: string;
  runCount: number;
  createdAt: string;
}

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not-equals' | 'greater-than' | 'less-than' | 'contains';
  value: string;
}

export interface WorkflowAction {
  id: string;
  type: 'email' | 'notification' | 'update-field' | 'create-task' | 'webhook';
  configuration: Record<string, any>;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

export interface ShipmentTracking {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: 'pending' | 'in-transit' | 'delivered' | 'failed' | 'returned';
  shippedDate?: string;
  deliveryDate?: string;
  origin: string;
  destination: string;
  notes?: string;
}

export interface ReturnOrder {
  id: string;
  returnNumber: string;
  originalOrderId: string;
  customerId: string;
  date: string;
  items: ReturnItem[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  refundAmount: number;
  refundMethod: 'original' | 'store-credit' | 'exchange';
  notes?: string;
}

export interface ReturnItem {
  id: string;
  productId: string;
  quantity: number;
  reason: string;
  condition: 'new' | 'used' | 'damaged';
}

export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  fullName: string;
  role: 'superuser' | 'admin' | 'manager' | 'employee' | 'accountant' | 'sales' | 'hr';
  permissions: UserPermissions;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  createdBy?: string;
  companyId?: string;
  avatar?: string;
  phone?: string;
}

export interface UserPermissions {
  hr: PermissionLevel;
  finance: PermissionLevel;
  inventory: PermissionLevel;
  crm: PermissionLevel;
  sales: PermissionLevel;
  purchase: PermissionLevel;
  projects: PermissionLevel;
  manufacturing: PermissionLevel;
  reports: PermissionLevel;
  settings: PermissionLevel;
  users: PermissionLevel;
}

export type PermissionLevel = 'none' | 'read' | 'write' | 'admin';

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  logo?: string;
  createdAt: string;
  adminUserId: string;
  subscriptionStatus: 'trial' | 'active' | 'suspended' | 'cancelled';
  subscriptionExpiry?: string;
}
