// Organisation (business workspace) session layer.
//
// The backend owns all organisation data. This module only persists the *session*
// (which member of which org is logged in) and mirrors the organisation/member
// shapes the rest of the app expects. No demo data is seeded here any more — a
// workspace only appears after a real backend register/login.

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

// All organisation storage is namespaced under `merchant_org_` so it can never mix with
// data from normal (server-backed) logins — which also read/write localStorage caches
// (e.g. `dashboard_cache`, `token`, `login`).
const ORG_DATA_KEY = 'merchant_org_data'
const ORG_SESSION_KEY = 'merchant_org_session'
const ORG_VERSION_KEY = 'merchant_org_data_version'

// Legacy unprefixed keys (removed during migration) — wiped on load so stale demo data
// from earlier builds does not linger.
const LEGACY_ORG_KEYS = ['org_data', 'org_session', 'org_data_version']

// Bump SEED_VERSION whenever the stored layout changes. On mismatch the stored
// workspace data is WIPED (not reseeded) so no stale/demo session can survive a reload.
const SEED_VERSION = 6

export function loadOrganisations(): Organisation[] {
  for (const key of LEGACY_ORG_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      // storage unavailable (e.g. blocked) — best effort
    }
  }
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
    // corrupt or outdated storage -> wipe below
  }

  // Stale or corrupt workspace data (or demo data from an older build): wipe the
  // workspace and session so a forgotten org login is never resurrected on reload.
  clearOrgSession()
  try {
    localStorage.removeItem(ORG_DATA_KEY)
    localStorage.setItem(ORG_VERSION_KEY, String(SEED_VERSION))
  } catch {
    return []
  }
  return []
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
        disabled: false
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
  if (member.disabled) throw new Error('Your account has been disabled. Contact your administrator.')
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

// Re-checks a stored session: if the session data is present and has valid
// structure, trust it. Server-side validation happens on mount via a lightweight
// API call in auth_provider. We no longer cross-reference against local org data
// (loadOrganisations) since the backend owns all org data.
export function validateOrgSession(session: OrgSession | null): OrgSession | null {
  if (!session) return null
  if (!session.orgId || !session.token || !session.member) {
    clearOrgSession()
    return null
  }
  if (session.member.disabled || !session.member.isActive) {
    clearOrgSession()
    return null
  }
  return session
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
