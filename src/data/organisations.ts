// Organisation (business workspace) mock data layer.
//
// The real backend does NOT implement the organisation feature yet. This module
// simulates the future API using seeded mock data persisted in localStorage so
// the whole admin/staff flow can be developed and demoed today.
//
// When the backend ships the endpoints (see ORGANIZATION.md), `src/lib/api.ts`
// should swap these calls for real HTTP requests. The shapes returned here are
// the contract the rest of the app expects.

export type OrgRole = 'super-admin' | 'admin' | 'staff'

export interface OrgMember {
  id: string
  name: string
  email: string
  username: string
  password: string
  phone: string
  role: OrgRole
  jobTitle: string
  isActive: boolean // false  -> blocked from logging in
  dataBlocked: boolean // true -> blocked from dashboard data preview
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
}

const ORG_DATA_KEY = 'org_data'
const ORG_SESSION_KEY = 'org_session'
const ORG_VERSION_KEY = 'org_data_version'

// Bump SEED_VERSION whenever SEED_ORGS changes so stored demo data is reset to the
// fresh seed (prevents stale/conflicting demo credentials lingering in localStorage).
const SEED_VERSION = 2

// Seeded demo organisation. Login with these while the backend is missing:
//   Organisation name : Sunrise Mart
//   Super Admin       : daniel.kofi@sunrise.example / DemoPass@123
//   Admin             : sarah.mensah@sunrise.example / DemoPass@123
//   Staff (Cashier)   : grace.addo@sunrise.example / StaffPass@123
//   Staff (Sales)     : michael.owusu@sunrise.example / StaffPass@123
//   Staff (Stock)     : rita.boateng@sunrise.example / StaffPass@123 (data-blocked demo)
//
// Emails use the reserved `.example` domain (RFC 2606) so they can never collide
// with real server users.
const SEED_ORGS: Organisation[] = [
  {
    id: 'ORG-001',
    name: 'Sunrise Mart',
    businessEmail: 'business@sunrise.example',
    members: [
      { id: 'ADM-001', name: 'Daniel Kofi', email: 'daniel.kofi@sunrise.example', username: 'dkofi', password: 'DemoPass@123', phone: '+1 555 010 1001', role: 'super-admin', jobTitle: 'Super Admin', isActive: true, dataBlocked: false },
      { id: 'ADM-002', name: 'Sarah Mensah', email: 'sarah.mensah@sunrise.example', username: 'smensah', password: 'DemoPass@123', phone: '+1 555 010 1002', role: 'admin', jobTitle: 'Administrator', isActive: true, dataBlocked: false },
      { id: 'STF-101', name: 'Grace Addo', email: 'grace.addo@sunrise.example', username: 'grace', password: 'StaffPass@123', phone: '+1 555 010 1003', role: 'staff', jobTitle: 'Cashier', isActive: true, dataBlocked: false },
      { id: 'STF-102', name: 'Michael Owusu', email: 'michael.owusu@sunrise.example', username: 'michael', password: 'StaffPass@123', phone: '+1 555 010 1004', role: 'staff', jobTitle: 'Sales', isActive: true, dataBlocked: false },
      { id: 'STF-103', name: 'Rita Boateng', email: 'rita.boateng@sunrise.example', username: 'rita', password: 'StaffPass@123', phone: '+1 555 010 1005', role: 'staff', jobTitle: 'Stock Clerk', isActive: true, dataBlocked: true },
    ],
  },
]

export function loadOrganisations(): Organisation[] {
  try {
    const version = Number(localStorage.getItem(ORG_VERSION_KEY) || 0)
    if (version === SEED_VERSION) {
      const raw = localStorage.getItem(ORG_DATA_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Organisation[]
        if (Array.isArray(parsed)) return parsed
      }
    }
  } catch {
    // corrupt or outdated storage -> fall through and reseed fresh
  }

  clearOrgSession()
  const seed = SEED_ORGS.map(o => ({ ...o, members: o.members.map(m => ({ ...m })) }))
  saveOrganisations(seed)
  try {
    localStorage.setItem(ORG_VERSION_KEY, String(SEED_VERSION))
  } catch {
    return seed
  }
  return seed
}

function saveOrganisations(orgs: Organisation[]) {
  try {
    localStorage.setItem(ORG_DATA_KEY, JSON.stringify(orgs))
  } catch {
    return
  }
}

