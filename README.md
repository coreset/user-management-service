
to build docker image   
```bash   
$ docker build -t user-management-service . 
```
to start docker container    
```bash   
$ docker run -d --name user-management-service -p 3000:3000 user-management-service
```

## For Development   

to run nestjs application   
```bash 
$ yarn start:dev
```

This application inclided following 4 modules  
1. auth module  
2. clients module  
3. roles module   
4. users module  

### auth module  
* auth/strategies/local.strategy.ts  for handle create user with username and password   
* auth/strategies/jwt.strategy.ts  for handle jwt token (validate token, user role)  
* auth/strategies/refresh.strategy.ts for handle refresh token (validate refresh token)   
* auth/strategies/google.strategy.ts for handle google auth20  

---

## Keycloak Comparison

### What This Service Has

| Feature | Status | Notes |
|---|---|---|
| Local login (email/password) | Done | bcrypt hashing |
| JWT access tokens | Done | 60s expiry |
| Refresh token rotation | Done | Argon2 hashed, 7d expiry |
| Google OAuth 2.0 | Done | Auto user provisioning |
| Role-based access control | Done | ADMIN / EDITOR / USER guard |
| Permission management | Partial | Model exists, not enforced on endpoints yet |
| Role ↔ Permission assignment | Done | Many-to-many wired |
| Multi-device sign out | Done | Per-device & all-devices |
| Soft delete (users/roles) | Done | Audit-friendly |
| Forgot password (URL/code) | Done | 120s token TTL |
| OAuth2 client registry | Partial | Entity + CRUD, auth code flow not implemented |

### What's Missing vs. Keycloak

| Keycloak Feature | This Service | Impact |
|---|---|---|
| OpenID Connect (OIDC) | Missing | Can't act as an IdP for other apps (no `/userinfo`, no discovery doc) |
| Full OAuth2 Authorization Code Flow | Missing | `AuthorizationCode` entity exists but flow isn't wired |
| Token introspection endpoint | Missing | Other services can't validate tokens against this server |
| SAML 2.0 | Missing | No enterprise SSO |
| MFA / TOTP | Missing | No 2FA |
| LDAP / Active Directory | Missing | No enterprise directory sync |
| Permission enforcement on endpoints | Missing | Permissions stored but guards don't check them yet |
| Account lockout / brute-force | Missing | No failed login tracking |
| Rate limiting | Missing | Auth endpoints unprotected |
| Email verification on registration | Missing | Users unverified |
| Single Sign-On (SSO) | Missing | No session federation across apps |
| Multi-tenancy / Realms | Missing | Single-tenant only |
| Admin UI | Missing | API only |
| Token revocation endpoint | Missing | No `/revoke` per RFC 7009 |



### Why does the super admin live in a `master` realm?

The super admin manages every realm, so they don't *belong* to any tenant realm.
One option is to make them a special "realm-less" global user. But that means
treating the platform administrator as a separate case throughout the system:

- A separate login path (realm-less vs. realm-scoped)
- A separate way to issue and validate their tokens
- A separate role/permission model for global vs. realm roles
- More branching and more code to maintain

Instead — following Keycloak's model — we provide a built-in `master` realm and
place the super admin inside it. Every account, including the platform
administrator, then authenticates the same way and flows through the same realm,
user, role, and JWT machinery. There is no special case: the only difference is
that the super admin holds the `SUPER_ADMIN` realm role, which grants the
authority to create and manage other realms.

> Note: tokens are currently signed as JWTs (HS256). Per-realm RS256 signing and
> an OIDC/JWKS endpoint are planned (see "What's Missing vs. Keycloak" above), at
> which point realms verify tokens against their own published keys.