import { createContext } from 'react'

export interface CurrencyContextType {
  currency: string
  setCurrency: (code: string) => void
  format: (amount: number) => string
}

export const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'NLE',
  setCurrency: () => {},
  format: (amount: number) => `NLE${amount.toLocaleString()}`,
})
