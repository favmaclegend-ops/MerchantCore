import { describe, expect, it } from 'vitest'
import { generateOrgDashboard } from '@/data/orgDashboard'

describe('generateOrgDashboard (mock org dashboard)', () => {
  it('returns revenue consistent with the finance mock ledger (70,650)', () => {
    const data = generateOrgDashboard()
    expect(data.stats.totalRevenue).toBe(70650)
    expect(data.revenueData.reduce((sum, v) => sum + v, 0)).toBe(70650)
    expect(data.stats.monthlyRevenue).toBe(12700)
  })

  it('provides 6 revenue months aligned with the data points', () => {
    const data = generateOrgDashboard()
    expect(data.revenueMonths).toHaveLength(6)
    expect(data.revenueData).toHaveLength(6)
    for (const month of data.revenueMonths) {
      expect(month.length).toBeGreaterThan(0)
    }
  })

  it('matches finance assets: inventory 58,200 and receivables 10,025', () => {
    const data = generateOrgDashboard()
    expect(data.stats.inventoryValue).toBe(58200)
    expect(data.stats.creditOutstanding).toBe(10025)
  })

  it('provides transactions and alerts', () => {
    const data = generateOrgDashboard()
    expect(data.txns.length).toBeGreaterThan(0)
    for (const txn of data.txns) {
      expect(txn.id).toBeTruthy()
      expect(txn.type).toBeTruthy()
      expect(typeof txn.amount).toBe('number')
    }
    expect(data.alertList.some(a => a.type === 'low-stock')).toBe(true)
    expect(data.alertList.some(a => a.type === 'overdue')).toBe(true)
  })
})
