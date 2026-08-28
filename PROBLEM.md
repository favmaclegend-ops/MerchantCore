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

---

## Bug 4: Market Billboard Has No Default Ads and No Empty State (Medium)

### Problem
The market billboard ads array was initialized as empty (`advert: []`), causing the billboard to render nothing when no ads existed. Additionally, the top 4 rated shops section only rendered when shops existed — when empty, the entire right-side grid was hidden with no indication of what it was for.

### Root Cause
- `src/pages/market/demoMarketStore.ts:77` - `advert: []` initialized with no default ads
- `src/pages/market/demoMarketStore.ts:75` - `top4tRatingShops: []` initialized empty
- `src/pages/market/components/Bilboards.tsx:42` - `top4RatingShop.length > 0 && bp.xsm &&` condition hid the entire grid when no shops existed, leaving blank space with no explanation
- `src/pages/market/components/Bilboards.tsx:37-39` - `{current && <BillboardVideo />}` rendered nothing when no ads existed

### Note: Backend Does Not Handle Market
The entire market system (shops, products, ads, billboards, cart, checkout, ratings) is **100% client-side**. The backend (`MerchantCore-API`) has zero market/shop/store/ads/billboard endpoints. All data lives in localStorage and zustand stores. The only "reviews" in the backend are HRM employee performance reviews, not product/customer reviews.

### Fix
**Files changed:**
- `src/pages/market/demoMarketStore.ts:67-79` - Added 3 default ads (`DEFAULT_ADVERTS`) with SVG data-URI gradient images and descriptive titles ("Welcome to Merchant Core Market", "Start Selling Today", "Explore Top Products"). The `advert` array now defaults to these instead of empty.
- `src/pages/market/components/Bilboards.tsx:37-50` - Billboard container now shows a styled "No ads available yet" placeholder with a megaphone emoji when `current` is undefined, instead of rendering nothing.
- `src/pages/market/components/Bilboards.tsx:42-110` - Top 4 rated shops section now always renders on large screens (`bp.xsm`). When `top4RatingShop` is empty, it shows 4 placeholder cards with dashed borders and "No top rated shops yet" text instead of hiding the grid entirely.

---

## Summary of All Changed Files (Bug 4)

| File | Change |
|---|---|
| `src/pages/market/demoMarketStore.ts:67-79` | Added 3 default SVG ads to `DEFAULT_ADVERTS`, set `advert` default |
| `src/pages/market/components/Bilboards.tsx:37-50` | Added "No ads available yet" fallback when billboard has no ads |
| `src/pages/market/components/Bilboards.tsx:42-110` | Top 4 shops grid always renders; shows "No top rated shops yet" placeholders when empty |

---

## Bug 5: Market System Was 100% Client-Side (Critical)

