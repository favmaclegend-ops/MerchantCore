// Centralised module-level permission checks for ORGANISATION (business workspace)
// members. These gate nav items, routes and page bodies. The org user (`orgUser`)
// may be null when a normal (personal) login is active, so every check accepts null.
//
//   super-admin / admin     -> all manager modules (Finance, HRM, Supply) + Users page
//   hrm-manager             -> HRM only (NOT Finance, NOT Users, NOT Supply)
//   finance-manager         -> Finance only (NOT HRM, NOT Users, NOT Supply)
//   logistics-manager       -> Supply Chain & Logistics only (NOT Finance, NOT HRM, NOT Users)
//   staff                   -> self-service only (dashboard, POS, My Attendance)
import type { OrgMember } from '@/data/organisations'

export type OrgPermissions = 'finance' | 'hrm' | 'users' | 'supply'

export const isOrgMember = (orgUser: OrgMember | null): orgUser is OrgMember => !!orgUser

// Admin = the org owner (super-admin) or an admin. Distinguishes the people who
// can perform administrative actions (create/delete services, manage users,
// etc.) from regular employees/staff.
export function isOrgAdmin(orgUser: OrgMember | null): boolean {
  return !!orgUser && (orgUser.role === 'super-admin' || orgUser.role === 'admin')
}

export function canManageUsers(orgUser: OrgMember | null): boolean {
  return isOrgAdmin(orgUser)
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

// Supply Chain & Logistics — the department head (logistics-manager) and the Super Admin.
export function canManageSupply(orgUser: OrgMember | null): boolean {
  return !!orgUser && (orgUser.role === 'super-admin' || orgUser.role === 'logistics-manager')
}

// Product creation / edit / delete in inventory. Only the head of the Supply Chain
// department and the Super Admin may add, edit or delete products — everyone else can
// only read stock levels and run sales.
export function canEditInventory(orgUser: OrgMember | null): boolean {
  return canManageSupply(orgUser)
}

export function canAccess(orgUser: OrgMember | null, permission: OrgPermissions): boolean {
  switch (permission) {
    case 'finance':
      return canManageFinance(orgUser)
    case 'hrm':
      return canManageHRM(orgUser)
    case 'users':
      return canManageUsers(orgUser)
    case 'supply':
      return canManageSupply(orgUser)
  }
}
