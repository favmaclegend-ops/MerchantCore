import { useEffect, useState } from 'react'

const queries = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
} as const

export function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    return Object.fromEntries(
      Object.entries(queries).map(([key, q]) => [key, window.matchMedia(q).matches])
    ) as Record<keyof typeof queries, boolean>
  })

  useEffect(() => {
    const mqls = Object.entries(queries).map(([key, q]) => {
      const mql = window.matchMedia(q)
      const handler = (e: MediaQueryListEvent) => setBp(prev => ({ ...prev, [key]: e.matches }))
      mql.addEventListener('change', handler)
      return () => mql.removeEventListener('change', handler)
    })
    return () => mqls.forEach(fn => fn())
  }, [])

  return bp
}
