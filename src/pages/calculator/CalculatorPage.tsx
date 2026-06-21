import { useState, useContext } from 'react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import {
  Calculator, Percent, TrendingUp, DollarSign,
  RefreshCw,
} from 'lucide-react'
import { currencies, convert, getCurrencyInfo, formatCurrency } from '@/lib/currency'
import { CurrencyContext } from '@/context/currency_context'

type CalcTab = 'basic' | 'business' | 'currency'

const btnStyle = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: '10px 0', fontSize: '11px', fontWeight: 600, border: 'none',
  borderRadius: '8px', cursor: 'pointer',
  color: active ? '#fff' : '#475569',
  background: active ? '#0f172a' : '#f1f5f9',
})

export function CalculatorPage() {
  const bp = useBreakpoint()
  const [tab, setTab] = useState<CalcTab>('basic')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%', padding: '0 8px' }}>
      <div style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#0f172a' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Calculator</h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
          {tab === 'basic' ? 'Standard arithmetic operations' : tab === 'business' ? 'Profit, markup & business tools' : 'Real-time currency conversion'}
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', gap: '8px' }}>
        <button onClick={() => setTab('basic')} style={btnStyle(tab === 'basic')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Calculator style={{ width: '14px', height: '14px' }} />
            {bp.md && <span>Basic</span>}
          </div>
        </button>
        <button onClick={() => setTab('business')} style={btnStyle(tab === 'business')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <TrendingUp style={{ width: '14px', height: '14px' }} />
            {bp.md && <span>Business</span>}
          </div>
        </button>
        <button onClick={() => setTab('currency')} style={btnStyle(tab === 'currency')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <DollarSign style={{ width: '14px', height: '14px' }} />
            {bp.md && <span>Currency</span>}
          </div>
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: '520px' }}>
        {tab === 'basic' && <BasicCalculator />}
        {tab === 'business' && <BusinessCalculator />}
        {tab === 'currency' && <CurrencyConverter />}
      </div>
    </div>
  )
}

function BasicCalculator() {
  const [display, setDisplay] = useState('0')
  const [memory, setMemory] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [waiting, setWaiting] = useState(false)

  const inputDigit = (d: string) => {
    if (waiting) {
      setDisplay(d)
      setWaiting(false)
    } else {
      setDisplay(display === '0' ? d : display + d)
    }
  }

  const inputDecimal = () => {
    if (waiting) {
      setDisplay('0.')
      setWaiting(false)
      return
    }
    if (!display.includes('.')) setDisplay(display + '.')
  }

  const clear = () => {
    setDisplay('0')
    setMemory(null)
    setOperator(null)
    setWaiting(false)
  }

  const performOp = (nextOp: string) => {
    const current = parseFloat(display)
    if (operator && memory !== null) {
      const result = calculate(memory, current, operator)
      setDisplay(String(result))
      setMemory(result)
    } else {
      setMemory(current)
    }
    setOperator(nextOp)
    setWaiting(true)
  }

  const evaluate = () => {
    if (operator === null || memory === null) return
    const current = parseFloat(display)
    const result = calculate(memory, current, operator)
    setDisplay(String(result))
    setMemory(null)
    setOperator(null)
    setWaiting(true)
  }

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b
      case '-': return a - b
      case '*': return a * b
      case '/': return b !== 0 ? a / b : 0
      default: return b
    }
  }

  const btn = (label: string, onClick: () => void, style?: React.CSSProperties) => (
    <button onClick={onClick} style={{
      padding: '14px 0', fontSize: '16px', fontWeight: 600, border: 'none',
      borderRadius: '8px', cursor: 'pointer', background: '#f1f5f9', color: '#0f172a',
      ...style,
    }}>
      {label}
    </button>
  )

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '1px 6px 3px rgba(128,128,128,0.287)' }}>
      <div style={{
        background: '#f8fafc', borderRadius: '8px', padding: '12px 16px', marginBottom: '12px',
        textAlign: 'right', fontSize: '28px', fontWeight: 700, color: '#0f172a', minHeight: '48px',
        overflow: 'hidden', textOverflow: 'ellipsis',
        fontFamily: 'monospace',
      }}>
        {display}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {btn('C', clear, { background: '#fef2f2', color: '#dc2626' })}
        {btn('±', () => setDisplay(String(parseFloat(display) * -1)), { background: '#f1f5f9' })}
        {btn('%', () => setDisplay(String(parseFloat(display) / 100)), { background: '#f1f5f9' })}
        {btn('÷', () => performOp('/'), { background: '#0f172a', color: '#fff' })}

        {btn('7', () => inputDigit('7'))}
        {btn('8', () => inputDigit('8'))}
        {btn('9', () => inputDigit('9'))}
        {btn('×', () => performOp('*'), { background: '#0f172a', color: '#fff' })}

        {btn('4', () => inputDigit('4'))}
        {btn('5', () => inputDigit('5'))}
        {btn('6', () => inputDigit('6'))}
        {btn('-', () => performOp('-'), { background: '#0f172a', color: '#fff' })}

        {btn('1', () => inputDigit('1'))}
        {btn('2', () => inputDigit('2'))}
        {btn('3', () => inputDigit('3'))}
        {btn('+', () => performOp('+'), { background: '#0f172a', color: '#fff' })}

        {btn('0', () => inputDigit('0'), { gridColumn: 'span 2' })}
        {btn('.', inputDecimal)}
        {btn('=', evaluate, { background: '#0f172a', color: '#fff' })}
      </div>
    </div>
  )
}

