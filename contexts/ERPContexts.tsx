import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import {
  Employee,
  Attendance,
  Customer,
  Lead,
  Product,
  Warehouse,
  StockMovement,
  Invoice,
  Expense,
  SalesOrder,
  PurchaseOrder,
  Vendor,
  LeaveRequest,
  Task,
  Enquiry,
  EnquiryFollowUp,
  Contact,
  Reminder,
  AccountingEntry,
  Project,
  ProjectMilestone,
  Asset,
  TimeEntry,
  Budget,
  PayrollEntry,
  ApprovalWorkflow,
  Document,
  Notification,
  POSTransaction,
  POSTerminal,
  SalesQuotation,
  SalesTarget,
  Commission,
  ProductionOrder,
  BillOfMaterials,
  QualityCheck,
  WorkflowAutomation,
  AuditLog,
  ShipmentTracking,
  ReturnOrder,
} from '@/types/erp';

const STORAGE_KEYS = {
  EMPLOYEES: 'erp_employees',
  ATTENDANCE: 'erp_attendance',
  CUSTOMERS: 'erp_customers',
  LEADS: 'erp_leads',
  PRODUCTS: 'erp_products',
  WAREHOUSES: 'erp_warehouses',
  STOCK_MOVEMENTS: 'erp_stock_movements',
  INVOICES: 'erp_invoices',
  EXPENSES: 'erp_expenses',
  SALES_ORDERS: 'erp_sales_orders',
  PURCHASE_ORDERS: 'erp_purchase_orders',
  VENDORS: 'erp_vendors',
  LEAVE_REQUESTS: 'erp_leave_requests',
  TASKS: 'erp_tasks',
  ENQUIRIES: 'erp_enquiries',
  ENQUIRY_FOLLOWUPS: 'erp_enquiry_followups',
  CONTACTS: 'erp_contacts',
  REMINDERS: 'erp_reminders',
  ACCOUNTING: 'erp_accounting',
  PROJECTS: 'erp_projects',
  PROJECT_MILESTONES: 'erp_project_milestones',
  ASSETS: 'erp_assets',
  TIME_ENTRIES: 'erp_time_entries',
  BUDGETS: 'erp_budgets',
  PAYROLL: 'erp_payroll',
  APPROVALS: 'erp_approvals',
  DOCUMENTS: 'erp_documents',
  NOTIFICATIONS: 'erp_notifications',
  POS_TRANSACTIONS: 'erp_pos_transactions',
  POS_TERMINALS: 'erp_pos_terminals',
  SALES_QUOTATIONS: 'erp_sales_quotations',
  SALES_TARGETS: 'erp_sales_targets',
  COMMISSIONS: 'erp_commissions',
  PRODUCTION_ORDERS: 'erp_production_orders',
  BILL_OF_MATERIALS: 'erp_bill_of_materials',
  QUALITY_CHECKS: 'erp_quality_checks',
  WORKFLOW_AUTOMATIONS: 'erp_workflow_automations',
  AUDIT_LOGS: 'erp_audit_logs',
  SHIPMENT_TRACKING: 'erp_shipment_tracking',
  RETURN_ORDERS: 'erp_return_orders',
};

