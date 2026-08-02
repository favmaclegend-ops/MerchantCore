import { describe, expect, it } from 'vitest'
import {
  AVATAR_COLORS,
  TABS,
  generateCredential,
  initials,
  isStaffMember,
  isSuperAdmin,
  roleLabel,
  toFormData,
  toMember,
  type Member,
} from '@/pages/users/data'

const superAdmin: Member = {
  id: 'ADM-001', name: 'Daniel Kofi', email: 'daniel.kofi@sunrise.example', username: 'dkofi',
  password: 'x', phone: '', role: 'super-admin', jobTitle: 'Super Admin',
  isActive: true, dataBlocked: false, disabled: false,
}
const admin: Member = { ...superAdmin, id: 'ADM-002', role: 'admin', jobTitle: 'Administrator' }
const staff: Member = { ...superAdmin, id: 'STF-101', role: 'staff', jobTitle: 'Cashier' }
const staffNoTitle: Member = { ...staff, jobTitle: '' }

describe('users data helpers', () => {
  it('exports the expected tabs and avatar colors', () => {
    expect(TABS.map(t => t.id)).toEqual(['admin', 'staff'])
    expect(AVATAR_COLORS).toHaveLength(6)
  })

  it('initials uppercases up to two letters', () => {
    expect(initials('Daniel Kofi')).toBe('DK')
    expect(initials('ada')).toBe('A')
    expect(initials('')).toBe('')
  })

  it('detects roles', () => {
    expect(isSuperAdmin(superAdmin)).toBe(true)
    expect(isSuperAdmin(admin)).toBe(false)
    expect(isStaffMember(staff)).toBe(true)
    expect(isStaffMember(admin)).toBe(false)
  })

  it('labels roles and job titles', () => {
    expect(roleLabel(superAdmin)).toBe('Super Admin')
    expect(roleLabel(admin)).toBe('Admin')
    expect(roleLabel(staff)).toBe('Cashier')
    expect(roleLabel(staffNoTitle)).toBe('Staff')
  })

  it('generates credentials from the email username', () => {
    const cred = generateCredential('Daniel Kofi', 'daniel.kofi@sunrise.example')
    expect(cred.username).toBe('daniel.kofi')
    expect(cred.password).toMatch(/^MC\d{4}!$/)
  })

  it('falls back to a name slug when the email has no username', () => {
    const cred = generateCredential('John Doe', '')
    expect(cred.username).toBe('johndoe')
  })

  it('toMember shapes a staff member', () => {
    const member = toMember(
      { name: 'Ama Serwaa', email: 'ama@sunrise.example', username: '', password: '', phone: '+1 555', jobTitle: 'Cashier' },
      'staff',
    )
    expect(member).toMatchObject({
      name: 'Ama Serwaa',
      email: 'ama@sunrise.example',
      username: 'ama',
      role: 'staff',
      jobTitle: 'Cashier',
      isActive: true,
      dataBlocked: false,
      disabled: false,
    })
    expect(member.password).toMatch(/^MC\d{4}!$/)
  })

  it('toMember keeps explicit credentials and defaults job titles', () => {
    const member = toMember(
      { name: 'Ama', email: 'a@b.example', username: 'ama_custom', password: 'Fixed@1', phone: '', jobTitle: '' },
      'staff',
    )
    expect(member.username).toBe('ama_custom')
    expect(member.password).toBe('Fixed@1')
    expect(member.jobTitle).toBe('Staff')

    const adminMember = toMember(
      { name: 'B', email: 'b@b.example', username: '', password: '', phone: '', jobTitle: 'Anything' },
      'admin',
    )
    expect(adminMember.jobTitle).toBe('Administrator')
  })

  it('toFormData round-trips a member and yields an empty form for none', () => {
    expect(toFormData(staff)).toMatchObject({
      name: 'Daniel Kofi',
      email: 'daniel.kofi@sunrise.example',
      username: 'dkofi',
      jobTitle: 'Cashier',
    })
    expect(toFormData(null)).toEqual({ name: '', email: '', username: '', password: '', phone: '', jobTitle: '' })
  })
})
