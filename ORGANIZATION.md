# Organisation (Business Workspace) Feature — Developer Guide

> **Status:** Frontend development build. The organisation feature is **mock-backed** for now.
> The real server/backend does **not** implement it yet. Everything is wired to a local mock
> data layer so the full flow (register → login → roles → staff management → blocking) can be
> built, demoed and tested today. When the backend ships the endpoints, only
> `src/lib/api.ts` needs to change — see [Backend integration](#backend-integration).

---

## 1. What this feature is

An **Organisation** is a business workspace (paid tier, in development). A person registers an
organisation and becomes its **Super Admin**. The Super Admin can add **Admins** and **Staff**.
Every member logs in with the **organisation name + their credentials**.

There are three roles with a clear hierarchy:

| Role         | Access |
|--------------|--------|
| **Super Admin** | Full control. Manages admins and staff, can block/delete anyone except themselves. |
| **Admin**       | Below the Super Admin. Manages **staff only**; the Admin tab is hidden for them; they cannot manage other admins. |
| **Staff**       | Logs in to work the POS/inventory/etc. Cannot access the Users or Finance pages. Admins can **disable** them, **block their login** and **block their dashboard data preview**. |
| **Personal login (non-org)** | **No organisation features.** The Users and Finance pages are completely hidden/redirected for any non-org login — only organisation admins (Super Admin / Admin) can access them. |

### Finance & Accounting
An **admin-only** area for organisation members. Staff never see the Finance nav item and get
redirected if they try to reach `/home/finance`. It tracks cash flow and financial health with:
- **General Ledger** — every income/expense/asset/liability entry (mock-seeded).
- **Automated invoicing** — admins create invoices; one-click *Mark as sent / paid / void*.
- **Tax compliance tools** — obligations with rate, taxable base, payable/paid/balance, due dates.
- **Real-time balance sheet** — assets/liabilities/equity recomputed from live invoice + tax
  state (receivables and tax payable update automatically when an invoice or tax changes).

### Human Resources (HRM)
An **admin-only** area for organisation members that manages the **entire employee lifecycle
from hiring to retirement**. Staff never see the HRM nav item and get redirected if they try to
reach `/home/hrm`. It covers:
- **Employees** — hire, promote (probation → active), put on leave, **terminate or retire**;
  full records (department, job title, employment type, hire date, salary, benefits).
- **Payroll processing** — admins run payroll per period (gross, 10% tax, net) and mark runs
  paid. Retired/terminated employees are automatically excluded from runs.
- **Time tracking** — log daily hours + overtime per employee.
- **Performance reviews** — score 1–5 with an auto-derived rating (`exceeds` / `meets` /
  `below`); mark reviews complete.
- **Benefits administration** — benefit plans (health, retirement, transport, insurance,
  training…) with cost per employee; enrollment counts are derived from employee enrolments
  so the monthly benefits cost stays accurate.

### Blocking rules
- **Disable** (`disabled: true`) → **full lockout.** The member cannot log in and, if they had an
  active session, they are signed out / shown the *"Account disabled"* screen. They have **no
  access to anything on the platform** — not the dashboard, not inventory, not the POS. This is
  the recommended alternative to deleting a user.
- **Block login** (`isActive: false`) → the member cannot log in. The login page shows
  *"Your account has been blocked. Contact your administrator."*
- **Block dashboard data** (`dataBlocked: true`) → the member can log in, but the dashboard
  shows *"You have been blocked from seeing this data"* instead of real numbers.

---

## 2. How to try it (dev credentials)

Seed organisation **"Sunrise Mart"** is created automatically on first load (or after a seed
reset). All demo emails use the reserved `.example` domain (RFC 2606) so they **can never
collide with real server users**:

| Member        | Role        | Username / Email                    | Password       |
|---------------|-------------|-------------------------------------|----------------|
| Daniel Kofi   | Super Admin | `daniel.kofi@sunrise.example` / `dkofi` | `DemoPass@123` |
| Sarah Mensah  | Admin       | `sarah.mensah@sunrise.example` / `smensah` | `DemoPass@123` |
| Grace Addo    | Staff       | `grace.addo@sunrise.example` / `grace` | `StaffPass@123` |
| Michael Owusu | Staff       | `michael.owusu@sunrise.example` / `michael` | `StaffPass@123` |
| Rita Boateng  | Staff       | `rita.boateng@sunrise.example` / `rita` | `StaffPass@123` *(already data-blocked for demo)* |

> **Reset the demo data** at any time: clear the `merchant_org_data`,
> `merchant_org_data_version` and `merchant_org_session` keys from `localStorage` (or bump
> `SEED_VERSION` in `src/data/organisations.ts` — the next load reseeds automatically and
> clears any active org session).

**Flow to try:**
1. On the auth page (`/`), click **"Log in as an organisation"**.
2. Sign in with `Sunrise Mart` + one of the credentials above.
3. As **Super Admin**: `Users` nav item → add Admins/Staff. When you add a member, a modal
   shows the generated **username + password** — share those credentials with them.
4. **Disable** a staff member (Disable user) → they can no longer access anything on the
   platform. Or block a staff member's **login** (Block login) or **dashboard data** (Block
   dashboard data).
