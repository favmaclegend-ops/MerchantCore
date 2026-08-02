import { describe, expect, it } from 'vitest'
import {
  canAccess,
  canEditInventory,
  canManageFinance,
  canManageHRM,
  canManageSupply,
  canManageUsers,
  isOrgMember,
} from '@/lib/orgAccess'
import type { OrgMember } from '@/data/organisations'

const base: OrgMember = {
  id: 'ADM-001', name: 'Daniel Kofi', email: 'daniel.kofi@sunrise.example', username: 'dkofi',
  password: 'x', phone: '', role: 'super-admin', jobTitle: 'Super Admin',
  isActive: true, dataBlocked: false, disabled: false,
}

const member = (role: OrgMember['role']): OrgMember => ({ ...base, role })

describe('orgAccess (module-level permissions)', () => {
  it('treats null org users as non-members without any access', () => {
    expect(isOrgMember(null)).toBe(false)
    expect(canManageUsers(null)).toBe(false)
    expect(canManageFinance(null)).toBe(false)
    expect(canManageHRM(null)).toBe(false)
    expect(canManageSupply(null)).toBe(false)
    expect(canEditInventory(null)).toBe(false)
    expect(canAccess(null, 'finance')).toBe(false)
    expect(canAccess(null, 'supply')).toBe(false)
  })

  it('super-admin and admin access both Finance and HRM plus Users', () => {
    for (const role of ['super-admin', 'admin'] as const) {
      const m = member(role)
      expect(canManageFinance(m)).toBe(true)
      expect(canManageHRM(m)).toBe(true)
      expect(canManageUsers(m)).toBe(true)
    }
  })

  it('hrm-manager accesses HRM only (not Finance, not Users)', () => {
    const m = member('hrm-manager')
    expect(isOrgMember(m)).toBe(true)
    expect(canManageHRM(m)).toBe(true)
    expect(canManageFinance(m)).toBe(false)
    expect(canManageUsers(m)).toBe(false)
    expect(canManageSupply(m)).toBe(false)
    expect(canAccess(m, 'hrm')).toBe(true)
    expect(canAccess(m, 'finance')).toBe(false)
    expect(canAccess(m, 'users')).toBe(false)
  })

  it('finance-manager accesses Finance only (not HRM, not Users)', () => {
    const m = member('finance-manager')
    expect(canManageFinance(m)).toBe(true)
    expect(canManageHRM(m)).toBe(false)
    expect(canManageUsers(m)).toBe(false)
    expect(canManageSupply(m)).toBe(false)
    expect(canAccess(m, 'finance')).toBe(true)
    expect(canAccess(m, 'hrm')).toBe(false)
    expect(canAccess(m, 'users')).toBe(false)
  })

  it('staff access neither manager module', () => {
    const m = member('staff')
    expect(canManageFinance(m)).toBe(false)
    expect(canManageHRM(m)).toBe(false)
    expect(canManageUsers(m)).toBe(false)
    expect(canManageSupply(m)).toBe(false)
    expect(canEditInventory(m)).toBe(false)
  })

  it('super-admin and logistics-manager manage Supply Chain and inventory edits', () => {
    for (const role of ['super-admin', 'logistics-manager'] as const) {
      const m = member(role)
      expect(canManageSupply(m)).toBe(true)
      expect(canEditInventory(m)).toBe(true)
      expect(canAccess(m, 'supply')).toBe(true)
    }
  })

  it('logistics-manager is limited to Supply Chain (not Finance, not HRM, not Users)', () => {
    const m = member('logistics-manager')
    expect(canManageSupply(m)).toBe(true)
    expect(canManageFinance(m)).toBe(false)
    expect(canManageHRM(m)).toBe(false)
    expect(canManageUsers(m)).toBe(false)
    expect(canAccess(m, 'supply')).toBe(true)
    expect(canAccess(m, 'finance')).toBe(false)
    expect(canAccess(m, 'hrm')).toBe(false)
    expect(canAccess(m, 'users')).toBe(false)
  })

  it('admin cannot manage the Supply Chain module', () => {
    const m = member('admin')
    expect(canManageSupply(m)).toBe(false)
    expect(canEditInventory(m)).toBe(false)
    expect(canAccess(m, 'supply')).toBe(false)
  })
})
