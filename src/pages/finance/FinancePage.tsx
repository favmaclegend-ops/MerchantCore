import { useContext, useEffect, useState } from 'react'
import {
  Plus, Wallet, TrendingUp, TrendingDown, CheckCircle, Ban, Send, X, ReceiptText, FileText, Trash2,
} from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { api } from '@/lib/api'
import { Authcontext } from '@/context/auth_context'
import { CurrencyContext } from '@/context/currency_context'
import { buildBalanceSheet, type FinanceState, type Invoice, type InvoiceStatus, type OrgCustomer } from '@/lib/orgTypes'
import { useConfirm } from '@/components/confirm/confirm'

type TabId = 'overview' | 'ledger' | 'invoices' | 'tax' | 'balance'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'ledger', label: 'General Ledger' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'tax', label: 'Tax & Compliance' },
  { id: 'balance', label: 'Balance Sheet' },
]

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString()
}

function StatusBadge({ status }: { status: Invoice['status'] }) {
  const styles: Record<Invoice['status'], React.CSSProperties> = {
    draft: { background: 'var(--bg-secondary)', color: 'var(--text-muted)' },
    sent: { background: 'rgba(59,130,246,0.18)', color: '#93c5fd' },
    paid: { background: 'rgba(16,185,129,0.18)', color: '#6ee7b7' },
    overdue: { background: 'rgba(239,68,68,0.18)', color: '#fca5a5' },
    void: { background: 'var(--bg-secondary)', color: 'var(--text-placeholder)' },
  }
  return (
    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', textTransform: 'capitalize', whiteSpace: 'nowrap', ...styles[status] }}>
      {status}
    </span>
  )
}

function TaxBadge({ status }: { status: 'paid' | 'due' | 'upcoming' }) {
  const styles: Record<'paid' | 'due' | 'upcoming', React.CSSProperties> = {
    paid: { background: 'rgba(16,185,129,0.18)', color: '#6ee7b7' },
    due: { background: 'rgba(239,68,68,0.18)', color: '#fca5a5' },
    upcoming: { background: 'rgba(245,158,11,0.18)', color: '#fbbf24' },
  }
  return (
    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', textTransform: 'capitalize', whiteSpace: 'nowrap', ...styles[status] }}>
      {status}
    </span>
  )
}

