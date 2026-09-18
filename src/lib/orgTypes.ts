// Shared types for ORGANISATION workspaces.
//
// The backend owns all organisation data; these types mirror the shapes the backend
// returns (via `api.org.*`) and the shapes the rest of the app expects. The pure
// helpers `buildBalanceSheet` and `currentPeriod` live here too.

// ---- Organisation & members -----------------------------------------------

export type OrgRole =
  | 'super-admin'
  | 'admin'
  | 'hrm-manager'
  | 'finance-manager'
  | 'logistics-manager'
  | 'staff'

export interface OrgMember {
  id: string
  name: string
  email: string
  username: string
  password: string
  userId?: string
  phone: string
  role: OrgRole
  jobTitle: string
  isActive: boolean // false  -> blocked from logging in
  dataBlocked: boolean // true -> blocked from dashboard data preview
  disabled: boolean // true -> fully disabled: no access to anything on the platform
}

export interface Organisation {
  id: string
  name: string
  businessEmail: string
  members: OrgMember[]
}

export interface OrgRegisterInput {
  orgName: string
  businessEmail: string
  superAdminName: string
  superAdminUsername: string
  superAdminEmail: string
  password: string
  phone?: string
}

export interface OrgSession {
  orgId: string
  orgName: string
  member: OrgMember
  token: string
}

// ---- Commerce (products / customers / credit / POS) -----------------------

export type OrgProductStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

export interface OrgProduct {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  category: string
  status: OrgProductStatus
  image?: string
  rating?: number
}

export interface OrgProductInput {
  name: string
  sku: string
  price: number
  stock: number
  category: string
  image?: string
  rating?: number
}

export interface OrgCustomer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  total_spent: number
  credit_limit: number
  tier: 'platinum' | 'gold' | 'silver' | 'bronze'
  last_purchase: string
  created_at: string
}

export interface OrgCustomerInput {
  name: string
  email: string
  phone?: string
  company?: string
  credit_limit: number
}

export type OrgCreditStatus = 'active' | 'overdue' | 'critical'

export interface OrgCreditEntry {
  id: string
  customer_id: string
  customer_name: string
  customer_code: string
  balance: number
  last_payment: string
  last_payment_amount: number
  status: OrgCreditStatus
  overdue_days: number
}

export interface OrgCreditInput {
  customer_id: string
  customer_name: string
  customer_code?: string
  balance: number
}

export interface OrgPosTransaction {
  id: string
  type: string
  customer_name?: string
  amount: number
  status: string
  items?: string
  created_at: string
}

export interface CheckoutInput {
  items: { id: string; name: string; price: number; quantity: number }[]
  total: number
  payment_method: string
}

export interface OrgCommerceState {
  products: OrgProduct[]
  customers: OrgCustomer[]
  creditEntries: OrgCreditEntry[]
  transactions: OrgPosTransaction[]
}

// ---- HRM -------------------------------------------------------------------

export type OrgEmploymentStatus = 'active' | 'probation' | 'on-leave' | 'terminated' | 'retired'
export type OrgEmploymentType = 'full-time' | 'part-time' | 'contract'
export type OrgPayrollStatus = 'pending' | 'paid'
export type OrgReviewRating = 'exceeds' | 'meets' | 'below'
export type OrgReviewStatus = 'pending' | 'completed'
export type OrgBenefitType = 'health' | 'retirement' | 'transport' | 'insurance' | 'training' | 'other'

export interface OrgEmployee {
  id: string
  name: string
  email: string
  phone: string
  userId?: string
  department: string
  jobTitle: string
  employmentType: OrgEmploymentType
  hireDate: string
  salary: number
  status: OrgEmploymentStatus
  benefits: string[]
}

export interface OrgEmployeeInput {
  name: string
  email: string
  phone?: string
  userId?: string
  department: string
  jobTitle: string
  employmentType: OrgEmploymentType
  hireDate: string
  salary: number
  status?: OrgEmploymentStatus
  benefits?: string[]
}

export interface OrgBenefit {
  id: string
  name: string
  type: OrgBenefitType
  cost: number
  description: string
  enrollment: number
}

