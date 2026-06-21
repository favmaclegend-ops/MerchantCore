import { useContext } from 'react'
import { Authcontext } from '@/context/auth_context'
import { CurrencyContext } from '@/context/currency_context'
import { User, Mail, AtSign, DollarSign } from 'lucide-react'
import { currencies, getCurrencyInfo } from '@/lib/currency'

export function SettingsPage() {
  const { user, logout } = useContext(Authcontext)
  const { currency, setCurrency, format } = useContext(CurrencyContext)
  const currInfo = getCurrencyInfo(currency)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%', padding: '0 8px' }}>
      <div style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#0f172a' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Settings</h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>Manage your account and preferences</p>
      </div>

      <div style={{ width: '100%', maxWidth: '600px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0, paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>Profile</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User style={{ width: '24px', height: '24px', color: '#475569' }} />
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{user?.full_name || 'User'}</p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>{user?.username || ''}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
            <Mail style={{ width: '16px', height: '16px', color: '#64748b', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>Email</p>
              <p style={{ fontSize: '13px', color: '#0f172a', margin: '2px 0 0 0' }}>{user?.email || ''}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
            <AtSign style={{ width: '16px', height: '16px', color: '#64748b', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>Username</p>
              <p style={{ fontSize: '13px', color: '#0f172a', margin: '2px 0 0 0' }}>{user?.username || ''}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '600px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0, paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>Currency Preference</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
          <DollarSign style={{ width: '16px', height: '16px', color: '#64748b', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>Display Currency</p>
            <p style={{ fontSize: '13px', color: '#0f172a', margin: '2px 0 0 0' }}>All monetary values shown in {currInfo.name} ({currInfo.symbol})</p>
          </div>
        </div>

        <select
          value={currency}
          onChange={e => setCurrency(e.target.value)}
          style={{
            width: '100%', height: '44px', padding: '0 12px', border: '1px solid #cbd5e1',
            borderRadius: '8px', fontSize: '14px', fontWeight: 500, outline: 'none',
            background: '#fff', color: '#0f172a', cursor: 'pointer',
          }}
        >
          {currencies.map(c => (
            <option key={c.code} value={c.code}>{c.symbol} — {c.name}</option>
          ))}
        </select>

        <div style={{ padding: '12px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '12px', color: '#166534', textAlign: 'center' }}>
          Preview: 1,000.00 = {format(1000)}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '600px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ paddingTop: '0', borderTop: 'none' }}>
          <button
            onClick={logout}
            style={{ width: '100%', padding: '10px', background: '#fef2f2', color: '#dc2626', fontSize: '14px', fontWeight: 500, borderRadius: '8px', border: '1px solid #fecaca', cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
