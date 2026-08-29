# MerchantCore — Feature List

MerchantCore is a business management platform with a **personal (server-backed)** tier and an
**Organisation** workspace tier (mock-backed for now — see `ORGANIZATION.md`). This file
catalogues every feature and where to find it.

Legend: `[org]` organisation-workspace only · `[admin]` organisation admins (Super Admin /
Admin) only · `[hrm]` HRM permission (Super Admin / Admin / HRM Manager) · `[fin]` Finance
permission (Super Admin / Admin / Finance Manager) · `[dev]` mock-backed until the backend ships.

---

## 1. Authentication & Accounts

| Feature | Where | Notes |
|---------|-------|-------|
| Personal sign-up, login, email verification | `src/pages/authentication/`, `src/lib/api.ts` | Server-backed (`/auth/register`, `/auth/login`, `/auth/verify-email`) |
| Organisation sign-up / login (`orgName` + credentials) | `src/pages/authentication/OrganisationAuth.tsx`, `src/data/organisations.ts` | `[org]` `[dev]` |
| Role hierarchy | `src/data/organisations.ts`, `src/lib/orgAccess.ts` | `super-admin` → `admin` → `hrm-manager` / `finance-manager` → `staff`; module access gated by `orgAccess` |
| Session persistence + logout | `src/context/auth_provider.tsx` | Both auth modes are strictly exclusive |
| Account lifecycle (disable / block login / block data) | `src/data/organisations.ts`, `src/pages/users/` | Disabled ⇒ full lockout; blocked ⇒ login rejected; data-blocked ⇒ dashboard hidden |

## 2. Workspace (org-only, mock-backed)

| Feature | Where |
|---------|-------|
| Organisation dashboard (stats, trend, transactions, alerts) | `src/data/orgDashboard.ts`, `src/pages/dashboard/DashboardPage.tsx` |
| Users & roles management (incl. HRM/Finance Manager roles) | `src/pages/users/` |
| Finance & Accounting | `src/pages/finance/FinancePage.tsx`, `src/data/finance.ts` |
| HRM (Human Resources) | `src/pages/hrm/HRMPage.tsx`, `src/data/orgHRM.ts` |
| Attendance / self check-in ("My Attendance") | `src/pages/attendance/AttendancePage.tsx`, `src/data/orgHRM.ts` |
| Notifications & Alerts | `src/pages/notifications/NotificationsPage.tsx`, `src/data/orgNotifications.ts` |

## 3. Core Business Features (personal + org)

| Feature | Details | Where |
|---------|---------|-------|
| **Dashboard** | KPIs, revenue trend, transactions, low-stock alerts | `src/pages/dashboard/` |
| **Inventory** | Product CRUD, categories, low/out-of-stock status | `src/pages/inventory/InventoryPage.tsx`, `src/data/orgCommerce.ts` |
| **POS Terminal** | Product grid, category filters, cart, payment methods (Cash/Card/Mobile), checkout, transaction log; responsive cart (mobile toggle ↔ desktop side column) | `src/pages/pos/POSPage.tsx` |
| **Customers** | Directory CRUD, spending/tier, add-to-credit | `src/pages/customers/CustomersPage.tsx` |
| **Credit Ledger** | Debtors, balances, payments, overdue/critical status | `src/pages/credit/CreditLedgerPage.tsx` |
| **Calculator** | In-app utility | `src/pages/calculator/` |
| **Market** | Shop browsing, product catalog, cart & checkout with per-shop order alerts, billboard ads, and E2E-encrypted shop chat | `src/pages/market/` (see §5e, §5f) |
| **Spreadsheet (External)** | FortuneSheet workbook workspace — create, autosave, save (Ctrl+S), import/export `.xlsx`/`.csv`, deep-linked editor | `src/pages/spreadsheet/external/` |
| **Settings** | App preferences | `src/pages/settings/` |

## 4. Finance & Accounting — `[org]` `[fin]` `[dev]`

`src/pages/finance/FinancePage.tsx` · `src/data/finance.ts`

