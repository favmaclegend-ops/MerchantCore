export interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  category: string
  image?: string
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
}

export interface CartItem extends Product {
  quantity: number
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company?: string
  tier: 'platinum' | 'gold' | 'silver' | 'bronze'
  totalSpent: number
  creditLimit: number
  lastPurchase: string
  status: 'active' | 'pending' | 'overdue' | 'critical'
  avatar?: string
}

export interface Transaction {
  id: string
  type: 'sale' | 'payment' | 'restock' | 'credit'
  customer?: string
  amount: number
  status: 'completed' | 'pending' | 'cancelled'
  date: string
  items?: string
}

export interface CreditEntry {
  id: string
  customerId: string
  customerName: string
  customerCode: string
  balance: number
  lastPayment: string
  lastPaymentAmount?: number
  status: 'active' | 'overdue' | 'critical'
  overdueDays?: number
}

export interface Alert {
  id: string
  type: 'low-stock' | 'overdue' | 'system' | 'info'
  title: string
  description: string
  action?: string
}

export interface PaymentLog {
  id: string
  customerName: string
  amount: number
  date: string
  type: string
  method: string
}

export const products: Product[] = [
  { id: '1', name: 'Fresh Whole Milk 1L', sku: 'DAIRY-001', price: 4.50, stock: 145, category: 'Beverages', status: 'in-stock' },
  { id: '2', name: 'Organic Eggs (Doz)', sku: 'DAIRY-002', price: 6.25, stock: 12, category: 'Dairy', status: 'low-stock' },
  { id: '3', name: 'Premium White Bread', sku: 'BAKERY-001', price: 2.99, stock: 89, category: 'Grains', status: 'in-stock' },
  { id: '4', name: 'Arabica Beans 500g', sku: 'BEV-001', price: 12.50, stock: 67, category: 'Beverages', status: 'in-stock' },
  { id: '5', name: 'Basmati Rice 5kg', sku: 'GRAIN-001', price: 18.00, stock: 34, category: 'Grains', status: 'in-stock' },
  { id: '6', name: 'Liquid Detergent 2L', sku: 'CLN-001', price: 9.99, stock: 0, category: 'Toiletries', status: 'out-of-stock' },
  { id: '7', name: 'Cold Brew Coffee', sku: 'BEV-002', price: 4.50, stock: 56, category: 'Beverages', status: 'in-stock' },
  { id: '8', name: 'Smart Watch S4', sku: 'ELC-001', price: 199.00, stock: 2, category: 'Electronics', status: 'low-stock' },
  { id: '9', name: 'Steel Bottle', sku: 'ACC-001', price: 25.00, stock: 78, category: 'Accessories', status: 'in-stock' },
  { id: '10', name: 'Urban Runner Pro', sku: 'FSH-001', price: 89.99, stock: 0, category: 'Fashion', status: 'out-of-stock' },
  { id: '11', name: 'Nike Air Max Pro', sku: 'NK-2024-MX-001', price: 129.99, stock: 42, category: 'Footwear', status: 'in-stock' },
  { id: '12', name: 'Modernist Watch V2', sku: 'MW-ACC-V2-SV', price: 245.00, stock: 8, category: 'Accessories', status: 'low-stock' },
  { id: '13', name: 'Pro Audio Headphones', sku: 'PH-ELC-098-BK', price: 189.50, stock: 0, category: 'Electronics', status: 'out-of-stock' },
  { id: '14', name: 'Elite Gaming Controller', sku: 'GC-ENT-E12-GR', price: 69.99, stock: 112, category: 'Electronics', status: 'in-stock' },
]

export const customers: Customer[] = [
  { id: '1', name: 'Jonathan Sterling', email: 'sterling.j@corp.com', phone: '+1 (555) 012-9984', company: 'Sterling Exports Ltd.', tier: 'platinum', totalSpent: 24850, creditLimit: 50000, lastPurchase: 'Oct 12', status: 'active', avatar: 'JS' },
  { id: '2', name: 'Alisha Miller', email: 'alisha.m@design.io', phone: '+1 (555) 013-4421', tier: 'gold', totalSpent: 1150, creditLimit: 5000, lastPurchase: 'Oct 18', status: 'overdue', avatar: 'AM' },
  { id: '3', name: 'Sarah Chen', email: 'schen@venture.com', phone: '+1 (555) 014-7732', tier: 'silver', totalSpent: 840, creditLimit: 3000, lastPurchase: 'Oct 20', status: 'pending', avatar: 'SC' },
  { id: '4', name: 'Robert Wagner', email: 'rob.w@logistics.net', phone: '+1 (555) 015-2290', tier: 'gold', totalSpent: 12400, creditLimit: 25000, lastPurchase: 'Oct 22', status: 'active', avatar: 'RW' },
  { id: '5', name: 'Johnathan Doe', email: 'jdoe@example.com', phone: '+1 (555) 016-1100', tier: 'bronze', totalSpent: 2450, creditLimit: 10000, lastPurchase: 'Oct 12', status: 'overdue', avatar: 'JD' },
  { id: '6', name: 'Amara Smith', email: 'amara.smith@email.com', phone: '+1 (555) 017-3344', tier: 'silver', totalSpent: 12800, creditLimit: 20000, lastPurchase: 'Sep 28', status: 'critical', avatar: 'AS' },
  { id: '7', name: 'Marcus Lee', email: 'marcus.lee@mail.com', phone: '+1 (555) 018-5566', tier: 'gold', totalSpent: 420, creditLimit: 8000, lastPurchase: 'Oct 24', status: 'active', avatar: 'ML' },
]

