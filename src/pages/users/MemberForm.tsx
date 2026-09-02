import { useState } from 'react'
import { ADMIN_ROLES, type MemberFormData } from './data'
import type { OrgRole } from '@/data/organisations'

export type AvailableUser = { id: string; name: string; email: string; username: string; userId?: string }

const modalCard: React.CSSProperties = {
  background: 'var(--bg-surface)', borderRadius: '12px', padding: '20px', width: '100%',
  maxWidth: '420px', maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px',
  boxSizing: 'border-box', minWidth: 0, overflowX: 'hidden',
}

const modalBackdrop: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '12px', boxSizing: 'border-box', overflowX: 'hidden',
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block',
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: '42px', padding: '0 12px', border: '1px solid var(--border-input)',
  borderRadius: '8px', fontSize: '16px', outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)',
  boxSizing: 'border-box', minWidth: 0,
}

type FormProps = {
  title: string
  submitLabel: string
  initial: MemberFormData
  kind: 'admin' | 'staff'
  lockRole?: boolean
  users?: AvailableUser[] | null
  saving?: boolean
  onSave: (data: MemberFormData) => void
  onClose: () => void
}

export function MemberForm({ title, submitLabel, initial, kind, lockRole, users, saving, onSave, onClose }: FormProps) {
  const [formData, setFormData] = useState<MemberFormData>(() => {
    if (initial.id) return initial
    if (initial.username && initial.password) return initial
    return { ...initial, username: '', password: '' }
  })

  const pickUser = (u: AvailableUser) => {
    setFormData(p => ({
      ...p,
      userId: u.userId || u.id,
      name: u.name,
      email: u.email,
      username: (u.email || '').split('@')[0] || u.name.toLowerCase().replace(/[^a-z0-9]+/g, ''),
    }))
  }

  const handleSave = () => {
    if (users && !formData.userId) return
    if (!formData.name || !formData.email || saving) return
    onSave(formData)
  }

  const canSubmit = saving || (users && !formData.userId) || !formData.name || !formData.email

  return (
    <div style={modalBackdrop} onClick={onClose} >
      <div style={modalCard} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
        {!initial.id && users && (
          <div>
            <label style={labelStyle}>Select Employee</label>
            <select
              value={formData.userId ? (users.find(u => (u.userId || u.id) === formData.userId)?.id ?? '') : ''}
              onChange={e => {
                const u = users.find(x => x.id === e.target.value)
                if (u) pickUser(u)
                else setFormData(p => ({ ...p, userId: undefined, name: '', email: '', username: '' }))
              }}
              style={{ ...inputStyle, padding: '0 10px' }}
            >
              <option value="">— Choose an employee —</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}{u.email ? ` — ${u.email}` : ''}</option>
              ))}
            </select>
            {!formData.userId && <p style={{ fontSize: '11px', color: 'var(--text-danger)', margin: '4px 0 0' }}>Select an employee above to continue.</p>}
          </div>
        )}
        <div>
          <label style={labelStyle}>Full Name</label>
          <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Full name" />
        </div>
        {kind === 'staff' && (
          <div>
            <label style={labelStyle}>Job Title</label>
            <input value={formData.jobTitle} onChange={e => setFormData(p => ({ ...p, jobTitle: e.target.value }))} style={inputStyle} placeholder="e.g. Cashier, Sales" />
          </div>
        )}
        {kind === 'admin' && !lockRole && (
          <div>
            <label style={labelStyle}>Role</label>
            <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value as OrgRole }))} style={{ ...inputStyle, padding: '0 10px' }}>
              {ADMIN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        )}
        <div>
          <label style={labelStyle}>Phone</label>
          <input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} style={inputStyle} placeholder="+233 20 000 0000" />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <input value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} style={inputStyle} placeholder="Set a login password" />
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
          This creates a login for the selected employee. Share the password so they can sign in with the organisation name.
        </p>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', marginTop: '4px' }}>
          <button type="button" onClick={onClose} disabled={saving} style={{ flex: 1, height: '42px', fontSize: '13px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer' }}>Cancel</button>
          <button type="button" onClick={handleSave} disabled={canSubmit} style={{ flex: 1, height: '42px', fontSize: '13px', fontWeight: 500, background: 'var(--bg-nav-active)', color: 'var(--text-on-dark)', border: 'none', borderRadius: '8px', cursor: canSubmit ? 'not-allowed' : 'pointer', opacity: canSubmit ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {saving && <span className="spinner" style={{ width: 14, height: 14 }} />}
            {saving ? 'Adding…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
