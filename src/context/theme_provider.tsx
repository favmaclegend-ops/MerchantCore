import { useState, useCallback, useEffect, type ReactNode } from 'react'
import { ThemeContext } from './theme_context'

const HEADER_COLORS = {
  light: '#ffffff',
  dark: '#0f172a',
} as const

function applyStatusBar(theme: 'light' | 'dark') {
  const color = HEADER_COLORS[theme]

  let themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!themeColor) {
    themeColor = document.createElement('meta')
    themeColor.name = 'theme-color'
    document.head.appendChild(themeColor)
  }
  themeColor.content = color

  let statusBar = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-status-bar-style"]')
  if (!statusBar) {
    statusBar = document.createElement('meta')
    statusBar.name = 'apple-mobile-web-app-status-bar-style'
    document.head.appendChild(statusBar)
  }
  // Transparent bar in dark mode (light status-bar text over the dark header),
  // default opaque bar in light mode so the dark status-bar text stays readable.
  statusBar.content = theme === 'dark' ? 'black-translucent' : 'default'
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('app_theme') === 'dark' ? 'dark' : 'light',
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    applyStatusBar(theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('app_theme', next)
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