export const creditEntries: CreditEntry[] = [
  { id: '1', customerId: '5', customerName: 'Johnathan Doe', customerCode: '#MC-9021', balance: 2450, lastPayment: 'Oct 12, 2023', lastPaymentAmount: 500, status: 'overdue', overdueDays: 3 },
  { id: '2', customerId: '6', customerName: 'Amara Smith', customerCode: '#MC-8842', balance: 12800, lastPayment: 'Sep 28, 2023', lastPaymentAmount: 1200, status: 'critical', overdueDays: 15 },
  { id: '3', customerId: '7', customerName: 'Marcus Lee', customerCode: '#MC-7731', balance: 420, lastPayment: 'Oct 24, 2023', status: 'active' },
]

export const transactions: Transaction[] = [
  { id: '8492-B', type: 'sale', customer: 'Order', amount: 245, status: 'completed', date: '2 mins ago', items: 'Retail Sale' },
  { id: '3301-A', type: 'payment', customer: 'Sarah Jenkins', amount: 1100, status: 'completed', date: '15 mins ago', items: 'Credit Payment' },
  { id: '7712-C', type: 'restock', customer: 'Bulk Re-stock', amount: 4500, status: 'pending', date: '1 hour ago', items: 'Inventory Out' },
  { id: '8842', type: 'sale', customer: 'POS Sale', amount: 128.50, status: 'completed', date: '2:45 PM', items: 'Cash' },
  { id: '8843', type: 'payment', customer: 'Alex J.', amount: 450, status: 'completed', date: '1:15 PM', items: 'Credit Payment' },
]

export const paymentLogs: PaymentLog[] = [
  { id: '1', customerName: 'Marcus Lee', amount: 420, date: 'Today at 10:45 AM', type: 'Bank Transfer', method: 'payment' },
  { id: '2', customerName: 'Johnathan Doe', amount: 2450, date: 'Yesterday at 4:20 PM', type: 'Invoice #INV-9901', method: 'credit' },
  { id: '3', customerName: 'Amara Smith', amount: 0, date: '2 days ago', type: 'Automated Reminder', method: 'notice' },
]

export const alerts: Alert[] = [
  { id: '1', type: 'low-stock', title: 'Low Stock Alert', description: 'Premium Engine Oil is below 10 units. Restock suggested immediately.' },
  { id: '2', type: 'overdue', title: 'Overdue Payment', description: 'Global Logistics Corp has an outstanding balance of $2,400 past 30 days.' },
  { id: '3', type: 'system', title: 'System Update', description: 'POS terminal 4 update scheduled for tonight at 11:00 PM.' },
]

export const recentContacts = [
  { id: '1', name: 'Jonathan Sterling', email: 'sterling.j@corp.com', amount: 4280, status: 'paid', avatar: 'JS' },
  { id: '2', name: 'Alisha Miller', email: 'alisha.m@design.io', amount: 1150, status: 'overdue', avatar: 'AM' },
  { id: '3', name: 'Sarah Chen', email: 'schen@venture.com', amount: 840, status: 'pending', avatar: 'SC' },
  { id: '4', name: 'Robert Wagner', email: 'rob.w@logistics.net', amount: 12400, status: 'active', avatar: 'RW' },
]

export const purchaseHistory = [
  { id: '1', name: 'Wholesale Bulk Order - Electronics', date: 'Oct 12, 2023 • 14:30 PM', amount: 3200, status: 'settled' },
  { id: '2', name: 'Retail Supplies - Office Q4', date: 'Sep 28, 2023 • 09:15 AM', amount: 1080, status: 'settled' },
  { id: '3', name: 'Custom Fabrication Project', date: 'Sep 05, 2023 • 11:45 AM', amount: 15000, status: 'cancelled' },
]

export const lowStockAlerts = [
  { id: '1', name: 'Velocity Runner Red', sku: 'VR-202-R', left: 2 },
  { id: '2', name: 'Core Smartwatch v3', sku: 'CS-W3-GR', left: 5 },
]

export const recentActivity = [
  { id: '1', type: 'pos', title: 'POS Sale #8842', detail: '2:45 PM • Cash', amount: 128.50 },
  { id: '2', type: 'credit', title: 'Credit Payment', detail: '1:15 PM • Alex J.', amount: 450 },
  { id: '3', type: 'stock', title: 'Stock Received', detail: '12:30 PM • 12 Units', amount: 0 },
]

export const inventoryStats = {
  totalItems: 1284,
  lowStockAlerts: 23,
  inventoryValue: 42800,
  outOfStock: 5,
}

export const stockTrends = [
  { month: 'JAN', value: 35 },
  { month: 'FEB', value: 45 },
  { month: 'MAR', value: 30 },
  { month: 'APR', value: 55 },
  { month: 'MAY', value: 60 },
  { month: 'JUN', value: 58 },
  { month: 'JUL', value: 52 },
  { month: 'AUG', value: 48 },
  { month: 'SEP', value: 62 },
  { month: 'OCT', value: 72 },
]
