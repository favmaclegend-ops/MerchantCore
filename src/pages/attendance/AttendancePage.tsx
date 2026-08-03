import { useContext, useEffect, useState } from 'react'
import { Clock, CalendarCheck2, CheckCircle2, Star, User, Briefcase } from 'lucide-react'
import { api } from '@/lib/api'
import { Authcontext } from '@/context/auth_context'
import { CurrencyContext } from '@/context/currency_context'
import type { OrgAttendanceRecord, OrgAttendanceSummary, OrgEmployee } from '@/data/orgHRM'

const formatDate = (iso: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString()
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: 'green' | 'accent' | 'amber' | 'neutral' }) {
  const colors = {
    green: { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' },
    accent: { background: 'rgba(59,130,246,0.15)', color: '#93c5fd' },
    amber: { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
    neutral: { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
  }[tone]
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '16px', flex: '1', minWidth: '180px' }}>
      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: 0 }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '6px 0 0 0' }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{sub}</p>}
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '12px', ...colors }}>
        {tone === 'green' ? <CheckCircle2 size={17} /> : tone === 'accent' ? <Clock size={17} /> : tone === 'amber' ? <Star size={17} /> : <Briefcase size={17} />}
      </div>
    </div>
  )
}

export function AttendancePage() {
  const { orgUser } = useContext(Authcontext)
  const { format } = useContext(CurrencyContext)

  const [employee, setEmployee] = useState<OrgEmployee | null>(null)
  const [records, setRecords] = useState<OrgAttendanceRecord[]>([])
  const [summary, setSummary] = useState<OrgAttendanceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [notice, setNotice] = useState('')

  const reload = () => {
    api.org.attendance.self().then(setEmployee).catch(() => {})
    api.org.attendance.getRecords().then(setRecords).catch(() => {})
    api.org.attendance.getSummary().then(setSummary).catch(() => {})
  }

  useEffect(() => {
    api.org.attendance.self()
      .then(emp => {
        setEmployee(emp)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    api.org.attendance.getRecords().then(setRecords).catch(() => {})
    api.org.attendance.getSummary().then(setSummary).catch(() => {})
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const ownSummary = employee ? summary.find(s => s.employee_id === employee.id) ?? null : null
  const todayRecord = employee ? records.find(r => r.employee_id === employee.id && r.date === today) ?? null : null
  const ownRecords = employee ? records.filter(r => r.employee_id === employee.id).slice(0, 10) : []

  const handleCheckIn = () => {
    setCheckingIn(true)
    api.org.attendance.checkIn()
      .then(() => {
        setNotice('Checked in successfully. Have a great shift!')
        reload()
        setTimeout(() => setNotice(''), 4000)
      })
      .catch(() => setNotice('Check-in failed. Please try again.'))
      .finally(() => setCheckingIn(false))
  }

  if (!orgUser) {
    return (
      <div style={{ width: '100%', padding: '40px 16px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Restricted area</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
          This page is only available to organisation members.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%', padding: '0 8px' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <div>
          
        </div>
        <button
          onClick={handleCheckIn}
          disabled={checkingIn || !!todayRecord}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '13px', fontWeight: 600,
            color: todayRecord ? 'var(--text-secondary)' : 'var(--text-on-dark)',
            background: todayRecord ? 'var(--bg-secondary)' : 'var(--bg-nav-active)',
            border: 'none', borderRadius: '10px', cursor: todayRecord ? 'default' : 'pointer',
          }}
        >
          {todayRecord ? <CheckCircle2 size={16} /> : <CalendarCheck2 size={16} />}
          {todayRecord ? `Checked in · ${todayRecord.check_in}` : checkingIn ? 'Checking in…' : 'Present'}
        </button>
      </div>

      {notice && (
        <div style={{ width: '100%', padding: '10px 14px', background: 'rgba(16,185,129,0.12)', border: '1px solid var(--border-success)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-success)', fontWeight: 500 }}>
          {notice}
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: '12px', color: 'var(--text-placeholder)', padding: '24px' }}>Loading your attendance…</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
            <Stat label="Attendance Rate" value={ownSummary ? `${ownSummary.attendance_rate}%` : '—'} sub={ownSummary ? `${ownSummary.present_days} of ${ownSummary.scheduled_days} scheduled days` : 'No records yet'} tone="green" />
            <Stat label="Hours Logged" value={String(ownSummary?.total_hours ?? 0)} sub={`${ownSummary?.overtime_hours ?? 0} overtime hours`} tone="accent" />
            <Stat label="Latest Review" value={ownSummary?.latest_review_score != null ? ownSummary.latest_review_score.toFixed(1) : '—'} sub={ownSummary?.latest_review_rating ?? 'No review yet'} tone="amber" />
            <Stat label="Monthly Salary" value={employee ? format(employee.salary) : '—'} sub={employee ? `${employee.jobTitle} · ${employee.department}` : 'Not registered yet'} tone="neutral" />
          </div>

          <div style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '16px', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Recent attendance</h3>
            {ownRecords.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--bg-tertiary)', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--bg-tertiary)', textAlign: 'left' }}>Check-in</th>
                      <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--bg-tertiary)', textAlign: 'left' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownRecords.map(r => (
                      <tr key={r.id}>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-primary)', borderBottom: '1px solid var(--bg-secondary)' }}>{formatDate(r.date)}</td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)', borderBottom: '1px solid var(--bg-secondary)' }}>{r.check_in}</td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', borderBottom: '1px solid var(--bg-secondary)' }}>
                          {r.status === 'present' ? (
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(16,185,129,0.18)', color: '#6ee7b7', whiteSpace: 'nowrap' }}>Present</span>
                          ) : (
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(239,68,68,0.18)', color: '#fca5a5', whiteSpace: 'nowrap' }}>Absent</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-placeholder)', fontSize: '12px' }}>
                <User size={20} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                No attendance records yet. Press <strong>Present</strong> to check in for today.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