- Overview: revenue, expenses, net cash flow, cash on hand
- General Ledger with income/expense filtering
- Invoicing: create invoice, `draft → sent → paid`, void
- Tax & Compliance: obligations with rate, basis, payable/paid/balance, due dates
- Real-time Balance Sheet (assets / liabilities / equity, auto-derived receivables & tax)

## 5. Human Resources (HRM) — `[org]` `[hrm]` `[dev]`

`src/pages/hrm/HRMPage.tsx` · `src/data/orgHRM.ts`

Manages the **entire employee lifecycle from hiring to retirement**, plus payroll, time &
attendance, performance reviews and benefits:

| Sub-feature | Details |
|-------------|---------|
| **Employees** | Add/edit employees; statuses `probation → active → on-leave → terminated / retired`; department, job title, employment type, hire date, salary; attendance rate + latest review shown per employee |
| **Payroll processing** | Run payroll per period (gross, 10% tax, net); mark runs paid; retired/terminated automatically excluded; no duplicate runs per period |
| **Time & Attendance** | Log daily hours + overtime; **today roster** (Present · time / Pending); per-employee attendance & performance summary (scheduled/present/absent, rate, hours, overtime, latest review) |
| **Performance reviews** | Score 1–5 with derived rating (`exceeds`/`meets`/`below`); complete reviews |
| **Benefits administration** | Health / retirement / transport / insurance / training plans; cost per employee; enrollment derived from employees |
| **HRM Overview** | Headcount by status, monthly payroll, benefits cost, open reviews, **present today**, hours logged |

Consistent seed numbers (Sunrise Mart): 13 employees, monthly payroll **40,300**, monthly
benefits cost **3,845**, 6 reviews.

## 5b. Self check-in & performance — `[org]` `[all members]` `[dev]`

`src/pages/attendance/AttendancePage.tsx` · `src/data/orgHRM.ts`

Every org member (incl. staff) checks in at work with a **Present** button. The record
(date + check-in time) flows into the HRM attendance view (auto-provisioning the member's HRM
employee profile on first check-in if missing). The page also shows the member's own
performance indicators: **attendance rate**, days present, hours + overtime logged and their
**latest review score/rating**.

- Idempotent per day (pressing Present twice returns the existing record).
- Staff see **their own** data; Super Admin / Admin / HRM Manager see **every** employee's on
  the HRM page.

## 5c. Notifications & Alerts — `[org]` `[all members]` `[dev]`

`src/pages/notifications/NotificationsPage.tsx` · `src/data/orgNotifications.ts`

Org-wide, transparent feed of every transaction performed by any employee — visible to **all**
members via the header **bell** (unread badge + dropdown) and the **Notifications** page
(`/home/notifications`).

- **Alerts** (`is_alert`): POS **sale** checkout, **credit** payment, **invoice** paid/voided,
  **payroll** run. **Notifications**: invoice **created**, employee **check-in**, system.
- Each row shows the kind icon, actor + role, relative time, amount and reference; newest first.
- Read state is **per member** (`read_by`), so each member has their own unread count.
- **Mark all read**; delete/clear gated by `canDeleteOrgNotifications` (Super Admin always;
  Admins when the Super Admin enables the **"Admins can delete notifications"** setting).
- The feed auto-syncs via the API-layer emission hooks (checkout / credit / finance / payroll /
  check-in) — no UI changes needed for new activity.

**Developer integration** — to emit a notification from any component:

```ts
import { addOrgNotification } from '@/data/orgNotifications';
import { getOrgSession } from '@/data/organisations';
import { OrgNotificationContext } from '@/context';

const session = getOrgSession();
if (session) {
  addOrgNotification(session.orgId, { kind: 'system', title, message, is_alert: true });
  // `addOrgNotification` writes to localStorage only — refresh the React context
  // afterwards so the badge, dropdown and page update without a full reload.
  const { fetch } = useContext(OrgNotificationContext);
  void fetch();
}
```

