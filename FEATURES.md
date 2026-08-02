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

## 3. Core Business Features (personal + org)

| Feature | Details | Where |
|---------|---------|-------|
| **Dashboard** | KPIs, revenue trend, transactions, low-stock alerts | `src/pages/dashboard/` |
| **Inventory** | Product CRUD, categories, low/out-of-stock status | `src/pages/inventory/InventoryPage.tsx`, `src/data/orgCommerce.ts` |
| **POS Terminal** | Product grid, category filters, cart, payment methods (Cash/Card/Mobile), checkout, transaction log; responsive cart (mobile toggle ↔ desktop side column) | `src/pages/pos/POSPage.tsx` |
| **Customers** | Directory CRUD, spending/tier, add-to-credit | `src/pages/customers/CustomersPage.tsx` |
| **Credit Ledger** | Debtors, balances, payments, overdue/critical status | `src/pages/credit/CreditLedgerPage.tsx` |
| **Calculator** | In-app utility | `src/pages/calculator/` |
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

## 6. Platform-wide

| Feature | Where |
|---------|-------|
| Notifications (unread count, mark read) | `src/context/notification_*`, `src/lib/api.ts` |
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
