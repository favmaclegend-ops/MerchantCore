# Helper Modules & Utility Reference

This file documents the reusable helper functions and hooks available across the
project. Reaching for these instead of re-implementing saves time and keeps the
codebase consistent. All paths are relative to `src/`.

---

## Table of contents

1. [Class utilities — `lib/utils.ts`](#1-class-utilities--libutilsts)
2. [Browser / OS detection — `lib/browser.ts`](#2-browser--os-detection--libbrowserts)
3. [Currency & formatting — `lib/currency.ts`](#3-currency--formatting--libcurrencyts)
4. [Route preloading — `lib/routePreload.ts`](#4-route-preloading--libroutepreloadts)
5. [PWA / connectivity — `lib/pwa.ts`](#5-pwa--connectivity--libpwats)
6. [Org access permissions — `lib/orgAccess.ts`](#6-org-access-permissions--liborgaccessts)
7. [Dashboard caching — `lib/dashboardCache.ts`](#7-dashboard-caching--libdashboardcachets)
8. [Org types & finance helpers — `lib/orgTypes.ts`](#8-org-types--finance-helpers--liborgtypests)
9. [Hooks — `hooks/`](#9-hooks--hookssrc)
10. [API client — `lib/api.ts`](#10-api-client--libapits)

---

## 1. Class utilities — `lib/utils.ts`

### `cn(...inputs: ClassValue[]): string`

Combines [clsx](https://www.npmjs.com/package/clsx) with
[tailwind-merge](https://www.npmjs.com/package/tailwind-merge) so you can merge
conditional class names and deduplicate conflicting Tailwind utilities (the
later one wins).

```ts
import { cn } from '@/lib/utils'

<div className={cn('btn', isActive && 'btn-active', 'px-4')} />
// px-4 appears last, so it overrides any earlier padding utility
```

Use this everywhere you conditionally build className strings.

---

## 2. Browser / OS detection — `lib/browser.ts`

Thin, SSR-safe wrapper over `ua-parser-js`. The user-agent is parsed **once and
cached** for the lifetime of the page. Every helper guards against a non-browser
environment and never throws.

### `getBrowserInfo(): BrowserInfo`

Returns a frozen snapshot of the current environment:

```ts
interface BrowserInfo {
  name: string        // 'mobile safari', 'chrome', 'firefox', … (lowercased)
  os: string          // 'ios', 'android', 'windows', 'macos', …
  osVersion: string
  isIOS: boolean
  isIOSMobile: boolean
  isAndroid: boolean
  isMobile: boolean
  isIOSSafari: boolean
  isSafari: boolean
  isChrome: boolean
}
```

### Direct boolean helpers

| Helper | Returns `true` when |
| --- | --- |
| `isIOSSafari()` | iPhone / iPad Safari |
| `isIOS()` | any browser on an iOS device |
| `isMobile()` | mobile or tablet form factor |

### `safeBottomInset(extraPx = 0): string`

Returns a CSS value for the bottom safe-area inset. iOS Safari reports the real
inset (`var(--safe-bottom)`), while most other browsers resolve it to `0` — so
this optionally adds a fixed pixel lift for non-iOS Safari so floating bottom UI
(e.g. the nav bar) never sits under the home indicator / system UI.

```ts
import { safeBottomInset } from '@/lib/browser'

const NAV_SAFE_BOTTOM = safeBottomInset(16)
// iOS Safari -> 'var(--safe-bottom)'
// everything else -> 'calc(var(--safe-bottom) + 16px)'
```

---

## 3. Currency & formatting — `lib/currency.ts`

Handles the supported currency catalog, conversions, and formatting.

### Data

- `currencies: CurrencyInfo[]` — list of `{ code, symbol, name }` (NLE, USD, EUR,
  GBP, NGN, GHS, KES, ZAR, INR, CNY).
- `defaultCurrency = 'NLE'`
- `conversionRates: Record<string, number>` — base rates relative to USD.

### `getCurrencyInfo(code: string): CurrencyInfo`

Returns the currency info for `code`, or the first entry (`NLE`) as a fallback
when not found.

### `convert(amount: number, from: string, to: string): number`

Converts an amount between two currency codes via USD. Returns the amount
unchanged when `from === to`.

### `formatCurrency(amount: number, code: string): string`

Formats an amount with the currency symbol and 2 decimal places, with a leading
`-` for negatives.

```ts
formatCurrency(1234.5, 'USD') // '$1,234.50'
formatCurrency(-50, 'NGN')    // '-₦50.00'
```

---

## 4. Route preloading — `lib/routePreload.ts`

### `preloadRoute(path: string): void`

Lazily `import()`s the page module for a route so it's ready when the user
navigates there (widely used from nav click handlers). Each route is preloaded
only once. Safe to call for routes not in the map (it's a no-op).

```ts
import { preloadRoute } from '@/lib/routePreload'

<button onMouseDown={() => preloadRoute('/home/inventory')}>Inventory</button>
```

To add a route, extend the `preloadMap` with `path -> dynamic import`.

---

## 5. PWA / connectivity — `lib/pwa.ts`

### `registerServiceWorker(): void`

Registers `/sw.js` (caches the app shell + offline page). Call once at app
startup. Re-registers when coming back online if a previous registration failed.

### `useOnline(): boolean` (React hook)

Tracks live connectivity, reacting to the browser `online`/`offline` events.
Defaults to `true` on first render.

```ts
const online = useOnline()
<Badge>{online ? 'Online' : 'Offline'}</Badge>
```

---

## 6. Org access permissions — `lib/orgAccess.ts`

Centralised permission checks for **organisation (business workspace) members**.
Gate nav items, routes, and page bodies. Every check accepts `OrMember | null`
so it's safe to call whether or not an org login is active.

Permission matrix (from the file header):

| Role | Finance | HRM | Users | Supply |
| --- | --- | --- | --- | --- |
| super-admin / admin | ✅ | ✅ | ✅ | ✅ |
| finance-manager | ✅ | ❌ | ❌ | ❌ |
| hrm-manager | ❌ | ✅ | ❌ | ❌ |
| logistics-manager | ❌ | ❌ | ❌ | ✅ |
| staff | ❌ | ❌ | ❌ | ❌ |

### Helpers

| Helper | Returns `true` when |
| --- | --- |
| `isOrgMember(orgUser)` | there is an active org member (also a type guard to `OrgMember`) |
| `canManageUsers(orgUser)` | super-admin / admin |
| `canManageFinance(orgUser)` | super-admin / admin / finance-manager |
| `canManageHRM(orgUser)` | super-admin / admin / hrm-manager |
| `canManageSupply(orgUser)` | super-admin / logistics-manager |
| `canEditInventory(orgUser)` | super-admin / logistics-manager (alias of `canManageSupply`) |
| `canAccess(orgUser, 'finance' \| 'hrm' \| 'users' \| 'supply')` | any single permission |

```ts
import { canAccess, canManageFinance } from '@/lib/orgAccess'

if (canManageFinance(orgUser)) <FinanceModule />
const can = canAccess(orgUser, 'supply')
```

---

## 7. Dashboard caching — `lib/dashboardCache.ts`

In-memory + localStorage caching for dashboard stats so the dashboard renders
instantly before/without refetching. Two independent caches with a 5-minute TTL:

- `CACHE_KEY = 'dashboard_cache'` — personal login
- `ORG_CACHE_KEY = 'org_dashboard_cache'` — organisation workspace (never
  collides with the personal cache)

### Types

`DashboardStats`, `Tx`, `DashboardAlert`, `DashboardCache` (with `timestamp`),
and `defaultStats`.

### Functions

| Function | Description |
| --- | --- |
| `loadDashboardCache(key?)` | Reads + validates the cache; returns `null` (and clears) when expired or broken. |
| `saveDashboardCache(data, key?)` | Writes a cache entry, stamping `timestamp`. |
| `refreshDashboardCache()` | Fetches fresh stats/trend/transactions/products, saves + returns the new cache (personal). |
| `refreshOrgDashboardCache()` | Same but from the org backend aggregate endpoint, mapped onto the same shape and stored under `ORG_CACHE_KEY`. |

---

## 8. Org types & finance helpers — `lib/orgTypes.ts`

Primary source of **organisation** TypeScript types mirroring the backend
shapes (`OrgMember`, `OrgProduct`, `OrgCustomer`, `OrgEmployee`, `OrgSupplier`,
`OrgInvoice`, `LedgerEntry`, …). Reuse these types rather than redefining shapes.

Also exposes pure helpers:

### `currentPeriod(date = new Date()): string`

Returns a human label like `"Sep 2026"` for the given date.

```ts
currentPeriod()               // 'Sep 2026'
currentPeriod(new Date('2026-01-05')) // 'Jan 2026'
```

### `buildBalanceSheet(state: FinanceState, netCashFlow?): BalanceSheet`

Derives a `{ assets, liabilities, equity, updatedAt }` balance sheet from ledger,
invoices, and taxes. Pass `netCashFlow` to set "Cash & Bank" directly; otherwise
it's computed from income minus expense ledger entries.

```ts
const bs = buildBalanceSheet(finance.state, cashFlow)
```

---

## 9. Hooks — `hooks/`

### `useBreakpoint()` — `hooks/useBreakpoint.ts`

Reactive Tailwind-ish breakpoints via `matchMedia`. Returns an object of boolean
flags that update live on resize.

```ts
const bp = useBreakpoint()
// bp.sm  (max-width: 640px)
// bp.xxsm(max-width: 340px)
// bp.xsm (min-width: 650px)  bp.md (768px)  bp.avg (920px)
// bp.lg (1024px)  bp.mlg (1200px)  bp.xl (1280px)

<div className={bp.sm ? 'grid-cols-1' : 'grid-cols-3'}>…</div>
```

### `useKeyboardOpen()` — `hooks/useKeyboardOpen.ts`

Returns `true` while a text-entry control (input/textarea/select/contenteditable)
has focus — i.e. the on-screen keyboard is likely up. Use it to hide or lift
fixed bottom UI (nav bar, floating action buttons) so it doesn't sit behind the
mobile keyboard.

```ts
const keyboardOpen = useKeyboardOpen()
<MobileNav hidden={keyboardOpen} />
```

### `useRequireAuth()` — `hooks/useRequireAuth.ts`

Auth guard for routes. Returns `{ isLoggedIn, requireAuth }`.

```ts
const { isLoggedIn, requireAuth } = useRequireAuth()
useEffect(() => { if (!requireAuth()) return }, [requireAuth])
```

`requireAuth()` returns `true` when logged in; otherwise it redirects to
`/?redirect=<current path>` (preserving the URL so the user can be sent back
after login) and returns `false`.

### `useQrScanner(onScan, enabled)` — `hooks/useQrScanner.ts`

Camera-based QR scanner (jsQR) that streams frames and calls `onScan(data)` once
a code is decoded, then stops the camera. Returns `{ videoRef, error }`.

```ts
const { videoRef, error } = useQrScanner(code => markAttendance(code), scanEnabled)
<video ref={videoRef} playsInline muted />
{error && <p>{error}</p>}
```

Requires HTTPS (or localhost) for camera access.

---

## 10. API client — `lib/api.ts`

A single `api` singleton (exported at line 397) and its `api.org.*` namespace
wrap every backend endpoint used by the app. Before hand-writing a `fetch`,
check whether the call already exists here:

- Top-level `api.getDashboardStats()`, `api.getRevenueTrend()`,
  `api.getTransactions()`, `api.getProducts()`, etc.
- Org namespace `api.org.getDashboard()`, `api.org.getTransactions()`,
  `api.org.getProducts()`, service/order/pin calls, etc.

It also exports the request/response types used by the services feature:
`ServiceSchema`, `OrgServiceResponse`, `ServiceOrderSchema`,
`ServiceOrderResponse` (and the services store types live in
`pages/org_services/service_demo.ts`).
