import { useContext, useEffect, useState } from 'react'
import { Button, Icon, Icons } from 'elk-components'
import { MemberTable } from './MemberTable'
import { MemberForm } from './MemberForm'
import { Authcontext } from '@/context/auth_context'
import { api } from '@/lib/api'
import { canManageUsers } from '@/lib/orgAccess'
import { isSuperAdmin, TABS, toFormData, toMember, type Member, type MemberFormData, type TabId } from './data'

type FormState = { open: boolean; editing: Member | null }

export function Users() {
  const { orgUser, orgName } = useContext(Authcontext)
  const currentRole = orgUser?.role ?? null
  const isOrdinaryAdmin = currentRole === 'admin'

  const [active, setActive] = useState<TabId>(isOrdinaryAdmin ? 'staff' : 'admin')
  const [admins, setAdmins] = useState<Member[]>([])
  const [staff, setStaff] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormState>({ open: false, editing: null })
  const [search, setSearch] = useState('')
  const [credential, setCredential] = useState<Member | null>(null)

  const applyMembers = (members: Member[]) => {
    setAdmins(members.filter(m => m.role !== 'staff'))
    setStaff(members.filter(m => m.role === 'staff'))
  }

  useEffect(() => {
    api.org.getUsers()
      .then(applyMembers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const loadMembers = () => api.org.getUsers().then(applyMembers).catch(() => {})

  if (!canManageUsers(orgUser)) {
    return (
      <div style={{ width: '100%', padding: '40px 16px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Restricted area</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
          You do not have permission to manage users. This area is only available to organisation admins.
        </p>
      </div>
    )
  }

  const visibleTabs = TABS
  const members = active === 'admin' ? admins : staff
  const prefix = active === 'admin' ? 'ADM' : 'STF'

  const query = search.trim().toLowerCase()
  const filtered = query
    ? members.filter(m => m.name.toLowerCase().includes(query) || m.id.toLowerCase().includes(query))
    : members

  const openAdd = () => setForm({ open: true, editing: null })
  const openEdit = (member: Member) => setForm({ open: true, editing: member })
  const closeForm = () => setForm({ open: false, editing: null })

  const handleSave = (data: MemberFormData) => {
    const editing = form.editing
    if (editing) {
      const patch: Partial<Member> = {
        name: data.name,
        email: data.email,
        username: data.username,
        password: data.password || editing.password,
        phone: data.phone,
        jobTitle: editing.role === 'staff' ? data.jobTitle : editing.jobTitle,
      }
      if (editing.role !== 'super-admin' && data.role && data.role !== editing.role) {
        patch.role = data.role
      }
      api.org.updateUser(editing.id, patch).then(loadMembers)
    } else {
      const role = active === 'admin' ? (data.role || 'admin') : 'staff'
      api.org.addUser(toMember(data, role)).then(created => {
        loadMembers()
        setCredential(created)
      })
    }
    closeForm()
  }

  const handleToggleActive = (member: Member) => {
    if (isSuperAdmin(member)) return
    api.org.updateUser(member.id, { isActive: !member.isActive }).then(loadMembers)
  }

  const handleToggleDataBlock = (member: Member) => {
    api.org.updateUser(member.id, { dataBlocked: !member.dataBlocked }).then(loadMembers)
  }

  const handleToggleDisabled = (member: Member) => {
    if (isSuperAdmin(member)) return
    api.org.updateUser(member.id, { disabled: !member.disabled }).then(loadMembers)
  }

  const handleDelete = (member: Member) => {
    if (isSuperAdmin(member)) return
    api.org.deleteUser(member.id).then(loadMembers)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%', padding: '0 8px' }}>
      <div style={{ width: '100%', display: 'flex', gap: '8px', padding: '6px', borderRadius: '12px', background: 'transparent' }}>
        {visibleTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            style={{
              padding: '10px 1rem',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: active === t.id ? 'var(--bg-surface)' : 'var(--text-secondary)',
              background: active === t.id ? 'var(--bg-nav-active)' : 'transparent',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}

        <Button
          padding=".3rem 1rem"
          color="var(--bg-surface)"
          borderRadius=".3rem"
          gest={{ onClick: openAdd }}
          style={{ background: 'var(--bg-nav-active)', display: 'flex', marginInlineStart: 'auto', alignItems: 'center', gap: '.5rem' }}
          child={() => (
            <>
              <Icon icon={Icons.icon.Add} color="white" size={20}/>
              <span style={{ color: 'var(--text-on-dark)', fontSize: '.9rem' }}>Add new {active === 'admin' ? 'Team member' : 'Staff'}</span>
            </>
          )}
        />
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name or ID..."
        style={{ width: '100%', height: '40px', padding: '0 14px', border: '1px solid var(--border-default)', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
      />

      {loading ? (
        <p style={{ fontSize: '12px', color: 'var(--text-placeholder)', padding: '24px' }}>Loading members...</p>
      ) : (
        <div style={{ width: '100%' }}>
          <MemberTable
            members={filtered}
            onEdit={openEdit}
            onToggleActive={handleToggleActive}
            onToggleDataBlock={handleToggleDataBlock}
            onToggleDisabled={handleToggleDisabled}
            onDelete={handleDelete}
          />
        </div>
      )}

      {form.open && (
        <MemberForm
          key={form.editing?.id || 'new'}
          title={form.editing
            ? `Edit ${active === 'admin' ? 'Team member' : 'Staff'}`
            : `Add new ${active === 'admin' ? 'Team member' : 'Staff'}`}
          submitLabel={form.editing ? 'Save' : 'Add'}
          kind={form.editing ? (form.editing.role === 'staff' ? 'staff' : 'admin') : prefix === 'STF' ? 'staff' : 'admin'}
          lockRole={form.editing?.role === 'super-admin'}
          initial={toFormData(form.editing)}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      {credential && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} onClick={() => setCredential(null)}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Login credentials created</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Share these credentials with <strong style={{ color: 'var(--text-primary)' }}>{credential.name}</strong>. They sign in with the organisation name below.
            </p>
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Organisation: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{orgName}</span></p>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Username: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{credential.username}</span></p>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Email: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{credential.email}</span></p>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Password: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{credential.password}</span></p>
            </div>
            <button onClick={() => setCredential(null)} style={{ height: '40px', fontSize: '13px', fontWeight: 500, background: 'var(--bg-nav-active)', color: 'var(--text-on-dark)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Got it</button>
          </div>
        </div>
      )}
    </div>
  )
}
