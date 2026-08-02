# Organisation (Business Workspace) Feature — Developer Guide

> **Status:** Frontend development build. The organisation feature is **mock-backed** for now.
> The real server/backend does **not** implement it yet. Everything is wired to a local mock
> data layer so the full flow (register → login → roles → staff management → blocking) can be
> built, demoed and tested today. When the backend ships the endpoints, only
> `src/lib/api.ts` needs to change — see [Backend integration](#backend-integration).

---

## 1. What this feature is

An **Organisation** is a business workspace (paid tier, in development). A person registers an
organisation and becomes its **Super Admin**. The Super Admin can add **Admins**, **managers**
(HRM / Finance) and **Staff**. Every member logs in with the **organisation name + their
credentials**.

There are five roles with a clear hierarchy:

| Role | Access |
|--------------|--------|
| **Super Admin** | Full control. Manages every member and can block/delete anyone except themselves. |
| **Admin** | Below the Super Admin. Manages staff and managers (Admin + HRM Manager + Finance Manager tabs), can access **both** Finance and HRM, and can block/disable anyone except the Super Admin. |
| **HRM Manager** | **HRM only.** Can view/manage the HRM page but **not** Finance, Users or other manager modules. |
| **Finance Manager** | **Finance only.** Can view/manage the Finance page but **not** HRM, Users or other manager modules. |
| **Staff** | Logs in to work the POS/inventory/etc. Cannot access the Users, Finance or HRM pages. Admins can **disable** them, **block their login** and **block their dashboard data preview**. |
| **Personal login (non-org)** | **No organisation features.** The Users, Finance and HRM pages are completely hidden/redirected for any non-org login — only organisation admins/managers with the matching permission can access them. |

Every org member (including **Staff**) has their own **Attendance** page (`/home/attendance`)
for self check-in and their personal performance indicators — see *Self check-in & performance*
below.

### Finance & Accounting
An area for organisation members with the **Finance** permission (**Super Admin / Admin /
Finance Manager**). Others never see the Finance nav item and get redirected if they try to
reach `/home/finance`. It tracks cash flow and financial health with:
- **General Ledger** — every income/expense/asset/liability entry (mock-seeded).
- **Automated invoicing** — admins create invoices; one-click *Mark as sent / paid / void*.
- **Tax compliance tools** — obligations with rate, taxable base, payable/paid/balance, due dates.
- **Real-time balance sheet** — assets/liabilities/equity recomputed from live invoice + tax
  state (receivables and tax payable update automatically when an invoice or tax changes).

### Human Resources (HRM)
An area for organisation members with the **HRM** permission (**Super Admin / Admin / HRM
Manager**) that manages the **entire employee lifecycle from hiring to retirement**. Others never
see the HRM nav item and get redirected if they try to reach `/home/hrm`. It covers:
- **Employees** — hire, promote (probation → active), put on leave, **terminate or retire**;
  full records (department, job title, employment type, hire date, salary, benefits).
- **Payroll processing** — run payroll per period (gross, 10% tax, net) and mark runs
  paid. Retired/terminated employees are automatically excluded from runs.
- **Time & Attendance** — log daily hours + overtime; a **today roster** shows who checked in
  (Present · time / Pending); an **attendance & performance summary** per employee shows
  scheduled/present/absent days, attendance rate, hours, overtime and latest review.
- **Performance reviews** — score 1–5 with an auto-derived rating (`exceeds` / `meets` /
  `below`); mark reviews complete.
- **Benefits administration** — benefit plans (health, retirement, transport, insurance,
  training…) with cost per employee; enrollment counts are derived from employee enrolments
  so the monthly benefits cost stays accurate.

### Self check-in & performance (My Attendance)
Every org member has an **Attendance** nav item / route (`/home/attendance`). Staff "register
themselves" when they come to work by pressing **Present** — the check-in writes a
**date + check-in time** attendance record keyed to their HRM employee profile (matched by
email; if the member has no employee record yet, one is auto-provisioned). That record flows
straight into the HRM **Time & Attendance** view. The page also shows the member's own
**attendance rate**, **days present**, **hours/overtime logged** and **latest review score** —
their personal performance indicators. Admins/HRM managers see the same indicators for every
employee on the HRM page.

### Notifications & Alerts
Every org member (including **Staff**) sees a **bell icon** in the header with an **unread badge**
and a **Notifications** page (`/home/notifications`). The feed is org-wide and **transparent**:
any transaction performed by any employee is emitted as an alert visible to everyone, with the
actor, their role, the amount and a reference:
- **Alerts** (`is_alert: true`) — POS **sale** checkout, **credit** payment, **invoice** paid or
  voided, **payroll** run.
- **Notifications** (`is_alert: false`) — invoice **created**, employee **check-in**, system
  messages.
Each member's read state is tracked per-member (`read_by`), so everyone has their own unread
count. Only the **Super Admin** can delete notifications; the Super Admin can switch on a
settings toggle that grants **Admins** delete access as well (other managers/staff never delete).

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
| Efua Mensah   | HRM Manager | `efua.mensah@sunrise.example` / `efua` | `DemoPass@123` |
| Kwame Asante  | Finance Manager | `kwame.asante@sunrise.example` / `kwame` | `DemoPass@123` |
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
3. As **Super Admin**: `Users` nav item → add **Team members** (pick Admin, HRM Manager or
   Finance Manager) and **Staff**. When you add a member, a modal shows the generated
   **username + password** — share those credentials with them.
4. **Disable** a staff member (Disable user) → they can no longer access anything on the
   platform. Or block a staff member's **login** (Block login) or **dashboard data** (Block
   dashboard data).