5. Log out, log back in as that staff member. Disabled and blocked-login users are rejected;
   data-blocked users see the blocked dashboard message. A disabled user who still has an
   active session is signed out automatically (session re-validation on load).
6. As an **Admin** (Kwame), the Users page only shows the **Staff** tab.
7. As Super Admin or Admin: `Finance` nav item → try the tabs (Overview / General Ledger /
   Invoices / Tax & Compliance / Balance Sheet). Create an invoice and watch the Balance Sheet's
   **Accounts Receivable** and the Overview's **Outstanding** update in real time. Mark it paid
   and they drop again.
8. As Super Admin or Admin: `HRM` nav item → manage the employee lifecycle (Add employee → hire
   on probation → promote, retire or terminate), run payroll for the current month and mark runs
   paid, log hours for time tracking, add performance reviews, and manage benefit plans.

> **Reset finance demo data**: clear the `merchant_org_finance_{orgId}` keys from `localStorage`
> (or bump `FINANCE_VERSION` in `src/data/finance.ts` — all orgs reseed on next load).
>
> **Reset HRM demo data**: clear the `merchant_org_hrm_{orgId}` keys from `localStorage` (or
> bump `HRM_VERSION` in `src/data/orgHRM.ts` — all orgs reseed on next load).

---

## 3. How it works today (mock architecture)

### 3.1 Mock data layer — `src/data/organisations.ts`
A self-contained module that simulates the future backend:

- **All storage is namespaced under `merchant_org_`** (`merchant_org_data`,
  `merchant_org_data_version`, `merchant_org_session`). It can never mix with data from
  normal (server-backed) logins, which also keep caches in `localStorage`
  (e.g. `dashboard_cache`, `token`, `login`).
- **Seed data** (`SEED_ORGS`) is written to `localStorage` on first load (key
  `merchant_org_data`).
- A `SEED_VERSION` (key `merchant_org_data_version`) guards the seed: when it is bumped,
  stored demo data is **wiped and reseeded fresh** (and any active `merchant_org_session`
  is cleared), so stale or conflicting demo credentials never linger.
- All mutations (register organisation, add/update/delete members) read-modify-write the same
  array, so admin changes **persist across reloads**.
- **Session** is stored under `merchant_org_session` (`{ orgId, orgName, member }`).
- On load, legacy unprefixed keys (`org_data`, `org_session`, `org_data_version`) from earlier
  builds are removed automatically.

Key exports:

| Function | Purpose |
|----------|---------|
| `registerOrganisation(input)` | Creates an org + its Super Admin member. Throws if name/business email is taken. |
| `loginOrganisation(orgName, email, password)` | Validates credentials. Throws for unknown org, bad credentials, disabled (`disabled: true`), or blocked (`isActive: false`) accounts. |
| `getSessionOrganisation()` | Returns the org of the currently logged-in session. |
| `validateOrgSession(session)` | Re-checks a stored session against the mock data; clears it (and returns `null`) if the member no longer exists, is disabled, or is blocked from login. |
| `addOrgMember(member)` / `updateOrgMember(id, patch)` / `deleteOrgMember(id)` | CRUD against the active org's member list. |

