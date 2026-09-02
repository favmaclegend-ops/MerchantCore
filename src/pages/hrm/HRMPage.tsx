import { useContext,  useState, type ChangeEvent, } from 'react'
import {
  Plus, X, Contact, Wallet, ShieldCheck, Clock, Star, DollarSign, CheckCircle2, QrCode, ScanLine, MoreVertical, Copy, CalendarCheck2,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { api } from '@/lib/api'
import { Authcontext } from '@/context/auth_context'
import { CurrencyContext } from '@/context/currency_context'
import { canManageHRM } from '@/lib/orgAccess'
import {
  currentPeriod,
  type OrgAttendanceRecord,
  type OrgAttendanceSummary,
  type OrgBenefit,
  type OrgBenefitInput,
  type OrgBenefitType,
  type OrgEmployee,
  type OrgEmployeeInput,
  type OrgEmploymentStatus,
  type OrgEmploymentType,
  type OrgHrmState,
  type OrgReviewInput,
  type OrgTimeInput,
} from '@/lib/orgTypes'
import { useMountEffect } from 'elk-components'


type TabId = 'overview' | 'employees' | 'payroll' | 'attendance' | 'performance' | 'benefits'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'employees', label: 'Employees' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'attendance', label: 'Time & Attendance' },
  { id: 'performance', label: 'Performance' },
  { id: 'benefits', label: 'Benefits' },
]

const formatDate = (iso: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString()
}

const EMP_STATUS_STYLES: Record<OrgEmploymentStatus, React.CSSProperties> = {
  active: { background: 'rgba(16,185,129,0.18)', color: '#6ee7b7' },
  probation: { background: 'rgba(59,130,246,0.18)', color: '#93c5fd' },
  'on-leave': { background: 'rgba(245,158,11,0.18)', color: '#fbbf24' },
  terminated: { background: 'rgba(239,68,68,0.18)', color: '#fca5a5' },
  retired: { background: 'var(--bg-secondary)', color: 'var(--text-muted)' },
}

function EmpStatusBadge({ status }: { status: OrgEmploymentStatus }) {
  return (
    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', textTransform: 'capitalize', whiteSpace: 'nowrap', ...EMP_STATUS_STYLES[status] }}>
      {status}
    </span>
  )
}

function PayStatusBadge({ status }: { status: 'pending' | 'paid' }) {
  const styles: Record<'pending' | 'paid', React.CSSProperties> = {
    pending: { background: 'rgba(245,158,11,0.18)', color: '#fbbf24' },
    paid: { background: 'rgba(16,185,129,0.18)', color: '#6ee7b7' },
  }
  return (
    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', textTransform: 'capitalize', whiteSpace: 'nowrap', ...styles[status] }}>
      {status}
    </span>
  )
}

function RatingBadge({ rating }: { rating: 'exceeds' | 'meets' | 'below' }) {
  const styles: Record<'exceeds' | 'meets' | 'below', React.CSSProperties> = {
    exceeds: { background: 'rgba(16,185,129,0.18)', color: '#6ee7b7' },
    meets: { background: 'rgba(59,130,246,0.18)', color: '#93c5fd' },
    below: { background: 'rgba(239,68,68,0.18)', color: '#fca5a5' },
  }
  return (
    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', textTransform: 'capitalize', whiteSpace: 'nowrap', ...styles[rating] }}>
      {rating}
    </span>
  )
}