5. Log out, log back in as that staff member. Disabled and blocked-login users are rejected;
   data-blocked users see the blocked dashboard message. A disabled user who still has an
   active session is signed out automatically (session re-validation on load).
6. Log back in as **Efua Mensah** (HRM Manager) → sees the **HRM** nav item and page but not
   **Finance** or **Users**. Log in as **Kwame Asante** (Finance Manager) → sees **Finance** but
   not **HRM** or **Users**. As an **Admin** (Sarah), the Users page shows **both** tabs and can
   manage staff *and* managers.
7. As Super Admin / Admin / HRM Manager: `HRM` nav item → manage the employee lifecycle (Add
   employee → hire on probation → promote, retire or terminate), run payroll for the current
   month and mark runs paid, log hours, add performance reviews, manage benefit plans, and watch
   the **Time & Attendance** tab's today roster + attendance & performance summary.
8. As any org member (incl. staff): `Attendance` nav item → press **Present** to check in for
   today. The record appears in the HRM "Today's attendance" roster. The page shows your own
   attendance rate, days present, hours and latest review score.
9. As Super Admin or Admin: `Finance` nav item → try the tabs (Overview / General Ledger /
   Invoices / Tax & Compliance / Balance Sheet). Create an invoice and watch the Balance Sheet's
   **Accounts Receivable** and the Overview's **Outstanding** update in real time. Mark it paid
   and they drop again.
10. As any org member (incl. staff): click the **bell** in the header → the **Notifications**
    dropdown shows the latest alerts. Open **Notifications** (`/home/notifications`) → filter
    All / Alerts / Notifications, **Mark all read**. Make a POS sale or check in, then watch a
    new alert appear for everyone. Only the **Super Admin** sees the **delete** buttons; on the
    page the Super Admin can toggle *"Admins can delete notifications"* to grant Admins the same.