Types (`OrgMember`, `Organisation`, `OrgRole`, `OrgRegisterInput`, `OrgSession`) are the
**contract** the rest of the app consumes — keep them stable when writing the real backend.

### 3.2 Mock data layer — `src/data/finance.ts` (Finance & Accounting)
Per-organisation finance mock, scoped by org id:

- Storage key `merchant_org_finance_{orgId}` holds `{ version, state }` — namespaced so it can
  never mix with other orgs or normal-login caches.
- `FinanceState = { ledger, invoices, taxes }`. Seeded demo data uses dates **relative to
  today** so the demo always looks current.
- Invoices are **mutatable** (`createInvoice`, `setInvoiceStatus`) and persist across reloads.
- `buildBalanceSheet(state)` derives a **real-time** balance sheet: Accounts Receivable = unpaid
  invoice total, Tax Payable = unpaid tax total, Retained Earnings balances the sheet — so
  changing an invoice or tax instantly moves the balance sheet.
- Bump `FINANCE_VERSION` to force every org's finance data to reseed.

### 3.3 Mock data layer — `src/data/orgCommerce.ts` (Inventory / POS / Customers / Credit)
Per-organisation commerce mock, scoped by org id (storage key `merchant_org_commerce_{orgId}`
holding `{ version, state }`). The seed is **deliberately consistent** with the Finance mock and
the org dashboard:

- **48 products** whose total stock value is exactly **58,200** (matches the finance "Inventory"
  asset and the dashboard `inventoryValue`), with **3 low-stock** and **1 out-of-stock** items
  (matches the dashboard low-stock alert count).
