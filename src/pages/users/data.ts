import type { OrgMember } from '@/data/organisations'

export type TabId = 'admin' | 'staff'

export type Member = OrgMember

export type MemberFormData = {
  name: string
  email: string
  username: string
  password: string
  phone: string
  jobTitle: string
}

export const TABS: { id: TabId; label: string }[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'staff', label: 'Staff' },
]

export const AVATAR_COLORS = ['#0f172a', '#0d9488', '#2563eb', '#7c3aed', '#db2777', '#ea580c']

export const initials = (name: string) =>
  name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()

export const isSuperAdmin = (member: Member) => member.role === 'super-admin'
export const isStaffMember = (member: Member) => member.role === 'staff'

export const roleLabel = (member: Member) =>
  member.role === 'super-admin' ? 'Super Admin' : member.role === 'admin' ? 'Admin' : member.jobTitle || 'Staff'

export const generateCredential = (name: string, email: string) => {
  const username = email.split('@')[0] || name.toLowerCase().replace(/[^a-z0-9]+/g, '').substring(0, 10)
  const password = `MC${Math.floor(1000 + Math.random() * 9000)}!`
  return { username, password }
}

export const toMember = (form: MemberFormData, role: 'admin' | 'staff'): Omit<Member, 'id'> => {
  const cred = generateCredential(form.name, form.email)
  return {
    name: form.name,
    email: form.email,
    username: form.username || cred.username,
    password: form.password || cred.password,
    phone: form.phone,
    role,
    jobTitle: role === 'staff' ? form.jobTitle || 'Staff' : 'Administrator',
    isActive: true,
    dataBlocked: false,
  }
}

export const toFormData = (member?: Member | null): MemberFormData => ({
  name: member?.name || '',
  email: member?.email || '',
  username: member?.username || '',
  password: member?.password || '',
  phone: member?.phone || '',
  jobTitle: member?.role === 'staff' ? member.jobTitle || '' : '',
})