`addOrgNotification` (the "set" API) prepends an item to the org's feed and auto-fills the
actor from the active session. Reading, marking read and deleting go through
`api.org.notifications.getFeed() / markRead() / markAllRead() / deleteNotification() /
clearAll()` (`src/lib/api.ts`) or the equivalent context helpers. The page also re-syncs from
storage on mount, so activity emitted anywhere is visible immediately on visit.

## 5d. Spreadsheet (External) — `[all users]`

`src/pages/spreadsheet/external/ExternalSheet.tsx` · `sheetFormat.ts` · `useWorkbooks.ts` · `workbookStorage.ts`

The production spreadsheet workspace (`/home/spreadsheet`), built on **FortuneSheet**
(`@fortune-sheet/react` + `@fortune-sheet/core`) with Excel/CSV import-export via
`@corbe30/fortune-excel`. It is the successor to the legacy in-house grid (see below).

- **Workspace view** (`?id=` absent): cards of saved workbooks (newest first), **New Workbook**
  button (also emits an org notification — §5c), delete-with-confirm.
- **Editor view** (`?id=<workbookId>` deep link, fully remounts per workbook): FortuneSheet grid,
  inline workbook rename, **autosave on every change**, explicit **Save / Ctrl+S** with a
  "Saved" flash, **Import `.xlsx`/`.csv`**, **Export to Excel**.
- **Persistence**: promise-based `WorkbookStorage` interface (`workbookStorage.ts`) — the UI
  never touches localStorage directly, so a server backend can be dropped in later by
  reimplementing one interface. The local impl keeps a metadata index (`mc_workbooks`) for the
  grid plus one record per workbook (`mc_sheet:<id>`).
- **Sheet data format**: FortuneSheet hands the UI an internal row×col `data` matrix in
  `onChange` but stores/loads the compact **celldata** list. `sheetFormat.ts` owns that
  translation so the two forms can never drift apart again (saving the matrix straight to
  storage previously produced an empty grid on reload).
- **What it tackles**: replaces the buggy/limited hand-rolled grid with a battle-tested
  spreadsheet engine; adds persistence, workbook management, autosave, rename, import/export
  and shareable deep links that the legacy editor never had.

### Legacy spreadsheet — ON HOLD (in development, not production ready)

`src/pages/spreadsheet/SpreadSheetPage.tsx` · `spreadSheetLogic.ts` · `spreadSheetReabon.tsx` ·
`FillHandle.tsx` · `spreadComponents/` · `spread.css`

The original in-house spreadsheet built directly on DOM tables with custom logic: formula bar
(`SpreadSheetReabon`), fill handle, multi-select / block drag-fill, a formatting toolbar
(`spreadComponents/`), and a shared store (`src/context/store.ts` via `elk-components`).
It is **not routed** (`home.tsx` uses the external editor) and is **not production ready** —
kept in the tree while the FortuneSheet-based external workbook ships.

## 5e. Market & Billboard Ads — `[all users]` `[dev]`

`src/pages/market/` · `billboard.ts` · `demoMarketStore.ts` · `marketApi.ts` · `marketUpload.ts` · `useMarketData.ts`

The marketplace hub (`/home/market`) where shoppers browse shops and their products, plus an
in-app **billboard** that plays short video adverts.

- **Shop browsing**: `/home/market` lists shops and products; `/home/market/<shopId>` (e.g.
  `sunrise_mart@123456`) opens a shop profile (overview map, products, ratings) — see
  `ShopPage.tsx`, `OverView.tsx`, `Products.tsx`.
- **Data layer**: `demoMarketStore.ts` defines `MarketStore`, `MarketStoreShop`,
  `MarketStoreProduct` and `MarketStoreAdvert` and seeds an `elk-components` store. `marketApi.ts`
  exposes promise-based fetchers (`fetchMarketData`, `fetchShops`, `fetchShop`, `fetchProducts`,
  `fetchTopRatedShops`, `fetchAdverts`, `fetchCategories`) with simulated latency; `useMarketData()`
  hydrates the store once per session. Swap the fetchers for HTTP calls when the backend ships.
