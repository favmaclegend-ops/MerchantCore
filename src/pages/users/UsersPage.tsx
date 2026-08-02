import { useState } from 'react'
import { Button, Icon, Icons } from 'elk-components'
import { MemberTable } from './MemberTable'
import { MemberForm } from './MemberForm'
import { TABS, ADMINS, STAFF, nextId, toFormData, isSuperAdmin } from './data'
import type { Member, MemberFormData, TabId } from './data'

type FormState = { open: boolean; editing: Member | null }

export function Users() {
  const [active, setActive] = useState<TabId>('admin')
  const [admins, setAdmins] = useState<Member[]>(ADMINS)
  const [staff, setStaff] = useState<Member[]>(STAFF)
  const [form, setForm] = useState<FormState>({ open: false, editing: null })
  const [search, setSearch] = useState('')

  const members = active === 'admin' ? admins : staff
  const setMembers = active === 'admin' ? setAdmins : setStaff
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
      setMembers(members.map(m => m.id === editing.id ? { ...m, ...data } : m))
    } else {
      setMembers([...members, { id: nextId(members, prefix), ...data, isActive: true }])
    }
    closeForm()
  }

  const handleToggleActive = (member: Member) => {
    setMembers(members.map(m => m.id === member.id ? { ...m, isActive: m.isActive === false } : m))
  }

  const handleDelete = (member: Member) => {
    if (isSuperAdmin(member)) return
    setMembers(members.filter(m => m.id !== member.id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%', padding: '0 8px' }}>
      <div style={{ width: '100%', display: 'flex', gap: '8px', padding: '6px', borderRadius: '12px', background: 'var(--bg-tertiary)' }}>
        {TABS.map(t => (
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
              <span style={{ color: 'var(--bg-surface)', fontSize: '.9rem' }}>Add new {active === 'admin' ? 'Admin' : 'Staff'}</span>
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

      <div style={{ width: '100%' }}>
        <MemberTable
          members={filtered}
          onEdit={openEdit}
          onToggleActive={handleToggleActive}
          onDelete={handleDelete}
        />
      </div>

      {form.open && (
        <MemberForm
          key={form.editing?.id || 'new'}
          title={form.editing
            ? `Edit ${active === 'admin' ? 'Admin' : 'Staff'}`
            : `Add new ${active === 'admin' ? 'Admin' : 'Staff'}`}
          submitLabel={form.editing ? 'Save' : 'Add'}
          initial={toFormData(form.editing)}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
