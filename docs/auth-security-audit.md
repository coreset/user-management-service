# Auth System Security Audit — Issues & Suggested Fixes

> Generated from a full read of the auth module, guards/strategies, entities, config, and dependencies.
> Status: tracking doc — items are unchecked until fixed. No code has been changed as part of this audit.

Legend: `[ ]` open · `[x]` fixed

---

## Critical / High Priority

### 1. No access-token revocation mechanism
- **Where:** `src/modules/auth/guards/jwt-rs256.guard.ts:108-129`
- **Issue:** Access tokens are stateless; logout, password change, and admin "revoke session" don't invalidate an already-issued access token (valid up to 1 day in prod).
- **Suggested fix:** Add a `tokenVersion` (or `securityStamp`) column on the user, embed it in the JWT payload, and check it against the DB on every request. Bump it on password change, admin-forced logout, and "sign out all devices." Alternatively, shorten access-token TTL significantly (e.g. 5–15 min) and rely on refresh-token revocation to bound exposure.
- [ ] Fixed

### 2. Admin "revoke session" doesn't actually revoke anything
- **Where:** `src/modules/sessions/sessions.service.ts:65-76`
- **Issue:** Only flips `UserSession.isActive`, which nothing in the auth path checks; refresh tokens still work.
- **Suggested fix:** Make session revocation delete/expire the associated `RefreshToken` row(s) too, and combine with fix #1 so the access token is also killed immediately rather than just the refresh path.
- [ ] Fixed

### 3. Password-reset flow doesn't reset a password — it's a repeatable login
- **Where:** `src/modules/auth/auth.service.ts:783` (`verifyIdentifier`)
- **Issue:** Just calls `login()` instead of prompting a new password; combined with a weak, non-single-use code this is a bigger risk than a normal reset flow.
- **Suggested fix:** Split into two steps: (a) verify code/token → issue a short-lived, single-purpose "password reset ticket" (not a login session); (b) require that ticket on a dedicated `POST /reset-password` endpoint that sets a new password and invalidates the ticket. Mark `UserVerificationIdentifier.used = true` on successful verification so it can't be replayed.
- [ ] Fixed

