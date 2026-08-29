import { useState, useCallback, useEffect, type ReactNode } from 'react'
import { ThemeContext } from './theme_context'

const HEADER_COLORS = {
  light: '#ffffff',
  dark: '#0f172a',
} as const

function writeMeta(name: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = name
    document.head.appendChild(meta)
  }
  meta.content = content
}

function applyStatusBar(theme: 'light' | 'dark') {
  const color = HEADER_COLORS[theme]

  // `theme-color` drives the live iOS status bar / toolbar area colour
  // (works dynamically in Safari and standalone to colour the strip).
  writeMeta('theme-color', color)

  // `apple-mobile-web-app-status-bar-style` is only read at launch on iOS
  // standalone, so we keep it consistent here rather than relying on runtime
  // changes. `theme-color` above is what actually updates dynamically.
  writeMeta(
    'apple-mobile-web-app-status-bar-style',
    theme === 'dark' ? 'black-translucent' : 'black-translucent',
  )
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
