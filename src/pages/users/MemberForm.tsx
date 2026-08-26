import { useState } from 'react'
import { ADMIN_ROLES, generateCredential, type MemberFormData } from './data'
import type { OrgRole } from '@/data/organisations'

const modalBackdrop: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px',
}

const modalCard: React.CSSProperties = {
  background: 'var(--bg-surface)', borderRadius: '12px', padding: '24px', width: '100%',
  maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block',
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: '40px', padding: '0 12px', border: '1px solid var(--border-input)',
  borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)', boxSizing: 'border-box',
}

type FormProps = {
  title: string
  submitLabel: string
  initial: MemberFormData
  kind: 'admin' | 'staff'
  lockRole?: boolean
  onSave: (data: MemberFormData) => void
  onClose: () => void
}

export function MemberForm({ title, submitLabel, initial, kind, lockRole, onSave, onClose }: FormProps) {
  const [formData, setFormData] = useState<MemberFormData>(() => {
    if (initial.id) return initial
    if (initial.username && initial.password) return initial
    const cred = generateCredential(initial.name, initial.email)
    return { ...initial, username: cred.username, password: cred.password }
  })

  const handleSave = () => {
    console.log(formData)
    if (!formData.name || !formData.email) return
    onSave(formData)
  }

  return (
    <div style={modalBackdrop} onClick={onClose} >
      <div style={modalCard} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
        <div>
          <label style={labelStyle}>Full Name</label>
          <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Full name" />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} style={inputStyle} placeholder="email@example.com" />
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
            <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value as OrgRole }))} style={{ ...inputStyle, padding: '0 8px' }}>
              {ADMIN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        )}
        <div>
          <label style={labelStyle}>Phone</label>
          <input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} style={inputStyle} placeholder="+233 20 000 0000" />
        </div>
        <div>
          <label style={labelStyle}>Username</label>
          <input value={formData.username} onChange={e => setFormData(p => ({ ...p, username: e.target.value }))} style={inputStyle} placeholder="Login username" />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <input value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} style={inputStyle} placeholder="Login password" />
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
          Provide these credentials to the {kind === 'staff' ? 'staff member' : 'team member'} so they can log in with the organisation name.
        </p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button onClick={onClose} style={{ flex: 1, height: '40px', fontSize: '13px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 1, height: '40px', fontSize: '13px', fontWeight: 500, background: 'var(--bg-nav-active)', color: 'var(--text-on-dark)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{submitLabel}</button>
        </div>
      </div>
    </div>
  )
}
