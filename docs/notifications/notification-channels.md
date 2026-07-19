# Notification Channels and Delivery Specifications

**Domain:** Notifications  
**Phase:** 16.2 — Notification Channels  
**Depends on:** event-catalog.md

---

## 1. Overview

This document specifies the communication channels and delivery rules supported by the Pikud360 notification engine. 

The system uses 6 primary channels: In-App, Email, SMS, WhatsApp, Push Notification, and Webhook.

---

## 2. Notification Channels Directory

---

### 2.1 In-App Notifications (התראות במערכת)

- **Purpose:** Delivers real-time notifications directly inside the Pikud360 web and desktop application interface (e.g. transfer approvals, roster warnings).
- **Priority:** `MEDIUM`
- **Retry Policy:** 
  - Standard retries are not required. Since the message is written directly to the database notification log table, it is loaded when the client next queries the notification store.
- **Failure Handling:**
  - Database write failure blocks the primary transaction or is routed to a local retry queue.
  - Failures are logged to application monitoring tools.
- **Configuration Requirements:**
  - Standard user notification profile row (auto-created with user registration).
  - WebSockets configuration (`Socket.io` or SSE endpoint) to push updates instantly to active clients.

---

### 2.2 Email (דואר אלקטרוני)

- **Purpose:** Delivers non-urgent summaries, weekly roster PDFs, audit export downloads, and password reset flows.
- **Priority:** `LOW`
- **Retry Policy:**
  - Exponential backoff: `[30s, 5m, 30m, 2h]`
  - Maximum attempts: 4
- **Failure Handling:**
  - After 4 failed attempts, the message is routed to `notification.email.dlq` (Dead Letter Queue).
  - Triggers warning alerts to administrators if SMTP connection timeouts exceed 5 consecutive requests.
- **Configuration Requirements:**
  - SMTP server settings (host, port, username, secure TLS password).
  - Verified sender domain (DKIM and SPF records configured).
  - User profile email field validation (must be valid format).

---

### 3.3 SMS (מסרונים)

- **Purpose:** Delivers urgent call-ups, attendance warnings (late alerts), and multi-factor authentication (MFA) codes.
- **Priority:** `HIGH`
- **Retry Policy:**
  - Short-interval linear backoff: `[15s, 60s, 3m]`
  - Maximum attempts: 3
- **Failure Handling:**
  - Failure after 3 retries sends the record to `notification.sms.dlq`.
  - MFA failovers are escalated to trigger client error warnings on screen immediately.
- **Configuration Requirements:**
  - External SMS Gateway API credentials (e.g. Twilio, local SMS provider keys).
  - User telephone field validation (must be E.164 international format, e.g. `+972501234567`).
  - Mandatory user opt-in flag.

---

### 3.4 WhatsApp (וואטסאפ)

- **Purpose:** Delivers scheduling announcements, shift replacements requests, and general commander updates.
- **Priority:** `MEDIUM`
- **Retry Policy:**
  - Exponential backoff: `[1m, 10m, 1h]`
  - Maximum attempts: 3
- **Failure Handling:**
  - Messages failing WhatsApp delivery auto-fallback to SMS delivery if the event is marked `URGENT`.
  - Errors are routed to `notification.whatsapp.dlq`.
- **Configuration Requirements:**
  - Meta Business Suite API Integration (WhatsApp Business Platform credentials).
  - Pre-approved WhatsApp message templates (matching Meta guidelines).
  - Valid telephone number (E.164) and opt-in consent settings.

---

### 3.5 Push Notifications (התראות דחיפה לנייד)

- **Purpose:** Sends real-time alerts to the Pikud360 mobile app (e.g. shift reminder alerts, emergency call-ups).
- **Priority:** `HIGH`
- **Retry Policy:**
  - Rapid linear backoff: `[10s, 45s]`
  - Maximum attempts: 2
- **Failure Handling:**
  - If the push fails because the device token is invalid, the token is deleted from the user's profile database.
  - Failures are logged locally without routing to a DLQ.
- **Configuration Requirements:**
  - Firebase Cloud Messaging (FCM) API keys or Apple Push Notification Service (APNs) certificates.
  - Mobile client device registration (token exchange on login).
  - Push permission granted on the mobile OS.

---

### 3.6 Webhooks (הזנות משתמש חיצוני)

- **Purpose:** Delivers business event logs to external systems configured by the tenant (e.g. exporting check-in events to a national intelligence hub).
- **Priority:** `LOW`
- **Retry Policy:**
  - Exponential backoff with jitter: `[5m, 30m, 2h, 8h]`
  - Maximum attempts: 5 (over 12 hours)
- **Failure Handling:**
  - If the client responds with HTTP `410 Gone`, the webhook subscription is immediately deactivated.
  - After 5 failed attempts, the webhook message is routed to `notification.webhook.dlq` and the endpoint's error counter is incremented.
- **Configuration Requirements:**
  - Destination URL (must be HTTPS).
  - Shared secret token to generate signature headers (`X-Pikud360-Signature` using HMAC-SHA256) for payload validation.
  - Admin configuration screen to select which events from the event catalog trigger the webhook.

---

## 4. Channels Execution Summary

| Channel | Priority | Max Retries | Backoff Strategy | DLQ Destination | Failure Fallback |
|---|---|---|---|---|---|
| **In-App** | `MEDIUM` | None | N/A | None | System Error Log |
| **Email** | `LOW` | 4 | Exponential | `email.dlq` | Log to Audit Table |
| **SMS** | `HIGH` | 3 | Linear (Short) | `sms.dlq` | Screen Escalate / Fail |
| **WhatsApp**| `MEDIUM` | 3 | Exponential | `whatsapp.dlq` | Fallback to SMS |
| **Push** | `HIGH` | 2 | Linear (Short) | None | Token Invalidation |
| **Webhook** | `LOW` | 5 | Jittered Exp | `webhook.dlq` | Disable Endpoint |