export interface OrgBenefitInput {
  name: string
  type: OrgBenefitType
  cost: number
  description?: string
}

export interface OrgPayrollRun {
  id: string
  period: string
  employee_id: string
  employee_name: string
  gross: number
  tax: number
  net: number
  status: OrgPayrollStatus
  processed_at: string
}

export interface OrgTimeEntry {
  id: string
  employee_id: string
  employee_name: string
  date: string
  hours: number
  overtime_hours: number
}

export interface OrgTimeInput {
  employee_id: string
  date: string
  hours: number
  overtime_hours?: number
}

export interface OrgPerformanceReview {
  id: string
  employee_id: string
  employee_name: string
  period: string
  score: number
  rating: OrgReviewRating
  notes: string
  status: OrgReviewStatus
  reviewed_at: string
}

export interface OrgReviewInput {
  employee_id: string
  period: string
  score: number
  notes?: string
}

export interface OrgHrmState {
  employees: OrgEmployee[]
  benefits: OrgBenefit[]
  payrollRuns: OrgPayrollRun[]
  timeEntries: OrgTimeEntry[]
  reviews: OrgPerformanceReview[]
  attendance: OrgAttendanceRecord[]
}

export interface OrgAttendanceRecord {
  id: string
  employee_id: string
  employee_name: string
  date: string
  check_in: string
  check_out: string
  check_in_method: 'qr' | 'manual'
  check_out_method: 'qr' | 'manual'
  status: 'present' | 'absent'
}

export interface QrScanRequest {
  token: string
  action: 'in' | 'out'
  employeeId: string
  employeeName: string
  expiresAt: string
}

export interface OrgAttendanceSummary {
  employee_id: string
  employee_name: string
  scheduled_days: number
  present_days: number
  absent_days: number
  attendance_rate: number
  total_hours: number
  overtime_hours: number
  latest_review_score: number | null
  latest_review_rating: OrgReviewRating | null
}

// ---- Supply chain & logistics ---------------------------------------------

export type OrgSupplierStatus = 'active' | 'inactive'

export interface OrgSupplier {
  id: string
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  categories: string[] // product categories this supplier provides
  payment_terms: string
  status: OrgSupplierStatus
  created_at: string
}

export interface OrgSupplierInput {
  name: string
  contact_person?: string
  email: string
  phone?: string
  address?: string
  categories: string[]
  payment_terms?: string
  status?: OrgSupplierStatus
}

export type OrgPoStatus = 'draft' | 'pending' | 'approved' | 'received' | 'cancelled'

export interface OrgPurchaseOrderItem {
  product_id: string
  product_name: string
  qty: number
  unit_price: number
}

export interface OrgPurchaseOrder {
  id: string
  po_number: string
  supplier_id: string
  supplier_name: string
  items: OrgPurchaseOrderItem[]
  total: number
  status: OrgPoStatus
  ordered_at: string
  received_at: string
}

export interface OrgPurchaseOrderInput {
  supplier_id: string
  items: { product_id: string; qty: number }[]
}

export type OrgShipmentStatus = 'in-transit' | 'delivered' | 'delayed' | 'cancelled'

export interface OrgShipment {
  id: string
  tracking_number: string
  po_id: string
  po_number: string
  supplier_name: string
  market_order_id: string
  customer_name: string
  carrier: string
  status: OrgShipmentStatus
  eta: string
  created_at: string
  delivered_at: string
}

export interface OrgShipmentInput {
  po_id?: string
  market_order_id?: string
  carrier: string
  eta: string
}

export interface OrgSupplyState {
  suppliers: OrgSupplier[]
  purchaseOrders: OrgPurchaseOrder[]
  shipments: OrgShipment[]
}

// ---- Notifications & alerts -----------------------------------------------

export type OrgNotificationKind =
  | 'sale'
  | 'credit'
  | 'invoice'
  | 'payroll'
  | 'low_stock'
  | 'check_in'
  | 'inventory'
  | 'system'

export type OrgNotificationSeverity = 'success' | 'info' | 'warning' | 'danger'