function StatCard({ label, value, sub, icon, tone }: { label: string; value: string; sub?: string; icon: React.ReactNode; tone: 'green' | 'red' | 'neutral' | 'accent' | 'amber' }) {
  const colors = {
    green: { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' },
    red: { background: 'rgba(239,68,68,0.15)', color: '#fca5a5' },
    neutral: { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
    accent: { background: 'rgba(59,130,246,0.15)', color: '#93c5fd' },
    amber: { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  }[tone]
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

type EmployeeForm = {
  name: string
  email: string
  phone: string
  userId?: string
  department: string
  jobTitle: string
  employmentType: OrgEmploymentType
  hireDate: string
  salary: string
  status: OrgEmploymentStatus
  benefits: string[]
}

const emptyEmployeeForm: EmployeeForm = {
  name: '', email: '', phone: '', userId: undefined, department: '', jobTitle: '',
  employmentType: 'full-time', hireDate: new Date().toISOString().slice(0, 10),
  salary: '', status: 'probation', benefits: [],
}

const BENEFIT_TYPES: { id: OrgBenefitType; label: string }[] = [
  { id: 'health', label: 'Health' },
  { id: 'retirement', label: 'Retirement' },
  { id: 'transport', label: 'Transport' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'training', label: 'Training' },
  { id: 'other', label: 'Other' },
]

const WORK_STATUSES: OrgEmploymentStatus[] = ['probation', 'active', 'on-leave']

export function HRMPage() {
  const bp = useBreakpoint()
  const { format } = useContext(CurrencyContext)
  const { orgUser } = useContext(Authcontext)

  const [active, setActive] = useState<TabId>('overview')
  const [state, setState] = useState<OrgHrmState | null>(null)
  const [benefits, setBenefits] = useState<OrgBenefit[]>([])
  const [attendance, setAttendance] = useState<OrgAttendanceRecord[]>([])
  const [summary, setSummary] = useState<OrgAttendanceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<OrgEmployee | null>(null)
  const [employeeForm, setEmployeeForm] = useState<EmployeeForm>(emptyEmployeeForm)

  const [showBenefitForm, setShowBenefitForm] = useState(false)
  const [editingBenefit, setEditingBenefit] = useState<OrgBenefit | null>(null)
  const [benefitForm, setBenefitForm] = useState<{ name: string; type: OrgBenefitType; cost: string; description: string }>({
    name: '', type: 'health', cost: '', description: '',
  })

  const [showTimeForm, setShowTimeForm] = useState(false)
  const [timeForm, setTimeForm] = useState<{ employee_id: string; date: string; hours: string; overtime_hours: string }>({
    employee_id: '', date: new Date().toISOString().slice(0, 10), hours: '', overtime_hours: '',
  })

  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState<{ employee_id: string; period: string; score: string; notes: string }>({
    employee_id: '', period: 'H2 2026', score: '', notes: '',
  })

   const employees = state ? state.employees : []
  const payrollRuns = state ? state.payrollRuns : []
  const timeEntries = state ? state.timeEntries : []
  const reviews = state ? state.reviews : []

  const activeCount = employees.filter(e => e.status === 'active').length
  const monthlyGross = employees
    .filter(e => e.status === 'active' || e.status === 'probation' || e.status === 'on-leave')
    .reduce((sum, e) => sum + e.salary, 0)
  const benefitsCost = benefits.reduce((sum, b) => sum + b.cost * b.enrollment, 0)
  const openReviews = reviews.filter(r => r.status === 'pending').length
  const loggedHours = timeEntries.reduce((sum, t) => sum + t.hours, 0)
  const overtimeHours = timeEntries.reduce((sum, t) => sum + t.overtime_hours, 0)
  const today = new Date().toISOString().slice(0, 10)
  const presentToday = attendance.filter(a => a.date === today && a.status === 'present').length
  const summaryByEmp = new Map(summary.map(s => [s.employee_id, s]))
  const todayByEmp = new Map(attendance.filter(a => a.date === today).map(a => [a.employee_id, a]))
  const rosterEmployees = employees.filter(e => e.status === 'active' || e.status === 'probation') 
  const [rosterEmployeesFilter, setRosterEmployeeFilter] = useState<OrgEmployee[]>(rosterEmployees);
  const [sumaryEmployees, setSummaryEmployees] = useState(summary)
  const [timeEntriesFilter, setTimeEntriesFilter] = useState(timeEntries)

  // Attendance terminal (QR confirmation).
  const [terminalEmployeeId, setTerminalEmployeeId] = useState('')
  const [terminalAction, setTerminalAction] = useState<'in' | 'out'>('in')
  const [qrData, setQrData] = useState('')
  const [copied, setCopied] = useState(false)
  const [terminalBusy, setTerminalBusy] = useState(false)
  const [terminalError, setTerminalError] = useState('')
  const [terminalDone, setTerminalDone] = useState('')
  const [bypassOpen, setBypassOpen] = useState(false)
  const selectedToday = terminalEmployeeId ? todayByEmp.get(terminalEmployeeId) : undefined
  const selectedHasCheckedIn = !!selectedToday?.check_in
  const selectedHasCheckedOut = !!selectedToday?.check_out

  const handleAttendanceFilter = (e: ChangeEvent) => {
    const target = e.currentTarget as HTMLInputElement
    console.log(target)
    if (target?.value == '') {
      setRosterEmployeeFilter(rosterEmployees);
      setSummaryEmployees(summary);
      setTimeEntriesFilter(timeEntries);
      return;
    }
    setRosterEmployeeFilter(rosterEmployees.filter(x => x.name?.toLowerCase()?.includes(target?.value?.toLowerCase())  ))
    setSummaryEmployees(summary.filter(x => x.employee_name?.toLowerCase()?.includes(target.value.toLowerCase())))
    setTimeEntriesFilter(timeEntries.filter(t => t.employee_name?.toLowerCase()?.includes(target?.value?.toLowerCase())))
  }

  const requestTerminalQr = (action: 'in' | 'out') => {
    if (!terminalEmployeeId) return
    setTerminalBusy(true)
    setTerminalError('')
    setTerminalDone('')
    api.org.attendance.requestQr(terminalEmployeeId, action)
      .then(res => {
        setTerminalAction(action)
        setQrData(res.token)
        pollTerminalStatus()
      })
      .catch((err: unknown) => {
        setQrData('')
        setTerminalError(err instanceof Error ? err.message : 'Could not generate QR code')
      })
      .finally(() => setTerminalBusy(false))
  }

  const markTerminalManual = (action: 'check_in' | 'check_out' | 'absent') => {
    if (!terminalEmployeeId) return
    setTerminalBusy(true)
    setTerminalError('')
    api.org.attendance.markManual(terminalEmployeeId, action)
      .then(() => {
        setTerminalDone(action === 'absent' ? 'Marked absent.' : action === 'check_in' ? 'Marked present (manual).' : 'Checked out (manual).')
        setQrData('')
        reload()
        setTimeout(() => setTerminalDone(''), 4000)
      })
      .catch((err: unknown) => setTerminalError(err instanceof Error ? err.message : 'Could not mark attendance'))
      .finally(() => setTerminalBusy(false))
  }

  const pollTerminalStatus = () => {
    // Poll the attendance list; once the selected employee has a record for today
    // written by the scanned QR, clear the QR and show confirmation.
    const id = window.setInterval(() => {
      api.org.attendance.getRecords()
        .then(records => {
          const rec = records.find(r => r.employee_id === terminalEmployeeId && r.date === today)
          if (terminalAction === 'in' && rec && rec.check_in) {
            window.clearInterval(id)
            setTerminalDone(`✅ ${rec.employee_name} confirmed present at ${rec.check_in}`)
            setQrData('')
            reload()
          } else if (terminalAction === 'out' && rec && rec.check_out) {
            window.clearInterval(id)
            setTerminalDone(`✅ ${rec.employee_name} checked out at ${rec.check_out}`)
            setQrData('')
            reload()
          }
        })
        .catch(() => {})
    }, 4000)
  }

  const reload = () => {
    api.org.hrm.getState()
      .then(s => {
        setState(s); 
        setRosterEmployeeFilter(s.employees.filter(e => e.status == 'active' || e.status == 'probation'))
        setTimeEntriesFilter(s.timeEntries)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load HR data'))
    api.org.hrm.getBenefits()
      .then(setBenefits)
      .catch(() => {})
    api.org.hrm.getAttendance()
      .then(setAttendance)
      .catch(() => {})
    api.org.hrm.getSummary()
      .then((data) => {setSummary(data); setSummaryEmployees(data)})
      .catch(() => {})
  }

  useMountEffect(() => {
    api.org.hrm.getState()
      .then(s => {
        setState(s); 
        setRosterEmployeeFilter(s.employees.filter(e => e.status == 'active' || e.status == 'probation'))
        setTimeEntriesFilter(s.timeEntries)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load HR data'))
      .finally(() => setLoading(false))
    api.org.hrm.getBenefits()
      .then(setBenefits)
      .catch(() => {})
    api.org.hrm.getAttendance()
      .then(setAttendance)
      .catch(() => {})
    api.org.hrm.getSummary()
      .then((data) => {setSummary(data); setSummaryEmployees(data)})
      .catch(() => {})
  })

  if (!canManageHRM(orgUser)) {
    return (
      <div style={{ width: '100%', padding: '40px 16px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Restricted area</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
          You do not have permission to view Human Resources. This area is only available to organisation admins and HRM managers.
        </p>
      </div>
    )
  }

 


  const openEmployeeForm = (employee?: OrgEmployee) => {
    setEditingEmployee(employee ?? null)
    if (employee) {
      setEmployeeForm({
        name: employee.name, email: employee.email, phone: employee.phone, userId: employee.userId || undefined,
        department: employee.department,
        jobTitle: employee.jobTitle, employmentType: employee.employmentType, hireDate: employee.hireDate,
        salary: String(employee.salary), status: employee.status === 'active' || employee.status === 'probation' || employee.status === 'on-leave' ? employee.status : 'active',
        benefits: [...employee.benefits],
      })
    } else {
      setEmployeeForm(emptyEmployeeForm)
    }
    setShowEmployeeForm(true)
  }

  const toggleBenefit = (id: string) => {
    setEmployeeForm(prev => ({
      ...prev,
      benefits: prev.benefits.includes(id) ? prev.benefits.filter(b => b !== id) : [...prev.benefits, id],
    }))
  }

  const submitEmployee = () => {
    if (!employeeForm.name.trim() || !employeeForm.email.trim() || !employeeForm.department.trim() || !employeeForm.jobTitle.trim()) return
    const input: OrgEmployeeInput = {
      name: employeeForm.name, email: employeeForm.email, phone: employeeForm.phone,
      userId: employeeForm.userId,
      department: employeeForm.department, jobTitle: employeeForm.jobTitle,
      employmentType: employeeForm.employmentType, hireDate: employeeForm.hireDate,
      salary: Number(employeeForm.salary) || 0, status: employeeForm.status, benefits: employeeForm.benefits,
    }
    const action = editingEmployee
      ? api.org.hrm.updateEmployee(editingEmployee.id, input)
      : api.org.hrm.createEmployee(input)
    action
      .then(() => {
        setShowEmployeeForm(false)
        setEditingEmployee(null)
        reload()
      })
      .catch(() => {})
  }

  const setEmployeeStatus = (employee: OrgEmployee, status: OrgEmploymentStatus) => {
    api.org.hrm.updateEmployee(employee.id, { status })
      .then(reload)
      .catch(() => {})
  }

  const openBenefitForm = (benefit?: OrgBenefit) => {
    setEditingBenefit(benefit ?? null)
    setBenefitForm(benefit
      ? { name: benefit.name, type: benefit.type, cost: String(benefit.cost), description: benefit.description }
      : { name: '', type: 'health', cost: '', description: '' })
    setShowBenefitForm(true)
  }

  const submitBenefit = () => {
    if (!benefitForm.name.trim()) return
    const input: OrgBenefitInput = {
      name: benefitForm.name, type: benefitForm.type,
      cost: Number(benefitForm.cost) || 0, description: benefitForm.description,
    }
    const action = editingBenefit
      ? api.org.hrm.updateBenefit(editingBenefit.id, input)
      : api.org.hrm.createBenefit(input)
    action
      .then(() => {
        setShowBenefitForm(false)
        setEditingBenefit(null)
        reload()
      })
      .catch(() => {})
  }

  const deleteBenefit = (id: string) => {
    api.org.hrm.deleteBenefit(id).then(reload).catch(() => {})
  }

  const submitTime = () => {
    const employee = employees.find(e => e.id === timeForm.employee_id)
    if (!employee) return
    const input: OrgTimeInput = {
      employee_id: employee.id, date: timeForm.date,
      hours: Number(timeForm.hours) || 0, overtime_hours: Number(timeForm.overtime_hours) || 0,
    }
    api.org.hrm.logTime(input)
      .then(() => {
        setShowTimeForm(false)
        setTimeForm({ employee_id: '', date: new Date().toISOString().slice(0, 10), hours: '', overtime_hours: '' })
        reload()
      })
      .catch(() => {})
  }

  const submitReview = () => {
    const employee = employees.find(e => e.id === reviewForm.employee_id)
    if (!employee) return
    const input: OrgReviewInput = {
      employee_id: employee.id, period: reviewForm.period,
      score: Number(reviewForm.score) || 0, notes: reviewForm.notes,
    }
    api.org.hrm.createReview(input)
      .then(() => {
        setShowReviewForm(false)
        setReviewForm({ employee_id: '', period: 'H2 2026', score: '', notes: '' })
        reload()
      })
      .catch(() => {})
  }

  const completeReview = (id: string) => {
    api.org.hrm.updateReview(id).then(reload).catch(() => {})
  }

  const runPayroll = () => {
    const period = currentPeriod()
    api.org.hrm.runPayroll(period)
      .then(runs => {
        setNotice(runs.length
          ? `Payroll run created for ${period} (${runs.length} run${runs.length === 1 ? '' : 's'})`
          : `Payroll already processed for ${period}`)
        reload()
        setTimeout(() => setNotice(''), 4000)
      })
      .catch(() => {})
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '38px', padding: '0 12px', border: '1px solid var(--border-input)',
    borderRadius: '8px', fontSize: '16px', outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)', boxSizing: 'border-box',
  }
  const selectStyle: React.CSSProperties = { ...inputStyle, padding: '0 8px' }
  const thStyle: React.CSSProperties = {
    padding: '10px 14px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em',
    color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--bg-tertiary)', textAlign: 'left', whiteSpace: 'nowrap',
  }
  const tdStyle: React.CSSProperties = {
    padding: '12px 14px', fontSize: '13px', color: 'var(--text-primary)', borderBottom: '1px solid var(--bg-secondary)', whiteSpace: 'nowrap',
  }
  const panelStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '16px', boxSizing: 'border-box',
  }

  const primaryBtn = {
    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 600,
    color: 'var(--text-on-dark)', background: 'var(--bg-nav-active)', border: 'none', borderRadius: '8px', cursor: 'pointer',
  }
  const ghostBtn = {
    padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
    background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: '8px', cursor: 'pointer',
  }

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: '16px', boxSizing: 'border-box', overflowX: 'hidden',
  } as React.CSSProperties
  const modalCard = {
    background: 'var(--bg-surface)', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '560px',
    maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px',
    boxSizing: 'border-box', minWidth: 0, overflowX: 'hidden',
  } as React.CSSProperties
  const modalHeader = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  } as React.CSSProperties
  const modalClose = {
    padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', display: 'inline-flex',
  } as React.CSSProperties
  const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block' }
  const fieldRow = { display: 'grid', gridTemplateColumns: bp.md ? 'repeat(2, 1fr)' : '1fr', gap: '12px 8px' } as React.CSSProperties
  const field = { minWidth: 0, width: '100%' } as React.CSSProperties
  const footer = { display: 'flex', gap: '8px', marginTop: '4px' } as React.CSSProperties
  const cancelBtn = { flex: 1, height: '40px', fontSize: '13px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer' } as React.CSSProperties
  const submitBtn = { flex: 1, height: '40px', fontSize: '13px', fontWeight: 500, background: 'var(--bg-nav-active)', color: 'var(--text-on-dark)', border: 'none', borderRadius: '8px', cursor: 'pointer' } as React.CSSProperties

  const tabBar = (
    <div style={{ width: 'auto', display: 'flex', gap: '4px', padding: '6px', borderRadius: '12px', background: 'transparent', overflowX: 'auto' }}>
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => setActive(t.id)}
          style={{
            padding: '9px 14px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap',
            color: active === t.id ? 'var(--bg-surface)' : 'var(--text-secondary)',
            background: active === t.id ? 'var(--bg-nav-active)' : 'transparent',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%', padding: '0 8px' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',  }}>
        {tabBar}
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {active === 'employees' && (
            <button onClick={() => openEmployeeForm()} style={primaryBtn as React.CSSProperties}>
              <Plus size={16} /> Add employee
            </button>
          )}
          {active === 'benefits' && (
            <button onClick={() => openBenefitForm()} style={primaryBtn as React.CSSProperties}>
              <Plus size={16} /> Add benefit
            </button>
          )}
          {active === 'payroll' && (
            <button onClick={runPayroll} style={primaryBtn as React.CSSProperties}>
              <DollarSign size={16} /> Run payroll
            </button>
          )}
          {active === 'attendance' && (
            <button onClick={() => setShowTimeForm(true)} style={primaryBtn as React.CSSProperties}>
              <Plus size={16} /> Log hours
            </button>
          )}
          {active === 'performance' && (
            <button onClick={() => setShowReviewForm(true)} style={primaryBtn as React.CSSProperties}>
              <Plus size={16} /> Add review
            </button>
          )}
        </div>
        </div>
      

      {notice && (
        <div style={{ width: '100%', padding: '10px 14px', background: 'rgba(16,185,129,0.12)', border: '1px solid var(--border-success)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-success)', fontWeight: 500 }}>
          {notice}
        </div>
      )}

      

      {loading ? (
        <p style={{ fontSize: '12px', color: 'var(--text-placeholder)', padding: '24px' }}>Loading HR data...</p>
      ) : error && !state ? (
        <p style={{ fontSize: '12px', color: 'var(--text-danger)', padding: '24px' }}>{error}</p>
      ) : state ? (
        <>
          {active === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <StatCard label="Total Employees" value={String(employees.length)} sub={`${activeCount} active · ${employees.filter(e => e.status === 'probation').length} probation`} icon={<Contact size={18} />} tone="accent" />
                <StatCard label="Monthly Payroll" value={format(monthlyGross)} sub="Gross (active + probation + leave)" icon={<Wallet size={18} />} tone="green" />
                <StatCard label="Benefits Cost" value={format(benefitsCost)} sub={`Across ${benefits.length} benefit plans / month`} icon={<ShieldCheck size={18} />} tone="neutral" />
                <StatCard label="Open Reviews" value={String(openReviews)} sub="Pending performance reviews" icon={<Star size={18} />} tone="amber" />
                <StatCard label="Present Today" value={String(presentToday)} sub={`Of ${rosterEmployees.length} active staff`} icon={<Clock size={18} />} tone="green" />
                <StatCard label="Hours Logged" value={String(loggedHours)} sub={`+ ${overtimeHours} overtime (recent)`} icon={<Clock size={18} />} tone="neutral" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: bp.xl ? '2fr 1fr' : '1fr', gap: '16px' }}>
                <div style={panelStyle}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Headcount by status</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(['active', 'probation', 'on-leave', 'retired', 'terminated'] as const).map(status => {
                      const count = employees.filter(e => e.status === status).length
                      const pct = employees.length ? Math.round((count / employees.length) * 100) : 0
                      return (
                        <div key={status}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{status}</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{count} · {pct}%</span>
                          </div>
                          <div style={{ height: '6px', borderRadius: '999px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: EMP_STATUS_STYLES[status].color, borderRadius: '999px' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={panelStyle}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Recent payroll</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{payrollRuns.length} runs · {payrollRuns.filter(r => r.status === 'paid').length} paid · {payrollRuns.filter(r => r.status === 'pending').length} pending</p>
                    <button onClick={() => setActive('payroll')} style={{ marginTop: '12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-on-dark)', background: 'var(--bg-nav-active)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}>Manage payroll</button>
                  </div>
                  <div style={panelStyle}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Team departments</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[...new Set(employees.map(e => e.department))].map(dept => {
                        const count = employees.filter(e => e.department === dept).length
                        return (
                          <div key={dept} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid var(--bg-secondary)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{dept}</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {active === 'employees' && (
            <div style={panelStyle}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Employee</th>
                      <th style={thStyle}>Department</th>
                      <th style={thStyle}>Job Title</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Hire Date</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Salary</th>
                      <th style={thStyle}>Attendance</th>
                      <th style={thStyle}>Review</th>
                      <th style={thStyle}>Status</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(employee => (
                      <tr key={employee.id} style={{ contentVisibility: 'auto', containIntrinsicSize: '64px' }}>
                        <td style={tdStyle}>
                          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{employee.name}</p>
                          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{employee.email}</p>
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{employee.department}</td>
                        <td style={tdStyle}>{employee.jobTitle}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{employee.employmentType}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{formatDate(employee.hireDate)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{format(employee.salary)}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                          {summaryByEmp.get(employee.id) ? `${summaryByEmp.get(employee.id)!.attendance_rate}%` : '—'}
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>
                          {summaryByEmp.get(employee.id)?.latest_review_score != null
                            ? `${summaryByEmp.get(employee.id)!.latest_review_score!.toFixed(1)} · ${summaryByEmp.get(employee.id)!.latest_review_rating}`
                            : '—'}
                        </td>
                        <td style={tdStyle}><EmpStatusBadge status={employee.status} /></td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button onClick={() => openEmployeeForm(employee)} title="Edit employee" style={ghostBtn as React.CSSProperties}>Edit</button>
                            {(employee.status === 'active' || employee.status === 'probation' || employee.status === 'on-leave') && (
                              <>
                                <button onClick={() => setEmployeeStatus(employee, 'retired')} title="Move to retirement" style={{ ...ghostBtn, color: 'var(--text-muted)' }}>Retire</button>
                                <button onClick={() => setEmployeeStatus(employee, 'terminated')} title="Terminate employment" style={{ ...ghostBtn, color: 'var(--text-danger)', borderColor: 'var(--border-danger, rgba(239,68,68,0.4))' }}>Terminate</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {employees.length === 0 && (
                      <tr><td colSpan={10} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-placeholder)' }}>No employees yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {active === 'payroll' && (
            <div style={panelStyle}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Period</th>
                      <th style={thStyle}>Employee</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Gross</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Tax</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Net</th>
                      <th style={thStyle}>Status</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollRuns.map(run => (
                      <tr key={run.id} style={{ contentVisibility: 'auto', containIntrinsicSize: '56px' }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{run.period}</td>
                        <td style={tdStyle}>{run.employee_name}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{format(run.gross)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--text-muted)' }}>{format(run.tax)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{format(run.net)}</td>
                        <td style={tdStyle}><PayStatusBadge status={run.status} /></td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          {run.status === 'pending' && (
                            <button onClick={() => api.org.hrm.setPayrollStatus(run.id, 'paid').then(reload).catch(() => {})} style={ghostBtn as React.CSSProperties}>
                              <CheckCircle2 size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Mark paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {payrollRuns.length === 0 && (
                      <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-placeholder)' }}>No payroll runs yet — run payroll for {currentPeriod()}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/**Attendance */}
          {active === 'attendance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              <div style={{display: 'flex', flexDirection: 'column',   marginInlineStart: 'auto', width: '100%' }}> 
                  <input onChange={handleAttendanceFilter} placeholder='Search Attendence...' style={{width: '100%', borderRadius: '.3rem', padding: '.5rem .5rem', height: '100%', border: '1px solid var(--border-default)', outline: 'none', background: 'var(--bg-surface)', }}/>
                </div>

              <div style={{ ...panelStyle, background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(2,6,23,0.2))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <QrCode size={18} style={{ color: 'var(--text-primary)' }} />
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Attendance terminal</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: bp.md ? '1.4fr 1fr' : '1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block' }}>Search employee</label>
                      <input
                        list="terminal-employees"
                        placeholder="Type employee name…"
                        value={employees.find(e => e.id === terminalEmployeeId)?.name ?? ''}
                        onChange={e => {
                          const name = e.target.value
                          const match = rosterEmployees.find(x => x.name?.toLowerCase() === name.toLowerCase())
                          setTerminalEmployeeId(match ? match.id : '')
                          setQrData('')
                        }}
                        style={inputStyle}
                      />
                      <datalist id="terminal-employees">
                        {rosterEmployees.map(e => <option key={e.id} value={e.name} />)}
                      </datalist>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {terminalEmployeeId && !selectedHasCheckedIn && (
                        <button onClick={() => requestTerminalQr('in')} disabled={terminalBusy} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, color: 'var(--text-on-dark)', background: 'var(--bg-nav-active)', border: 'none', borderRadius: '8px', cursor: terminalBusy ? 'not-allowed' : 'pointer' }}>
                          <ScanLine size={14} /> Show check-in QR
                        </button>
                      )}
                      {terminalEmployeeId && selectedHasCheckedIn && !selectedHasCheckedOut && (
                        <button onClick={() => requestTerminalQr('out')} disabled={terminalBusy} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, color: 'var(--text-on-dark)', background: 'var(--bg-nav-active)', border: 'none', borderRadius: '8px', cursor: terminalBusy ? 'not-allowed' : 'pointer' }}>
                          <CalendarCheck2 size={14} /> Show check-out QR
                        </button>
                      )}
                      {terminalEmployeeId && selectedHasCheckedOut && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6ee7b7', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.15)' }}>
                          <CheckCircle2 size={14} /> Checked in & out today
                        </span>
                      )}
                      <div style={{ position: 'relative', marginLeft: 'auto' }}>
                        <button
                          onClick={() => setBypassOpen(o => !o)}
                          disabled={!terminalEmployeeId}
                          title="Admin options"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '8px', border: 'none', cursor: terminalEmployeeId ? 'pointer' : 'not-allowed', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', opacity: terminalEmployeeId ? 1 : 0.5 }}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {bypassOpen && (
                          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '6px', boxShadow: '0 10px 30px rgba(0,0,0,0.35)', minWidth: '170px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '4px 8px' }}>Admin bypass</span>
                            <button onClick={() => { markTerminalManual('check_in'); setBypassOpen(false) }} disabled={terminalBusy} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, padding: '8px', color: 'var(--text-primary)', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}>
                              <CheckCircle2 size={14} color="#6ee7b7" /> Mark present
                            </button>
                            <button onClick={() => { markTerminalManual('check_out'); setBypassOpen(false) }} disabled={terminalBusy} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, padding: '8px', color: 'var(--text-primary)', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}>
                              <Clock size={14} color="#93c5fd" /> Mark checked out
                            </button>
                            <button onClick={() => { markTerminalManual('absent'); setBypassOpen(false) }} disabled={terminalBusy} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, padding: '8px', color: 'var(--text-danger)', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}>
                              <X size={14} /> Mark absent
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {terminalError && <p style={{ fontSize: '12px', color: 'var(--text-danger)', margin: 0 }}>{terminalError}</p>}
                    {terminalDone && <p style={{ fontSize: '12px', color: 'var(--text-success)', margin: 0, fontWeight: 500 }}>{terminalDone}</p>}
                    {qrData && !terminalDone && (
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                        Waiting for {employees.find(e => e.id === terminalEmployeeId)?.name} to scan… (expires in ~2 min)
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#ffffff', borderRadius: '12px', padding: '16px' }}>
                    {qrData ? (
                      <>
                        <QRCodeSVG value={qrData} size={180} />
                        <span style={{ fontSize: '11px', color: '#334155', fontWeight: 500 }}>{'Check-' + (terminalAction === 'in' ? 'in' : 'out')} QR · show to employee</span>
                        <button
                          onClick={() => { navigator.clipboard?.writeText(qrData); setCopied(true); setTimeout(() => setCopied(false), 2500) }}
                          title="Copy code for manual entry"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: '8px 12px', color: '#0f172a', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        >
                          <Copy size={14} /> {copied ? 'Copied!' : 'Copy code'}
                        </button>
                        <code style={{ fontSize: '10px', color: '#64748b', maxWidth: '100%', overflowWrap: 'anywhere', textAlign: 'center', userSelect: 'all' }}>{qrData}</code>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '24px' }}>
                        <QrCode size={40} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                        Select an employee and press a QR button to begin.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={panelStyle}>
                <div style={{display: 'flex', alignItems: 'center', width: '100%',}}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Today's attendance</h3>
                  
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Employee</th>
                        <th style={thStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rosterEmployeesFilter.map(employee => {
                        const record = todayByEmp.get(employee.id)
                        return (
                          <tr key={employee.id} style={{ contentVisibility: 'auto', containIntrinsicSize: '48px' }}>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>{employee.name}</td>
                            <td style={tdStyle}>
                              {record
                                ? <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(16,185,129,0.18)', color: '#6ee7b7', whiteSpace: 'nowrap' }}>Present · {record.check_in}</span>
                                : <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'var(--bg-secondary)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Pending</span>}
                            </td>
                          </tr>
                        )
                      })}
                      {rosterEmployeesFilter.length === 0 && (
                        <tr><td colSpan={2} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-placeholder)' }}>No active staff</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={panelStyle}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Attendance &amp; performance summary</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Employee</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Scheduled</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Present</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Absent</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Rate</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Hours</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Overtime</th>
                        <th style={thStyle}>Latest Review</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sumaryEmployees.map(row => (
                        <tr key={row.employee_id} style={{ contentVisibility: 'auto', containIntrinsicSize: '56px' }}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{row.employee_name}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--text-muted)' }}>{row.scheduled_days}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--text-muted)' }}>{row.present_days}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: row.absent_days > 0 ? 'var(--text-danger)' : 'var(--text-muted)' }}>{row.absent_days}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{row.attendance_rate}%</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{row.total_hours}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: row.overtime_hours > 0 ? '#fbbf24' : 'var(--text-muted)' }}>{row.overtime_hours}</td>
                          <td style={{ ...tdStyle }}>
                            {row.latest_review_score != null ? (
                              <>
                                {row.latest_review_score.toFixed(1)} <RatingBadge rating={row.latest_review_rating!} />
                              </>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                      {sumaryEmployees.length === 0 && (
                        <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-placeholder)' }}>No attendance data yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={panelStyle}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Time entries</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>Employee</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Hours</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Overtime</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeEntriesFilter.map(entry => (
                        <tr key={entry.id} style={{ contentVisibility: 'auto', containIntrinsicSize: '44px' }}>
                          <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{formatDate(entry.date)}</td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{entry.employee_name}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{entry.hours}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: entry.overtime_hours > 0 ? '#fbbf24' : 'var(--text-muted)' }}>{entry.overtime_hours}</td>
                        </tr>
                      ))}
                      {timeEntriesFilter.length === 0 && (
                        <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-placeholder)' }}>No time entries yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {active === 'performance' && (
            <div style={panelStyle}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Employee</th>
                      <th style={thStyle}>Period</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Score</th>
                      <th style={thStyle}>Rating</th>
                      <th style={thStyle}>Notes</th>
                      <th style={thStyle}>Status</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map(review => (
                      <tr key={review.id} style={{ contentVisibility: 'auto', containIntrinsicSize: '56px' }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{review.employee_name}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{review.period}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{review.score.toFixed(1)}</td>
                        <td style={tdStyle}><RatingBadge rating={review.rating} /></td>
                        <td style={{ ...tdStyle, color: 'var(--text-muted)', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{review.notes || '—'}</td>
                        <td style={tdStyle}><PayStatusBadge status={review.status === 'completed' ? 'paid' : 'pending'} /></td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          {review.status === 'pending' && (
                            <button onClick={() => completeReview(review.id)} style={ghostBtn as React.CSSProperties}>
                              <CheckCircle2 size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {reviews.length === 0 && (
                      <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-placeholder)' }}>No reviews yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {active === 'benefits' && (
            <div style={{ display: 'grid', gridTemplateColumns: bp.md ? 'repeat(2, 1fr)' : '1fr', gap: '12px', width: '100%' }}>
              {benefits.map(benefit => (
                <div key={benefit.id} style={{ ...panelStyle, contentVisibility: 'auto', containIntrinsicSize: '150px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', color: '#93c5fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={15} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{benefit.name}</span>
                    </div>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', textTransform: 'capitalize', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>{benefit.type}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 10px 0', minHeight: '32px' }}>{benefit.description || '—'}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{format(benefit.cost)}<span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>/mo</span></p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{benefit.enrollment} enrolled</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openBenefitForm(benefit)} style={ghostBtn as React.CSSProperties}>Edit</button>
                      <button onClick={() => deleteBenefit(benefit.id)} style={{ ...ghostBtn, color: 'var(--text-danger)' }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {benefits.length === 0 && (
                <div style={{ ...panelStyle, textAlign: 'center', color: 'var(--text-placeholder)', fontSize: '12px', gridColumn: '1 / -1' }}>
                  No benefits yet — add your first benefit plan.
                </div>
              )}
            </div>
          )}
        </>
      ) : null}

      {/* Employee add/edit modal */}
      {showEmployeeForm && (
        <div style={overlay} onClick={() => setShowEmployeeForm(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {editingEmployee ? `Edit ${editingEmployee.name}` : 'Add employee'}
              </h3>
              <button onClick={() => setShowEmployeeForm(false)} style={modalClose}><X size={14} /></button>
            </div>
            <div style={fieldRow}>
              <div style={field}>
                <label style={labelStyle}>Full name</label>
                <input value={employeeForm.name} onChange={e => setEmployeeForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Employee name" />
              </div>
              <div style={field}>
                <label style={labelStyle}>Email</label>
                <input value={employeeForm.email} onChange={e => setEmployeeForm(p => ({ ...p, email: e.target.value }))} style={inputStyle} placeholder="name@org.example" />
              </div>
            </div>
            <div style={fieldRow}>
              <div style={field}>
                <label style={labelStyle}>Department</label>
                <input value={employeeForm.department} onChange={e => setEmployeeForm(p => ({ ...p, department: e.target.value }))} style={inputStyle} placeholder="e.g. Sales" />
              </div>
              <div style={field}>
                <label style={labelStyle}>Job title</label>
                <input value={employeeForm.jobTitle} onChange={e => setEmployeeForm(p => ({ ...p, jobTitle: e.target.value }))} style={inputStyle} placeholder="e.g. Cashier" />
              </div>
            </div>
            <div style={fieldRow}>
              <div style={field}>
                <label style={labelStyle}>Employment type</label>
                <select value={employeeForm.employmentType} onChange={e => setEmployeeForm(p => ({ ...p, employmentType: e.target.value as OrgEmploymentType }))} style={selectStyle}>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <div style={field}>
                <label style={labelStyle}>Status</label>
                <select value={employeeForm.status} onChange={e => setEmployeeForm(p => ({ ...p, status: e.target.value as OrgEmploymentStatus }))} style={selectStyle}>
                  {WORK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={fieldRow}>
              <div style={field}>
                <label style={labelStyle}>Hire date</label>
                <input type="date" value={employeeForm.hireDate} onChange={e => setEmployeeForm(p => ({ ...p, hireDate: e.target.value }))} style={inputStyle} />
              </div>
              <div style={field}>
                <label style={labelStyle}>Monthly salary</label>
                <input type="number" min="0" value={employeeForm.salary} onChange={e => setEmployeeForm(p => ({ ...p, salary: e.target.value }))} style={inputStyle} placeholder="0" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Benefits</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {benefits.map(benefit => (
                  <button
                    key={benefit.id}
                    type="button"
                    onClick={() => toggleBenefit(benefit.id)}
                    style={{
                      padding: '6px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '999px', cursor: 'pointer',
                      border: employeeForm.benefits.includes(benefit.id) ? 'none' : '1px solid var(--border-default)',
                      background: employeeForm.benefits.includes(benefit.id) ? 'var(--bg-nav-active)' : 'var(--bg-surface)',
                      color: employeeForm.benefits.includes(benefit.id) ? 'var(--text-secondary-b)' : 'var(--text-secondary)',
                    }}
                  >
                    {benefit.name}
                  </button>
                ))}
                {benefits.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>No benefit plans yet</span>}
              </div>
            </div>
            <div style={footer}>
              <button onClick={() => setShowEmployeeForm(false)} style={cancelBtn}>Cancel</button>
              <button onClick={submitEmployee} style={submitBtn}>{editingEmployee ? 'Save changes' : 'Add employee'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Benefit add/edit modal */}
      {showBenefitForm && (
        <div style={overlay} onClick={() => setShowBenefitForm(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{editingBenefit ? `Edit ${editingBenefit.name}` : 'Add benefit'}</h3>
              <button onClick={() => setShowBenefitForm(false)} style={modalClose}><X size={14} /></button>
            </div>
            <div>
              <label style={labelStyle}>Benefit name</label>
              <input value={benefitForm.name} onChange={e => setBenefitForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="e.g. Dental Cover" />
            </div>
            <div style={fieldRow}>
              <div style={field}>
                <label style={labelStyle}>Type</label>
                <select value={benefitForm.type} onChange={e => setBenefitForm(p => ({ ...p, type: e.target.value as OrgBenefitType }))} style={selectStyle}>
                  {BENEFIT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div style={field}>
                <label style={labelStyle}>Monthly cost / employee</label>
                <input type="number" min="0" value={benefitForm.cost} onChange={e => setBenefitForm(p => ({ ...p, cost: e.target.value }))} style={inputStyle} placeholder="0" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input value={benefitForm.description} onChange={e => setBenefitForm(p => ({ ...p, description: e.target.value }))} style={inputStyle} placeholder="What the plan covers" />
            </div>
            <div style={footer}>
              <button onClick={() => setShowBenefitForm(false)} style={cancelBtn}>Cancel</button>
              <button onClick={submitBenefit} style={submitBtn}>{editingBenefit ? 'Save changes' : 'Add benefit'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Log hours modal */}
      {showTimeForm && (
        <div style={overlay} onClick={() => setShowTimeForm(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Log hours</h3>
              <button onClick={() => setShowTimeForm(false)} style={modalClose}><X size={14} /></button>
            </div>
            <div>
              <label style={labelStyle}>Employee</label>
              <select value={timeForm.employee_id} onChange={e => setTimeForm(p => ({ ...p, employee_id: e.target.value }))} style={selectStyle}>
                <option value="">Select employee</option>
                {employees.filter(e => e.status === 'active' || e.status === 'probation').map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <div style={fieldRow}>
              <div style={field}>
                <label style={labelStyle}>Date</label>
                <input type="date" value={timeForm.date} onChange={e => setTimeForm(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
              </div>
              <div style={field}>
                <label style={labelStyle}>Hours</label>
                <input type="number" min="0" max="24" value={timeForm.hours} onChange={e => setTimeForm(p => ({ ...p, hours: e.target.value }))} style={inputStyle} placeholder="8" />
              </div>
              <div style={field}>
                <label style={labelStyle}>Overtime</label>
                <input type="number" min="0" max="24" value={timeForm.overtime_hours} onChange={e => setTimeForm(p => ({ ...p, overtime_hours: e.target.value }))} style={inputStyle} placeholder="0" />
              </div>
            </div>
            <div style={footer}>
              <button onClick={() => setShowTimeForm(false)} style={cancelBtn}>Cancel</button>
              <button onClick={submitTime} style={submitBtn}>Log hours</button>
            </div>
          </div>
        </div>
      )}

      {/* Add review modal */}
      {showReviewForm && (
        <div style={overlay} onClick={() => setShowReviewForm(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Add performance review</h3>
              <button onClick={() => setShowReviewForm(false)} style={modalClose}><X size={14} /></button>
            </div>
            <div>
              <label style={labelStyle}>Employee</label>
              <select value={reviewForm.employee_id} onChange={e => setReviewForm(p => ({ ...p, employee_id: e.target.value }))} style={selectStyle}>
                <option value="">Select employee</option>
                {employees.filter(e => e.status === 'active' || e.status === 'probation').map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <div style={fieldRow}>
              <div style={field}>
                <label style={labelStyle}>Period</label>
                <input value={reviewForm.period} onChange={e => setReviewForm(p => ({ ...p, period: e.target.value }))} style={inputStyle} placeholder="H2 2026" />
              </div>
              <div style={field}>
                <label style={labelStyle}>Score (1-5)</label>
                <input type="number" min="0" max="5" step="0.1" value={reviewForm.score} onChange={e => setReviewForm(p => ({ ...p, score: e.target.value }))} style={inputStyle} placeholder="4.0" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea value={reviewForm.notes} onChange={e => setReviewForm(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} placeholder="Review notes" />
            </div>
            <div style={footer}>
              <button onClick={() => setShowReviewForm(false)} style={cancelBtn}>Cancel</button>
              <button onClick={submitReview} style={submitBtn}>Add review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
