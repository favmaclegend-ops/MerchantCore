import type { CSSProperties } from 'react'

// Style tokens and small helpers shared across the Supply Chain & Logistics tab
// components. Kept separate from the component file so react-refresh stays happy
// (a file must only export components or only export constants/functions).

export type Tone = 'green' | 'red' | 'neutral' | 'accent' | 'amber'

export const TONE_COLORS: Record<Tone, { background: string; color: string }> = {
  green: { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' },
  red: { background: 'rgba(239,68,68,0.15)', color: '#fca5a5' },
  neutral: { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
  accent: { background: 'rgba(59,130,246,0.15)', color: '#93c5fd' },
  amber: { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
}

export const PO_STATUS_TONES: Record<string, Tone> = {
  draft: 'neutral',
  pending: 'amber',
  approved: 'accent',
  received: 'green',
  cancelled: 'red',
}

export const SHIPMENT_STATUS_TONES: Record<string, Tone> = {
  'in-transit': 'accent',
  delayed: 'amber',
  delivered: 'green',
  cancelled: 'red',
}

export function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString()
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export const inputStyle: CSSProperties = {
  width: '100%', height: '38px', padding: '0 12px', border: '1px solid var(--border-input)',
  borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)', boxSizing: 'border-box',
}

export const selectStyle: CSSProperties = { ...inputStyle, padding: '0 8px' }

export const thStyle: CSSProperties = {
  padding: '10px 14px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em',
  color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--bg-tertiary)', textAlign: 'left', whiteSpace: 'nowrap',
}

export const tdStyle: CSSProperties = {
  padding: '12px 14px', fontSize: '13px', color: 'var(--text-primary)', borderBottom: '1px solid var(--bg-secondary)', whiteSpace: 'nowrap',
}

export const panelStyle: CSSProperties = {
  width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '16px', boxSizing: 'border-box',
}

export const primaryBtn: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 600,
  color: 'var(--text-on-dark)', background: 'var(--bg-nav-active)', border: 'none', borderRadius: '8px', cursor: 'pointer',
}

export const ghostBtn: CSSProperties = {
  padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
  background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: '8px', cursor: 'pointer',
}

export const overlay: CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, padding: '16px',
}

export const modalCard: CSSProperties = {
  background: 'var(--bg-surface)', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '560px',
  maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px',
}

export const modalHeader: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }

export const modalClose: CSSProperties = {
  padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', display: 'inline-flex',
}

export const labelStyle: CSSProperties = { fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block' }

export const fieldRow: CSSProperties = { display: 'flex', gap: '8px' }

export const field: CSSProperties = { flex: 1, minWidth: 0 }

export const footerRow: CSSProperties = { display: 'flex', gap: '8px', marginTop: '4px' }

export const cancelBtn: CSSProperties = { flex: 1, height: '40px', fontSize: '13px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer' }

export const submitBtn: CSSProperties = { flex: 1, height: '40px', fontSize: '13px', fontWeight: 500, background: 'var(--bg-nav-active)', color: 'var(--text-on-dark)', border: 'none', borderRadius: '8px', cursor: 'pointer' }