### 4. Weak, brute-forceable reset code
- **Where:** `src/modules/auth/auth.service.ts:727`
- **Issue:** `Math.random()` 6-digit code, no rate limiting, no single-use enforcement.
- **Suggested fix:** Generate with `crypto.randomInt`, enforce single-use (see #3), and add a per-identifier attempt counter/lockout (e.g. 5 attempts then invalidate) independent of general rate limiting.
- [ ] Fixed

### 5. No rate limiting anywhere
- **Where:** absent from `package.json` / `main.ts`
- **Issue:** Login, register, OIDC token endpoint, and password-reset verification are all unthrottled.
- **Suggested fix:** Add `@nestjs/throttler` globally plus tighter per-route limits on `/auth/*/login`, `/auth/*/register`, `/auth/*/verify-identifier`, and the OIDC token endpoint. Set `trust proxy` correctly if/when deployed behind a reverse proxy so limits key off the real client IP.
- [ ] Fixed

### 6. CORS is wide open in every environment
- **Where:** `src/main.ts:37`
- **Issue:** `app.enableCors()` with no options — same wide-open policy in prod.
- **Suggested fix:** Pass an explicit `origin` allowlist sourced from an env var (e.g. `CORS_ALLOWED_ORIGINS`), with a stricter/no-op default in production if the var isn't set.
- [ ] Fixed

---

## Medium Priority

### 7. OAuth `state` param provides no CSRF protection
- **Where:** `src/modules/auth/strategies/google.strategy.ts:36-40`
- **Issue:** `state` only encodes `realmName`, isn't a random nonce, and isn't validated server-side on callback.
- **Suggested fix:** Generate a random nonce, store it (session/cache) before redirecting to Google, and compare it on callback before proceeding — keep `realmName` as a separate encoded field if needed.
- [ ] Fixed

### 8. OIDC client-secret comparison isn't timing-safe
- **Where:** `src/modules/auth/oidc-token.controller.ts:98`
- **Issue:** Plain `!==` string comparison.
- **Suggested fix:** Use `crypto.timingSafeEqual` on fixed-length buffers (hash both sides first if lengths can differ).
- [ ] Fixed

### 9. OAuth tokens leaked via redirect URL, and hardcoded to localhost
- **Where:** `src/modules/auth/auth.controller.ts:238`
- **Issue:** Tokens passed in query string; also broken outside local dev.
- **Suggested fix:** Use the existing `FRONTEND_BASE_URL` config for the redirect target, and deliver tokens via a short-lived one-time code exchanged by the frontend (or a POST-based handoff) instead of query params, to keep them out of browser history/Referer/logs.
- [ ] Fixed

### 10. Registration and verify-identifier leak user enumeration
- **Where:** `src/modules/auth/auth.service.ts:468,473` (register conflict errors), `src/modules/auth/auth.service.ts:753-787` (verify-identifier errors)
- **Issue:** Distinct email/username-taken errors on register; distinct "invalid user" vs "invalid token" errors on verify-identifier.
- **Suggested fix:** Return a generic message for both register conflict cases (e.g. "unable to register with these details") and align `verifyIdentifier`'s error responses with `forgotPassword`'s generic pattern.
- [ ] Fixed

### 11. Hardcoded `'defaultSecret'` fallback for HS256 secrets
- **Where:** `src/modules/auth/strategies/jwt.strategy.ts:23`, `src/modules/auth/strategies/refresh.strategy.ts:23`
- **Issue:** Silently falls back to a public constant secret if env vars are unset.
- **Suggested fix:** Fail startup (throw in `ConfigService`/module init) if `JWT_SECRET`/`REFRESH_JWT_SECRET` are unset, rather than silently defaulting. Also consider removing the now-dead `jwt.strategy.ts` (HS256 path) entirely since RS256 is the live mechanism.
- [ ] Fixed

### 12. No `helmet` in the stack
- **Where:** absent from `package.json` and `main.ts`
- **Issue:** No standard HTTP hardening headers (HSTS, X-Content-Type-Options, etc.).
- **Suggested fix:** Add `helmet` with default config as global middleware.
- [ ] Fixed

---

## Low Priority / Nits

### 13. Weak password complexity policy
- **Where:** `src/modules/auth/dto/local-register.dto.ts:21-27`
- **Issue:** 6-char minimum + "contains a digit" only.
- **Suggested fix:** Raise to 8+ chars and require mixed case + digit; keep it shared across register/admin-create/change-password as it is now.
- [ ] Fixed

### 14. bcrypt cost factor 10
- **Where:** all hashing sites (e.g. `user.entity.ts`, `auth.service.ts`)
- **Issue:** Acceptable but on the low side for 2026.
- **Suggested fix:** Bump to 12 if you want to raise offline-cracking resistance; low priority.
- [ ] Fixed

### 15. Admin email-change doesn't reset `isEmailVerified`
- **Where:** `src/modules/users/users.service.ts:214-223`
- **Issue:** Changed email is left marked "verified" without ever being verified.
- **Suggested fix:** Set `isEmailVerified = false` whenever `email` changes in the update path, and (optionally) re-trigger a verification email.
- [ ] Fixed

### 16. Verbose `console.log` of JWT payloads / realm names on every request
- **Where:** `src/modules/auth/guards/jwt-rs256.guard.ts:52`, `src/modules/permission/guards/permissions.guard.ts:34-36`
- **Issue:** Logs auth internals on every authenticated request.
- **Suggested fix:** Remove or route through the structured logger at debug level; don't log full JWT payloads.
- [ ] Fixed

### 17. Reset URL/code logged to console
- **Where:** `src/modules/auth/auth.service.ts:723,738`
- **Issue:** Equivalent to logging a credential.
- **Suggested fix:** Guard behind a dev-only flag or remove once an actual email provider is wired up.
- [ ] Fixed

### 18. `update()` doesn't catch duplicate-key DB errors like `create()` does
- **Where:** `src/modules/users/users.service.ts:214-223` vs `src/modules/users/users.service.ts:42-54`
- **Issue:** A duplicate-email admin update surfaces as a raw 500 instead of a clean 409.
- **Suggested fix:** Mirror the same MySQL-1062 catch/`ConflictException` handling in `update()`.
- [ ] Fixed

### 19. `RolesGuard`/`@Roles()` is dead code with a disabled null-check
- **Where:** `src/modules/roles/guards/roles/roles.guard.ts:22-24`
- **Issue:** Will throw a raw 500 instead of a clean 403 if `@Roles()` is ever applied to a route without a properly-shaped `user.roles`.
- **Suggested fix:** Either remove the unused guard/decorator, or restore the null-check before adopting `@Roles()` anywhere.
- [ ] Fixed

### 20. Unused OAuth2 authorization-code entities
- **Where:** `AuthorizationCode`, `AccessToken`, `ClientSession` entities
- **Issue:** No service/controller usage — half-modeled authorization-code grant.
- **Suggested fix:** Either implement the authorization-code grant properly (state/PKCE/single-use/redirect-URI validation) or drop the unused schema to reduce surface area.
- [ ] Fixed

### 21. Typo in generic reset message
- **Where:** `src/modules/auth/auth.service.ts:684,692,742`
- **Issue:** "if this user **exits**" should be "exists".
- **Suggested fix:** Trivial copy fix.
- [ ] Fixed

### 22. Mixed `package-lock.json` + `yarn.lock`
- **Where:** repo root
- **Issue:** Two lockfiles present, risk of drift.
- **Suggested fix:** Standardize on one package manager and remove the other lockfile.
- [ ] Fixed

### 23. `passport-google-oauth20` is unmaintained since 2020
- **Where:** `package.json`
- **Issue:** No release since 2020; still functional, no known active CVE.
- **Suggested fix:** Not urgent — track for a future migration to a maintained OIDC client library.
- [ ] Fixed