- **Credit balances sum to 10,025** — the same unpaid invoices as the finance accounts
  receivable (Adom Fresh Foods 4,850 + Naana's Kitchen 3,200 + Efua Bakery 1,975).
- POS transactions mirror the finance ledger references.
- Products are **mutatable** (`createOrgProduct`, `updateOrgProduct`, `deleteOrgProduct`) and
  `status` is always recomputed from `stock` (threshold 20). A POS `checkoutOrg` records a
  transaction **and decrements stock**.
- Bump `COMMERCE_VERSION` to force every org's commerce data to reseed.

### 3.4 Mock data layer — `src/data/orgHRM.ts` (Human Resources)
Per-organisation HRM mock, scoped by org id (storage key `merchant_org_hrm_{orgId}` holding
`{ version, state }`). It models the full employee lifecycle and everything stays cross-consistent:
`OrgHrmState = { employees, benefits, payrollRuns, timeEntries, reviews }`.

- **13 seeded employees** spanning every lifecycle status: 9 active, 1 probation, 1 on-leave,
  1 retired, 1 terminated.
- **Monthly gross payroll = 40,300** — derived only from employees who are active, on
  probation or on leave (retired/terminated are excluded). Payroll tax is 10% of gross
  (`Math.round`), `net = gross - tax`. `runOrgPayroll` never double-runs a period.
- **Benefit enrollment is derived from employees** — each employee carries the benefit ids they
  are enrolled in, so the monthly benefits cost (**3,845**) updates automatically when
  enrollment changes. Deleting a benefit un-enrolls every employee.
- **Review rating is derived from the score** (≥ 4.5 `exceeds`, ≥ 3.5 `meets`, else `below`);
  completing a review stamps `reviewed_at`.
- Bump `HRM_VERSION` to force every org's HRM data to reseed.

### 3.5 API layer — `src/lib/api.ts` → `api.org.*`
The app calls the API through the `api` object, exactly like a real endpoint. Each function
adds a small artificial `delay(...)` to mimic network latency and returns the same shapes the
real backend should return.

| Function | Mock source | Future endpoint (suggested) |
|----------|-------------|-----------------------------|
| `api.org.register(data)` | `registerOrganisation` | `POST /api/v1/organisations/register` |
| `api.org.login(orgName, email, password)` | `loginOrganisation` | `POST /api/v1/organisations/login` |
| `api.org.getUsers()` | session org `members` | `GET /api/v1/organisations/{org_id}/users` |
| `api.org.addUser(member)` | `addOrgMember` | `POST /api/v1/organisations/{org_id}/users` |
| `api.org.updateUser(id, patch)` | `updateOrgMember` | `PATCH /api/v1/organisations/{org_id}/users/{id}` |
| `api.org.deleteUser(id)` | `deleteOrgMember` | `DELETE /api/v1/organisations/{org_id}/users/{id}` |
| `api.org.finance.getState()` | `loadFinanceState(orgId)` | `GET /api/v1/organisations/{org_id}/finance` |
| `api.org.finance.createInvoice(input)` | `createInvoice(orgId, input)` | `POST /api/v1/organisations/{org_id}/invoices` |
| `api.org.finance.setInvoiceStatus(id, status)` | `setInvoiceStatus(orgId, id, status)` | `PATCH /api/v1/organisations/{org_id}/invoices/{id}` |
| `api.org.getProducts()` | `getOrgProducts(orgId)` | `GET /api/v1/organisations/{org_id}/products` |
| `api.org.createProduct(data)` | `createOrgProduct(orgId, data)` | `POST /api/v1/organisations/{org_id}/products` |
| `api.org.updateProduct(id, patch)` | `updateOrgProduct(orgId, id, patch)` | `PATCH /api/v1/organisations/{org_id}/products/{id}` |
| `api.org.deleteProduct(id)` | `deleteOrgProduct(orgId, id)` | `DELETE /api/v1/organisations/{org_id}/products/{id}` |
| `api.org.getCustomers()` | `getOrgCustomers(orgId)` | `GET /api/v1/organisations/{org_id}/customers` |
| `api.org.createCustomer(data)` | `createOrgCustomer(orgId, data)` | `POST /api/v1/organisations/{org_id}/customers` |
| `api.org.updateCustomer(id, patch)` | `updateOrgCustomer(orgId, id, patch)` | `PATCH /api/v1/organisations/{org_id}/customers/{id}` |
| `api.org.deleteCustomer(id)` | `deleteOrgCustomer(orgId, id)` | `DELETE /api/v1/organisations/{org_id}/customers/{id}` |
| `api.org.getCreditEntries()` | `getOrgCreditEntries(orgId)` | `GET /api/v1/organisations/{org_id}/credit-entries` |
| `api.org.createCreditEntry(data)` | `createOrgCreditEntry(orgId, data)` | `POST /api/v1/organisations/{org_id}/credit-entries` |
| `api.org.updateCreditEntry(id, patch)` | `updateOrgCreditEntry(orgId, id, patch)` | `PATCH /api/v1/organisations/{org_id}/credit-entries/{id}` |
| `api.org.getTransactions()` | `getOrgPosTransactions(orgId)` | `GET /api/v1/organisations/{org_id}/transactions` |
| `api.org.checkout(data)` | `checkoutOrg(orgId, data)` | `POST /api/v1/organisations/{org_id}/pos/checkout` |
| `api.org.hrm.getState()` | `loadHrmState(orgId)` | `GET /api/v1/organisations/{org_id}/hrm` |
| `api.org.hrm.getEmployees()` | `getOrgEmployees(orgId)` | `GET /api/v1/organisations/{org_id}/employees` |
| `api.org.hrm.createEmployee(data)` | `createOrgEmployee(orgId, data)` | `POST /api/v1/organisations/{org_id}/employees` |
| `api.org.hrm.updateEmployee(id, patch)` | `updateOrgEmployee(orgId, id, patch)` | `PATCH /api/v1/organisations/{org_id}/employees/{id}` |
| `api.org.hrm.retireEmployee(id)` | `retireOrgEmployee(orgId, id)` | `POST /api/v1/organisations/{org_id}/employees/{id}/retire` |
| `api.org.hrm.terminateEmployee(id)` | `terminateOrgEmployee(orgId, id)` | `POST /api/v1/organisations/{org_id}/employees/{id}/terminate` |
| `api.org.hrm.getBenefits()` | `getOrgBenefits(orgId)` | `GET /api/v1/organisations/{org_id}/benefits` |
| `api.org.hrm.createBenefit(data)` | `createOrgBenefit(orgId, data)` | `POST /api/v1/organisations/{org_id}/benefits` |
| `api.org.hrm.updateBenefit(id, patch)` | `updateOrgBenefit(orgId, id, patch)` | `PATCH /api/v1/organisations/{org_id}/benefits/{id}` |
| `api.org.hrm.deleteBenefit(id)` | `deleteOrgBenefit(orgId, id)` | `DELETE /api/v1/organisations/{org_id}/benefits/{id}` |
| `api.org.hrm.getPayrollRuns()` | `getOrgPayrollRuns(orgId)` | `GET /api/v1/organisations/{org_id}/payroll` |
| `api.org.hrm.runPayroll(period)` | `runOrgPayroll(orgId, period)` | `POST /api/v1/organisations/{org_id}/payroll/run` |
| `api.org.hrm.setPayrollStatus(id, status)` | `setOrgPayrollStatus(orgId, id, status)` | `PATCH /api/v1/organisations/{org_id}/payroll/{id}` |
| `api.org.hrm.getTimeEntries()` | `getOrgTimeEntries(orgId)` | `GET /api/v1/organisations/{org_id}/time-entries` |
| `api.org.hrm.logTime(data)` | `logOrgTime(orgId, data)` | `POST /api/v1/organisations/{org_id}/time-entries` |
| `api.org.hrm.getReviews()` | `getOrgReviews(orgId)` | `GET /api/v1/organisations/{org_id}/reviews` |
| `api.org.hrm.createReview(data)` | `createOrgReview(orgId, data)` | `POST /api/v1/organisations/{org_id}/reviews` |
| `api.org.hrm.updateReview(id, patch)` | `updateOrgReview(orgId, id, patch)` | `PATCH /api/v1/organisations/{org_id}/reviews/{id}` |

### 3.6 Auth context — `src/context/auth_provider.tsx` / `auth_context.tsx`
The existing `AuthContext` now carries both auth modes:

```ts
interface AuthContextType {
  user: User | null;                 // personal (server) login
  orgUser: OrgMember | null;         // organisation member login
  orgName: string | null;
  loading: boolean;
  login(email, password): Promise<void>;
  orgLogin(orgName, email, password): Promise<void>;
  logout(): void;
}
```

- `orgLogin` stores the `org_session`, clears the personal token, and sets `orgUser`.
- On app load, the session is restored **synchronously from `localStorage`** via the `useState`
  initializers (no fetch needed for the mock).
- `logout()` clears both sessions.

---

## 4. Files touched

| File | Change |
|------|--------|
| `src/data/organisations.ts` | **New.** Mock org data, session, member CRUD. |
| `src/data/finance.ts` | **New.** Mock finance state (ledger/invoices/taxes), per-org storage, invoice CRUD, `buildBalanceSheet`. |
| `src/data/orgCommerce.ts` | **New.** Mock commerce state (products/customers/credit/POS transactions), per-org storage, product/customer/credit/checkout CRUD. |
| `src/data/orgHRM.ts` | **New.** Mock HRM state (employees/benefits/payroll/time/reviews), per-org storage, employee lifecycle, payroll runs, derived benefit enrollment & review ratings. |
| `src/pages/authentication/OrganisationAuth.tsx` | **New.** Org Login + Register UI (segmented control). |
| `src/pages/authentication/default_page.tsx` | Added the "Log in as an organisation" toggle + back link. |
| `src/context/auth_context.tsx`, `src/context/auth_provider.tsx` | Added `orgUser`, `orgName`, `orgLogin`, logout handling. |
| `src/lib/api.ts` | Added the `org.*` API namespace (users, finance, commerce, **hrm**) — all mock-backed. |
| `src/pages/home/home.tsx` | Allow org users; guard `/home/users`, `/home/finance` and `/home/hrm` for admins only; full-screen "Account disabled" lockout for `orgUser.disabled`. |
| `src/components/layout/DesktopSidebar.tsx`, `MobileNavbar.tsx` | Hide the **Users**, **Finance** and **HRM** nav items for staff/non-org. |
| `src/components/layout/DesktopHeader.tsx`, `MobileHeader.tsx` | Show org member name/role/email. |
| `src/pages/finance/FinancePage.tsx` | **New.** Admin-only Finance & Accounting (Overview, General Ledger, Invoices, Tax & Compliance, Balance Sheet). |
| `src/pages/hrm/HRMPage.tsx` | **New.** Admin-only Human Resources (Overview, Employees, Payroll, Time & Attendance, Performance, Benefits). |
| `src/pages/users/UsersPage.tsx` | Fetch members from `api.org.getUsers()`; role-based tabs & actions; credential reveal modal. |
| `src/pages/users/data.ts` | `Member` = `OrgMember`; credential generator (`generateCredential`), `toMember`, `roleLabel`. |
| `src/pages/users/MemberForm.tsx` | Username/Password/Job Title fields; auto-generates credentials for new members. |
| `src/pages/users/MemberTable.tsx` | "Disable user"/"Enable user", "Block login", "Block dashboard data", status badges, super-admin guard. |
| `src/pages/inventory/InventoryPage.tsx` | Uses `api.org.*` for org users (add/edit/delete inventory against localStorage). |
| `src/pages/pos/POSPage.tsx` | Uses `api.org.*` for org users (products, checkout, transaction log; skips `refreshDashboardCache`). |
| `src/pages/customers/CustomersPage.tsx` | Uses `api.org.*` for org users (directory + add-to-credit). |
| `src/pages/credit/CreditLedgerPage.tsx` | Uses `api.org.*` for org users (debtor registry, payments, status changes). |
| `src/pages/dashboard/DashboardPage.tsx` | Shows the blocked-data message for `orgUser.dataBlocked`. |

---

## 5. Backend integration

When the backend implements organisations, do this:

1. **Replace the bodies of `api.org.*`** in `src/lib/api.ts` with real `fetch`/`request` calls
   to the endpoints in section 3.5. Use the same request/response shapes.
2. **Login/register** should return an access token + the member object (and org id/name).
   Store the member/org data in `org_session` exactly like `setOrgSession` does today.
3. **`isActive` / `dataBlocked` / `disabled`** should be returned by the users endpoints and
   respected server-side (reject login when `isActive === false` or `disabled === true`, and
   revoke/deny access for disabled sessions).
4. **Passwords** must never be returned by the backend. When the API returns members, drop the
   `password` field; the credential reveal modal should instead read the response of
   `addUser`/`updateUser` only (server returns the generated credential once, e.g. at creation).
5. Roles stay as strings: `super-admin`, `admin`, `staff`. The frontend derives all permission
   decisions from `orgUser.role` (see `UsersPage`, `FinancePage`, `home.tsx`, `DesktopSidebar`).
6. Finance data is **per-organisation** (mock key `merchant_org_finance_{orgId}`). Server-side,
   every finance endpoint must be scoped by `org_id` and only admins of that org may access it.
7. Invoice status transitions are `draft → sent → paid`, `overdue` (auto when past due), and
   `void`. `paid` moves the invoice out of outstanding/receivables; `void` excludes it from
   totals.
8. Inventory / Customers / Credit / POS data is **per-organisation** (mock key
   `merchant_org_commerce_{orgId}`). Server-side, every commerce endpoint must be scoped by
   `org_id`. Products return `status` computed from `stock` (threshold 20); a POS checkout must
   record a transaction and decrement stock atomically.
9. HRM data is **per-organisation** (mock key `merchant_org_hrm_{orgId}`) and **admin-only**.
   Server-side, every HRM endpoint must be scoped by `org_id` and only admins of that org may
   access it. Payroll runs must never be created twice for the same period/employee; employee
   `retire`/`terminate` transitions are explicit lifecycle actions.

### Suggested payloads

```ts
// POST /organisations/register
{ orgName, businessEmail, superAdminName, superAdminUsername, superAdminEmail, password }

// POST /organisations/login
{ orgName, email, password }   // email may be email OR username

// GET /organisations/{org_id}/users  ->  OrgMember[]
{
  id, name, email, username, phone, role, jobTitle,
  isActive: boolean,      // false => blocked from login
  dataBlocked: boolean,   // true  => blocked from dashboard data
  disabled: boolean,      // true  => fully disabled (no access to anything)
}

// GET /organisations/{org_id}/finance  ->  FinanceState
{
  ledger: [{ id, date, account, category, description, amount, reference, status }],
  invoices: [{ id, number, customer, issuedAt, dueAt, amount, status, items: [{ description, qty, unitPrice }] }],
  taxes: [{ id, name, rate, basis, period, dueAt, paid, status }],
}

// POST /organisations/{org_id}/invoices
{ customer, dueAt, items: [{ description, qty, unitPrice }] }

// PATCH /organisations/{org_id}/invoices/{id}
{ status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void' }

// GET /organisations/{org_id}/hrm  ->  OrgHrmState
{
  employees: [{
    id, name, email, phone, department, jobTitle,
    employmentType: 'full-time' | 'part-time' | 'contract',
    hireDate, salary: number,
    status: 'active' | 'probation' | 'on-leave' | 'terminated' | 'retired',
    benefits: ['BNF-001', ...],
  }],
  benefits: [{ id, name, type, cost, description, enrollment }],  // enrollment derived
  payrollRuns: [{ id, period, employee_id, employee_name, gross, tax, net, status: 'pending' | 'paid', processed_at }],
  timeEntries: [{ id, employee_id, employee_name, date, hours, overtime_hours }],
  reviews: [{ id, employee_id, employee_name, period, score, rating, notes, status: 'pending' | 'completed', reviewed_at }],
}

// POST /organisations/{org_id}/employees
{ name, email, phone?, department, jobTitle, employmentType, hireDate, salary, status?, benefits?: string[] }

// PATCH /organisations/{org_id}/employees/{id}
{ salary?, status?, department?, benefits?, ... }   // retire/terminate set status

// POST /organisations/{org_id}/payroll/run
{ period: 'Aug 2026' }   // creates pending runs for active/probation/on-leave employees only

// PATCH /organisations/{org_id}/payroll/{id}
{ status: 'pending' | 'paid' }
```

---

## 6. Notes & constraints

- **The real server belongs to normal (personal) logins ONLY.** Organisation logins have no
  token, and `request()` in `src/lib/api.ts` rejects **every** server call made without a token
  (only `/auth/login`, `/auth/register`, `/auth/verify-email` are public). It is impossible for
  an organisation account to reach the backend "anyhow".
- **Organisation dashboard is 100% mock** (`src/data/orgDashboard.ts`) — it never reads the
  shared `dashboard_cache` (which belongs to normal logins) and never calls
  `getDashboardStats` / `getRevenueTrend` / `getTransactions`. Its figures are consistent with
  the Finance mock (total revenue = ledger income total, etc.).
- **No data leaks between auth modes.** `orgLogin` clears `token` and `dashboard_cache`;
  `logout` clears them too; normal `login` clears any leftover org session. The two modes are
  strictly exclusive.
- The Inventory / POS / Customers / Credit pages now serve **mock localStorage data for org
  accounts** (`api.org.*` → `src/data/orgCommerce.ts`), so everything an organisation touches
  is fully self-contained in the browser and never reaches the server. Normal logins keep using
  the real backend.
- The **HRM page is admin-only and 100% mock** (`api.org.hrm.*` → `src/data/orgHRM.ts`). Staff
  and non-org logins are redirected away from `/home/hrm` and never see the nav item. Its
  numbers are internally consistent (monthly payroll = active + probation + on-leave salaries;
  benefits cost = Σ cost × derived enrollment).
- Existing lint conventions are respected (`react-hooks/set-state-in-effect` is avoided, no new
  `any` types added).
