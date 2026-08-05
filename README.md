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
