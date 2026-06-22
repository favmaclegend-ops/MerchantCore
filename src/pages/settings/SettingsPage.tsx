import { useContext } from 'react'
import { Authcontext } from '@/context/auth_context'
import { CurrencyContext } from '@/context/currency_context'
import { ThemeContext } from '@/context/theme_context'
import { User, Mail, AtSign, DollarSign, Moon, Sun } from 'lucide-react'
import { currencies, getCurrencyInfo } from '@/lib/currency'

export function SettingsPage() {
  const { user, logout } = useContext(Authcontext)
  const { currency, setCurrency, format } = useContext(CurrencyContext)
  const { theme, toggle } = useContext(ThemeContext)
  const currInfo = getCurrencyInfo(currency)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%', padding: '0 8px' }}>
      <div style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#0f172a' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--bg-surface)', margin: 0 }}>Settings</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>Manage your account and preferences</p>
      </div>

      <div style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, paddingBottom: '12px', borderBottom: '1px solid var(--bg-tertiary)' }}>Profile</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--border-default)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User style={{ width: '24px', height: '24px', color: 'var(--text-secondary)' }} />
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{user?.full_name || 'User'}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{user?.username || ''}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <Mail style={{ width: '16px', height: '16px', color: 'var(--text-muted)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Email</p>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '2px 0 0 0' }}>{user?.email || ''}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <AtSign style={{ width: '16px', height: '16px', color: 'var(--text-muted)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Username</p>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '2px 0 0 0' }}>{user?.username || ''}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, paddingBottom: '12px', borderBottom: '1px solid var(--bg-tertiary)' }}>Currency Preference</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <DollarSign style={{ width: '16px', height: '16px', color: 'var(--text-muted)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Display Currency</p>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '2px 0 0 0' }}>All monetary values shown in {currInfo.name} ({currInfo.symbol})</p>
          </div>
        </div>

        <select
          value={currency}
          onChange={e => setCurrency(e.target.value)}
          style={{
            width: '100%', height: '44px', padding: '0 12px', border: '1px solid var(--border-input)',
            borderRadius: '8px', fontSize: '14px', fontWeight: 500, outline: 'none',
            background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer',
          }}
        >
          {currencies.map(c => (
            <option key={c.code} value={c.code}>{c.symbol} — {c.name}</option>
          ))}
        </select>

        <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-success)', border: '1px solid var(--border-success)', fontSize: '12px', color: '#166534', textAlign: 'center' }}>
          Preview: 1,000.00 = {format(1000)}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, paddingBottom: '12px', borderBottom: '1px solid var(--bg-tertiary)' }}>Appearance</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          {theme === 'light' ? <Sun style={{ width: '16px', height: '16px', color: 'var(--text-muted)', flexShrink: 0 }} /> : <Moon style={{ width: '16px', height: '16px', color: 'var(--text-muted)', flexShrink: 0 }} />}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Theme</p>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '2px 0 0 0' }}>{theme === 'light' ? 'Light mode' : 'Dark mode'}</p>
          </div>
          <button
            onClick={toggle}
            style={{
              width: '52px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer', flexShrink: 0, position: 'relative',
              background: theme === 'dark' ? '#334155' : '#cbd5e1', transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px',
              left: theme === 'dark' ? '27px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ paddingTop: '0', borderTop: 'none' }}>
          <button
            onClick={logout}
            style={{ width: '100%', padding: '10px', background: 'var(--bg-danger)', color: '#dc2626', fontSize: '14px', fontWeight: 500, borderRadius: '8px', border: '1px solid var(--border-danger)', cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
