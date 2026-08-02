import { useState } from 'react'
import type { MemberFormData } from './data'

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
  onSave: (data: MemberFormData) => void
  onClose: () => void
}

export function MemberForm({ title, submitLabel, initial, onSave, onClose }: FormProps) {
  const [formData, setFormData] = useState<MemberFormData>(initial)

  const handleSave = () => {
    if (!formData.name || !formData.email) return
    onSave(formData)
  }

  return (
    <div style={modalBackdrop} onClick={onClose}>
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
        <div>
          <label style={labelStyle}>Phone</label>
          <input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} style={inputStyle} placeholder="+233 20 000 0000" />
        </div>
        <div>
          <label style={labelStyle}>Role</label>
          <input value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} style={inputStyle} placeholder="e.g. Admin / Cashier" />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button onClick={onClose} style={{ flex: 1, height: '40px', fontSize: '13px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 1, height: '40px', fontSize: '13px', fontWeight: 500, background: 'var(--bg-nav-active)', color: 'var(--bg-surface)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{submitLabel}</button>
        </div>
      </div>
    </div>
  )
}
