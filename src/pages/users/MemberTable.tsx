import { useState } from 'react'
import { MoreVertical, Phone, Mail, Pencil, Ban, Power, Trash2 } from 'lucide-react'
import { AVATAR_COLORS, initials, isSuperAdmin } from './data'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { Member } from './data'

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  color: 'var(--text-muted)',
  background: 'var(--bg-secondary)',
  borderBottom: '1px solid var(--bg-tertiary)',
  textAlign: 'left',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '13px',
  color: 'var(--text-primary)',
  borderBottom: '1px solid var(--bg-secondary)',
}

function MenuAction({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px',
      border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer',
      fontSize: '12px', fontWeight: 500, textAlign: 'left', color: danger ? 'var(--text-danger)' : 'var(--text-primary)',
    }}>
      {icon}
      {label}
    </button>
  )
}

function Avatar({ member, color, size }: { member: Member; color: string; size: number }) {
  return (
    <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: color, color: '#fff', fontSize: `${Math.round(size / 3)}px`, fontWeight: 700, overflow: 'hidden', opacity: member.isActive === false ? 0.4 : 1 }}>
      {member.avatar
        ? <img src={member.avatar} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials(member.name)}
    </div>
  )
}

type RowProps = {
  member: Member
  color: string
  compact: boolean
  open: boolean
  onToggle: () => void
  onEdit: (member: Member) => void
  onToggleActive: (member: Member) => void
  onDelete: (member: Member) => void
}

function MemberRow({ member, color, compact, open, onToggle, onEdit, onToggleActive, onDelete }: RowProps) {
  const inactive = member.isActive === false
  const nameColor = inactive ? 'var(--text-placeholder)' : 'var(--text-primary)'

  return (
    <tr style={{ opacity: 1 }}>
      <td style={tdStyle}>
        <Avatar member={member} color={color} size={36} />
      </td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: nameColor, margin: 0 }}>{member.name}</p>
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '999px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{member.role}</span>
          {inactive && (
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '999px', background: 'var(--bg-danger)', color: 'var(--text-danger)', whiteSpace: 'nowrap' }}>Inactive</span>
          )}
        </div>
      </td>
      {!compact && <td style={tdStyle}>{member.id}</td>}
      {!compact && <td style={tdStyle}>{member.phone}</td>}
      {!compact && <td style={tdStyle}>{member.email}</td>}
      <td style={{ ...tdStyle, position: 'relative', textAlign: 'right', borderBottom: 'none' }}>
        <button onClick={onToggle} aria-label="More actions" style={{
          padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: open ? 'var(--bg-tertiary)' : 'transparent', color: 'var(--text-secondary)',
        }}>
          <MoreVertical style={{ width: '16px', height: '16px' }} />
        </button>

        {open && (
          <>
            <div onClick={onToggle} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{ position: 'absolute', right: '8px', top: 'calc(100% - 4px)', width: '260px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', boxShadow: 'var(--shadow-menu)', zIndex: 50, overflow: 'hidden', textAlign: 'left' }}>
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--bg-tertiary)' }}>
                <Avatar member={member} color={color} size={36} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: nameColor, margin: 0 }}>{member.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{member.role}</p>
                </div>
              </div>

              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: '1px solid var(--bg-tertiary)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>ID: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{member.id}</span></p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Phone: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{member.phone}</span></p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Email: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{member.email}</span></p>
              </div>

              <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <MenuAction icon={<Phone style={{ width: '14px', height: '14px' }} />} label="Call" onClick={() => { window.location.href = `tel:${member.phone.replace(/[^+\d]/g, '')}` }} />
                <MenuAction icon={<Mail style={{ width: '14px', height: '14px' }} />} label="Email" onClick={() => { window.location.href = `mailto:${member.email}` }} />
                <MenuAction icon={<Pencil style={{ width: '14px', height: '14px' }} />} label="Edit" onClick={() => { onEdit(member); onToggle() }} />
                <MenuAction
                  icon={inactive ? <Power style={{ width: '14px', height: '14px' }} /> : <Ban style={{ width: '14px', height: '14px' }} />}
                  label={inactive ? 'Activate' : 'Deactivate'}
                  onClick={() => { onToggleActive(member); onToggle() }}
                />
                {!isSuperAdmin(member) && (
                  <MenuAction icon={<Trash2 style={{ width: '14px', height: '14px' }} />} label="Delete" danger onClick={() => { onDelete(member); onToggle() }} />
                )}
              </div>
            </div>
          </>
        )}
      </td>
    </tr>
  )
}

type TableProps = {
  members: Member[]
  onEdit: (member: Member) => void
  onToggleActive: (member: Member) => void
  onDelete: (member: Member) => void
}

export function MemberTable({ members, onEdit, onToggleActive, onDelete }: TableProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const bp = useBreakpoint()
  const compact = !bp.sm

  return (
    <div style={{ width: '100%', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', overflow: 'visible' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Profile</th>
            <th style={thStyle}>Name</th>
            {!compact && <th style={thStyle}>ID</th>}
            {!compact && <th style={thStyle}>Phone</th>}
            {!compact && <th style={thStyle}>Email</th>}
            <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, i) => (
            <MemberRow
              key={member.id}
              member={member}
              color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
              compact={compact}
              open={openId === member.id}
              onToggle={() => setOpenId(openId === member.id ? null : member.id)}
              onEdit={onEdit}
              onToggleActive={onToggleActive}
              onDelete={onDelete}
            />
          ))}
          {members.length === 0 && (
            <tr>
              <td colSpan={compact ? 3 : 6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-placeholder)' }}>
                No members found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