> **Reset notifications demo data**: clear the `merchant_org_notifications_{orgId}` keys from
> `localStorage` (or bump `NOTIF_VERSION` in `src/data/orgNotifications.ts` — all orgs reseed
> on next load).

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
`OrgHrmState = { employees, benefits, payrollRuns, timeEntries, reviews, attendance }`.

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
- **Attendance / self check-in** — `attendance` seeds ~21 working days of `present`/`absent`
  records (deterministic, weekends excluded) so attendance rates start around 90%.
  `checkInOrg(orgId, employeeId)` records **today** as `present` with a check-in time and is
  **idempotent** (same day returns the existing record). `getOrgAttendanceSummary` derives, per
  active/probation employee: scheduled/present/absent days, attendance rate, hours + overtime
  (from `timeEntries`) and the latest review score/rating — these are the performance indicators
  shown on the HRM page and the staff "My Attendance" page.
- Bump `HRM_VERSION` to force every org's HRM data to reseed.

### 3.5 Module-level permissions — `src/lib/orgAccess.ts`
Centralises the role → module mapping so routes, nav items and page bodies all agree:

| Role | Finance | HRM | Users | Attendance (self) |
|------|:-------:|:---:|:-----:|:------------------:|
| super-admin | ✅ | ✅ | ✅ | ✅ |
| admin | ✅ | ✅ | ✅ | ✅ |
| hrm-manager | — | ✅ | — | ✅ |
| finance-manager | ✅ | — | — | ✅ |
| staff | — | — | — | ✅ |
| non-org (personal) | — | — | — | — |

Exports: `canManageFinance`, `canManageHRM`, `canManageUsers`, `canAccess(orgUser, perm)`,
`isOrgMember`.

### 3.6 API layer — `src/lib/api.ts` → `api.org.*`
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
| `api.org.hrm.getAttendance()` | `getOrgAttendance(orgId)` | `GET /api/v1/organisations/{org_id}/attendance` |
| `api.org.hrm.getSummary()` | `getOrgAttendanceSummary(orgId)` | `GET /api/v1/organisations/{org_id}/attendance/summary` |
| `api.org.attendance.self()` | HRM employee matched to the session member by email | `GET /api/v1/organisations/{org_id}/attendance/self` |
| `api.org.attendance.getRecords()` | `getOrgAttendance(orgId)` | `GET /api/v1/organisations/{org_id}/attendance` |
| `api.org.attendance.getSummary()` | `getOrgAttendanceSummary(orgId)` | `GET /api/v1/organisations/{org_id}/attendance/summary` |
| `api.org.attendance.checkIn()` | `checkInOrg(orgId, employeeId)` (auto-provisions the employee if missing) | `POST /api/v1/organisations/{org_id}/attendance/check-in` |
| `api.org.notifications.getFeed()` | `getOrgNotifications(orgId)` (session-scoped) | `GET /api/v1/organisations/{org_id}/notifications` |
| `api.org.notifications.markRead(id)` | `markOrgNotificationRead(orgId, id)` (adds the session member to `read_by`) | `POST /api/v1/organisations/{org_id}/notifications/{id}/read` |
| `api.org.notifications.markAllRead()` | `markAllOrgNotificationsRead(orgId)` (adds the session member to every `read_by`) | `POST /api/v1/organisations/{org_id}/notifications/read-all` |
| `api.org.notifications.deleteNotification(id)` | `deleteOrgNotification(orgId, id)` (permission-gated) | `DELETE /api/v1/organisations/{org_id}/notifications/{id}` |
| `api.org.notifications.clearAll()` | `clearOrgNotifications(orgId)` (permission-gated) | `DELETE /api/v1/organisations/{org_id}/notifications` |
| `api.org.notifications.setSettings(patch)` | `setOrgNotificationSettings(orgId, patch)` (super admin only) | `PATCH /api/v1/organisations/{org_id}/notifications/settings` |

**Emission hooks** (transactional): the `checkout`, `updateCreditEntry` (when a payment is
recorded), `finance.createInvoice`, `setInvoiceStatus` (paid/voided), `hrm.runPayroll` and
`attendance.checkIn` API functions also push a matching notification via
`addOrgNotification` — so the feed stays in sync with real activity with no UI code changes.