function StatCard({ label, value, sub, icon, tone }: { label: string; value: string; sub?: string; icon: React.ReactNode; tone: 'green' | 'red' | 'neutral' | 'accent' }) {
  const colors = {
    green: { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' },
    red: { background: 'rgba(239,68,68,0.15)', color: '#fca5a5' },
    neutral: { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
    accent: { background: 'rgba(59,130,246,0.15)', color: '#93c5fd' },
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

type InvoiceFormItem = { description: string; qty: string; unitPrice: string }

export function FinancePage() {
  const bp = useBreakpoint()
  const { format } = useContext(CurrencyContext)
  const { orgUser } = useContext(Authcontext)
  const { confirm } = useConfirm()

  const [active, setActive] = useState<TabId>('overview')
  const [state, setState] = useState<FinanceState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [customers, setCustomers] = useState<OrgCustomer[]>([])
  const [invoiceForm, setInvoiceForm] = useState<{ customerId: string; dueAt: string; items: InvoiceFormItem[] }>({
    customerId: '',
    dueAt: '',
    items: [{ description: '', qty: '1', unitPrice: '' }],
  })
  const [showTaxForm, setShowTaxForm] = useState(false)
  const [taxForm, setTaxForm] = useState({ name: '', rate: '5', basis: '', period: '', dueAt: '', paid: '0' })

  const loadState = (initial = false) => {
    api.org.finance.getState()
      .then(s => setState(s))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load finance data'))
      .finally(() => { if (initial) setLoading(false) })
  }

  useEffect(() => {
    loadState(true)
    const id = setInterval(() => loadState(), 30_000)
    return () => clearInterval(id)
  }, [])

  if (!orgUser || orgUser.role === 'staff') {
    return (
      <div style={{ width: '100%', padding: '40px 16px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Restricted area</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
          You do not have permission to view Finance &amp; Accounting. This area is only available to organisation admins.
        </p>
      </div>
    )
  }

  // Prefer server-computed aggregates; fall back to local recomputation.
  const income = state ? (state.income ?? state.ledger.filter(e => e.category === 'income').reduce((sum, e) => sum + e.amount, 0)) : 0
  const expenses = state ? (state.expenses ?? state.ledger.filter(e => e.category === 'expense').reduce((sum, e) => sum + e.amount, 0)) : 0
  // Ledger is the single, consistent source of truth for the P&L: every
  // completed POS sale posts an income line, refunds post an expense, and
  // payroll posts an expense when marked paid. No POS fallback.
  const totalRevenue = income
  // P&L expenses grouped by account (payroll appears here once a run is paid).
  const expenseByAccount = state
    ? state.ledger
        .filter(e => e.category === 'expense')
        .reduce<{ account: string; amount: number }[]>((acc, e) => {
          const existing = acc.find(x => x.account === e.account)
          if (existing) existing.amount += e.amount
          else acc.push({ account: e.account, amount: e.amount })
          return acc
        }, [])
        .sort((a, b) => b.amount - a.amount)
    : []
  const netProfit = totalRevenue - expenses
  // Current month (this period) figures for a roll-up P&L.
  const thisMonth = new Date().toISOString().slice(0, 7)
  const thisMonthIncome = state ? state.ledger.filter(e => e.category === 'income' && e.date && e.date.startsWith(thisMonth)).reduce((s, e) => s + e.amount, 0) : 0
  const thisMonthExpenses = state ? state.ledger.filter(e => e.category === 'expense' && e.date && e.date.startsWith(thisMonth)).reduce((s, e) => s + e.amount, 0) : 0
  const thisMonthNet = thisMonthIncome - thisMonthExpenses
  const balanceSheet = state ? buildBalanceSheet(state, totalRevenue - expenses) : null
  const cashOnHand = balanceSheet ? balanceSheet.assets[0].value : 0
  const outstanding = state
    ? (state.outstanding ?? state.invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0))
    : 0
  const overdueCount = state ? state.invoices.filter(i => i.status === 'overdue').length : 0
  const taxPayable = state
    ? (state.totalDue ?? state.taxes.reduce((sum, t) => sum + Math.round(t.basis * t.rate) / 100 - t.paid, 0))
    : 0
  const taxPaid = state ? state.taxes.reduce((sum, t) => sum + t.paid, 0) : 0
  const nextTaxDue = state
    ? state.taxes.filter(t => t.status !== 'paid').sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0]
    : null

  const filteredLedger = state
    ? state.ledger.filter(e => ledgerFilter === 'all' || e.category === ledgerFilter)
    : []

  const changeStatus = (invoice: Invoice, status: InvoiceStatus) => {
    api.org.finance.setInvoiceStatus(invoice.id, status).then(() => loadState()).catch(() => {})
  }

  const deleteInvoice = async (invoiceId: string) => {
    if (!await confirm({ title: 'Delete this invoice permanently?' })) return
    api.org.finance.deleteInvoice(invoiceId).then(() => loadState()).catch(() => {})
  }

  const submitInvoice = () => {
    const items = invoiceForm.items
      .filter(item => item.description.trim() && Number(item.qty) > 0 && Number(item.unitPrice) > 0)
      .map(item => ({ description: item.description.trim(), qty: Number(item.qty), unitPrice: Number(item.unitPrice) }))
    const customer = customers.find(c => c.id === invoiceForm.customerId)
    if (!customer || items.length === 0) return
    api.org.finance.createInvoice({ customer: customer.name, customerId: customer.id, customerEmail: customer.email, dueAt: invoiceForm.dueAt, items })
      .then(() => {
        setShowInvoiceForm(false)
        setInvoiceForm({ customerId: '', dueAt: '', items: [{ description: '', qty: '1', unitPrice: '' }] })
        loadState()
      })
      .catch(() => {})
  }

  const submitTax = () => {
    const name = taxForm.name.trim()
    const rate = Number(taxForm.rate)
    const basis = Number(taxForm.basis)
    if (!name || rate <= 0 || basis <= 0) return
    api.org.finance.createTaxItem({
      name,
      rate,
      basis,
      period: taxForm.period.trim(),
      dueAt: taxForm.dueAt,
      paid: Number(taxForm.paid) || 0,
    })
      .then(() => {
        setShowTaxForm(false)
        setTaxForm({ name: '', rate: '5', basis: '', period: '', dueAt: '', paid: '0' })
        loadState()
      })
      .catch(() => {})
  }

  const markTaxPaid = (taxId: string) => {
    const tax = state?.taxes.find(t => t.id === taxId)
    const payable = tax ? Math.max(0, Math.round(tax.basis * tax.rate) / 100) : 0
    api.org.finance.updateTaxItem(taxId, { paid: payable, status: 'paid' })
      .then(() => loadState())
      .catch(() => {})
  }

  const deleteTax = (taxId: string) => {
    api.org.finance.deleteTaxItem(taxId)
      .then(() => loadState())
      .catch(() => {})
  }

  const updateItem = (index: number, patch: Partial<InvoiceFormItem>) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }))
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '38px', padding: '0 12px', border: '1px solid var(--border-input)',
    borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)', boxSizing: 'border-box',
  }
  const thStyle: React.CSSProperties = {
    padding: '10px 14px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em',
    color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--bg-tertiary)', textAlign: 'left', whiteSpace: 'nowrap',
  }
  const tdStyle: React.CSSProperties = {
    padding: '12px 14px', fontSize: '13px', color: 'var(--text-primary)', borderBottom: '1px solid var(--bg-secondary)', whiteSpace: 'nowrap',
  }

  const tabBar = (
    <div style={{ width: '100%', display: 'flex', gap: '4px', padding: '6px', borderRadius: '12px', background: 'transparent', overflowX: 'auto' }}>
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

  const panelStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '16px', boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%', padding: '0 8px' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Finance &amp; Accounting</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Cash flow, invoicing, tax compliance &amp; financial health</p>
        </div>
        <button onClick={() => { api.org.getCustomers().then(setCustomers).catch(() => setCustomers([])); setShowInvoiceForm(true) }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, color: 'var(--text-on-dark)', background: 'var(--bg-nav-active)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          <Plus size={16} /> Create invoice
        </button>
      </div>

      {tabBar}

      {loading ? (
        <p style={{ fontSize: '12px', color: 'var(--text-placeholder)', padding: '24px' }}>Loading finance data...</p>
      ) : error && !state ? (
        <p style={{ fontSize: '12px', color: 'var(--text-danger)', padding: '24px' }}>{error}</p>
      ) : state ? (
        <>
          {active === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <StatCard label="Total Revenue" value={format(totalRevenue)} sub="From general ledger" icon={<TrendingUp size={18} />} tone="green" />
                <StatCard label="Total Expenses" value={format(expenses)} sub="From general ledger" icon={<TrendingDown size={18} />} tone="red" />
                <StatCard label="Net Profit" value={format(netProfit)} sub="Revenue minus all expenses" icon={<Wallet size={18} />} tone={netProfit >= 0 ? 'green' : 'red'} />
                <StatCard label="Cash on Hand" value={format(cashOnHand)} sub="Balance sheet snapshot" icon={<ReceiptText size={18} />} tone="neutral" />
              </div>

              <div style={panelStyle}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Profit &amp; Loss</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
                  Revenue minus every expense (including payroll once runs are marked paid) = net profit.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>Revenue (income)</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#6ee7b7' }}>{format(totalRevenue)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>Total expenses</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#fca5a5' }}>-{format(expenses)}</span>
                  </div>
                  {expenseByAccount.map(e => (
                    <div key={e.account} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingLeft: '14px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{e.account}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>-{format(e.amount)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid var(--bg-secondary)', paddingTop: '10px', marginTop: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Net profit</span>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: netProfit >= 0 ? '#6ee7b7' : '#fca5a5' }}>{netProfit < 0 ? '-' : ''}{format(Math.abs(netProfit))}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid var(--bg-secondary)', paddingTop: '10px', marginTop: '14px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>This month (net)</span>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: thisMonthNet >= 0 ? '#6ee7b7' : '#fca5a5' }}>{thisMonthNet < 0 ? '-' : ''}{format(Math.abs(thisMonthNet))}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingLeft: '14px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Income this month</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{format(thisMonthIncome)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingLeft: '14px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Expenses this month</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>-{format(thisMonthExpenses)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: bp.xl ? '2fr 1fr' : '1fr', gap: '16px' }}>
                <div style={panelStyle}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Recent activity</h3>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {[...state.ledger].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map(entry => (
                      <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--bg-secondary)' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: entry.category === 'income' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
                          {entry.category === 'income' ? <TrendingUp size={15} color="#6ee7b7" /> : <TrendingDown size={15} color="#fca5a5" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.account} · {entry.description}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{formatDate(entry.date)} · {entry.reference}</p>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: entry.category === 'income' ? '#6ee7b7' : '#fca5a5', flexShrink: 0 }}>
                          {entry.category === 'income' ? '+' : '-'}{format(entry.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={panelStyle}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Invoices</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Outstanding (sent + overdue)</p>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 8px 0' }}>{format(outstanding)}</p>
                    <p style={{ fontSize: '12px', color: overdueCount ? '#fca5a5' : 'var(--text-muted)', margin: 0 }}>{overdueCount} overdue invoice{overdueCount === 1 ? '' : 's'}</p>
                    <button onClick={() => setActive('invoices')} style={{ marginTop: '12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-on-dark)', background: 'var(--bg-nav-active)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}>Manage invoices</button>
                  </div>
                  <div style={panelStyle}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Tax compliance</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Unpaid tax liability</p>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 8px 0' }}>{format(taxPayable)}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Next due: {nextTaxDue ? `${nextTaxDue.name} — ${formatDate(nextTaxDue.dueAt)}` : 'None'}</p>
                    <button onClick={() => setActive('tax')} style={{ marginTop: '12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-on-dark)', background: 'var(--bg-nav-active)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}>View obligations</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {active === 'ledger' && (
            <div style={panelStyle}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {(['all', 'income', 'expense'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setLedgerFilter(f)}
                    style={{
                      padding: '6px 12px', fontSize: '12px', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', textTransform: 'capitalize',
                      color: ledgerFilter === f ? 'var(--bg-surface)' : 'var(--text-secondary)',
                      background: ledgerFilter === f ? 'var(--bg-nav-active)' : 'var(--bg-secondary)',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Reference</th>
                      <th style={thStyle}>Account</th>
                      <th style={thStyle}>Description</th>
                      <th style={thStyle}>Status</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredLedger].sort((a, b) => b.date.localeCompare(a.date)).map(entry => (
                      <tr key={entry.id}>
                        <td style={tdStyle}>{formatDate(entry.date)}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{entry.reference}</td>
                        <td style={tdStyle}>{entry.account}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{entry.description}</td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: 'var(--bg-secondary)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{entry.status}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: entry.category === 'income' ? '#6ee7b7' : entry.category === 'expense' ? '#fca5a5' : 'var(--text-primary)' }}>
                          {entry.category === 'expense' ? '-' : '+'}{format(entry.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {active === 'invoices' && (
            <div style={panelStyle}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Number</th>
                      <th style={thStyle}>Customer</th>
                      <th style={thStyle}>Issued</th>
                      <th style={thStyle}>Due</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                      <th style={thStyle}>Status</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.invoices.map(invoice => (
                      <tr key={invoice.id}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{invoice.number}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600 }}>{invoice.customer}</div>
                          {invoice.customerEmail && <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>{invoice.customerEmail}</div>}
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{formatDate(invoice.issuedAt)}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{formatDate(invoice.dueAt)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{format(invoice.amount)}</td>
                        <td style={tdStyle}><StatusBadge status={invoice.status} /></td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {invoice.status === 'draft' && (
                              <button onClick={() => changeStatus(invoice, 'sent')} title="Mark as sent" style={{ padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', display: 'inline-flex' }}>
                                <Send size={14} />
                              </button>
                            )}
                            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                              <button onClick={() => changeStatus(invoice, 'paid')} title="Mark as paid" style={{ padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(16,185,129,0.18)', color: '#6ee7b7', display: 'inline-flex' }}>
                                <CheckCircle size={14} />
                              </button>
                            )}
                            {(invoice.status === 'draft' || invoice.status === 'sent' || invoice.status === 'overdue') && (
                              <button onClick={() => changeStatus(invoice, 'void')} title="Void invoice" style={{ padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-danger)', display: 'inline-flex' }}>
                                <Ban size={14} />
                              </button>
                            )}
                            <button onClick={() => deleteInvoice(invoice.id)} title="Delete invoice" style={{ padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', display: 'inline-flex' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {state.invoices.length === 0 && (
                      <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-placeholder)' }}>No invoices yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {active === 'tax' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <StatCard label="Tax Payable" value={format(taxPayable)} sub="Outstanding obligations" icon={<ReceiptText size={18} />} tone="red" />
                <StatCard label="Tax Paid" value={format(taxPaid)} sub="Settled in current period" icon={<CheckCircle size={18} />} tone="green" />
                <StatCard label="Next Due" value={nextTaxDue ? formatDate(nextTaxDue.dueAt) : '—'} sub={nextTaxDue ? nextTaxDue.name : 'No obligations'} icon={<FileText size={18} />} tone="accent" />
              </div>

              <div style={panelStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Tax obligations</h3>
                  <button onClick={() => setShowTaxForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-on-dark)', background: 'var(--bg-nav-active)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    <Plus size={14} /> Add obligation
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ flex: 1, height: '8px', borderRadius: '999px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                    <div style={{ width: `${taxPayable + taxPaid > 0 ? Math.min(100, (taxPaid / (taxPayable + taxPaid)) * 100) : 0}%`, height: '100%', background: 'var(--bg-nav-active)', borderRadius: '999px' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{Math.round(taxPayable + taxPaid > 0 ? (taxPaid / (taxPayable + taxPaid)) * 100 : 100)}% settled</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Tax</th>
                        <th style={thStyle}>Rate</th>
                        <th style={thStyle}>Period</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Taxable base</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Payable</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Paid</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Balance</th>
                        <th style={thStyle}>Due</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.taxes.map(tax => {
                        const payable = Math.round(tax.basis * tax.rate) / 100
                        const balance = Math.max(0, payable - tax.paid)
                        return (
                          <tr key={tax.id}>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>{tax.name}</td>
                            <td style={tdStyle}>{tax.rate}%</td>
                            <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{tax.period}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--text-muted)' }}>{format(tax.basis)}</td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>{format(payable)}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: '#6ee7b7' }}>{format(tax.paid)}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: balance > 0 ? '#fca5a5' : '#6ee7b7', fontWeight: 600 }}>{format(balance)}</td>
                            <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{formatDate(tax.dueAt)}</td>
                            <td style={tdStyle}><TaxBadge status={tax.status} /></td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                {tax.status !== 'paid' && (
                                  <button onClick={() => markTaxPaid(tax.id)} title="Mark as paid" style={{ padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(16,185,129,0.18)', color: '#6ee7b7', display: 'inline-flex' }}>
                                    <CheckCircle size={14} />
                                  </button>
                                )}
                                <button onClick={() => deleteTax(tax.id)} title="Delete obligation" style={{ padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-danger)', display: 'inline-flex' }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {active === 'balance' && balanceSheet && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Real-time balance sheet</h2>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Updated {formatDate(balanceSheet.updatedAt)} · {new Date(balanceSheet.updatedAt).toLocaleTimeString()}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: bp.md ? '1fr 1fr' : '1fr', gap: '16px' }}>
                <div style={panelStyle}>
                  <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 12px 0' }}>Assets</h3>
                  {balanceSheet.assets.map(line => (
                    <div key={line.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--bg-secondary)' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{line.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{format(line.value)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0 0 0' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Total assets</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#6ee7b7' }}>{format(balanceSheet.assets.reduce((sum, l) => sum + l.value, 0))}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={panelStyle}>
                    <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 12px 0' }}>Liabilities</h3>
                    {balanceSheet.liabilities.map(line => (
                      <div key={line.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--bg-secondary)' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{line.label}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{format(line.value)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0 0 0' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Total liabilities</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#fca5a5' }}>{format(balanceSheet.liabilities.reduce((sum, l) => sum + l.value, 0))}</span>
                    </div>
                  </div>

                  <div style={panelStyle}>
                    <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 12px 0' }}>Equity</h3>
                    {balanceSheet.equity.map(line => (
                      <div key={line.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--bg-secondary)' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{line.label}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{format(line.value)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0 0 0' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Total equity</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#93c5fd' }}>{format(balanceSheet.equity.reduce((sum, l) => sum + l.value, 0))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}

      {showInvoiceForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} onClick={() => setShowInvoiceForm(false)}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '14px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Create invoice</h3>
              <button onClick={() => setShowInvoiceForm(false)} style={{ padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', display: 'inline-flex' }}>
                <X size={14} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block' }}>Customer</label>
              <select value={invoiceForm.customerId} onChange={e => setInvoiceForm(p => ({ ...p, customerId: e.target.value }))} style={inputStyle}>
                <option value="">Select a customer…</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ''}</option>
                ))}
              </select>
              {customers.length === 0 && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  No customers found yet. Add customers from the Customers page first.
                </p>
              )}
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block' }}>Due date</label>
              <input type="date" value={invoiceForm.dueAt} onChange={e => setInvoiceForm(p => ({ ...p, dueAt: e.target.value }))} style={inputStyle} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-label)' }}>Line items</label>
                <button onClick={() => setInvoiceForm(p => ({ ...p, items: [...p.items, { description: '', qty: '1', unitPrice: '' }] }))} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-on-dark)', background: 'var(--bg-nav-active)', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}>
                  Add item
                </button>
              </div>
              {invoiceForm.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input value={item.description} onChange={e => updateItem(i, { description: e.target.value })} style={{ ...inputStyle, flex: 2 }} placeholder="Description" />
                  <input value={item.qty} onChange={e => updateItem(i, { qty: e.target.value })} type="number" min="0" style={{ ...inputStyle, flex: 0.5 }} placeholder="Qty" />
                  <input value={item.unitPrice} onChange={e => updateItem(i, { unitPrice: e.target.value })} type="number" min="0" step="0.01" style={{ ...inputStyle, flex: 1 }} placeholder="Price" />
                  {invoiceForm.items.length > 1 && (
                    <button onClick={() => setInvoiceForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))} style={{ padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-danger)', display: 'inline-flex' }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={() => setShowInvoiceForm(false)} style={{ flex: 1, height: '40px', fontSize: '13px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitInvoice} style={{ flex: 1, height: '40px', fontSize: '13px', fontWeight: 500, background: 'var(--bg-nav-active)', color: 'var(--text-on-dark)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {showTaxForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} onClick={() => setShowTaxForm(false)}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '14px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Add tax obligation</h3>
              <button onClick={() => setShowTaxForm(false)} style={{ padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', display: 'inline-flex' }}>
                <X size={14} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block' }}>Tax name</label>
              <input value={taxForm.name} onChange={e => setTaxForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="e.g. VAT / Sales tax" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block' }}>Rate (%)</label>
                <input value={taxForm.rate} onChange={e => setTaxForm(p => ({ ...p, rate: e.target.value }))} type="number" min="0" step="0.01" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block' }}>Taxable basis</label>
                <input value={taxForm.basis} onChange={e => setTaxForm(p => ({ ...p, basis: e.target.value }))} type="number" min="0" step="0.01" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block' }}>Period</label>
                <input value={taxForm.period} onChange={e => setTaxForm(p => ({ ...p, period: e.target.value }))} style={inputStyle} placeholder="e.g. 2026-09" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block' }}>Due date</label>
                <input type="date" value={taxForm.dueAt} onChange={e => setTaxForm(p => ({ ...p, dueAt: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block' }}>Already paid</label>
              <input value={taxForm.paid} onChange={e => setTaxForm(p => ({ ...p, paid: e.target.value }))} type="number" min="0" step="0.01" style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={() => setShowTaxForm(false)} style={{ flex: 1, height: '40px', fontSize: '13px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitTax} style={{ flex: 1, height: '40px', fontSize: '13px', fontWeight: 500, background: 'var(--bg-nav-active)', color: 'var(--text-on-dark)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