export const [ERPProvider, useERP] = createContextHook(() => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [enquiryFollowUps, setEnquiryFollowUps] = useState<EnquiryFollowUp[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [accountingEntries, setAccountingEntries] = useState<AccountingEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMilestones, setProjectMilestones] = useState<ProjectMilestone[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [approvals, setApprovals] = useState<ApprovalWorkflow[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [posTransactions, setPOSTransactions] = useState<POSTransaction[]>([]);
  const [posTerminals, setPOSTerminals] = useState<POSTerminal[]>([]);
  const [salesQuotations, setSalesQuotations] = useState<SalesQuotation[]>([]);
  const [salesTargets, setSalesTargets] = useState<SalesTarget[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [billOfMaterials, setBillOfMaterials] = useState<BillOfMaterials[]>([]);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [workflowAutomations, setWorkflowAutomations] = useState<WorkflowAutomation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [shipmentTracking, setShipmentTracking] = useState<ShipmentTracking[]>([]);
  const [returnOrders, setReturnOrders] = useState<ReturnOrder[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [
        employeesData,
        attendanceData,
        customersData,
        leadsData,
        productsData,
        warehousesData,
        stockMovementsData,
        invoicesData,
        expensesData,
        salesOrdersData,
        purchaseOrdersData,
        vendorsData,
        leaveRequestsData,
        tasksData,
        enquiriesData,
        enquiryFollowUpsData,
        contactsData,
        remindersData,
        accountingData,
        projectsData,
        projectMilestonesData,
        assetsData,
        timeEntriesData,
        budgetsData,
        payrollData,
        approvalsData,
        documentsData,
        notificationsData,
        posTransactionsData,
        posTerminalsData,
        salesQuotationsData,
        salesTargetsData,
        commissionsData,
        productionOrdersData,
        billOfMaterialsData,
        qualityChecksData,
        workflowAutomationsData,
        auditLogsData,
        shipmentTrackingData,
        returnOrdersData,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.EMPLOYEES),
        AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE),
        AsyncStorage.getItem(STORAGE_KEYS.CUSTOMERS),
        AsyncStorage.getItem(STORAGE_KEYS.LEADS),
        AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS),
        AsyncStorage.getItem(STORAGE_KEYS.WAREHOUSES),
        AsyncStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.INVOICES),
        AsyncStorage.getItem(STORAGE_KEYS.EXPENSES),
        AsyncStorage.getItem(STORAGE_KEYS.SALES_ORDERS),
        AsyncStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS),
        AsyncStorage.getItem(STORAGE_KEYS.VENDORS),
        AsyncStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS),
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.ENQUIRIES),
        AsyncStorage.getItem(STORAGE_KEYS.ENQUIRY_FOLLOWUPS),
        AsyncStorage.getItem(STORAGE_KEYS.CONTACTS),
        AsyncStorage.getItem(STORAGE_KEYS.REMINDERS),
        AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTING),
        AsyncStorage.getItem(STORAGE_KEYS.PROJECTS),
        AsyncStorage.getItem(STORAGE_KEYS.PROJECT_MILESTONES),
        AsyncStorage.getItem(STORAGE_KEYS.ASSETS),
        AsyncStorage.getItem(STORAGE_KEYS.TIME_ENTRIES),
        AsyncStorage.getItem(STORAGE_KEYS.BUDGETS),
        AsyncStorage.getItem(STORAGE_KEYS.PAYROLL),
        AsyncStorage.getItem(STORAGE_KEYS.APPROVALS),
        AsyncStorage.getItem(STORAGE_KEYS.DOCUMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.POS_TRANSACTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.POS_TERMINALS),
        AsyncStorage.getItem(STORAGE_KEYS.SALES_QUOTATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.SALES_TARGETS),
        AsyncStorage.getItem(STORAGE_KEYS.COMMISSIONS),
        AsyncStorage.getItem(STORAGE_KEYS.PRODUCTION_ORDERS),
        AsyncStorage.getItem(STORAGE_KEYS.BILL_OF_MATERIALS),
        AsyncStorage.getItem(STORAGE_KEYS.QUALITY_CHECKS),
        AsyncStorage.getItem(STORAGE_KEYS.WORKFLOW_AUTOMATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.AUDIT_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.SHIPMENT_TRACKING),
        AsyncStorage.getItem(STORAGE_KEYS.RETURN_ORDERS),
      ]);

      setEmployees(employeesData ? JSON.parse(employeesData) : []);
      setAttendance(attendanceData ? JSON.parse(attendanceData) : []);
      setCustomers(customersData ? JSON.parse(customersData) : []);
      setLeads(leadsData ? JSON.parse(leadsData) : []);
      setProducts(productsData ? JSON.parse(productsData) : []);
      setWarehouses(warehousesData ? JSON.parse(warehousesData) : []);
      setStockMovements(stockMovementsData ? JSON.parse(stockMovementsData) : []);
      setInvoices(invoicesData ? JSON.parse(invoicesData) : []);
      setExpenses(expensesData ? JSON.parse(expensesData) : []);
      setSalesOrders(salesOrdersData ? JSON.parse(salesOrdersData) : []);
      setPurchaseOrders(purchaseOrdersData ? JSON.parse(purchaseOrdersData) : []);
      setVendors(vendorsData ? JSON.parse(vendorsData) : []);
      setLeaveRequests(leaveRequestsData ? JSON.parse(leaveRequestsData) : []);
      setTasks(tasksData ? JSON.parse(tasksData) : []);
      setEnquiries(enquiriesData ? JSON.parse(enquiriesData) : []);
      setEnquiryFollowUps(enquiryFollowUpsData ? JSON.parse(enquiryFollowUpsData) : []);
      setContacts(contactsData ? JSON.parse(contactsData) : []);
      setReminders(remindersData ? JSON.parse(remindersData) : []);
      setAccountingEntries(accountingData ? JSON.parse(accountingData) : []);
      setProjects(projectsData ? JSON.parse(projectsData) : []);
      setProjectMilestones(projectMilestonesData ? JSON.parse(projectMilestonesData) : []);
      setAssets(assetsData ? JSON.parse(assetsData) : []);
      setTimeEntries(timeEntriesData ? JSON.parse(timeEntriesData) : []);
      setBudgets(budgetsData ? JSON.parse(budgetsData) : []);
      setPayrollEntries(payrollData ? JSON.parse(payrollData) : []);
      setApprovals(approvalsData ? JSON.parse(approvalsData) : []);
      setDocuments(documentsData ? JSON.parse(documentsData) : []);
      setNotifications(notificationsData ? JSON.parse(notificationsData) : []);
      setPOSTransactions(posTransactionsData ? JSON.parse(posTransactionsData) : []);
      setPOSTerminals(posTerminalsData ? JSON.parse(posTerminalsData) : []);
      setSalesQuotations(salesQuotationsData ? JSON.parse(salesQuotationsData) : []);
      setSalesTargets(salesTargetsData ? JSON.parse(salesTargetsData) : []);
      setCommissions(commissionsData ? JSON.parse(commissionsData) : []);
      setProductionOrders(productionOrdersData ? JSON.parse(productionOrdersData) : []);
      setBillOfMaterials(billOfMaterialsData ? JSON.parse(billOfMaterialsData) : []);
      setQualityChecks(qualityChecksData ? JSON.parse(qualityChecksData) : []);
      setWorkflowAutomations(workflowAutomationsData ? JSON.parse(workflowAutomationsData) : []);
      setAuditLogs(auditLogsData ? JSON.parse(auditLogsData) : []);
      setShipmentTracking(shipmentTrackingData ? JSON.parse(shipmentTrackingData) : []);
      setReturnOrders(returnOrdersData ? JSON.parse(returnOrdersData) : []);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading ERP data:', error);
      setIsLoaded(true);
    }
  };

  const saveData = async <T,>(key: string, data: T[]) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  const addAuditLog = (log: AuditLog) => {
    const updated = [...auditLogs, log];
    setAuditLogs(updated);
    saveData(STORAGE_KEYS.AUDIT_LOGS, updated);
  };

  return {
    employees,
    setEmployees: (data: Employee[]) => {
      setEmployees(data);
      saveData(STORAGE_KEYS.EMPLOYEES, data);
    },
    addEmployee: (employee: Employee) => {
      const updated = [...employees, employee];
      setEmployees(updated);
      saveData(STORAGE_KEYS.EMPLOYEES, updated);
      addAuditLog({
        id: Date.now().toString() + '-audit',
        userId: 'system',
        userName: 'System',
        action: 'Create Employee',
        module: 'HR',
        entityType: 'Employee',
        entityId: employee.id,
        timestamp: new Date().toISOString(),
      });
    },
    updateEmployee: (id: string, updates: Partial<Employee>) => {
      const updated = employees.map((e) => (e.id === id ? { ...e, ...updates } : e));
      setEmployees(updated);
      saveData(STORAGE_KEYS.EMPLOYEES, updated);
    },
    deleteEmployee: (id: string) => {
      const updated = employees.filter((e) => e.id !== id);
      setEmployees(updated);
      saveData(STORAGE_KEYS.EMPLOYEES, updated);
    },

    attendance,
    addAttendance: (record: Attendance) => {
      const updated = [...attendance, record];
      setAttendance(updated);
      saveData(STORAGE_KEYS.ATTENDANCE, updated);
      addAuditLog({
        id: Date.now().toString() + '-audit',
        userId: 'system',
        userName: 'System',
        action: 'Check In',
        module: 'HR',
        entityType: 'Attendance',
        entityId: record.id,
        timestamp: new Date().toISOString(),
      });
    },
    updateAttendance: (id: string, updates: Partial<Attendance>) => {
      const updated = attendance.map((a) => (a.id === id ? { ...a, ...updates } : a));
      setAttendance(updated);
      saveData(STORAGE_KEYS.ATTENDANCE, updated);
      addAuditLog({
        id: Date.now().toString() + '-audit',
        userId: 'system',
        userName: 'System',
        action: updates.checkOut ? 'Check Out' : 'Update Attendance',
        module: 'HR',
        entityType: 'Attendance',
        entityId: id,
        changes: updates,
        timestamp: new Date().toISOString(),
      });
    },

    customers,
    setCustomers: (data: Customer[]) => {
      setCustomers(data);
      saveData(STORAGE_KEYS.CUSTOMERS, data);
    },
    addCustomer: (customer: Customer) => {
      const updated = [...customers, customer];
      setCustomers(updated);
      saveData(STORAGE_KEYS.CUSTOMERS, updated);
    },
    updateCustomer: (id: string, updates: Partial<Customer>) => {
      const updated = customers.map((c) => (c.id === id ? { ...c, ...updates } : c));
      setCustomers(updated);
      saveData(STORAGE_KEYS.CUSTOMERS, updated);
    },

    leads,
    setLeads: (data: Lead[]) => {
      setLeads(data);
      saveData(STORAGE_KEYS.LEADS, data);
    },
    addLead: (lead: Lead) => {
      const updated = [...leads, lead];
      setLeads(updated);
      saveData(STORAGE_KEYS.LEADS, updated);
    },
    updateLead: (id: string, updates: Partial<Lead>) => {
      const updated = leads.map((l) => (l.id === id ? { ...l, ...updates } : l));
      setLeads(updated);
      saveData(STORAGE_KEYS.LEADS, updated);
    },

    products,
    setProducts: (data: Product[]) => {
      setProducts(data);
      saveData(STORAGE_KEYS.PRODUCTS, data);
    },
    addProduct: (product: Product) => {
      const updated = [...products, product];
      setProducts(updated);
      saveData(STORAGE_KEYS.PRODUCTS, updated);
      addAuditLog({
        id: Date.now().toString() + '-audit',
        userId: 'system',
        userName: 'System',
        action: 'Create Product',
        module: 'Inventory',
        entityType: 'Product',
        entityId: product.id,
        timestamp: new Date().toISOString(),
      });
    },
    updateProduct: (id: string, updates: Partial<Product>) => {
      const updated = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
      setProducts(updated);
      saveData(STORAGE_KEYS.PRODUCTS, updated);
    },
    deleteProduct: (id: string) => {
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      saveData(STORAGE_KEYS.PRODUCTS, updated);
    },

    warehouses,
    addWarehouse: (warehouse: Warehouse) => {
      const updated = [...warehouses, warehouse];
      setWarehouses(updated);
      saveData(STORAGE_KEYS.WAREHOUSES, updated);
    },

    stockMovements,
    addStockMovement: (movement: StockMovement) => {
      const updated = [...stockMovements, movement];
      setStockMovements(updated);
      saveData(STORAGE_KEYS.STOCK_MOVEMENTS, updated);
    },

    invoices,
    setInvoices: (data: Invoice[]) => {
      setInvoices(data);
      saveData(STORAGE_KEYS.INVOICES, data);
    },
    addInvoice: (invoice: Invoice) => {
      const updated = [...invoices, invoice];
      setInvoices(updated);
      saveData(STORAGE_KEYS.INVOICES, updated);
      addAuditLog({
        id: Date.now().toString() + '-audit',
        userId: 'system',
        userName: 'System',
        action: 'Create Invoice',
        module: 'Finance',
        entityType: 'Invoice',
        entityId: invoice.id,
        timestamp: new Date().toISOString(),
      });
    },
    updateInvoice: (id: string, updates: Partial<Invoice>) => {
      const updated = invoices.map((i) => (i.id === id ? { ...i, ...updates } : i));
      setInvoices(updated);
      saveData(STORAGE_KEYS.INVOICES, updated);
    },

    expenses,
    setExpenses: (data: Expense[]) => {
      setExpenses(data);
      saveData(STORAGE_KEYS.EXPENSES, data);
    },
    addExpense: (expense: Expense) => {
      const updated = [...expenses, expense];
      setExpenses(updated);
      saveData(STORAGE_KEYS.EXPENSES, updated);
    },
    updateExpense: (id: string, updates: Partial<Expense>) => {
      const updated = expenses.map((e) => (e.id === id ? { ...e, ...updates } : e));
      setExpenses(updated);
      saveData(STORAGE_KEYS.EXPENSES, updated);
    },

    salesOrders,
    addSalesOrder: (order: SalesOrder) => {
      const updated = [...salesOrders, order];
      setSalesOrders(updated);
      saveData(STORAGE_KEYS.SALES_ORDERS, updated);
    },
    updateSalesOrder: (id: string, updates: Partial<SalesOrder>) => {
      const updated = salesOrders.map((o) => (o.id === id ? { ...o, ...updates } : o));
      setSalesOrders(updated);
      saveData(STORAGE_KEYS.SALES_ORDERS, updated);
    },

    purchaseOrders,
    addPurchaseOrder: (order: PurchaseOrder) => {
      const updated = [...purchaseOrders, order];
      setPurchaseOrders(updated);
      saveData(STORAGE_KEYS.PURCHASE_ORDERS, updated);
    },
    updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => {
      const updated = purchaseOrders.map((o) => (o.id === id ? { ...o, ...updates } : o));
      setPurchaseOrders(updated);
      saveData(STORAGE_KEYS.PURCHASE_ORDERS, updated);
    },
    deletePurchaseOrder: (id: string) => {
      const updated = purchaseOrders.filter((o) => o.id !== id);
      setPurchaseOrders(updated);
      saveData(STORAGE_KEYS.PURCHASE_ORDERS, updated);
    },

    vendors,
    addVendor: (vendor: Vendor) => {
      const updated = [...vendors, vendor];
      setVendors(updated);
      saveData(STORAGE_KEYS.VENDORS, updated);
    },
    updateVendor: (id: string, updates: Partial<Vendor>) => {
      const updated = vendors.map((v) => (v.id === id ? { ...v, ...updates } : v));
      setVendors(updated);
      saveData(STORAGE_KEYS.VENDORS, updated);
    },
    deleteVendor: (id: string) => {
      const updated = vendors.filter((v) => v.id !== id);
      setVendors(updated);
      saveData(STORAGE_KEYS.VENDORS, updated);
    },

    leaveRequests,
    addLeaveRequest: (request: LeaveRequest) => {
      const updated = [...leaveRequests, request];
      setLeaveRequests(updated);
      saveData(STORAGE_KEYS.LEAVE_REQUESTS, updated);
    },
    updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => {
      const updated = leaveRequests.map((r) => (r.id === id ? { ...r, ...updates } : r));
      setLeaveRequests(updated);
      saveData(STORAGE_KEYS.LEAVE_REQUESTS, updated);
    },

    tasks,
    addTask: (task: Task) => {
      const updated = [...tasks, task];
      setTasks(updated);
      saveData(STORAGE_KEYS.TASKS, updated);
    },
    updateTask: (id: string, updates: Partial<Task>) => {
      const updated = tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
      setTasks(updated);
      saveData(STORAGE_KEYS.TASKS, updated);
    },
    deleteTask: (id: string) => {
      const updated = tasks.filter((t) => t.id !== id);
      setTasks(updated);
      saveData(STORAGE_KEYS.TASKS, updated);
    },

    enquiries,
    addEnquiry: (enquiry: Enquiry) => {
      const updated = [...enquiries, enquiry];
      setEnquiries(updated);
      saveData(STORAGE_KEYS.ENQUIRIES, updated);
    },
    updateEnquiry: (id: string, updates: Partial<Enquiry>) => {
      const updated = enquiries.map((e) => (e.id === id ? { ...e, ...updates } : e));
      setEnquiries(updated);
      saveData(STORAGE_KEYS.ENQUIRIES, updated);
    },

    enquiryFollowUps,
    addEnquiryFollowUp: (followUp: EnquiryFollowUp) => {
      const updated = [...enquiryFollowUps, followUp];
      setEnquiryFollowUps(updated);
      saveData(STORAGE_KEYS.ENQUIRY_FOLLOWUPS, updated);
    },

    contacts,
    addContact: (contact: Contact) => {
      const updated = [...contacts, contact];
      setContacts(updated);
      saveData(STORAGE_KEYS.CONTACTS, updated);
    },
    updateContact: (id: string, updates: Partial<Contact>) => {
      const updated = contacts.map((c) => (c.id === id ? { ...c, ...updates } : c));
      setContacts(updated);
      saveData(STORAGE_KEYS.CONTACTS, updated);
    },
    deleteContact: (id: string) => {
      const updated = contacts.filter((c) => c.id !== id);
      setContacts(updated);
      saveData(STORAGE_KEYS.CONTACTS, updated);
    },

    reminders,
    addReminder: (reminder: Reminder) => {
      const updated = [...reminders, reminder];
      setReminders(updated);
      saveData(STORAGE_KEYS.REMINDERS, updated);
    },
    updateReminder: (id: string, updates: Partial<Reminder>) => {
      const updated = reminders.map((r) => (r.id === id ? { ...r, ...updates } : r));
      setReminders(updated);
      saveData(STORAGE_KEYS.REMINDERS, updated);
    },

    accountingEntries,
    addAccountingEntry: (entry: AccountingEntry) => {
      const updated = [...accountingEntries, entry];
      setAccountingEntries(updated);
      saveData(STORAGE_KEYS.ACCOUNTING, updated);
    },

    projects,
    addProject: (project: Project) => {
      const updated = [...projects, project];
      setProjects(updated);
      saveData(STORAGE_KEYS.PROJECTS, updated);
    },
    updateProject: (id: string, updates: Partial<Project>) => {
      const updated = projects.map((p) => (p.id === id ? { ...p, ...updates } : p));
      setProjects(updated);
      saveData(STORAGE_KEYS.PROJECTS, updated);
    },

    projectMilestones,
    addProjectMilestone: (milestone: ProjectMilestone) => {
      const updated = [...projectMilestones, milestone];
      setProjectMilestones(updated);
      saveData(STORAGE_KEYS.PROJECT_MILESTONES, updated);
    },
    updateProjectMilestone: (id: string, updates: Partial<ProjectMilestone>) => {
      const updated = projectMilestones.map((m) => (m.id === id ? { ...m, ...updates } : m));
      setProjectMilestones(updated);
      saveData(STORAGE_KEYS.PROJECT_MILESTONES, updated);
    },
    deleteProject: (id: string) => {
      const updated = projects.filter((p) => p.id !== id);
      setProjects(updated);
      saveData(STORAGE_KEYS.PROJECTS, updated);
    },

    assets,
    addAsset: (asset: Asset) => {
      const updated = [...assets, asset];
      setAssets(updated);
      saveData(STORAGE_KEYS.ASSETS, updated);
    },
    updateAsset: (id: string, updates: Partial<Asset>) => {
      const updated = assets.map((a) => (a.id === id ? { ...a, ...updates } : a));
      setAssets(updated);
      saveData(STORAGE_KEYS.ASSETS, updated);
    },

    timeEntries,
    addTimeEntry: (entry: TimeEntry) => {
      const updated = [...timeEntries, entry];
      setTimeEntries(updated);
      saveData(STORAGE_KEYS.TIME_ENTRIES, updated);
    },
    updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => {
      const updated = timeEntries.map((t) => (t.id === id ? { ...t, ...updates } : t));
      setTimeEntries(updated);
      saveData(STORAGE_KEYS.TIME_ENTRIES, updated);
    },

    budgets,
    addBudget: (budget: Budget) => {
      const updated = [...budgets, budget];
      setBudgets(updated);
      saveData(STORAGE_KEYS.BUDGETS, updated);
    },
    updateBudget: (id: string, updates: Partial<Budget>) => {
      const updated = budgets.map((b) => (b.id === id ? { ...b, ...updates } : b));
      setBudgets(updated);
      saveData(STORAGE_KEYS.BUDGETS, updated);
    },

    payrollEntries,
    addPayrollEntry: (entry: PayrollEntry) => {
      const updated = [...payrollEntries, entry];
      setPayrollEntries(updated);
      saveData(STORAGE_KEYS.PAYROLL, updated);
    },
    updatePayrollEntry: (id: string, updates: Partial<PayrollEntry>) => {
      const updated = payrollEntries.map((p) => (p.id === id ? { ...p, ...updates } : p));
      setPayrollEntries(updated);
      saveData(STORAGE_KEYS.PAYROLL, updated);
    },

    approvals,
    addApproval: (approval: ApprovalWorkflow) => {
      const updated = [...approvals, approval];
      setApprovals(updated);
      saveData(STORAGE_KEYS.APPROVALS, updated);
    },
    updateApproval: (id: string, updates: Partial<ApprovalWorkflow>) => {
      const updated = approvals.map((a) => (a.id === id ? { ...a, ...updates } : a));
      setApprovals(updated);
      saveData(STORAGE_KEYS.APPROVALS, updated);
    },

    documents,
    addDocument: (document: Document) => {
      const updated = [...documents, document];
      setDocuments(updated);
      saveData(STORAGE_KEYS.DOCUMENTS, updated);
    },
    deleteDocument: (id: string) => {
      const updated = documents.filter((d) => d.id !== id);
      setDocuments(updated);
      saveData(STORAGE_KEYS.DOCUMENTS, updated);
    },

    notifications,
    addNotification: (notification: Notification) => {
      const updated = [...notifications, notification];
      setNotifications(updated);
      saveData(STORAGE_KEYS.NOTIFICATIONS, updated);
    },
    markNotificationRead: (id: string) => {
      const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      setNotifications(updated);
      saveData(STORAGE_KEYS.NOTIFICATIONS, updated);
    },
    markAllNotificationsRead: () => {
      const updated = notifications.map((n) => ({ ...n, read: true }));
      setNotifications(updated);
      saveData(STORAGE_KEYS.NOTIFICATIONS, updated);
    },
    deleteNotification: (id: string) => {
      const updated = notifications.filter((n) => n.id !== id);
      setNotifications(updated);
      saveData(STORAGE_KEYS.NOTIFICATIONS, updated);
    },
    clearAllData: async () => {
      try {
        const keys = Object.values(STORAGE_KEYS);
        await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
        setEmployees([]);
        setAttendance([]);
        setCustomers([]);
        setLeads([]);
        setProducts([]);
        setWarehouses([]);
        setStockMovements([]);
        setInvoices([]);
        setExpenses([]);
        setSalesOrders([]);
        setPurchaseOrders([]);
        setVendors([]);
        setLeaveRequests([]);
        setTasks([]);
        setEnquiries([]);
        setEnquiryFollowUps([]);
        setContacts([]);
        setReminders([]);
        setAccountingEntries([]);
        setProjects([]);
        setProjectMilestones([]);
        setAssets([]);
        setTimeEntries([]);
        setBudgets([]);
        setPayrollEntries([]);
        setApprovals([]);
        setDocuments([]);
        setNotifications([]);
        setPOSTransactions([]);
        setPOSTerminals([]);
        setSalesQuotations([]);
        setSalesTargets([]);
        setCommissions([]);
        setProductionOrders([]);
        setBillOfMaterials([]);
        setQualityChecks([]);
        setWorkflowAutomations([]);
        setAuditLogs([]);
        setShipmentTracking([]);
        setReturnOrders([]);
        return { success: true, message: 'All data cleared' };
      } catch (error) {
        console.error('Error clearing data:', error);
        return { success: false, message: 'Failed to clear data' };
      }
    },

    posTransactions,
    addPOSTransaction: (transaction: POSTransaction) => {
      const updated = [...posTransactions, transaction];
      setPOSTransactions(updated);
      saveData(STORAGE_KEYS.POS_TRANSACTIONS, updated);
    },

    posTerminals,
    addPOSTerminal: (terminal: POSTerminal) => {
      const updated = [...posTerminals, terminal];
      setPOSTerminals(updated);
      saveData(STORAGE_KEYS.POS_TERMINALS, updated);
    },

    salesQuotations,
    addSalesQuotation: (quotation: SalesQuotation) => {
      const updated = [...salesQuotations, quotation];
      setSalesQuotations(updated);
      saveData(STORAGE_KEYS.SALES_QUOTATIONS, updated);
    },
    updateSalesQuotation: (id: string, updates: Partial<SalesQuotation>) => {
      const updated = salesQuotations.map((q) => (q.id === id ? { ...q, ...updates } : q));
      setSalesQuotations(updated);
      saveData(STORAGE_KEYS.SALES_QUOTATIONS, updated);
    },

    salesTargets,
    addSalesTarget: (target: SalesTarget) => {
      const updated = [...salesTargets, target];
      setSalesTargets(updated);
      saveData(STORAGE_KEYS.SALES_TARGETS, updated);
    },

    commissions,
    addCommission: (commission: Commission) => {
      const updated = [...commissions, commission];
      setCommissions(updated);
      saveData(STORAGE_KEYS.COMMISSIONS, updated);
    },

    productionOrders,
    addProductionOrder: (order: ProductionOrder) => {
      const updated = [...productionOrders, order];
      setProductionOrders(updated);
      saveData(STORAGE_KEYS.PRODUCTION_ORDERS, updated);
    },
    updateProductionOrder: (id: string, updates: Partial<ProductionOrder>) => {
      const updated = productionOrders.map((o) => (o.id === id ? { ...o, ...updates } : o));
      setProductionOrders(updated);
      saveData(STORAGE_KEYS.PRODUCTION_ORDERS, updated);
    },

    billOfMaterials,
    addBillOfMaterials: (bom: BillOfMaterials) => {
      const updated = [...billOfMaterials, bom];
      setBillOfMaterials(updated);
      saveData(STORAGE_KEYS.BILL_OF_MATERIALS, updated);
    },

    qualityChecks,
    addQualityCheck: (check: QualityCheck) => {
      const updated = [...qualityChecks, check];
      setQualityChecks(updated);
      saveData(STORAGE_KEYS.QUALITY_CHECKS, updated);
    },

    workflowAutomations,
    addWorkflowAutomation: (workflow: WorkflowAutomation) => {
      const updated = [...workflowAutomations, workflow];
      setWorkflowAutomations(updated);
      saveData(STORAGE_KEYS.WORKFLOW_AUTOMATIONS, updated);
    },
    updateWorkflowAutomation: (id: string, updates: Partial<WorkflowAutomation>) => {
      const updated = workflowAutomations.map((w) => (w.id === id ? { ...w, ...updates } : w));
      setWorkflowAutomations(updated);
      saveData(STORAGE_KEYS.WORKFLOW_AUTOMATIONS, updated);
    },

    auditLogs,
    addAuditLog,

    shipmentTracking,
    addShipmentTracking: (shipment: ShipmentTracking) => {
      const updated = [...shipmentTracking, shipment];
      setShipmentTracking(updated);
      saveData(STORAGE_KEYS.SHIPMENT_TRACKING, updated);
    },
    updateShipmentTracking: (id: string, updates: Partial<ShipmentTracking>) => {
      const updated = shipmentTracking.map((s) => (s.id === id ? { ...s, ...updates } : s));
      setShipmentTracking(updated);
      saveData(STORAGE_KEYS.SHIPMENT_TRACKING, updated);
    },

    returnOrders,
    addReturnOrder: (order: ReturnOrder) => {
      const updated = [...returnOrders, order];
      setReturnOrders(updated);
      saveData(STORAGE_KEYS.RETURN_ORDERS, updated);
    },
    updateReturnOrder: (id: string, updates: Partial<ReturnOrder>) => {
      const updated = returnOrders.map((r) => (r.id === id ? { ...r, ...updates } : r));
      setReturnOrders(updated);
      saveData(STORAGE_KEYS.RETURN_ORDERS, updated);
    },

    isLoaded,

    exportAllData: async () => {
      try {
        const allData = {
          employees,
          attendance,
          customers,
          leads,
          products,
          warehouses,
          stockMovements,
          invoices,
          expenses,
          salesOrders,
          purchaseOrders,
          vendors,
          leaveRequests,
          tasks,
          enquiries,
          enquiryFollowUps,
          contacts,
          reminders,
          accountingEntries,
          projects,
          projectMilestones,
          assets,
          timeEntries,
          budgets,
          payrollEntries,
          approvals,
          documents,
          notifications,
          posTransactions,
          posTerminals,
          salesQuotations,
          salesTargets,
          commissions,
          productionOrders,
          billOfMaterials,
          qualityChecks,
          workflowAutomations,
          auditLogs,
          shipmentTracking,
          returnOrders,
          exportDate: new Date().toISOString(),
          version: '1.0.0',
        };
        return JSON.stringify(allData, null, 2);
      } catch (error) {
        console.error('Error exporting data:', error);
        throw error;
      }
    },

    importAllData: async (dataString: string) => {
      try {
        const data = JSON.parse(dataString);
        
        if (data.employees) setEmployees(data.employees);
        if (data.attendance) setAttendance(data.attendance);
        if (data.customers) setCustomers(data.customers);
        if (data.leads) setLeads(data.leads);
        if (data.products) setProducts(data.products);
        if (data.warehouses) setWarehouses(data.warehouses);
        if (data.stockMovements) setStockMovements(data.stockMovements);
        if (data.invoices) setInvoices(data.invoices);
        if (data.expenses) setExpenses(data.expenses);
        if (data.salesOrders) setSalesOrders(data.salesOrders);
        if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
        if (data.vendors) setVendors(data.vendors);
        if (data.leaveRequests) setLeaveRequests(data.leaveRequests);
        if (data.tasks) setTasks(data.tasks);
        if (data.enquiries) setEnquiries(data.enquiries);
        if (data.enquiryFollowUps) setEnquiryFollowUps(data.enquiryFollowUps);
        if (data.contacts) setContacts(data.contacts);
        if (data.reminders) setReminders(data.reminders);
        if (data.accountingEntries) setAccountingEntries(data.accountingEntries);
        if (data.projects) setProjects(data.projects);
        if (data.projectMilestones) setProjectMilestones(data.projectMilestones);
        if (data.assets) setAssets(data.assets);
        if (data.timeEntries) setTimeEntries(data.timeEntries);
        if (data.budgets) setBudgets(data.budgets);
        if (data.payrollEntries) setPayrollEntries(data.payrollEntries);
        if (data.approvals) setApprovals(data.approvals);
        if (data.documents) setDocuments(data.documents);
        if (data.notifications) setNotifications(data.notifications);
        if (data.posTransactions) setPOSTransactions(data.posTransactions);
        if (data.posTerminals) setPOSTerminals(data.posTerminals);
        if (data.salesQuotations) setSalesQuotations(data.salesQuotations);
        if (data.salesTargets) setSalesTargets(data.salesTargets);
        if (data.commissions) setCommissions(data.commissions);
        if (data.productionOrders) setProductionOrders(data.productionOrders);
        if (data.billOfMaterials) setBillOfMaterials(data.billOfMaterials);
        if (data.qualityChecks) setQualityChecks(data.qualityChecks);
        if (data.workflowAutomations) setWorkflowAutomations(data.workflowAutomations);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        if (data.shipmentTracking) setShipmentTracking(data.shipmentTracking);
        if (data.returnOrders) setReturnOrders(data.returnOrders);

        await Promise.all([
          saveData(STORAGE_KEYS.EMPLOYEES, data.employees || []),
          saveData(STORAGE_KEYS.ATTENDANCE, data.attendance || []),
          saveData(STORAGE_KEYS.CUSTOMERS, data.customers || []),
          saveData(STORAGE_KEYS.LEADS, data.leads || []),
          saveData(STORAGE_KEYS.PRODUCTS, data.products || []),
          saveData(STORAGE_KEYS.WAREHOUSES, data.warehouses || []),
          saveData(STORAGE_KEYS.STOCK_MOVEMENTS, data.stockMovements || []),
          saveData(STORAGE_KEYS.INVOICES, data.invoices || []),
          saveData(STORAGE_KEYS.EXPENSES, data.expenses || []),
          saveData(STORAGE_KEYS.SALES_ORDERS, data.salesOrders || []),
          saveData(STORAGE_KEYS.PURCHASE_ORDERS, data.purchaseOrders || []),
          saveData(STORAGE_KEYS.VENDORS, data.vendors || []),
          saveData(STORAGE_KEYS.LEAVE_REQUESTS, data.leaveRequests || []),
          saveData(STORAGE_KEYS.TASKS, data.tasks || []),
          saveData(STORAGE_KEYS.ENQUIRIES, data.enquiries || []),
          saveData(STORAGE_KEYS.ENQUIRY_FOLLOWUPS, data.enquiryFollowUps || []),
          saveData(STORAGE_KEYS.CONTACTS, data.contacts || []),
          saveData(STORAGE_KEYS.REMINDERS, data.reminders || []),
          saveData(STORAGE_KEYS.ACCOUNTING, data.accountingEntries || []),
          saveData(STORAGE_KEYS.PROJECTS, data.projects || []),
          saveData(STORAGE_KEYS.PROJECT_MILESTONES, data.projectMilestones || []),
          saveData(STORAGE_KEYS.ASSETS, data.assets || []),
          saveData(STORAGE_KEYS.TIME_ENTRIES, data.timeEntries || []),
          saveData(STORAGE_KEYS.BUDGETS, data.budgets || []),
          saveData(STORAGE_KEYS.PAYROLL, data.payrollEntries || []),
          saveData(STORAGE_KEYS.APPROVALS, data.approvals || []),
          saveData(STORAGE_KEYS.DOCUMENTS, data.documents || []),
          saveData(STORAGE_KEYS.NOTIFICATIONS, data.notifications || []),
          saveData(STORAGE_KEYS.POS_TRANSACTIONS, data.posTransactions || []),
          saveData(STORAGE_KEYS.POS_TERMINALS, data.posTerminals || []),
          saveData(STORAGE_KEYS.SALES_QUOTATIONS, data.salesQuotations || []),
          saveData(STORAGE_KEYS.SALES_TARGETS, data.salesTargets || []),
          saveData(STORAGE_KEYS.COMMISSIONS, data.commissions || []),
          saveData(STORAGE_KEYS.PRODUCTION_ORDERS, data.productionOrders || []),
          saveData(STORAGE_KEYS.BILL_OF_MATERIALS, data.billOfMaterials || []),
          saveData(STORAGE_KEYS.QUALITY_CHECKS, data.qualityChecks || []),
          saveData(STORAGE_KEYS.WORKFLOW_AUTOMATIONS, data.workflowAutomations || []),
          saveData(STORAGE_KEYS.AUDIT_LOGS, data.auditLogs || []),
          saveData(STORAGE_KEYS.SHIPMENT_TRACKING, data.shipmentTracking || []),
          saveData(STORAGE_KEYS.RETURN_ORDERS, data.returnOrders || []),
        ]);

        return { success: true, message: 'Data restored successfully' };
      } catch (error) {
        console.error('Error importing data:', error);
        return { success: false, message: 'Failed to restore data' };
      }
    },
  };
});