- **Cart & checkout** (`cart.ts` + `MarketPage.tsx`): shoppers add products to the cart from the
  product grids (`Markets.tsx`, `Products.tsx`) or the product detail panel. The cart panel
  (desktop side column / mobile slide-up overlay) supports quantity ±, remove, and shows
  subtotal, 5% tax and total. Checkout (`submitMarketOrder` in `marketApi.ts`) groups the cart by
  owning shop and **dispatches an order alert to every shop that owns a selected product**; the
  completed order is stored in `marketOrdersStore` and shown in the **Log** modal. See `README.md`
  → "Market & Billboard Ads" → "Cart & checkout".
- **Shop creation & item upload** (`marketUpload.ts` + `components/UploadToShopModal.tsx`): a
  **Upload to shop** button in the POS page header and under **Settings** opens a panel — a
  create-shop form when the user owns no shop yet, otherwise a POS item picker with **All items** /
  **Selected items** modes that highlights items already uploaded (deduped by `sourceId`) so they
  can't be double-added. User shops/products persist in localStorage (`mc_market_user_shops` /
  `mc_market_user_products`), keyed by `getOwnerKey` (`org:<orgId>` for org members, `user:<id>`
  for personal logins). `mergeUserMarketData` folds them into the seeded market bundle and
  `syncUserMarketData()` pushes them into `marketStore` immediately. On a shop page the owner sees
  an **Add new items** button (`useShopOwner` guard) that opens the same panel scoped to that shop.
  Maps to `POST /market/shops` and `POST /market/items` when the backend ships.
- **Product moderation** (`components/ProductDeleteButton.tsx`): a trash button on market product
  cards (hub and shop page) lets **admins remove products from the marketplace** — reserved for org
  `admin`/`super-admin` roles (`canManageMarket` in `src/lib/orgAccess.ts`); personal logins can
  only delete items they uploaded themselves. `deleteMarketProduct` tombstones the id in
  `mc_market_deleted_products` so the removal survives reloads (`mergeUserMarketData` filters
  tombstones). Maps to `DELETE /market/items/:id`.
- **Billboard** (`components/Bilboards.tsx`): a **single large billboard** that cycles through
  **exactly three** randomly-selected ads (chosen per user/mount by `pickBillboardAds` — Fisher–
  Yates shuffle, count `BILLBOARD_AD_COUNT = 3`). Ads play **one at a time**: each advert is a
  **muted, autoplaying video with no controls** (`components/BillboardVideo.tsx`); when a clip
  ends the next advert plays, looping over and over. `useBillboardPlayer` owns the sequence and
  advances on the video's `onEnded`. Adverts without a `videoUrl` fall back to the `advertUrl`
  poster image and auto-advance after a fixed timeout. Clicking an ad opens `visitLink` in a new
  tab.
- **Advert shape (future server contract)**:

  ```ts
  interface MarketStoreAdvert {
    id: string;        // unique advert id
    title?: string;    // display title (falls back to id)
    advertUrl: string; // poster / fallback image
    videoUrl?: string; // short muted looping clip (no controls)
    visitLink: string; // target URL opened on click
  }
  ```

  See `README.md` → "Market & Billboard Ads" for the endpoint mapping and integration checklist.

## 5f. Market Chat (end-to-end encrypted) — `[all users]`

`src/pages/market/chat/` · `chatApi.ts` · `chatStore.ts` · `chatCrypto.ts` · `chatTypes.ts` ·
`ChatRoute.tsx` · `ChatListPage.tsx` · `ChatThreadPage.tsx`

A WhatsApp-style shop-messaging feature (`/market/chat` list + `/market/chat/:shopId` thread)
backed by the **real chat API** (see `API.md` §6) with **end-to-end encryption** — the server can
never read message contents:

- **Identity**: a personal user is a **buyer** (`user:<id>`); an org member is a **shop owner**
  (`org:<org_id>`). A buyer starts a conversation from a shop's **Message** button
  (`startThread`), which registers the buyer's RSA public key, opens (or reuses) the thread, and
  navigates to the thread page. Only buyers can start threads. **Owners** see the conversations
  buyers started with their shop in the same chat UI — `useChatStore` resolves the participant from
  the personal `Authcontext.user` (`user:<id>`) **or** the org session (`org:<orgId>`), so both
  roles load their threads.
- **Encryption** (`chatCrypto.ts`, Web Crypto): per-participant **RSA-2048 / OAEP-SHA256** keypair,
  a per-thread symmetric key **AES-256-GCM** for message bodies, and the thread key stored only as
  ciphertext wrapped under each participant's RSA public key. The private key lives in localStorage
  and never leaves the client; message bodies are decrypted locally after fetching. When a role's
  own wrap is missing (e.g. the owner's key wasn't registered when the thread was created),
  `storeThread` **falls back to the other participant's wrap** — so a single browser switching
  between a personal buyer and the org owner (sharing one keypair) can still recover the thread key.
- **Realtime**: while the chat is open, `useChatStore` **polls the API every ~4s** (no websocket in
  place yet), so messages sent by the other participant appear without a manual refresh.
- **State** (`chatStore.ts`): `useChatStore()` exposes `{ threads, unread, loading }`; reusable
  actions `startThread`, `sendMessage`, `markThreadRead`, `deleteThread`, `getThread(s)`,
  `getUnreadCount`, `notifyChatChanged`. A user signed in only as an org member (no personal buyer
  session) gets a clear "sign in with a customer account to message this shop" prompt from the shop
  **Message** button.
- **Widescreen layout** (`ChatRoute.tsx`): on wide screens (`useBreakpoint().lg`) the chat renders a
  **two-column grid** — a left column with the list of stores that have open conversations and a
  right column with the selected conversation panel (a placeholder prompts to pick a conversation).
  On narrow screens it keeps the single-page flow (list page, then full-screen thread once opened).
  The open conversation is highlighted in the list from the URL `/chat/:shopId`.
- **Thread page** (`ChatThreadPage.tsx`): loads + decrypts the conversation (loading state), sends
  the buyer's messages (E2E-encrypted), and shows the **shop name as a clickable link** that
  navigates back to the shop page. Each **outgoing message shows a delivery tick** (WhatsApp-style):
  a blue double-check when the other participant has read the conversation, a single check once it's
  stored server-side, and a spinner while it's still sending (`sending`/`sent`/`delivered` status on
  `ChatMessage`, driven by the other side's unread count).
- **List page** (`ChatListPage.tsx`): a WhatsApp-style list sorted by newest activity. Each tile
  shows the **actual conversation partner** as the title — the buyer name for a shop owner viewing,
  the shop name for a buyer viewing (`ChatThread.title`, so the list shows the person/org you're
  chatting with, not always the shop) — plus the **last-message time**, an **unread-count indicator**
  badge, and a preview that prefixes the sender's name. Deleting a conversation uses **no visible
  button**: on desktop you **right-click** a tile to open a context menu, and on mobile you **swipe
  the tile left** to reveal a red delete action (`ChatTile` in `ChatListPage.tsx`).
- **Embedding**: the chat routes hide the app frame (header/nav/gap) via the `hideFrame` regex
  `/\/market\/chat(\/|$)/` in `home.tsx`, and the cart is hidden on chat routes so the thread stays
  clean.
- **Identity for API calls** (`chatApi.ts`): `getChatToken()` uses the personal JWT
  (`localStorage 'token'`) first, else the org session token, so both buyers and owners authenticate
  against `/chat/*`.
- **Data lifecycle**: threads/messages live in a dedicated `chat.db` and are purged server-side
  after a **4-day TTL** on startup and during reads (freshly-created empty threads are retained).

## 6. Platform-wide

