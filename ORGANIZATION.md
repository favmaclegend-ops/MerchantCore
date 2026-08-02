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
| **Staff**       | Logs in to work the POS/inventory/etc. Cannot access the Users page. Admins can **block their login** and **block their dashboard data preview**. |
| **Personal login (non-org)** | **No organisation features.** The Users page is completely hidden/redirected for any non-org login — only organisation admins (Super Admin / Admin) can access it. |

### Blocking rules
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
4. Block a staff member's **login** (Block login) or **dashboard data** (Block dashboard data).
5. Log out, log back in as that staff member. Blocked-login users are rejected; data-blocked
   users see the blocked dashboard message.
6. As an **Admin** (Kwame), the Users page only shows the **Staff** tab.

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
| `loginOrganisation(orgName, email, password)` | Validates credentials. Throws for unknown org, bad credentials, or blocked (`isActive: false`) accounts. |
| `getSessionOrganisation()` | Returns the org of the currently logged-in session. |
| `addOrgMember(member)` / `updateOrgMember(id, patch)` / `deleteOrgMember(id)` | CRUD against the active org's member list. |

Types (`OrgMember`, `Organisation`, `OrgRole`, `OrgRegisterInput`, `OrgSession`) are the
**contract** the rest of the app consumes — keep them stable when writing the real backend.

### 3.2 API layer — `src/lib/api.ts` → `api.org.*`
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

### 3.3 Auth context — `src/context/auth_provider.tsx` / `auth_context.tsx`
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
| `src/pages/authentication/OrganisationAuth.tsx` | **New.** Org Login + Register UI (segmented control). |
| `src/pages/authentication/default_page.tsx` | Added the "Log in as an organisation" toggle + back link. |
| `src/context/auth_context.tsx`, `src/context/auth_provider.tsx` | Added `orgUser`, `orgName`, `orgLogin`, logout handling. |
| `src/lib/api.ts` | Added the `org.*` API namespace (mock-backed). |
| `src/pages/home/home.tsx` | Allow org users; guard `/home/users` for admins only. |
| `src/components/layout/DesktopSidebar.tsx`, `MobileNavbar.tsx` | Hide the **Users** nav item for staff. |
| `src/components/layout/DesktopHeader.tsx`, `MobileHeader.tsx` | Show org member name/role/email. |
| `src/pages/users/UsersPage.tsx` | Fetch members from `api.org.getUsers()`; role-based tabs & actions; credential reveal modal. |
| `src/pages/users/data.ts` | `Member` = `OrgMember`; credential generator (`generateCredential`), `toMember`, `roleLabel`. |
| `src/pages/users/MemberForm.tsx` | Username/Password/Job Title fields; auto-generates credentials for new members. |
| `src/pages/users/MemberTable.tsx` | "Block login", "Block dashboard data", blocked badges, super-admin guard. |
| `src/pages/dashboard/DashboardPage.tsx` | Shows the blocked-data message for `orgUser.dataBlocked`. |

---

## 5. Backend integration

When the backend implements organisations, do this:

1. **Replace the bodies of `api.org.*`** in `src/lib/api.ts` with real `fetch`/`request` calls
   to the endpoints in section 3.2. Use the same request/response shapes.
2. **Login/register** should return an access token + the member object (and org id/name).
   Store the member/org data in `org_session` exactly like `setOrgSession` does today.
3. **`isActive` / `dataBlocked`** should be returned by the users endpoints and respected
   server-side (reject login when `isActive === false`).
4. **Passwords** must never be returned by the backend. When the API returns members, drop the
   `password` field; the credential reveal modal should instead read the response of
   `addUser`/`updateUser` only (server returns the generated credential once, e.g. at creation).
5. Roles stay as strings: `super-admin`, `admin`, `staff`. The frontend derives all permission
   decisions from `orgUser.role` (see `UsersPage`, `home.tsx`, `DesktopSidebar`).

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
}
```

---

## 6. Notes & constraints

- **No real API call** is made by the organisation feature yet — every function is backed by
  `localStorage` mock data. Personal login still hits the real server as before.
- The stock `DashboardPage` / POS flows still require the real server; an org member without a
  personal token will see the usual fetch errors in those areas until the backend also moves
  product/transaction data into org workspaces.
- Existing lint conventions are respected (`react-hooks/set-state-in-effect` is avoided, no new
  `any` types added).
