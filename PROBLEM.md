# PROBLEM.md - Bug Report & Fixes

## Bug 1: Password Not Sent to Backend During Member Creation (Critical)

### Problem
When a super admin creates a new team member through the Users management UI, the frontend generates a password and displays it in a credential modal. However, this password is **never transmitted to the backend**. The backend's `invite_member` function independently generates its own temporary password (a 12-char OTP string) and hashes that into the database. As a result:

- The password shown to the admin in the credential modal is client-side only
- The database stores a completely different server-generated password that nobody knows
- Login with the displayed password always fails with "Invalid email or password"

### Root Cause
- `src/lib/api.ts:457` - `addUser` only sent `email`, `role`, `jobTitle` in the request body, omitting `password`
- `app/services/org_user.py:179` - `invite_member` generated its own `temp_password` via `generate_otp() + generate_otp()` regardless of any input
- `app/services/org_admin.py:107` - `add_member` did not accept or forward a password parameter
- `app/routers/org.py:103` - The endpoint did not extract `password` from the request body

### Fix
**Files changed:**
- `app/services/org_user.py:169` - Added optional `password: str | None = None` parameter to `invite_member`. Uses provided password if present, falls back to OTP-generated temp password otherwise.
- `app/services/org_admin.py:102-108` - Added optional `password` parameter to `add_member`, forwarded to `invite_member`. Added `from app.core.security import get_password_hash` import.
- `app/routers/org.py:103` - Added `body.get("password")` to the `add_member` call.
- `src/lib/api.ts:457` - Added `password: member.password || undefined` to the POST body in `addUser`.

---

## Bug 2: Password Randomizes on Every Edit Form Open (Medium)

### Problem
When editing an existing team member, the password field in the edit form shows a freshly generated random password (`MC####!`) every time the form is opened. This is confusing to admins who see a different password each time and cannot tell what the member's actual password is.

### Root Cause
- `src/lib/api.ts:130` - `memberFromApi()` always sets `password: ''` (empty string) when loading members from the API (backend never returns passwords for security)
- `src/pages/users/MemberForm.tsx:36` - The form initialization checked `if (initial.username && initial.password)` to decide whether to use initial values. Since `password` was always `''` (falsy), it fell through to `generateCredential()`, producing a new random password every time.
- `src/lib/api.ts:461-494` - `updateUser` never included `password` in any of its PATCH requests, so even saving the form had no effect on the stored password.

### Fix
**Files changed:**
- `src/pages/users/MemberForm.tsx:35-40` - Added `if (initial.id) return initial` as the first check in the state initializer. When editing (member has an `id`), the form uses initial values directly without generating new credentials. Password field starts empty, letting the admin optionally type a new password.
- `src/lib/api.ts:470-480` - Added `patch.password` to the condition check and included `password` in the PATCH body when provided.
- `app/services/org_admin.py:111-158` - Added `password: str | None = None` parameter to `update_member_profile`. When provided, hashes and stores the new password via `target.hashed_password = get_password_hash(password)`.
- `app/routers/org.py:136-147` - Added `password=body.get("password")` to the `update_member_profile` call.

---

## Summary of All Changed Files (Bugs 1 & 2)

| File | Change |
|---|---|
| `app/services/org_user.py:169` | `invite_member` accepts optional `password` parameter |
| `app/services/org_admin.py:10,102-108` | Added `get_password_hash` import; `add_member` accepts and forwards `password` |
| `app/services/org_admin.py:112-160` | `update_member_profile` accepts optional `password`, hashes and stores it |
| `app/routers/org.py:103` | `add_member` endpoint extracts `password` from request body |
| `app/routers/org.py:147` | `update_member_profile` endpoint forwards `password` from request body |
| `src/lib/api.ts:457` | `addUser` sends `password` in POST body |
| `src/lib/api.ts:470-480` | `updateUser` includes `password` in PATCH body when provided |
| `src/pages/users/MemberForm.tsx:35-40` | Skips password generation when editing (member has `id`) |

---

## Bug 3: Session Lost on Browser Refresh (Critical)

### Problem
Users are logged out on every browser refresh. The session does not persist across page reloads, forcing users to log in again each time. Expected behavior: sessions should last 7 days.

### Root Cause
Three interconnected issues:

1. **`validateOrgSession()` destroyed the session on every call** (`src/data/organisations.ts:197-206`): It called `loadOrganisations()` which checked `merchant_org_data` in localStorage against `SEED_VERSION` (6). Since the app is now server-backed (org data comes from the API, not localStorage), `merchant_org_data` is empty/stale. `loadOrganisations()` always returned `[]`, so `validateOrgSession()` always cleared the session via `clearOrgSession()`.

2. **No server-side validation of org session on mount** (`src/context/auth_provider.tsx:20-33`): The `useEffect` only validated personal tokens via `api.getProfile()`. For org logins, it did nothing — the org session was initialized synchronously from localStorage but immediately destroyed by `validateOrgSession()` (issue #1).

3. **JWT expiry was only 24 hours** (`app/config.py:22-23`): `TOKEN_EXPIRE_MINUTES` was set to 1440 (24h), too short for the desired 7-day session.

### Fix
**Files changed:**
- `src/data/organisations.ts:197-206` - `validateOrgSession()` no longer calls `loadOrganisations()`. It simply checks that the session has valid structure (`orgId`, `token`, `member` present) and that the member is not disabled/blocked. Server-side validation happens separately on mount.
- `src/context/auth_provider.tsx:20-33` - The `useEffect` now handles three cases: personal token (validates via `api.getProfile()`), org session (validates via `api.org.validateSession()`), or no session (sets loading=false immediately). If org session validation fails, the session is cleared and the user is redirected to login.
- `src/lib/api.ts:402-405` - Added `org.validateSession()` method that calls `GET /organisations` to verify the org member JWT is still valid server-side.
- `app/config.py:22-23` - Changed `TOKEN_EXPIRE_MINUTES` from `1440` (24h) to `10080` (7 days) for both personal and org tokens.

---

## Summary of All Changed Files (Bug 3)

| File | Change |
|---|---|
| `src/data/organisations.ts:197-206` | `validateOrgSession()` trusts session data directly, no longer calls `loadOrganisations()` |
| `src/context/auth_provider.tsx:20-33` | Added org session server-side validation on mount via `api.org.validateSession()` |
| `src/lib/api.ts:402-405` | Added `org.validateSession()` that calls `GET /organisations` to verify token |
| `app/config.py:22-23` | `TOKEN_EXPIRE_MINUTES` changed from `1440` (24h) to `10080` (7 days) |
