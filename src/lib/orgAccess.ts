// Centralised module-level permission checks for ORGANISATION (business workspace)
// members. These gate nav items, routes and page bodies. The org user (`orgUser`)
// may be null when a normal (personal) login is active, so every check accepts null.
//
//   super-admin / admin     -> all manager modules (Finance, HRM) + Users page
//   hrm-manager             -> HRM only (NOT Finance, NOT Users)
//   finance-manager         -> Finance only (NOT HRM, NOT Users)
//   staff                   -> self-service only (dashboard, POS, My Attendance)
import type { OrgMember } from '@/data/organisations'

export type OrgPermissions = 'finance' | 'hrm' | 'users'

export const isOrgMember = (orgUser: OrgMember | null): orgUser is OrgMember => !!orgUser

export function canManageUsers(orgUser: OrgMember | null): boolean {
  return !!orgUser && (orgUser.role === 'super-admin' || orgUser.role === 'admin')
}

export function canManageFinance(orgUser: OrgMember | null): boolean {
  return (
    !!orgUser &&
    (orgUser.role === 'super-admin' || orgUser.role === 'admin' || orgUser.role === 'finance-manager')
  )
}

export function canManageHRM(orgUser: OrgMember | null): boolean {
  return (
    !!orgUser &&
    (orgUser.role === 'super-admin' || orgUser.role === 'admin' || orgUser.role === 'hrm-manager')
  )
}

export function canAccess(orgUser: OrgMember | null, permission: OrgPermissions): boolean {
  switch (permission) {
    case 'finance':
      return canManageFinance(orgUser)
    case 'hrm':
      return canManageHRM(orgUser)
    case 'users':
      return canManageUsers(orgUser)
  }
}