export interface OrgNotification {
  id: string
  kind: OrgNotificationKind
  severity: OrgNotificationSeverity
  is_alert: boolean
  title: string
  message: string
  amount: number
  ref: string
  actor_name: string
  actor_role: string
  read_by: string[] // member ids that have read it (per-member read state)
  created_at: string
}

export interface OrgNotificationSettings {
  allow_admin_delete: boolean
}

export interface OrgNotificationsState {
  notifications: OrgNotification[]
  settings: OrgNotificationSettings
}

export interface OrgNotificationInput {
  kind: OrgNotificationKind
  title: string
  message: string
  amount?: number
  ref?: string
  is_alert?: boolean
  severity?: OrgNotificationSeverity
}

// ---- Finance ---------------------------------------------------------------

export type LedgerCategory = 'income' | 'expense' | 'asset' | 'liability'

export interface LedgerEntry {
  id: string
  date: string // ISO yyyy-mm-dd
  account: string
  category: LedgerCategory
  description: string
  amount: number // always positive; sign is derived from the category
  reference: string
  status: 'posted' | 'pending'
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void'

export interface InvoiceLineItem {
  description: string
  qty: number
  unitPrice: number
}

export interface Invoice {
  id: string
  number: string
  customer: string
  customerId?: string
  customerEmail?: string
  issuedAt: string
  dueAt: string
  amount: number
  status: InvoiceStatus
  items: InvoiceLineItem[]
}

export interface TaxItem {
  id: string
  name: string
  rate: number // percent
  basis: number // taxable amount
  period: string
  dueAt: string
  paid: number
  status: 'paid' | 'due' | 'upcoming'
}

export interface FinanceState {
  ledger: LedgerEntry[]
  invoices: Invoice[]
  taxes: TaxItem[]
  // Server-computed aggregates (preferred over local recomputation).
  income?: number
  expenses?: number
  net?: number
  paid?: number
  outstanding?: number
  totalDue?: number
  // Actual POS transaction revenue (from completed sales).
  posRevenue?: number
}

export interface BalanceSheetLine {
  label: string
  value: number
}

export interface BalanceSheet {
  assets: BalanceSheetLine[]
  liabilities: BalanceSheetLine[]
  equity: BalanceSheetLine[]
  updatedAt: string
}

export interface InvoiceInput {
  customer: string
  customerId?: string
  customerEmail?: string
  dueAt: string
  items: InvoiceLineItem[]
}

// ---- Pure helpers ----------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

export function currentPeriod(date = new Date()): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

function unpaidInvoiceAmount(invoices: Invoice[]): number {
  return invoices
    .filter(inv => inv.status === 'draft' || inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0)
}

function unpaidTaxAmount(taxes: TaxItem[]): number {
  return taxes.reduce((sum, tax) => sum + Math.max(0, Math.round(tax.basis * tax.rate) / 100 - tax.paid), 0)
}

export function buildBalanceSheet(state: FinanceState, netCashFlow?: number): BalanceSheet {
  // Cash & Bank is derived from the net cash flow (income - expenses) when
  // provided; otherwise fall back to the local computation.
  const cashBank = netCashFlow ?? (
    state.ledger.filter(e => e.category === 'income').reduce((s, e) => s + e.amount, 0)
    - state.ledger.filter(e => e.category === 'expense').reduce((s, e) => s + e.amount, 0)
  )
  const assets = [
    { label: 'Cash & Bank', value: Math.round(cashBank * 100) / 100 },
    { label: 'Accounts Receivable', value: Math.round(unpaidInvoiceAmount(state.invoices) * 100) / 100 },
  ]
  const liabilities = [
    { label: 'Accounts Payable', value: 0 },
    { label: 'Tax Payable', value: Math.round(unpaidTaxAmount(state.taxes) * 100) / 100 },
  ]
  const totalAssets = assets.reduce((sum, line) => sum + line.value, 0)
  const totalLiabilities = liabilities.reduce((sum, line) => sum + line.value, 0)
  const retainedEarnings = Math.round((totalAssets - totalLiabilities) * 100) / 100
  const equity = [
    { label: 'Retained Earnings', value: retainedEarnings },
  ]
  return {
    assets,
    liabilities,
    equity,
    updatedAt: new Date().toISOString(),
  }
}
