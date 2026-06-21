import { useState, useCallback, useEffect, type ReactNode } from 'react'
import { ThemeContext } from './theme_context'

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = localStorage.getItem('app_theme') as 'light' | 'dark' | null
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored)
      document.documentElement.setAttribute('data-theme', stored)
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [])

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('app_theme', next)
      document.documentElement.setAttribute('data-theme', next)
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