function BusinessCalculator() {
  const { format } = useContext(CurrencyContext)
  const [calcType, setCalcType] = useState<'margin' | 'markup' | 'tax' | 'roi' | 'breakeven' | 'discount'>('margin')

  const forms: Record<string, { label: string; key: string; placeholder: string }[]> = {
    margin: [
      { label: 'Cost Price', key: 'cost', placeholder: '0.00' },
      { label: 'Revenue / Selling Price', key: 'revenue', placeholder: '0.00' },
    ],
    markup: [
      { label: 'Cost Price', key: 'cost', placeholder: '0.00' },
      { label: 'Markup Percentage (%)', key: 'markupPct', placeholder: 'e.g. 25' },
    ],
    tax: [
      { label: 'Amount (excl. tax)', key: 'amount', placeholder: '0.00' },
      { label: 'Tax Rate (%)', key: 'taxRate', placeholder: 'e.g. 7.5' },
    ],
    roi: [
      { label: 'Total Investment', key: 'investment', placeholder: '0.00' },
      { label: 'Total Return', key: 'returnVal', placeholder: '0.00' },
    ],
    breakeven: [
      { label: 'Fixed Costs', key: 'fixedCost', placeholder: '0.00' },
      { label: 'Variable Cost per Unit', key: 'varCost', placeholder: '0.00' },
      { label: 'Selling Price per Unit', key: 'unitPrice', placeholder: '0.00' },
    ],
    discount: [
      { label: 'Original Price', key: 'original', placeholder: '0.00' },
      { label: 'Discount Percentage (%)', key: 'discountPct', placeholder: 'e.g. 20' },
    ],
  }

  const [values, setValues] = useState<Record<string, string>>({})
  const [result, setResult] = useState<string | null>(null)

  const handleCalc = () => {
    const v = { ...values }
    switch (calcType) {
      case 'margin': {
        const cost = parseFloat(v.cost) || 0
        const rev = parseFloat(v.revenue) || 0
        if (rev === 0) { setResult('Revenue cannot be zero'); return }
        const profit = rev - cost
        const margin = (profit / rev) * 100
        setResult(`Profit: ${format(profit)}  |  Margin: ${margin.toFixed(2)}%`)
        break
      }
      case 'markup': {
        const cost = parseFloat(v.cost) || 0
        const pct = parseFloat(v.markupPct) || 0
        const price = cost * (1 + pct / 100)
        setResult(`Selling Price: ${format(price)}  |  Profit: ${format(price - cost)}`)
        break
      }
      case 'tax': {
        const amt = parseFloat(v.amount) || 0
        const rate = parseFloat(v.taxRate) || 0
        const taxAmt = amt * (rate / 100)
        const total = amt + taxAmt
        setResult(`Tax: ${format(taxAmt)}  |  Total (incl. tax): ${format(total)}`)
        break
      }
      case 'roi': {
        const inv = parseFloat(v.investment) || 0
        const ret = parseFloat(v.returnVal) || 0
        if (inv === 0) { setResult('Investment cannot be zero'); return }
        const roi = ((ret - inv) / inv) * 100
        setResult(`Net Profit: ${format(ret - inv)}  |  ROI: ${roi.toFixed(2)}%`)
        break
      }
      case 'breakeven': {
        const fc = parseFloat(v.fixedCost) || 0
        const vc = parseFloat(v.varCost) || 0
        const up = parseFloat(v.unitPrice) || 0
        if (up <= vc) { setResult('Unit price must exceed variable cost'); return }
        const beUnits = Math.ceil(fc / (up - vc))
        setResult(`Break-Even: ${beUnits} units  |  Revenue: ${format(beUnits * up)}`)
        break
      }
      case 'discount': {
        const orig = parseFloat(v.original) || 0
        const dp = parseFloat(v.discountPct) || 0
        const discountAmt = orig * (dp / 100)
        const finalPrice = orig - discountAmt
        setResult(`You Save: ${format(discountAmt)}  |  Final Price: ${format(finalPrice)}`)
        break
      }
    }
  }

  const typeLabels: { value: typeof calcType; label: string; icon: React.ReactNode }[] = [
    { value: 'margin', label: 'Margin', icon: <Percent style={{ width: '14px', height: '14px' }} /> },
    { value: 'markup', label: 'Markup', icon: <TrendingUp style={{ width: '14px', height: '14px' }} /> },
    { value: 'tax', label: 'Tax', icon: <Percent style={{ width: '14px', height: '14px' }} /> },
    { value: 'roi', label: 'ROI', icon: <TrendingUp style={{ width: '14px', height: '14px' }} /> },
    { value: 'breakeven', label: 'B/E', icon: <Calculator style={{ width: '14px', height: '14px' }} /> },
    { value: 'discount', label: 'Discount', icon: <Percent style={{ width: '14px', height: '14px' }} /> },
  ]

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '1px 6px 3px rgba(128,128,128,0.287)' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {typeLabels.map(t => (
          <button key={t.value} onClick={() => { setCalcType(t.value); setResult(null); setValues({}) }}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '11px',
              fontWeight: 600, borderRadius: '6px', border: 'none', cursor: 'pointer',
              color: calcType === t.value ? '#fff' : '#475569',
              background: calcType === t.value ? '#0f172a' : '#f1f5f9',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
        {(forms[calcType] || []).map(f => (
          <div key={f.key}>
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#475569', marginBottom: '4px', display: 'block' }}>{f.label}</label>
            <input
              type="number" step="any" min="0"
              value={values[f.key] || ''}
              onChange={e => setValues(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              style={{
                width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1',
                borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff', color: '#0f172a',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
      </div>

      <button onClick={handleCalc} style={{
        width: '100%', padding: '10px 0', fontSize: '13px', fontWeight: 600,
        color: '#fff', background: '#0f172a', border: 'none', borderRadius: '8px', cursor: 'pointer',
      }}>
        Calculate
      </button>

      {result !== null && (
        <div style={{
          marginTop: '12px', padding: '12px', borderRadius: '8px', background: '#f0fdf4',
          border: '1px solid #bbf7d0', fontSize: '13px', fontWeight: 600, color: '#166534',
          textAlign: 'center', lineHeight: 1.5,
        }}>
          {result}
        </div>
      )}
    </div>
  )
}

function CurrencyConverter() {
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('NLE')
  const [amount, setAmount] = useState('1')

  const fromInfo = getCurrencyInfo(from)
  const toInfo = getCurrencyInfo(to)
  const numAmount = parseFloat(amount) || 0
  const result = convert(numAmount, from, to)

  const swap = () => {
    setFrom(to)
    setTo(from)
  }

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '1px 6px 3px rgba(128,128,128,0.287)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 500, color: '#475569', marginBottom: '4px', display: 'block' }}>Amount</label>
          <input
            type="number" step="any" min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="1.00"
            style={{
              width: '100%', height: '44px', padding: '0 12px', border: '1px solid #cbd5e1',
              borderRadius: '8px', fontSize: '16px', fontWeight: 600, outline: 'none',
              background: '#fff', color: '#0f172a', boxSizing: 'border-box', fontFamily: 'monospace',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#475569', marginBottom: '4px', display: 'block' }}>From</label>
            <select value={from} onChange={e => setFrom(e.target.value)}
              style={{
                width: '100%', height: '44px', padding: '0 8px', border: '1px solid #cbd5e1',
                borderRadius: '8px', fontSize: '13px', fontWeight: 600, outline: 'none',
                background: '#fff', color: '#0f172a', cursor: 'pointer',
              }}>
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} - {c.name}</option>
              ))}
            </select>
          </div>

          <button onClick={swap} style={{
            padding: '8px', borderRadius: '50%', border: '1px solid #e2e8f0',
            background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', marginBottom: '0',
          }}>
            <RefreshCw style={{ width: '16px', height: '16px', color: '#475569' }} />
          </button>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#475569', marginBottom: '4px', display: 'block' }}>To</label>
            <select value={to} onChange={e => setTo(e.target.value)}
              style={{
                width: '100%', height: '44px', padding: '0 8px', border: '1px solid #cbd5e1',
                borderRadius: '8px', fontSize: '13px', fontWeight: 600, outline: 'none',
                background: '#fff', color: '#0f172a', cursor: 'pointer',
              }}>
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} - {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{
          marginTop: '8px', padding: '16px', borderRadius: '8px', background: '#f8fafc',
          border: '1px solid #e2e8f0', textAlign: 'center',
        }}>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>
            {formatCurrency(numAmount, from)} =
          </p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0, fontFamily: 'monospace' }}>
            {formatCurrency(result, to)}
          </p>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', margin: '4px 0 0 0' }}>
            1 {fromInfo.symbol} = {formatCurrency(convert(1, from, to), to)}  |  1 {toInfo.symbol} = {formatCurrency(convert(1, to, from), from)}
          </p>
        </div>
      </div>
    </div>
  )
}
