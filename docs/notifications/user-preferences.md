# User Notification Preferences Specification

**Domain:** Notifications  
**Phase:** 16.7 — Notification Preferences  
**Depends on:** event-catalog.md, notification-channels.md, notification-rules.md

---

## 1. Overview

This document specifies the user preference model governing how notification alerts are routed, scheduled, and delivered to individuals in Pikud360. 

Users access these parameters through the `/settings/notifications` settings tab in the React client, writing mutations to their user profile settings block.

---

## 2. Preference Schema Variables

```json
{
  "userId": "string (UUID)",
  "enabledChannels": {
    "inApp": "boolean",
    "email": "boolean",
    "sms": "boolean",
    "whatsApp": "boolean",
    "push": "boolean"
  },
  "quietHours": {
    "isEnabled": "boolean",
    "startLocalTime": "string (HH:MM e.g. '22:00')",
    "endLocalTime": "string (HH:MM e.g. '07:00')",
    "timezone": "string (IANA Time Zone string, e.g. 'Asia/Jerusalem')",
    "allowedBypasses": ["string (Event IDs allowed to bypass, default: ['CRITICAL_CALLUP'])"]
  },
  "digestMode": {
    "isEnabled": "boolean",
    "frequency": "string ('DAILY' | 'WEEKLY')",
    "deliveryTime": "string (HH:MM e.g. '17:00')",
    "deliveryDayOfWeek": "number (1-7, where 1=Sunday, for weekly digests)"
  },
  "criticalAlertsOverride": {
    "alwaysPush": "boolean (Enforces push bypass on mobile OS settings, default: true)",
    "alwaysSms": "boolean (Enforces SMS bypass on silent configs, default: true)"
  },
  "channelsConfig": {
    "email": {
      "address": "string",
      "categories": {
        "scheduling": "boolean",
        "administrative": "boolean",
        "social": "boolean"
      }
    },
    "push": {
      "soundProfile": "string ('DEFAULT' | 'SILENT' | 'URGENT_SIREN')",
      "showPreviews": "boolean",
      "registeredDevicesCount": "number"
    },
    "whatsApp": {
      "phoneNumber": "string (E.164)",
      "optInStatus": "boolean",
      "optInTimestamp": "string (DateTime)"
    }
  }
}
```

---

## 3. Preferences Configuration Breakdown

---

### 3.1 Enabled Channels

- **Purpose:** Allows users to globally toggle individual notification channels on or off.
- **Rules:**
  - **In-App Cannot Be Disabled:** In-App notification logs serve as the core record of history. The check-box for `inApp` remains locked to `true` in settings views.
  - **Opt-In Logs for WhatsApp & SMS:** Enforcing active opt-in logs prevents unwanted messaging charges. Disabling channels deletes active delivery queue routes.

---

### 3.2 Quiet Hours (שעות שקטות)

- **Purpose:** Restricts notification delivery during designated rest hours.
- **Rules:**
  - When enabled, incoming events matching `MEDIUM` or `LOW` priority are delayed:
    - The notification engine changes the schedule time to `endLocalTime` on the next day.
  - **Timezone Enforcement:** Quiet hours are calculated against the user's localized timezone (`timezone`), rather than the tenant server's system time.

---

### 3.3 Digest Mode (דוחות מרוכזים)

- **Purpose:** Groups low-priority alerts into a single compilation report to reduce notification fatigue.
- **Rules:**
  - **Daily Digest:** Consolidates all `LOW` priority events (e.g. shift changes, general system info) occurring between 17:01 yesterday and 17:00 today. Delivers as a single email/In-App digest at `deliveryTime` (default: `17:00`).
  - **Weekly Digest:** Consolidates events weekly. Delivers on the specified day of the week (e.g., Sunday morning).

---

### 3.4 Critical Alerts (התראות חירום עוקפות)

- **Purpose:** Ensures emergency call-ups (e.g., `EMERGENCY_REASSIGN` events) reach the user immediately, even if they have quiet hours active or have opted out of channels.
- **Rules:**
  - **Bypasses Preferences:** System checks `criticalAlertsOverride` when an event is marked `CRITICAL`. If true, the system ignores the user's active quiet hours and delivers via SMS + Push immediately.
  - **Cannot Be Disabled:** Users **cannot** toggle critical alerts off. The settings UI displays a locked padlock icon next to critical settings.

---

### 3.5 Channel-Specific Preferences

#### 3.5.1 Email Preferences
- **Frequency selection:** Instant vs. Daily vs. None per category:
  - `Scheduling`: Weekly rosters, release notifications.
  - `Administrative`: Transfer approvals, permission alterations.
  - `Social`: Birthday wishes, community notices.

#### 3.5.2 Push Preferences
- **Sound Profile mapping:**
  - `URGENT_SIREN`: Bypasses device quiet states (using critical alerts protocols) for high-priority emergency alerts.
  - `SILENT`: Displays notifications on screen without audio ringers.
- **Show Previews toggle:** If `false`, the push notification body text is masked as *"נדרש אישור קריטי במערכת - פתח לפרטים"* (Critical Action Required - open for details) to protect privacy.

#### 3.5.3 WhatsApp Preferences
- **SMS Auto-Fallback:** If WhatsApp delivery fails, the system automatically checks if the user has a verified SMS number, falling back to SMS if priority is `HIGH`.
- **Opt-In Verification Workflow:** Toggling WhatsApp to `true` sends a verification code via WhatsApp. The option remains pending until the user inputs the matching verification code in the client.
