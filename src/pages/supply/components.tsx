import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import {
  TONE_COLORS,
  overlay, modalCard, modalHeader, modalClose, footerRow, cancelBtn, submitBtn,
} from './styles'

// Shared UI pieces for the Supply Chain & Logistics module. Each tab lives in its own
// file under `src/pages/supply/`; this module only hosts the small reusable component
// building blocks (stat cards, badges, modal shell and form buttons).

export function StatCard({
  label, value, sub, icon, tone,
}: { label: string; value: string; sub?: string; icon: ReactNode; tone: keyof typeof TONE_COLORS }) {
  const colors = TONE_COLORS[tone]
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '16px', flex: '1', minWidth: '180px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...colors }}>
          {icon}
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</span>
      </div>
      <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{sub}</p>}
    </div>
  )
}

export function StatusBadge({ label, tone }: { label: string; tone: keyof typeof TONE_COLORS }) {
  const colors = TONE_COLORS[tone]
  return (
    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', textTransform: 'capitalize', whiteSpace: 'nowrap', ...colors }}>
      {label}
    </span>
  )
}

export function PageNotice({ message, tone = 'success' }: { message: string; tone?: 'success' | 'error' }) {
  const style = tone === 'error'
    ? { background: 'var(--bg-danger)', border: '1px solid var(--border-danger)', color: 'var(--text-danger)' }
    : { background: 'rgba(16,185,129,0.12)', border: '1px solid var(--border-success)', color: 'var(--text-success)' }
  return (
    <div style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, boxSizing: 'border-box', ...style }}>
      {message}
    </div>
  )
}

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <div style={overlay} onClick={onClose}>
      <div style={modalCard} onClick={e => e.stopPropagation()}>
        <div style={modalHeader}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={modalClose}><X size={14} /></button>
        </div>
        {children}
        {footer && <div style={footerRow}>{footer}</div>}
      </div>
    </div>
  )
}

export function FormButtons({ onCancel, onSubmit, submitLabel }: { onCancel: () => void; onSubmit: () => void; submitLabel: string }) {
  return (
    <>
      <button onClick={onCancel} style={cancelBtn}>Cancel</button>
      <button onClick={onSubmit} style={submitBtn}>{submitLabel}</button>
    </>
  )
}
