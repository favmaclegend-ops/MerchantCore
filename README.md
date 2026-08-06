# MerchantCore

A modern, responsive React dashboard application for merchant management. Built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- **Dashboard** - Real-time overview of revenue, sales, stock alerts, and critical notifications
- **Inventory Manager** - Track stock levels, SKUs, and automate reorder alerts
- **POS Terminal** - Point-of-sale system with product catalog, cart, and multi-payment support
- **Credit Ledger** - Manage customer credit accounts, payment logs, and debt aging
- **Customer Directory** - View customer profiles, purchase history, and loyalty tiers
- **Spreadsheet** - FortuneSheet-powered workbook workspace with autosave, rename, import/export (`.xlsx`/`.csv`), and shareable deep links
- **Organisation Workspace** - Multi-role business workspace (users, finance, HRM, supply chain, attendance, notifications) — see `ORGANIZATION.md`
- **Notifications & Alerts** - Org-wide activity feed with unread badge, per-member read state, and permission-gated delete
- **Market & Billboard Ads** - Shop browsing plus an in-app billboard of video adverts (muted/autoplay/looping, click-through to `visitLink`) — see "Market & Billboard Ads" below

> **Feature status**: the external spreadsheet (`src/pages/spreadsheet/external/`) is the
> active production editor. The legacy in-house spreadsheet
> (`src/pages/spreadsheet/SpreadSheetPage.tsx` et al.) is **on hold — in development, not
> production ready** and not routed in `home.tsx`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript 6 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 & React CSS|
| Routing | React Router v7 |
| Icons | Lucide React |
| Spreadsheet Engine | FortuneSheet (`@fortune-sheet/react` + `@fortune-sheet/core`) |
| Excel/CSV Import-Export | `@corbe30/fortune-excel` |
| Linting | ESLint + typescript-eslint |

## Notifications & Alerts API

All org activity flows through a single API so the feed stays in sync without per-screen wiring.
See `FEATURES.md` §5c and `ORGANIZATION.md` §3.6 for the full endpoint map.

- **Emit / set** — `addOrgNotification(orgId, { kind, title, message, is_alert?, severity?, amount?, ref? })`
  from `src/data/orgNotifications.ts`. Prepend + persist to per-org localStorage and auto-fill
  the actor from the active org session. (Read-only, shared with `api.org.notifications.*`.)
- **Load** — `api.org.notifications.getFeed()` returns `{ notifications, settings }`; mark read
  via `markRead(id)` / `markAllRead()`.
- **Delete / remove** — `api.org.notifications.deleteNotification(id)` and `clearAll()`,
  permission-gated (Super Admin always; Admins only when `allow_admin_delete` is enabled).
- **React binding** — `OrgNotificationContext` (mounted in `src/main.tsx`) exposes
  `notifications`, `unreadCount`, `loading`, `canDelete`, `settings`, `fetch`, `markAsRead`,
  `markAllAsRead`, `deleteNotification`, `clearAll`, `setSettings`, and polls every 30s.

To emit and reflect it in the UI immediately:

```ts
import { addOrgNotification } from '@/data/orgNotifications';
import { getOrgSession } from '@/data/organisations';
import { OrgNotificationContext } from '@/context';

const session = getOrgSession();
if (session) {
  addOrgNotification(session.orgId, { kind: 'system', title, message, is_alert: true });
  const { fetch } = useContext(OrgNotificationContext); // re-syncs context state
  void fetch();
}
```

> `addOrgNotification` writes to storage only — it does not touch React state. Call the
> context's `fetch()` afterwards (or rely on the 30s poll) or the badge/dropdown/page will not
> update until a full reload. The Notifications page also re-syncs on mount.

## Market & Billboard Ads

`src/pages/market/` — shop browsing + billboard adverts, mock-backed behind a promise API so a
real backend can be dropped in without UI changes. Mounted at `/home/market` (see `home.tsx`).

### Data & flow

- `demoMarketStore.ts` — domain types (`MarketStore`, `MarketStoreShop`, `MarketStoreProduct`,
  `MarketStoreAdvert`) and the seeded `marketStore` (an `elk-components` store).
- `marketApi.ts` — promise-based fetchers with simulated latency + deep clone.
- `useMarketData.ts` — hydrates `marketStore` from the promise API once per session.

### Billboard ads