| Feature | Where |
|---------|-------|
| Notifications (personal: unread count, mark read) | `src/context/notification_*`, `src/lib/api.ts` |
| Org Notifications & Alerts (bell dropdown, page) | `src/context/org_notification_*`, `src/components/notifications/NotificationDropdown.tsx` |
| Currency formatting | `src/context/currency_context.tsx` |
| Dark/light theming via CSS variables | `src/context/theme_*` |
| Responsive layout (desktop sidebar + mobile bottom nav) | `src/components/layout/` |
| **iOS-style bottom nav indicator** | `src/components/layout/MobileNavbar.tsx` |
| Breakpoint hooks | `src/hooks/useBreakpoint.ts` |

## 6b. iOS-style gilding bottom nav indicator — `[mobile]`

`src/components/layout/MobileNavbar.tsx` · CSS in `src/index.css` (`.nav-indicator`,
`.nav-indicator-pop`, `@keyframes nav-pill-pop`)

Replaces the static per-tab background highlight with a **single sliding pill** that glides
between the active tab, matching iOS's tab-bar feel:

- **Single indicator element**: an absolutely-positioned pill inside the floating nav
  (`position: relative`). One active highlight slides from tab to tab instead of each tab
  having its own static background.
- **Precise math**: a `useLayoutEffect` runs on every route change and measures the active
  tab's `offsetLeft` + `offsetWidth` (via `data-nav-index` on each tab and the More button),
  then sets the pill's `width` and `transform: translateX(...)` to land exactly on that tab.
- **Springy bounce**: the pill transitions with an overshooting spring bezier
  `cubic-bezier(0.34, 1.56, 0.64, 1)` on both `transform` and `width`, so it overshoots and
  settles — the iOS-style bouncy motion. A nested inner pill runs `nav-pill-pop`
  (`scale` up → overshoot → settle) keyed by the route so every navigation gets a subtle pop.
- **No flash on mount**: the first placement disables the transition (`.no-anim`) so the
  indicator appears already-positioned instead of animating from tab 0.
- **More sheet integration**: opening the More sheet (or an active path in the sheet) slides
  the indicator onto the **More** button; closing it slides it back.
- Inactive tab icon/label keep a `color` crossfade; only the moving pill carries the
  `--bg-nav-active` background, so colors stay readable as it glides underneath.

### 6b-i. Drag-to-navigate — `[mobile]`

The nav pill is not just a passive indicator — it is **draggable**. Pointer events on the nav
(`onPointerDown/Move/Up/Cancel` with `setPointerCapture`) drive a direct-manipulation flow:

- **Press** anywhere on the nav while holding the finger down scales the pill up
  (`.drag-scale`, `transform: scale(1.15)` via the inner pill, so it doesn't clash with the
  wrapper's `translateX`).
- **Drag** horizontally: past an `8px` movement threshold the pill enters drag mode and follows
  the finger's X position (`e.clientX - nav.left - pillWidth/2`, clamped inside the bar).
- **Release**: the tab whose rectangle the finger is over becomes active and the app **routes to
  that page** (`navigate(primaryItems[idx].path)`); dragging onto **More** opens the sheet.
- A `draggedRef` flag suppresses the native `Link` `onClick` after a real drag, so a drag-release
  doesn't bounce back to the tab you pressed on; a plain tap (no movement) still uses the native
  click to route.
- The nav sets `touchAction: none` + `user-select: none` so the browser doesn't hijack the
  horizontal drag with scrolling/selection while the finger is gliding.
- `positionIndicator()` is also called on pointer-up (when not navigating) so the pill snaps back
  to the current tab with the same spring after an aborted drag.


---

## Status & Backend Integration

- The **organisation workspace (incl. HRM + attendance) is mock-backed** in `localStorage`
  (`merchant_org_*` keys) behind the promise-based `api.org.*` namespace. Normal (personal)
  logins use the real server.
- When the backend ships the org endpoints, only `src/lib/api.ts` changes — see
  `ORGANIZATION.md` §5 for the endpoint map, payloads and integration checklist.
