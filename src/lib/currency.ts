export interface CurrencyInfo {
  code: string
  symbol: string
  name: string
}

export const currencies: CurrencyInfo[] = [
  { code: 'NLE', symbol: 'NLE', name: 'MerchantCore Credit' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
]

export const defaultCurrency = 'NLE'

export function getCurrencyInfo(code: string): CurrencyInfo {
  return currencies.find(c => c.code === code) || currencies[0]
}

export const conversionRates: Record<string, number> = {
  NLE: 1.5,
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  NGN: 1550,
  GHS: 15.5,
  KES: 150,
  ZAR: 18.5,
  INR: 83.5,
  CNY: 7.25,
}

export function convert(amount: number, from: string, to: string): number {
  if (from === to) return amount
  const usdAmount = amount / (conversionRates[from] || 1)
  return usdAmount * (conversionRates[to] || 1)
}

export function formatCurrency(amount: number, code: string): string {
  const info = getCurrencyInfo(code)
  const formatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  if (amount < 0) return `-${info.symbol}${formatted}`
  return `${info.symbol}${formatted}`
}