export function useERPStats() {
  const {
    employees,
    customers,
    invoices,
    expenses,
    products,
    salesOrders,
    leads,
    leaveRequests,
    tasks,
  } = useERP();

  return useMemo(() => {
    const totalRevenue = invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);

    const totalExpenses = expenses
      .filter((e) => e.status === 'paid')
      .reduce((sum, exp) => sum + exp.amount, 0);

    const pendingInvoices = invoices.filter(
      (i) => i.status === 'sent' || i.status === 'overdue'
    ).length;

    const lowStockProducts = products.filter((p) => p.currentStock <= p.minStock).length;

    const activeLeads = leads.filter(
      (l) => !['won', 'lost'].includes(l.stage)
    ).length;

    const pendingLeaveRequests = leaveRequests.filter((r) => r.status === 'pending').length;

    const pendingTasks = tasks.filter((t) => t.status !== 'done').length;

    return {
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      totalCustomers: customers.length,
      totalEmployees: employees.length,
      totalProducts: products.length,
      pendingInvoices,
      lowStockProducts,
      activeLeads,
      totalSalesOrders: salesOrders.length,
      pendingLeaveRequests,
      pendingTasks,
    };
  }, [
    employees,
    customers,
    invoices,
    expenses,
    products,
    salesOrders,
    leads,
    leaveRequests,
    tasks,
  ]);
}
