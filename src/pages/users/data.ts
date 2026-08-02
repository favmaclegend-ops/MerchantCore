export type TabId = 'admin' | 'staff'

export type Member = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  avatar?: string
  isActive?: boolean
}

export type MemberFormData = {
  name: string
  email: string
  phone: string
  role: string
}

export const TABS: { id: TabId; label: string }[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'staff', label: 'Staff' },
]

export const AVATAR_COLORS = ['#0f172a', '#0d9488', '#2563eb', '#7c3aed', '#db2777', '#ea580c']

export const ADMINS: Member[] = [
  { id: 'ADM-001', name: 'Amara Okafor', email: 'amara.okafor@merchant.io', phone: '+233 20 123 4567', role: 'Super Admin', isActive: true },
  { id: 'ADM-002', name: 'Kwame Mensah', email: 'kwame.mensah@merchant.io', phone: '+233 24 555 8890', role: 'Admin', isActive: true },
]

export const STAFF: Member[] = [
  { id: 'STF-101', name: 'Efua Asante', email: 'efua.asante@merchant.io', phone: '+233 26 443 2211', role: 'Cashier', isActive: true },
  { id: 'STF-102', name: 'Kojo Boateng', email: 'kojo.boateng@merchant.io', phone: '+233 20 778 9900', role: 'Sales', isActive: true },
  { id: 'STF-103', name: 'Ama Serwaa', email: 'ama.serwaa@merchant.io', phone: '+233 55 201 3344', role: 'Stock Clerk', isActive: true },
]

export const initials = (name: string) =>
  name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()

export const isSuperAdmin = (member: Member) => member.role === 'Super Admin'

export const nextId = (list: Member[], prefix: string) => {
  const nums = list.map(m => parseInt(m.id.replace(`${prefix}-`, ''), 10)).filter(n => !isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}-${String(next).padStart(3, '0')}`
}

export const toFormData = (member?: Member | null): MemberFormData => ({
  name: member?.name || '',
  email: member?.email || '',
  phone: member?.phone || '',
  role: member?.role || '',
})
