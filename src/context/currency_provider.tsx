import { useState, useCallback, type ReactNode } from 'react'
import { CurrencyContext } from './currency_context'
import { defaultCurrency, formatCurrency, getCurrencyInfo } from '@/lib/currency'

export default function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState(() => {
    const stored = localStorage.getItem('app_currency')
    return stored && getCurrencyInfo(stored) ? stored : defaultCurrency
  })

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code)
    localStorage.setItem('app_currency', code)
  }, [])

  const format = useCallback((amount: number) => {
    return formatCurrency(amount, currency)
  }, [currency])

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  )
}