export function findOrganisation(orgName: string): Organisation | null {
  const query = orgName.trim().toLowerCase()
  return loadOrganisations().find(
    o => o.name.toLowerCase() === query || o.businessEmail.toLowerCase() === query,
  ) ?? null
}

export function registerOrganisation(input: OrgRegisterInput): Organisation {
  const orgs = loadOrganisations()
  const taken = orgs.some(
    o =>
      o.name.toLowerCase() === input.orgName.trim().toLowerCase() ||
      o.businessEmail.toLowerCase() === input.businessEmail.trim().toLowerCase(),
  )
  if (taken) throw new Error('Organisation name or business email is already registered')

  const org: Organisation = {
    id: `ORG-${String(orgs.length + 1).padStart(3, '0')}`,
    name: input.orgName.trim(),
    businessEmail: input.businessEmail.trim(),
    members: [
      {
        id: 'ADM-001',
        name: input.superAdminName.trim(),
        email: input.superAdminEmail.trim(),
        username: input.superAdminUsername.trim(),
        password: input.password,
        phone: input.phone?.trim() ?? '',
        role: 'super-admin',
        jobTitle: 'Super Admin',
        isActive: true,
        dataBlocked: false,
      },
    ],
  }
  saveOrganisations([...orgs, org])
  return org
}

export function loginOrganisation(orgName: string, email: string, password: string): { org: Organisation; member: OrgMember } {
  const org = findOrganisation(orgName)
  if (!org) throw new Error('Organisation not found. Check the organisation name.')

  const identifier = email.trim().toLowerCase()
  const member = org.members.find(
    m => m.email.toLowerCase() === identifier || m.username.toLowerCase() === identifier,
  )
  if (!member) throw new Error('Invalid credentials for this organisation.')
  if (member.password !== password) throw new Error('Invalid credentials for this organisation.')
  if (!member.isActive) throw new Error('Your account has been blocked. Contact your administrator.')

  return { org, member }
}

// ---- Session helpers -----------------------------------------------------

export function getOrgSession(): OrgSession | null {
  try {
    const raw = localStorage.getItem(ORG_SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as OrgSession
  } catch {
    return null
  }
}

export function setOrgSession(session: OrgSession) {
  try {
    localStorage.setItem(ORG_SESSION_KEY, JSON.stringify(session))
  } catch {
    return
  }
}

export function clearOrgSession() {
  try {
    localStorage.removeItem(ORG_SESSION_KEY)
  } catch {
    return
  }
}

// ---- Member CRUD against the active organisation -------------------------

export function getSessionOrganisation(): Organisation | null {
  const session = getOrgSession()
  if (!session) return null
  return loadOrganisations().find(o => o.id === session.orgId) ?? null
}

function nextMemberId(members: OrgMember[], prefix: 'ADM' | 'STF'): string {
  const nums = members
    .filter(m => m.id.startsWith(`${prefix}-`))
    .map(m => parseInt(m.id.replace(`${prefix}-`, ''), 10))
    .filter(n => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}-${String(next).padStart(3, '0')}`
}

export function addOrgMember(member: Omit<OrgMember, 'id'>): OrgMember {
  const org = getSessionOrganisation()
  if (!org) throw new Error('No active organisation session')

  const orgs = loadOrganisations()
  const target = orgs.find(o => o.id === org.id)
  if (!target) throw new Error('Organisation not found')

  const prefix = member.role === 'staff' ? 'STF' : 'ADM'
  const created: OrgMember = { ...member, id: nextMemberId(target.members, prefix) }
  target.members.push(created)
  saveOrganisations(orgs)
  return created
}

export function updateOrgMember(memberId: string, patch: Partial<OrgMember>): OrgMember {
  const org = getSessionOrganisation()
  if (!org) throw new Error('No active organisation session')

  const orgs = loadOrganisations()
  const target = orgs.find(o => o.id === org.id)
  if (!target) throw new Error('Organisation not found')

  const index = target.members.findIndex(m => m.id === memberId)
  if (index === -1) throw new Error('Member not found')

  target.members[index] = { ...target.members[index], ...patch }
  saveOrganisations(orgs)
  return target.members[index]
}

export function deleteOrgMember(memberId: string) {
  const org = getSessionOrganisation()
  if (!org) throw new Error('No active organisation session')

  const orgs = loadOrganisations()
  const target = orgs.find(o => o.id === org.id)
  if (!target) throw new Error('Organisation not found')

  target.members = target.members.filter(m => m.id !== memberId)
  saveOrganisations(orgs)
}
