import { UAParser } from 'ua-parser-js'

/**
 * Lightweight browser / OS detection helpers built on `ua-parser-js`.
 *
 * Every helper guards against a non-browser environment (SSR / tests) and
 * never throws, so it is safe to call from anywhere in the project.
 */

interface BrowserInfo {
  readonly name: string
  readonly os: string
  readonly osVersion: string
  readonly isIOS: boolean
  readonly isIOSMobile: boolean
  readonly isAndroid: boolean
  readonly isMobile: boolean
  readonly isIOSSafari: boolean
  readonly isSafari: boolean
  readonly isChrome: boolean
}

let cache: BrowserInfo | undefined

function parse(): BrowserInfo {
  if (cache) return cache

  if (typeof navigator === 'undefined') {
    cache = {
      name: '',
      os: '',
      osVersion: '',
      isIOS: false,
      isIOSMobile: false,
      isAndroid: false,
      isMobile: false,
      isIOSSafari: false,
      isSafari: false,
      isChrome: false,
    }
    return cache
  }

  try {
    const ua = new UAParser(navigator.userAgent)
    const browser = (ua.getBrowser().name ?? '').toLowerCase()
    const os = (ua.getOS().name ?? '').toLowerCase()
    const osVersion = ua.getOS().version ?? ''
    const device = (ua.getDevice().type ?? '').toLowerCase()

    const isIOS = os.includes('ios')
    const isIOSMobile =
      isIOS && (device === 'mobile' || device === 'tablet' || device === '')
    const isAndroid = os.includes('android') && !isIOS
    const isMobile = isIOSMobile || isAndroid || device === 'mobile'
    const isSafari = browser.includes('safari')
    const isIOSSafari = isIOS && isSafari
    const isChrome = browser.includes('chrome')

    cache = {
      name: browser,
      os,
      osVersion,
      isIOS,
      isIOSMobile,
      isAndroid,
      isMobile,
      isIOSSafari,
      isSafari,
      isChrome,
    }
    return cache
  } catch {
    cache = {
      name: '',
      os: '',
      osVersion: '',
      isIOS: false,
      isIOSMobile: false,
      isAndroid: false,
      isMobile: false,
      isIOSSafari: false,
      isSafari: false,
      isChrome: false,
    }
    return cache
  }
}

/** The current browser / OS, parsed once and cached for the lifetime of the page. */
export function getBrowserInfo(): BrowserInfo {
  return parse()
}

/** True when the rendering browser is iOS Safari (iPhone / iPad). */
export function isIOSSafari(): boolean {
  return parse().isIOSSafari
}

/** True when running on an iOS device (any browser). */
export function isIOS(): boolean {
  return parse().isIOS
}

/** True when running on a mobile or tablet form factor. */
export function isMobile(): boolean {
  return parse().isMobile
}

/** Safe-area bottom inset with an optional fixed pixel offset for non-iOS Safari. */
export function safeBottomInset(extraPx = 0): string {
  const base = 'var(--safe-bottom)'
  if (!isIOSSafari() && extraPx > 0) {
    return `calc(${base} + ${extraPx}px)`
  }
  return base
}