- `billboard.ts` — pure logic + hooks:
  - `pickBillboardAds(ads, count = 3, random = Math.random)` — Fisher–Yates shuffle, returns the
    first `count`. Exactly three ads are picked per mount/refresh, so users see different ads.
    `random` is injectable for deterministic tests.
  - `useBillboardAds(ads, count)` — memoised selection hook.
  - `useBillboardPlayer(ads)` — sequential player: exposes the `current` advert and a `next()`
    that advances through the picked ads and wraps around forever.
  - `advertTargetUrl(ad)` / `openAdvertTarget(ad)` — resolve/open `visitLink`.
- `components/BillboardVideo.tsx` — one advert on the **large billboard**: a **muted, autoplaying
  `<video>` with no controls** (`controls={false}`, `disablePictureInPicture`, no per-video loop —
  it calls `onEnded` when the clip finishes so the player advances). Falls back to the `advertUrl`
  poster image when `videoUrl` is absent (auto-advancing after a fixed timeout); the whole card is
  an `<a>` that opens `visitLink` in a new tab.
- `components/Bilboards.tsx` — renders a **single large billboard** playing the three randomly
  picked ads **one at a time**, advancing when each clip ends and looping indefinitely, next to
  the top-rated shops panel.

### Advert shape (future server contract)

```ts
interface MarketStoreAdvert {
  id: string;        // unique advert id
  title?: string;    // display title (falls back to id)
  advertUrl: string; // poster / fallback image
  videoUrl?: string; // short muted looping clip (no controls)
  visitLink: string; // target URL opened on click
}
```

### Endpoint mapping

| Existing mock | Future endpoint |
|---|---|
| `fetchMarketData()` | `GET /market` (full bundle) |
| `fetchShops()` | `GET /market/shops` |
| `fetchShop(id)` | `GET /market/shops/:id` |
| `fetchTopRatedShops()` | `GET /market/shops/top-rated` |
| `fetchProducts()` | `GET /market/products` |
| `fetchCategories()` | `GET /market/categories` |
| `fetchAdverts()` | `GET /market/adverts` |

> **Server-integration checklist**: keep the promise-based signatures in `marketApi.ts`, resolve
> `videoUrl`/`visitLink` to absolute URLs, and ensure advert IDs stay unique. Shop ids contain
> `@` (e.g. `sunrise_mart@123456`) — valid URL segments, keep them unencoded in links.

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10

### Installation

```bash
# Clone the repository
git clone https://github.com/anomalyco/merchant-core.git
cd merchant-core

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```
merchant-core/
├── src/
│   ├── components/
│   │   ├── layout/          # DesktopSidebar, DesktopHeader, MobileNavbar, MobileHeader
│   │   └── notifications/   # NotificationDropdown (bell, org-aware)
│   ├── context/
│   │   ├── org_notification_*  # Org notifications & alerts (React binding)
│   │   ├── notification_*      # Personal notifications
│   │   └── ...
│   ├── data/
│   │   ├── mockData.ts      # Mock data and TypeScript interfaces
│   │   └── orgNotifications.ts  # Notification store + addOrgNotification (set API)
│   ├── lib/
│   │   ├── api.ts           # Global api object (api.org.notifications.*, api.getNotifications)
│   │   └── utils.ts         # Utility functions (cn helper)
│   ├── pages/
│   │   ├── dashboard/       # DashboardPage
│   │   ├── inventory/       # InventoryPage
│   │   ├── pos/             # POSPage
│   │   ├── credit/          # CreditLedgerPage
│   │   ├── customers/       # CustomersPage
│   │   ├── notifications/   # NotificationsPage
│   │   ├── market/          # Market hub + billboard ads (MarketPage, Markets, ShopPage, billboard.ts, marketApi.ts, components/)
│   │   └── spreadsheet/
│   │       ├── external/    # ExternalSheet (active) + sheetFormat/useWorkbooks/workbookStorage
│   │       └── ...          # Legacy spreadsheet (on hold, not production ready)
│   ├── App.tsx              # Main routing and layout
│   ├── index.css            # Global styles and Tailwind imports
│   └── main.tsx             # App entry point
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Architecture

- **Mobile-first responsive design**: Desktop sidebar/header hidden on mobile; bottom tab navigation shown instead
- **Feature-based pages**: Each page is self-contained with its own components and state
- **Mock data layer**: All data flows through `mockData.ts` for easy swap to real APIs
- **Path aliases**: `@/*` maps to `src/*` for clean imports

## Design System

| Token | Value |
|-------|-------|
| Font Family | Inter (Google Fonts) |
| Primary Color | Slate 900 |
| Success | Emerald 500/600 |
| Warning | Amber 500/600 |
| Danger | Red 500/600 |
| Info | Blue 500/600 |

## License

MIT