### 3.7 Auth context — `src/context/auth_provider.tsx` / `auth_context.tsx`
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
| `src/data/organisations.ts` | **New.** Mock org data, session, member CRUD; `OrgRole` includes `hrm-manager` / `finance-manager`; seeds Efua Mensah (HRM Manager) + Kwame Asante (Finance Manager). |
| `src/data/finance.ts` | **New.** Mock finance state (ledger/invoices/taxes), per-org storage, invoice CRUD, `buildBalanceSheet`. |
| `src/data/orgCommerce.ts` | **New.** Mock commerce state (products/customers/credit/POS transactions), per-org storage, product/customer/credit/checkout CRUD. |
| `src/data/orgHRM.ts` | **New.** Mock HRM state (employees/benefits/payroll/time/reviews/**attendance**), per-org storage, employee lifecycle, payroll runs, derived benefit enrollment & review ratings, `checkInOrg` + `getOrgAttendanceSummary`. |
| `src/lib/orgAccess.ts` | **New.** Module-level permissions (`canManageFinance` / `canManageHRM` / `canManageUsers` / `canAccess`). |
| `src/pages/authentication/OrganisationAuth.tsx` | **New.** Org Login + Register UI (segmented control). |
| `src/pages/authentication/default_page.tsx` | Added the "Log in as an organisation" toggle + back link. |
| `src/context/auth_context.tsx`, `src/context/auth_provider.tsx` | Added `orgUser`, `orgName`, `orgLogin`, logout handling. |
| `src/lib/api.ts` | Added the `org.*` API namespace (users, finance, commerce, **hrm**, **attendance**) — all mock-backed. |
| `src/pages/home/home.tsx` | Allow org users; guard `/home/users`, `/home/finance` and `/home/hrm` via `orgAccess` helpers; new `/home/attendance` self-service route; full-screen "Account disabled" lockout for `orgUser.disabled`. |
| `src/components/layout/DesktopSidebar.tsx`, `MobileNavbar.tsx` | Filter nav items by module permission (`orgAccess`); **Finance** visible to finance-managers, **HRM** to hrm-managers, plus an **Attendance** item for every org member. |
| `src/components/layout/DesktopHeader.tsx`, `MobileHeader.tsx` | Show org member name/role/email. |
| `src/pages/finance/FinancePage.tsx` | **New.** Finance & Accounting (Overview, General Ledger, Invoices, Tax & Compliance, Balance Sheet) for super-admin/admin/finance-manager. |
| `src/pages/hrm/HRMPage.tsx` | **New.** Human Resources (Overview, Employees, Payroll, Time & Attendance, Performance, Benefits) for super-admin/admin/hrm-manager; attendance roster + per-employee summary. |
| `src/pages/attendance/AttendancePage.tsx` | **New.** Self check-in ("Present") + personal attendance rate, hours and latest review — available to every org member. |
| `src/data/orgNotifications.ts` | **New.** Mock notifications/alerts state (kinds, severity, per-member `read_by`, settings), per-org storage, `addOrgNotification` (actor from session), mark-read/delete/clear/settings fns, `canDeleteOrgNotifications`. |
| `src/context/org_notification_context.tsx`, `src/context/org_notification_provider.tsx` | **New.** Org notification context + provider (30s poll, unread count, canDelete, settings). |
| `src/pages/notifications/NotificationsPage.tsx` | **New.** Notifications & Alerts page (stats, All/Alerts/Notifications filters, mark-all-read, delete/clear gated by permission, Super-Admin settings toggle). |
| `src/components/notifications/NotificationDropdown.tsx` | Org-aware bell dropdown (unread badge, per-kind icons, delete button when allowed, "View all notifications"). |
| `src/pages/users/UsersPage.tsx` | Fetch members from `api.org.getUsers()`; role-based tabs & actions; Admins tab manages Admin / HRM Manager / Finance Manager; credential reveal modal. |
| `src/pages/users/data.ts` | `Member` = `OrgMember`; credential generator (`generateCredential`), `toMember`, `roleLabel`, `ADMIN_ROLES`. |
| `src/pages/users/MemberForm.tsx` | Username/Password/Job Title fields + Role selector (Admin / HRM Manager / Finance Manager); auto-generates credentials. |
| `src/pages/users/MemberTable.tsx` | "Disable user"/"Enable user", "Block login", "Block dashboard data", status badges, super-admin guard. |
| `src/pages/inventory/InventoryPage.tsx` | Uses `api.org.*` for org users (add/edit/delete inventory against localStorage). |
| `src/pages/pos/POSPage.tsx` | Uses `api.org.*` for org users (products, checkout, transaction log; skips `refreshDashboardCache`). |
| `src/pages/customers/CustomersPage.tsx` | Uses `api.org.*` for org users (directory + add-to-credit). |
| `src/pages/credit/CreditLedgerPage.tsx` | Uses `api.org.*` for org users (debtor registry, payments, status changes). |
| `src/pages/dashboard/DashboardPage.tsx` | Shows the blocked-data message for `orgUser.dataBlocked`. |
| `tests/orgAccess.test.ts`, `tests/orgHRM.test.ts`, `tests/api.test.ts`, `tests/organisations.test.ts`, `tests/usersData.test.ts` | Coverage for the new roles, permissions, check-in/attendance and updated seed. |

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
5. Roles stay as strings: `super-admin`, `admin`, `hrm-manager`, `finance-manager`, `staff`. The
   frontend derives all permission decisions from `orgUser.role` via `src/lib/orgAccess.ts` (see
   `home.tsx`, `DesktopSidebar`, `MobileNavbar`, `UsersPage`, `FinancePage`, `HRMPage`). The
   backend must enforce the same isolation: only members with the matching role may access each
   module's endpoints.
6. Finance data is **per-organisation** (mock key `merchant_org_finance_{orgId}`). Server-side,
   every finance endpoint must be scoped by `org_id` and only members with the **Finance**
   permission (super-admin / admin / finance-manager) may access it.
7. Invoice status transitions are `draft → sent → paid`, `overdue` (auto when past due), and
   `void`. `paid` moves the invoice out of outstanding/receivables; `void` excludes it from
   totals.
8. Inventory / Customers / Credit / POS data is **per-organisation** (mock key
   `merchant_org_commerce_{orgId}`). Server-side, every commerce endpoint must be scoped by
   `org_id`. Products return `status` computed from `stock` (threshold 20); a POS checkout must
   record a transaction and decrement stock atomically.
9. HRM data is **per-organisation** (mock key `merchant_org_hrm_{orgId}`) and only accessible to
   members with the **HRM** permission (super-admin / admin / hrm-manager). Server-side, every
   HRM endpoint must be scoped by `org_id`. Payroll runs must never be created twice for the same
   period/employee; employee `retire`/`terminate` transitions are explicit lifecycle actions.
10. Attendance / self check-in: `checkIn` must be scoped to the session member, map the member to
     an HRM employee (by email) — provisioning one if missing — and be **idempotent per day**
     (a second check-in the same day returns the existing record). Attendance endpoints are
     open to **all** org members for their own data, and to HRM-permission holders for the full
     roster/summary.
11. Notifications are **per-organisation** (mock key `merchant_org_notifications_{orgId}`) and
    readable by **every** org member. Read state is **per member** (`read_by: member_id[]`) —
    the server must add the session member's id to `read_by`, never mark read for the whole org.
    `DELETE` is restricted to the super admin (plus admins when the org's
    `allow_admin_delete` settings flag is on); `settings` is super-admin only.
12. Transaction endpoints (`checkout`, credit payment, invoice create/paid/void, payroll run,
    check-in) should emit a notification server-side with the same kind/title/amount/actor
    shape the mock uses, so the feed requires no client changes.

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
  attendance: [{ id, employee_id, employee_name, date, check_in: 'HH:MM', status: 'present' | 'absent' }],
}

// POST /organisations/{org_id}/employees
{ name, email, phone?, department, jobTitle, employmentType, hireDate, salary, status?, benefits?: string[] }

// PATCH /organisations/{org_id}/employees/{id}
{ salary?, status?, department?, benefits?, ... }   // retire/terminate set status

// POST /organisations/{org_id}/payroll/run
{ period: 'Aug 2026' }   // creates pending runs for active/probation/on-leave employees only

// PATCH /organisations/{org_id}/payroll/{id}
{ status: 'pending' | 'paid' }

// POST /organisations/{org_id}/attendance/check-in  ->  OrgAttendanceRecord
{ }   // server maps the session member -> HRM employee (by email, provisioning if missing);
     // returns { id, employee_id, employee_name, date, check_in: 'HH:MM', status: 'present' }

// GET /organisations/{org_id}/attendance/summary  ->  OrgAttendanceSummary[]
[{
  employee_id, employee_name,
  scheduled_days, present_days, absent_days,
  attendance_rate: number,      // 0-100, present / scheduled
  total_hours, overtime_hours,
  latest_review_score: number | null,
  latest_review_rating: 'exceeds' | 'meets' | 'below' | null,
}]

// GET /organisations/{org_id}/notifications  ->  { notifications: OrgNotification[], settings }
// POST /organisations/{org_id}/notifications/{id}/read
// POST /organisations/{org_id}/notifications/read-all
// DELETE /organisations/{org_id}/notifications/{id}          (super admin / granted admins)
// DELETE /organisations/{org_id}/notifications               (super admin / granted admins)
// PATCH /organisations/{org_id}/notifications/settings       (super admin only)
//   { allow_admin_delete?: boolean }

// GET /organisations/{org_id}/notifications  ->  feed item shape
{
  id, kind: 'sale' | 'credit' | 'invoice' | 'payroll' | 'low_stock' | 'check_in' | 'system',
  severity: 'info' | 'success' | 'warning' | 'danger',
  is_alert: boolean,                 // transaction kinds => true
  title, message,
  amount: number | null,             // e.g. sale total / credit payment / payroll gross
  ref: string | null,                // transaction/invoice/payroll reference
  actor_name, actor_role,            // 'System' / 'Platform' for seeded system items
  read_by: string[],                 // member ids; the session member is added on read
  created_at: string,                // ISO
}
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
- The **HRM page is permission-gated (super-admin / admin / hrm-manager) and 100% mock**
  (`api.org.hrm.*` → `src/data/orgHRM.ts`). Finance-managers, staff and non-org logins are
  redirected away from `/home/hrm` and never see the nav item. Its numbers are internally
  consistent (monthly payroll = active + probation + on-leave salaries; benefits cost =
  Σ cost × derived enrollment).
- **Self check-in ("My Attendance")** (`api.org.attendance.*` → `src/data/orgHRM.ts`) is
  available to **every org member**, including staff. The session member is matched to an HRM
  employee by email and auto-provisioned on first check-in if needed, so the record always shows
  up in the HRM attendance view.
- **Notifications & Alerts** (`api.org.notifications.*` → `src/data/orgNotifications.ts`) is
  available to **every org member**. The feed is unshift-newest-first, read state is per-member
  (`read_by`), and delete is gated by `canDeleteOrgNotifications` (super-admin always; admin
  only when the super admin flips `allow_admin_delete`; others never). Transaction hooks in
  `api.ts` keep the feed in sync automatically.
- Existing lint conventions are respected (`react-hooks/set-state-in-effect` is avoided, no new
  `any` types added); the eslint problem count is unchanged from the pre-feature baseline.
