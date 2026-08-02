// Mock dashboard data for ORGANISATION logins.
//
// Organisation accounts must NEVER talk to the real server (their emails are not registered
// there), so every organisation dashboard value is generated locally. The figures are kept
// consistent with the Finance mock (`src/data/finance.ts`): total revenue equals the ledger's
// income total, receivables equal unpaid invoices, and so on.

import type { DashboardAlert, DashboardCache, DashboardStats, Tx } from '@/lib/dashboardCache'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function monthLabels(count: number): string[] {
  const labels: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(d.toLocaleString('en', { month: 'short' }))
  }
  return labels
}

export function generateOrgDashboard(): Omit<DashboardCache, 'timestamp'> {
  // Sums to 70,650 — matches the Finance mock ledger's total income.
  const revenueData = [9800, 10800, 11200, 12450, 13700, 12700]
  const revenue = revenueData.reduce((sum, v) => sum + v, 0)

  const stats: DashboardStats = {
    totalRevenue: revenue,
    monthlyRevenue: revenueData[revenueData.length - 1],
    totalOrders: 1276,
    activeCustomers: 312,
    lowStockAlerts: 3,
    inventoryValue: 58200,
    creditOutstanding: 10025,
    avgTicket: 55.36,
    totalProducts: 48,
  }

  const txns: Tx[] = [
    { id: 'POS-0914', type: 'sale', customer_name: 'Walk-in', amount: 12480, status: 'completed', items: '52 items', date: daysAgo(2) },
    { id: 'POS-0913', type: 'sale', customer_name: 'Adom Fresh Foods', amount: 4850, status: 'completed', items: '3 items', date: daysAgo(2) },
    { id: 'POS-0910', type: 'sale', customer_name: 'Walk-in', amount: 10920, status: 'completed', items: '47 items', date: daysAgo(6) },
    { id: 'SVC-0112', type: 'payment', customer_name: 'City Restaurants Ltd', amount: 2400, status: 'completed', items: 'Delivery services', date: daysAgo(15) },
    { id: 'PAY-0042', type: 'payment', customer_name: 'Total Trust Wholesale', amount: 6400, status: 'completed', items: 'Invoice INV-2026-0103', date: daysAgo(16) },
    { id: 'POS-0903', type: 'sale', customer_name: 'Efua Bakery', amount: 11350, status: 'completed', items: '38 items', date: daysAgo(12) },
    { id: 'POS-0896', type: 'sale', customer_name: 'Walk-in', amount: 9860, status: 'completed', items: '41 items', date: daysAgo(20) },
    { id: 'POS-0889', type: 'sale', customer_name: 'Walk-in', amount: 13100, status: 'completed', items: '55 items', date: daysAgo(28) },
  ]

  const alertList: DashboardAlert[] = [
    { id: 'org-low-stock', type: 'low-stock', title: 'Low Stock Alert', description: '3 items are running low on stock. Restock suggested.' },
    { id: 'org-overdue', type: 'overdue', title: 'Overdue Invoice', description: "INV-2026-0102 from Naana's Kitchen is overdue." },
  ]

  return { stats, revenueMonths: monthLabels(6), revenueData, txns, alertList }
}
