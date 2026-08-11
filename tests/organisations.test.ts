import { beforeEach, describe, expect, it } from 'vitest'
import {
  addOrgMember,
  clearOrgSession,
  deleteOrgMember,
  findOrganisation,
  getOrgSession,
  loadOrganisations,
  loginOrganisation,
  registerOrganisation,
  setOrgSession,
  updateOrgMember,
  validateOrgSession,
  type OrgMember,
  type OrgRegisterInput,
  type OrgSession,
  type Organisation,
} from '@/data/organisations'

const registerInput: OrgRegisterInput = {
  orgName: 'Kofi Stores',
  businessEmail: 'hello@kofistores.example',
  superAdminName: 'Kofi Mensah',
  superAdminUsername: 'kofi',
  superAdminEmail: 'kofi@kofistores.example',
  password: 'Pass@123',
  phone: '+233 555 010 9999',
}

function sessionFor(org: Organisation, member: OrgMember): OrgSession {
  return { orgId: org.id, orgName: org.name, member, token: 'test-token' }
}

describe('organisations (mock data layer)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('loadOrganisations', () => {
    it('starts with no seeded demo workspace', () => {
      const orgs = loadOrganisations()
      expect(orgs).toHaveLength(0)
      expect(localStorage.getItem('merchant_org_data_version')).toBe('6')
    })

    it('removes legacy unprefixed keys on load', () => {
      localStorage.setItem('org_data', '{}')
      localStorage.setItem('org_session', '{}')
      localStorage.setItem('org_data_version', '1')
      loadOrganisations()
      expect(localStorage.getItem('org_data')).toBeNull()
      expect(localStorage.getItem('org_session')).toBeNull()
      expect(localStorage.getItem('org_data_version')).toBeNull()
    })

    it('returns stored data when the version matches', () => {
      loadOrganisations()
      const org = registerOrganisation(registerInput)
      org.name = 'Renamed Mart'
      localStorage.setItem('merchant_org_data', JSON.stringify([org]))
      expect(loadOrganisations()[0].name).toBe('Renamed Mart')
    })

    it('wipes stale workspace data instead of reseeding demo data', () => {
      localStorage.setItem('merchant_org_data_version', '1')
      localStorage.setItem('merchant_org_data', JSON.stringify([]))
      const orgs = loadOrganisations()
      expect(orgs).toHaveLength(0)
      expect(localStorage.getItem('merchant_org_data_version')).toBe('6')
    })

    it('wipes stored data and clears the session when data is corrupt', () => {
      const org = registerOrganisation(registerInput)
      setOrgSession(sessionFor(org, org.members[0]))
      localStorage.setItem('merchant_org_data_version', '6')
      localStorage.setItem('merchant_org_data', 'not-json')
      expect(loadOrganisations()).toEqual([])
      expect(getOrgSession()).toBeNull()
    })
  })

  describe('findOrganisation', () => {
    it('finds by name or business email, case-insensitive and trimmed', () => {
      const org = registerOrganisation(registerInput)
      expect(findOrganisation(`  ${org.name} `)?.id).toBe(org.id)
      expect(findOrganisation(org.businessEmail.toUpperCase())?.id).toBe(org.id)
      expect(findOrganisation('nope')).toBeNull()
    })
  })

  describe('registerOrganisation', () => {
    it('creates and persists a new org with a super-admin member', () => {
      const org = registerOrganisation(registerInput)
      expect(org.id).toBe('ORG-001')
      expect(org.name).toBe('Kofi Stores')
      expect(org.businessEmail).toBe('hello@kofistores.example')
      expect(org.members).toHaveLength(1)
      expect(org.members[0]).toMatchObject({
        name: 'Kofi Mensah',
        username: 'kofi',
        role: 'super-admin',
        jobTitle: 'Super Admin',
        isActive: true,
        dataBlocked: false,
        disabled: false,
      })
      expect(findOrganisation('Kofi Stores')).toEqual(org)
    })

    it('rejects duplicate names or business emails', () => {
      registerOrganisation(registerInput)
      expect(() => registerOrganisation({ ...registerInput, orgName: 'KOFI STORES' })).toThrow('already registered')
      expect(() => registerOrganisation({ ...registerInput, businessEmail: 'HELLO@KOFISTORES.EXAMPLE' })).toThrow('already registered')
    })
  })

  describe('loginOrganisation', () => {
    it('authenticates by email or username', () => {
      const org = registerOrganisation(registerInput)
      expect(loginOrganisation('Kofi Stores', 'kofi@kofistores.example', 'Pass@123').member.id).toBe('ADM-001')
      expect(loginOrganisation('Kofi Stores', 'kofi', 'Pass@123').member.id).toBe('ADM-001')
      expect(loginOrganisation('Kofi Stores', 'kofi@kofistores.example', 'Pass@123').org.id).toBe(org.id)
    })

    it('rejects unknown orgs, unknown members and wrong passwords', () => {
      registerOrganisation(registerInput)
      expect(() => loginOrganisation('No Org', 'x@y.example', 'pw')).toThrow('Organisation not found')
      expect(() => loginOrganisation('Kofi Stores', 'ghost@kofistores.example', 'pw')).toThrow('Invalid credentials')
      expect(() => loginOrganisation('Kofi Stores', 'kofi@kofistores.example', 'wrong')).toThrow('Invalid credentials')
    })

    it('rejects disabled and blocked members', () => {
      const org = registerOrganisation(registerInput)
      const superAdmin = org.members[0]
      setOrgSession(sessionFor(org, superAdmin))

      updateOrgMember(superAdmin.id, { disabled: true })
      expect(() => loginOrganisation('Kofi Stores', 'kofi@kofistores.example', 'Pass@123')).toThrow('disabled')

      updateOrgMember(superAdmin.id, { disabled: false, isActive: false })
      expect(() => loginOrganisation('Kofi Stores', 'kofi@kofistores.example', 'Pass@123')).toThrow('blocked')
    })
  })

  describe('org sessions', () => {
    it('stores, reads and clears a session', () => {
      expect(getOrgSession()).toBeNull()
      const org = registerOrganisation(registerInput)
      const session = sessionFor(org, org.members[0])
      setOrgSession(session)
      expect(getOrgSession()).toEqual(session)
      clearOrgSession()
      expect(getOrgSession()).toBeNull()
    })

    it('validateOrgSession returns null for a null session', () => {
      expect(validateOrgSession(null)).toBeNull()
    })

    it('validateOrgSession refreshes a valid session from stored data', () => {
      const org = registerOrganisation(registerInput)
      const superAdmin = org.members[0]
      const session = sessionFor(org, superAdmin)
      setOrgSession(session)
      expect(validateOrgSession(session)?.orgId).toBe(org.id)
      expect(getOrgSession()).not.toBeNull()
    })

    it('validateOrgSession clears sessions whose member is disabled or blocked', () => {
      const org = registerOrganisation(registerInput)
      const superAdmin = org.members[0]
      const session = sessionFor(org, superAdmin)
      setOrgSession(session)

      updateOrgMember(superAdmin.id, { disabled: true })
      expect(validateOrgSession(session)).toBeNull()
      expect(getOrgSession()).toBeNull()

      setOrgSession(session)
      updateOrgMember(superAdmin.id, { disabled: false, isActive: false })
      expect(validateOrgSession(session)).toBeNull()
      expect(getOrgSession()).toBeNull()    })

    it('validateOrgSession returns null when the org no longer exists', () => {
      const org = registerOrganisation(registerInput)
      const session = sessionFor(org, org.members[0])
      setOrgSession(session)

      const remaining = loadOrganisations().filter(o => o.id !== org.id)
      localStorage.setItem('merchant_org_data', JSON.stringify(remaining))
      expect(validateOrgSession(session)).toBeNull()
      expect(getOrgSession()).toBeNull()
    })
  })

  describe('member CRUD', () => {
    const staffInput: Omit<OrgMember, 'id'> = {
      name: 'Ama Serwaa',
      email: 'ama@sunrise.example',
      username: 'ama',
      password: 'StaffPass@123',
      phone: '',
      role: 'staff',
      jobTitle: 'Cashier',
      isActive: true,
      dataBlocked: false,
      disabled: false,
    }

    it('requires an active session', () => {
      expect(() => addOrgMember(staffInput)).toThrow('No active organisation session')
    })

    it('adds, updates and deletes members for the active org', () => {
      const org = registerOrganisation(registerInput)
      setOrgSession(sessionFor(org, org.members[0]))

      const staff = addOrgMember(staffInput)
      expect(staff.id).toBe('STF-001')

      const admin = addOrgMember({ ...staffInput, role: 'admin', jobTitle: 'Administrator' })
      expect(admin.id).toBe('ADM-002')

      expect(loadOrganisations()[0].members).toHaveLength(3)

      const updated = updateOrgMember(staff.id, { disabled: true })
      expect(updated.disabled).toBe(true)
      expect(loadOrganisations()[0].members.find(m => m.id === staff.id)?.disabled).toBe(true)

      expect(() => updateOrgMember('STF-999', { name: 'x' })).toThrow('Member not found')

      deleteOrgMember(staff.id)
      expect(loadOrganisations()[0].members.find(m => m.id === staff.id)).toBeUndefined()
    })
  })
})