### Problem
The entire market system (shops, products, ads, billboards, cart, ratings, categories) was implemented entirely client-side using localStorage and zustand stores. No backend endpoints existed for market data. This meant:
- Data was not cross-platform (tied to a single browser's localStorage)
- No API for mobile/desktop clients to consume
- Data lost on cache clear or different device
- No server-side validation or persistence

### Root Cause
The backend (`MerchantCore-API`) had zero market/shop/store/ads/billboard endpoints. The only "reviews" in the backend were HRM employee performance reviews, not product/customer reviews.

### Fix — Separate Market Database + Full API
Created a completely separate `merchant_market` database with its own engine, session, and Base, plus a full REST API.

**New files created:**

| File | Purpose |
|---|---|
| `app/db/market_session.py` | Separate SQLAlchemy engine, session factory, `MarketBase`, and `get_market_db()` dependency for the `merchant_market` database |
| `app/models/market.py` | 6 models: `MarketShop`, `MarketProduct`, `MarketProductImage`, `MarketProductVariant`, `MarketAdvert`, `MarketCategory` — all using `MarketBase` |
| `app/services/market.py` | Full business logic: serialisers, public read helpers (list shops, get shop, list products, get product, list adverts, list categories, top rated shops), and authenticated write helpers (create/update shop, create/update/delete product) with ownership checks |
| `app/routers/market.py` | 10 endpoints — 7 public (browsing) + 3 authenticated (shop management) |

**Existing files modified:**

| File | Change |
|---|---|
| `app/config.py` | Added `MARKET_DATABASE_URL` setting + `sqlalchemy_market_database_url` computed property |
| `.env` / `.env.example` | Added `MARKET_DATABASE_URL=mysql+pymysql://root@localhost:3306/merchant_market` |
| `app/models/__init__.py` | Added market model imports for SQLAlchemy registration |
| `app/main.py` | Imported market models + router, mounted at `/api/v1`, added market DB auto-creation on startup |

**API Endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/market/shops` | No | List shops (search, pagination) |
| `GET` | `/api/v1/market/shops/{id}` | No | Get shop + its products |
| `GET` | `/api/v1/market/products` | No | List products (category, search, pagination) |
| `GET` | `/api/v1/market/products/{id}` | No | Get product + images + variants |
| `GET` | `/api/v1/market/advert` | No | List active billboard ads |
| `GET` | `/api/v1/market/categories` | No | List categories (falls back to defaults if empty) |
| `GET` | `/api/v1/market/top-rated` | No | Top N rated shops (default 4) |
| `POST` | `/api/v1/market/shops` | Yes | Create a shop |
| `PATCH` | `/api/v1/market/shops/{id}` | Yes | Update shop (owner only) |
| `POST` | `/api/v1/market/shops/{id}/products` | Yes | Add product to shop (owner only) |
| `PATCH` | `/api/v1/market/products/{id}` | Yes | Update product (owner only) |
| `DELETE` | `/api/v1/market/products/{id}` | Yes | Delete product (owner only) |

### Fix — Frontend Integration with Market Backend

After creating the backend API, the entire frontend market layer was rewritten to use the backend instead of localStorage/mock data.

**Files modified:**

| File | Change |
|---|---|
| `src/lib/api.ts` | Added `api.market` namespace with 12 methods: 7 public browsing (getShops, getShop, getProducts, getProduct, getAdverts, getCategories, getTopRated) and 5 authenticated management (createShop, updateShop, createProduct, updateProduct, deleteProduct). Placed at top-level alongside `api.org`. |
| `src/pages/market/demoMarketStore.ts` | Added optional `id` field to `MarketStoreShop`, `MarketStoreProduct`, and `MarketProductVariant` types for backend ID tracking. Removed `DEFAULT_ADVERTS` — ads now come from the backend. |
| `src/pages/market/marketApi.ts` | Replaced mock delay/clone pattern with real `api.market.*` calls. Added `adaptShop`, `adaptProduct`, `adaptAdvert` mappers that convert backend snake_case responses to frontend camelCase types. `fetchMarketData` now fetches all data in parallel via `Promise.all`. Removed `mergeUserMarketData` dependency — store is populated entirely from backend. |
| `src/pages/market/marketUpload.ts` | Replaced all localStorage CRUD (`loadUserShops`, `loadUserProducts`, `writeStore`) with backend API calls. `createMarketShop` → `POST /market/shops`. `uploadProductsToShop` → `POST /market/shops/{id}/products`. `removeProductFromMarket` → `DELETE /market/products/{id}`. `getMyShop` fetches all shops and matches by `owner_id`. All functions are now `async`. |
| `src/pages/market/useShopOwner.ts` | Changed `getMyShop` call to async `useEffect` — shop state is loaded from backend on mount instead of synchronously from localStorage. |
| `src/pages/market/useMarketData.ts` | No changes needed — already called `fetchMarketData` which was updated to use backend. |
| `src/pages/market/randomSlectedProduct.ts` | Removed module-load-time store access (`const product = marketStore.getState().products` at top level). `getProductsByChunck` and `getRandomProduct` now read from the store lazily at call time. |
| `src/pages/market/components/UploadToShopModal.tsx` | Made `UploadToShopModal`, `CreateShopForm`, and `UploadItemsForm` fully async. `getMyShop`, `getUploadedSourceIds`, `uploadProductsToShop`, `removeProductFromMarket` are all awaited. State initialization uses `useEffect` for async data loading. |
| `src/pages/market/ShopPage.tsx` | Made `EditShopImageModal.save` async to await `updateShopProfileImage`/`updateShopProfileBackground` before calling `syncUserMarketData`. |
| `src/pages/inventory/InventoryPage.tsx` | Replaced sync `getMyShop`/`getUploadedSourceIds`/`removeProductFromMarket` with async equivalents. Added `useEffect` to load shop ID and uploaded IDs on mount. Made `handleRemoveFromMarket` and market sync in `handleSave` async. |
| `src/pages/supply/InventoryTracking.tsx` | Same pattern as InventoryPage — async `useEffect` for initial data load, async `removeFromMarket` and `updateMarketProductFromInventory` calls. Added `useEffect` import. |
| `src/pages/users/data.ts` | Added optional `id` field to `MemberFormData` type (pre-existing bug fix — `MemberForm.tsx` checked `initial.id` but the type lacked it). |

**Key architecture decisions:**
- Public browsing endpoints use `anonRequest` (no auth) so any client can browse
- Authenticated endpoints use `orgRequest` with the org member JWT
- Backend returns snake_case; frontend adapters map to camelCase types
- `getMyShop` matches by `owner_id` extracted from the `ownerKey` pattern
- Checkout/orders remain client-side (no order backend endpoint yet)
- Product ratings remain localStorage-based (no rating backend endpoint yet)

---

### Bug 6 — Server crashes: MySQL connection refused + Market models missing foreign keys

**Symptom:** `sqlalchemy.exc.OperationalError: (pymysql.err.OperationalError) (1045, "Access denied for user 'root'@'localhost' (using password: NO)")` — server fails to start. After switching to SQLite, all market endpoints returned `500 Internal Server Error` due to `sqlalchemy.exc.NoForeignKeysError`.

**Root causes (two separate issues):**
1. `.env` had `MARKET_DATABASE_URL=mysql+pymysql://root@localhost:3306/merchant_market` but MySQL isn't running/accessible on this machine. The config defaults to SQLite but the env override forced MySQL.
2. Market models (`MarketShop`, `MarketProduct`, `MarketProductImage`, `MarketProductVariant`) used `relationship()` declarations but their foreign key columns (`shop_id`, `product_id`) lacked `ForeignKey` constraints. SQLAlchemy needs explicit `ForeignKey` to determine join conditions for relationships.

**Fixes:**

| File | Change |
|---|---|
| `.env` | Changed `MARKET_DATABASE_URL` to `sqlite:///./market.db` |
| `.env.example` | Changed defaults to SQLite, commented out MySQL examples |
| `app/db/session.py` | Added SQLite fallback — if configured URL fails to connect, auto-falls back to `./app.db`. Added `make_url()` driver detection for MySQL-specific `connect_args`. |
| `app/db/market_session.py` | Same fallback pattern — if configured URL fails, falls back to `./market.db` |
| `app/models/market.py` | Added `ForeignKey("market_shops.id")` to `MarketProduct.shop_id`. Added `ForeignKey("market_products.id")` to `MarketProductImage.product_id` and `MarketProductVariant.product_id`. |

---

### Bug 7 — Login screen content hidden when panel overflows viewport

**Symptom:** On the login page (especially the Organisation Registration form with 8 fields), when the panel height exceeds the viewport, the content is clipped at both top and bottom. The user cannot scroll to see the full form.

**Root cause:** The outer container in `default_page.tsx` used `justifyContent: 'center'` on a flex column with `minHeight: '100vh'`. When content overflows, flexbox centers the oversized content relative to the container, pushing the top of the content above the viewport (inaccessible) and the bottom below it. No `overflow-y` was set, so scrolling was disabled.

**Fix:**

| File | Change |
|---|---|
| `src/pages/authentication/default_page.tsx` | Removed `justifyContent: 'center'` from the outer container. Added `overflowY: 'auto'` to allow scrolling. Wrapped all children in an inner `<div>` with `margin: 'auto 0'` which achieves the same centering effect when content fits, but allows natural scroll flow when content overflows. Added `maxWidth: '440px'` to the inner wrapper for consistent width. |

---

### Bug 8 — "Create a shop before uploading items" always shows even after creating a shop

**Symptom:** After successfully creating a shop, opening the upload modal still shows "Create a shop before uploading items" instead of the product upload form.

**Root cause:** owner_id mismatch between creation and lookup.

- **Backend stored** `owner_id = member.id` (the OrgMember UUID, e.g., `"abc-123-member"`)
- **Frontend searched** with `ownerKey = "org:abc-123-org"` (the Organisation ID), stripped prefix → `"abc-123-org"`
- These are **different UUIDs** — the match in `getMyShop()` always failed

**Fix:**

| File | Change |
|---|---|
| `app/routers/market.py` | Added `_owner_key(member)` helper that returns `f"org:{member.org_id}"`. All 5 authenticated endpoints (`create_shop`, `update_shop`, `create_product`, `update_product`, `delete_product`) now pass this as `owner_id` instead of raw `member.id`. This stores the same cross-platform key the frontend uses. |
| `src/pages/market/marketUpload.ts` | `getMyShop()` now matches the full `ownerKey` (e.g., `"org:abc-123-org"`) against `owner_id` in the DB. Removed the prefix-stripping regex `ownerKey.replace(/^user:\|^org:/, "")` that was producing the mismatched value. |

---

### Bug 9 — Org login bypasses email verification (commented out)

**Symptom:** Organisation members can log in even when the org hasn't been verified via email OTP.

**Root cause:** In `app/services/org_user.py`, the `login_organisation()` function had the verification check commented out (marked `#######################REQUIRED`):

```python
# if not org or not org.is_verified:
#     raise HTTPException(...)
```

**Fix:**

| File | Change |
|---|---|
| `app/services/org_user.py` | Uncommented the `org.is_verified` check in `login_organisation()`. Unverified orgs now receive a 403 with "Your organisation has not been verified" message. Email sending was already functional (verified via yagmail + Gmail SMTP). |

---

### Bug 10 — Top 4 rated shops show with any number of shops / any rating

**Symptom:** The "Top 4 Rated Shops" panel shows shops even when there are very few shops or shops with trivially low ratings.

**Root cause:** The backend `top_rated_shops()` in `app/services/market.py` simply queried all shops ordered by rating with no minimum thresholds.

**Fix:**

| File | Change |
|---|---|
| `app/services/market.py` | `top_rated_shops()` now requires: (1) at least 10 shops total in the market (`MIN_SHOPS_FOR_TOP_RATED = 10`), (2) each shop must have `rating >= 1000` (`MIN_RATING_FOR_TOP_RATED = 1000`), (3) at least 4 qualifying shops must exist. If any condition fails, returns `[]` so the frontend shows the 2x2 placeholder grid. |

---

### Bug 11 — "Organisation not verified" error shows but doesn't route to verify page

**Symptom:** After uncommenting the org verification check (Bug 9), logging in with an unverified org shows the error message but the user has no way to verify from there.

**Root cause:** The `handleLogin` catch block in `OrganisationAuth.tsx` just displayed the error via `showAlert()` without switching to the verify mode.

**Fix:**

| File | Change |
|---|---|
| `src/pages/authentication/OrganisationAuth.tsx` | `handleLogin` now detects the "not been verified" error message. When caught, it sets `pending` with the org name, email, and password from the login form, then switches `mode` to `'verify'`. This shows the OTP verification form with "Enter the 6-digit code sent to [email]". The existing "Resend code" button triggers `api.org.resendVerification()`, and successful verification auto-logs in via `orgLogin()`. |

---

### Bug 12 — Verification code sent to shared business email (security risk)

**Symptom:** The org registration verification code was sent to the `businessEmail` address. Business emails are often shared among employees, meaning anyone with inbox access could intercept the code.

**Root cause:** The registration endpoint in `org_auth.py` used `business_email` for both the organisation record and the OTP email recipient.

**Fix:**

| File | Change |
|---|---|
| `app/routers/org_auth.py` | Registration now reads `superAdminEmail` from the request body and stores it on the `OrgMember.email` field (not `businessEmail`). The verification code is sent to `super_admin_email` instead of `business_email`. Added `_get_org_by_member_email()` helper that looks up an org via its member's email. Both `verify-email` and `resend-verification` endpoints now try member-email lookup first, falling back to business-email lookup for backward compatibility. |

---

### Bug 13 — "Invalid email" after org verification when logging in with business email

**Symptom:** After successfully verifying an org, the auto-login step fails with "Invalid email or password" if the user entered the business email (not the super admin email) in the login form.

**Root cause:** `OrgMember.email` stores the super admin's personal email, but users naturally enter the business email when logging in. `login_organisation()` only looked up `OrgMember.email`, so business-email logins always failed.

**Fix:**

| File | Change |
|---|---|
| `app/services/org_user.py` | `login_organisation()` now falls back: if no member matches the email directly, it checks `Organisation.business_email` and resolves the super admin member through the org. This means both `admin@gmail.com` (super admin) and `info@company.com` (business) work as login emails. |

---

### Bug 14 — Frontend never sent superAdminEmail to backend / Resend code went to wrong email

**Symptom:** Despite Bug 12's fix to the backend (which now correctly reads `superAdminEmail`), the verification code was still being sent to the business email. After resend, the new code also went to the business email instead of the super admin's personal email.

**Root cause (two issues):**

1. **`src/lib/api.ts` `register()` omitted `superAdminEmail`** — The frontend `OrganisationAuth.tsx` sent `superAdminEmail` in the `OrgRegisterInput`, but `api.org.register()` never included it in the JSON body. The backend received no `superAdminEmail`, so it fell back to `super_admin_email = business_email`, storing the business email as the member email and sending the OTP there.

2. **`resend_org_code` sent code to user-provided email** — The `resend-verification` endpoint sent the new OTP to whatever email the caller provided (often the business email). It should always send to the super admin member's email regardless of which email was used for the resend request.

**Fix:**

| File | Change |
|---|---|
| `src/lib/api.ts` | `org.register()` now includes `superAdminEmail: data.superAdminEmail` in the JSON request body |
| `app/routers/org_auth.py` | `resend_org_code` now looks up the super admin member via `OrgMember.role == "super-admin"` and sends the new OTP to `admin_member.email` instead of the user-provided email. Rate limiting and lookup also keyed to `org.id` instead of `email` |

---

## Bug 15 — Market Chat Discount Offer: "Offer is missing required details" (Critical)

### Problem
A seller sends a discount offer from the `DiscountPanel`. When the buyer taps the **"Order This Item"** button on the discount bubble, the order panel rejects it with:

> **"This offer is missing required details and can no longer be used."**

### Root Cause
`src/pages/market/chat/actions/DiscountPanel.tsx` built the outgoing discount message like this:

```ts
discountLink: generalStore.getState().discountLink ?? "test_123456",
```

`generalStore.discountLink` is initialised to `""` and was **never set** by the panel. The `??` (nullish coalescing) operator only falls back when the left side is `null`/`undefined` — **not** on an empty string. So the fallback `"test_123456"` never fired, and the offer was sent with `discountLink: ""`. The full failure chain:

1. Message sent with `discount_link = ""` → stored empty by the backend.
2. `refreshStore` (4s poll) maps `m.discount_link || undefined` → `undefined` for the buyer.
3. `DiscountMessageBubble.openOrder()` builds the target with `discountLink: message.discountLink ?? ""` → `""`.
4. `DiscountOrderPanel` validates `if (!target.discountLink || !target.newPrice)` → `!""` is true → shows "missing required details".

A secondary issue: normal text messages in `ChatThreadPage` re-sent **stale** discount fields from the last offer (including the old link), leaking discount data into ordinary messages.

### Fix
- `src/pages/market/chat/actions/DiscountPanel.tsx` — added `generateDiscountLink()` (produces `disc-<uuid>` with a fallback). The send handler now builds all values in local variables, sets them in `generalStore`, and passes them **directly** to `sendMessage` (no stale store reads). Also renamed the local price variable to avoid shadowing the `newPrice` ref.
- `src/pages/market/chat/ChatThreadPage.tsx` — normal (non-discount) sends now pass empty discount fields so stale offer data (link/image/prices/product) is never attached to a plain message.

### How the discount offer now flows end-to-end
1. **Owner** opens a chat thread → taps `+` → *Negotiate* → *New Discount* (`DiscountPanel`).
2. `DiscountPanel` loads the owner's on-market inventory items, generates a unique `disc-<uuid>` link, and `sendMessage({ type: "discount", discountLink, discountImage, product_id, oldPrice, newPrice })` sends an encrypted message whose plaintext is `"<name> at a discount price of <amount>"`.
3. **Backend** (`app/routers/chat.py` / `app/services/chat.py` / `app/models/chat.py`) stores the structured, non-encrypted discount fields alongside the ciphertext and returns them in `_message_api`. Existing callers keep working because the new service params default (`message_type="normal"`, rest `""`) and the model columns are nullable.
4. **Both sides** map the discount fields back from the API in `refreshStore`, so the bubble survives the 4s poll (`type: message_type === "discount"`).
5. **Buyer** sees `DiscountMessageBubble` (image, `% OFF` badge, struck old price, discount price, 24h countdown, **Order This Item** button — disabled once expired).
6. Tapping **Order This Item** opens `DiscountOrderPanel`, which authenticates the offer (link present + within the 24h window from `sentAt`), fetches the shop product via `api.market.getShop(shopId)` (matched by `source_id === product_id` or market `id`), shows the real product, and the **"Proceed to Add to Cart with Discount Price"** button calls `addDiscountedProductToCart` (bakes the discount price into the cart line). Checkout then charges the discount price.

### Known issue (unrelated, tracked separately)
On small screens the chat thread scroll container can be clipped depending on the wrapping layout; the messages list itself uses `flex: 1; overflowY: auto` in `ChatThreadPage`. Not part of the discount bug.

---

## How to add a new chat bubble type (reusable flow)

Every message is an **encrypted chat message with optional structured metadata**. Messages are discriminated client-side by `ChatMessage.type` (currently `"normal" | "discount"`). To add a new bubble (e.g. `"product"`, `"invoice"`, `"location"`), follow this flow:

### 1. Backend — persist the structured fields
- **Model** `app/models/chat.py`: add nullable columns with defaults to `ChatMessage` (keeps old rows + existing callers working).
- **Router** `app/routers/chat.py::send_message`: read the new snake_case body keys (e.g. `"product-id"`) and pass them to `chat.send_encrypted_message(...)`.
- **Service** `app/services/chat.py::send_encrypted_message`: add the new params **with defaults** and store them on the model instance.
- **Serialiser** `app/services/chat.py::_message_api`: include the new fields so the frontend can restore them after refresh.

### 2. Frontend API layer — `chatApi.ts`
- Add the new fields (optional) to `ChatApiMessage`.
- Add matching params to `apiSendMessage(...)` and append them to the POST body with the snake_case keys.

### 3. Frontend store — `chatStore.ts`
- Add optional fields to the `ChatMessage` interface.
- Populate them in the **optimistic push** (inside `sendMessage`).
- **Critically**, map them back in `refreshStore` from the API response. If you skip this, the bubble renders only until the next 4s poll then loses its data.
- Optionally add the new `type` to the `'normal' | 'discount'` union.

### 4. Frontend UI
- Create `XxxMessageBubble({ message, shopId, shopName })` in `src/pages/market/chat/ChatComponents.tsx`.
- Render it in `ChatThreadPage` with a type discriminator:
  ```tsx
  {thread.messages.map((m) =>
    m.type === "discount" ? (
      <DiscountMessageBubble key={m.id} message={m} shopId={thread.shopId} shopName={thread.shopName} />
    ) : m.type === "xxx" ? (
      <XxxMessageBubble key={m.id} message={m} />
    ) : (
      <MessageBubble key={m.id} message={m} />
    ),
  )}
  ```

### 5. Panels / actions (when the bubble opens something)
- Add a field to `src/pages/market/store/generalStore.ts` (e.g. `discountOrder`), render the panel in `ChatThreadPage` when set, and have the bubble / action button set it via `generalStore.setState(...)`.
- Follow the existing modal pattern: fixed overlay + backdrop blur, `onClick={close}`, inner `onClick={(e) => e.stopPropagation()}`.

---

## Bug 16 — Market Cart resets when leaving/reloading the market (Medium)

### Problem
The market cart lived only in the `marketCartStore` in-memory singleton created at module import. It survived route changes within a session (module state), but a full page reload cleared it. On a real phone/browser the cart contents were lost whenever the app was closed or preloaded/DOM was torn down.

### Fix — global store + localStorage persistence (`src/pages/market/cart.ts`)
- The store is a **module-level singleton** (`createStore`), so every consumer (`useStore(marketCartStore)` in `MarketPage`, the floating cart button, etc.) reads the same state and re-renders on change — the cart is global no matter which page is mounted.
- Added hydration: `loadInitialCartItems()` reads `localStorage["market_cart_v1"]` at module load (guarded), validates each entry's shape, and seeds the store.
- Added persistence: `marketCartStore.subscribe(persistCartItems)` writes the cart to `localStorage` on every state change (guarded for private mode/quota). Explicit `clearMarketCart()` empties it and the empty state is also persisted.
- The discount-offer "Proceed to Add to Cart" flow (Bug 15) automatically benefits — discount-priced lines persist exactly like any other line.

---

## Bug 17 — Chat poll flooding the backend every few seconds (Medium)

### Problem
`chatStore.ts` refreshed chat via a 4-second `setInterval` (`refreshStore`) with no websocket in place — and each tick re-fetched **all thread headers + every message of every thread**. `useChatStore()` was mounted in three places (`ChatListPage`, `ChatThreadPage`, `ShopPage`), so on the desktop chat view the list + thread panes ran **two parallel intervals**, and on any shop page a poll ran even though the user wasn't in chat. The poll also ignored tab visibility, so background tabs kept hitting the API every few seconds. While not a timer *leak* (cleanup ran on unmount), it was redundant traffic that overworks the server.

### Fix — single shared, visibility-gated, route-aware poll (`chatStore.ts`)
- Polling is now a **module-level, ref-counted shared interval** (`acquirePoll`/`releasePoll`): N mounted `useChatStore()` hooks share exactly ONE interval. Desktop list + thread panes therefore dedupe to one poll instead of two.
- **Visibility-gated**: the interval is created only while the tab is visible, skips a tick when hidden, and does an immediate `refreshStore()` when the tab becomes visible again (`visibilitychange`).
- **Overlap-guarded**: `refreshInFlight` skips a tick if the previous refresh is still running, so slow backends don't accumulate a backlog of requests.
- **Route-aware**: `useChatStore({ poll: false })` opts out of polling entirely — `ShopPage` uses it (it only registers the buyer session; it still gets fresh data on the initial load and via the `market-chat` event + `startThread`).
- Cadence is a named constant (`CHAT_POLL_MS = 4000`) so it's tunable to reduce traffic further if desired (e.g. 8000).

### Notes
- The notification providers (`notification_provider.tsx`, `org_notification_provider.tsx`) poll every **30s** with correct cleanup — normal, not a leak.
