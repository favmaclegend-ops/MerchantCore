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

## 6. Platform-wide

| Feature | Where |
|---------|-------|
| Notifications (personal: unread count, mark read) | `src/context/notification_*`, `src/lib/api.ts` |
| Org Notifications & Alerts (bell dropdown, page) | `src/context/org_notification_*`, `src/components/notifications/NotificationDropdown.tsx` |
| Currency formatting | `src/context/currency_context.tsx` |
| Dark/light theming via CSS variables | `src/context/theme_*` |
| Responsive layout (desktop sidebar + mobile bottom nav) | `src/components/layout/` |
| Breakpoint hooks | `src/hooks/useBreakpoint.ts` |

---

## Status & Backend Integration

- The **organisation workspace (incl. HRM + attendance) is mock-backed** in `localStorage`
  (`merchant_org_*` keys) behind the promise-based `api.org.*` namespace. Normal (personal)
  logins use the real server.
- When the backend ships the org endpoints, only `src/lib/api.ts` changes — see
  `ORGANIZATION.md` §5 for the endpoint map, payloads and integration checklist.
