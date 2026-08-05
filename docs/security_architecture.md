# Pikud — Mandatory Enterprise Security & Authentication Architecture

**Document Version:** 1.0.0  
**Status:** Mandatory System Specification  
**Scope:** Frontend, Backend, Authentication Services, Session Management & User Preferences  
**Location:** `docs/security_architecture.md`  

---

## 1. Executive Summary & Purpose

This document defines the **mandatory architecture** for authentication, session lifecycle, credential protection, authorization, and user preferences persistence for the **Pikud** platform.

Every current and future developer, engineering team member, or AI agent contributing to this project **MUST** follow this specification. No temporary workarounds, duplicate auth mechanisms, or client-side sensitive data persistence are permitted.

---

## 2. Architecture Philosophy

1. **Single Source of Truth:** PostgreSQL is the sole authoritative store for users, credentials, role scopes, and permanent user preferences.
2. **Zero Insecure Storage:** Sensitive credentials (Refresh Tokens, passwords, user secrets, roles, permissions) must never be stored in client-side persistent storage (`localStorage`, `sessionStorage`).
3. **Defense-in-Depth:** Every API endpoint must enforce authentication, role checks, and organizational hierarchy scope limits.

---

## 3. Authentication & Token Architecture

Authentication follows a strict 2-tier token model:

```
[User Login Request]
        │
        ▼
[Flask Auth API (/api/security/login)]
        │
        ▼
[Verify Bcrypt Hash in PostgreSQL (security.users)]
        │
        ▼
[Issue 15-Min Access Token]  ──────► [Return in Response JSON Payload]
        │
        ▼
[Issue 7-Day Refresh Token]  ──────► [Set HttpOnly Secure SameSite Cookie (refresh_token)]
```

### 3.1 Access Token Specifications
- **Lifetime:** Short (10–15 minutes).
- **Storage:** Application memory (React state / AuthContext) ONLY. Never written to `localStorage`.
- **Usage:** Sent in HTTP `Authorization: Bearer <token>` header for all API calls.

### 3.2 Refresh Token Specifications
- **Lifetime:** Long (7–30 days).
- **Storage:** Stored **ONLY as an `HttpOnly`, `Secure` (in HTTPS), `SameSite=Lax`, `Path=/api/security` Cookie** (`refresh_token`).
- **Forbidden Locations:**
  - ❌ `localStorage`
  - ❌ `sessionStorage`
  - ❌ Zustand / Redux persistent stores
  - ❌ React Context / Component State
  - ❌ Exposed JavaScript properties
- **Handling:** Read and validated exclusively by the backend Flask API (`/api/security/refresh`).

---

## 4. Session Restoration & Silent Refresh Flow

When the user opens the application or refreshes the browser:

```
App Mount / 401 Unauthorized Intercepted
        │
        ▼
Axios Interceptor calls POST /api/security/refresh withCredentials: true
        │
        ▼
Flask Reads HttpOnly refresh_token Cookie
        │
        ▼
Validates Session in PostgreSQL (security.user_sessions)
        │
        ├── [IF VALID]: Issues new 15-min Access Token & Rotated HttpOnly Cookie ──► App Restores Session & User Profile
        └── [IF INVALID]: Clears Cookie ──► Redirects User to /login
```

- Users remain seamlessly logged in across browser refreshes and tab restarts as long as the Refresh Token cookie is valid.

---

## 5. User Preferences Architecture (PostgreSQL Persistence)

User preferences belong to the user account, not to a single browser or device. All permanent preferences are persisted in PostgreSQL table `security.user_preferences`.

### 5.1 Persisted Preferences Schema
- **`theme`**: `'dark'` | `'light'`
- **`language`**: `'he'` | `'en'`
- **`notification_preferences`**: JSONB (email, SMS, web notifications)
- **`dashboard_layout`**: JSONB (card ordering, default views)
- **`default_page`**: Default landing route (`'/dashboard'`, `'/attendance'`)
- **`table_density`**: `'compact'` | `'comfortable'` | `'spacious'`
- **`accessibility_preferences`**: JSONB (font size, contrast mode)
- **`display_preferences`**: JSONB (column visibility, chart types)

### 5.2 Endpoints & Sync
- `GET /api/security/preferences`: Retrieves preferences from PostgreSQL on login/restore.
- `PUT /api/security/preferences`: Upserts modified preferences directly into PostgreSQL.

---

## 6. `localStorage` Strict Usage Policy

`localStorage` is strictly restricted to temporary, non-sensitive client UI state.

### ✅ Allowed in `localStorage`
- Sidebar collapsed state (`sidebar_collapsed`)
- Active tab / filter view ID (`dashboard_filters`)
- Transient table scroll positions
- Last selected date filter

### ❌ Strictly FORBIDDEN in `localStorage`
- Passwords
- JWT Refresh Tokens
- Authentication secrets
- User roles & permission arrays
- Personally Identifiable Information (PII)

---

## 7. Password Security & Session Revocation

- **Hashing:** All user passwords must be salted and hashed using **bcrypt** (`bcrypt.hashpw`).
- **Password Change Requirements (`POST /api/security/change-password`):**
  1. Verify current password hash with bcrypt.
  2. Compute new bcrypt hash with salt.
  3. Commit transaction in PostgreSQL `security.users`.
  4. **Immediately revoke all active user sessions** in `security.user_sessions`.
  5. Clear `refresh_token` HttpOnly cookie.
  6. The old password must stop working immediately.

---

## 8. Role-Based Access Control (RBAC) & Scope Enforcement

Every API request must validate:
1. Valid JWT Access Token in header.
2. User Role (`ADMIN`, `COMMANDER`, `OFFICER`, `USER`).
3. Organizational Scope (`department_id`, `section_id`, `team_id`).
4. Resource-level permission code.

Users must **never** receive data or execute actions outside their assigned organizational hierarchy scope.

---

## 9. Security Audit Trail

All security events must create a permanent audit record in `audit.audit_logs` and `security.user_login_history`:
- `LOGIN_SUCCESS` / `LOGIN_FAILED`
- `LOGOUT`
- `PASSWORD_CHANGE`
- `UPDATE_PREFERENCES`
- `ACCESS_DENIED`

---

## 10. Developer Checklist for Future Features

Before submitting any code changes related to authentication, user settings, or security:

- [ ] Does this feature use PostgreSQL as the single source of truth?
- [ ] Is the Refresh Token stored **ONLY** in an HttpOnly cookie?
- [ ] Are sensitive tokens or credentials kept OUT of `localStorage`?
- [ ] Are user preferences saved via `/api/security/preferences` in PostgreSQL?
- [ ] Does password change invalidate all active sessions in PostgreSQL?
- [ ] Are API endpoints protected with `@jwt_required()` and RBAC scope checks?

---

*Official Security Architecture Standard — Pikud360 Platform*
