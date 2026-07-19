# Notification Routing Rules Specification

**Domain:** Notifications  
**Phase:** 16.3 — Notification Rules  
**Depends on:** event-catalog.md, notification-channels.md, organization-hierarchy.md

---

## 1. Overview

This document specifies the routing, filtering, escalation, quiet hours, and deduplication rules for the Pikud360 notification engine. 

These rules map incoming events from the global event catalog to target recipients and delivery channels, ensuring critical alerts are delivered promptly while non-urgent alerts are aggregated or held.

---

## 2. Notification Rules Registry

---

### NR-01 — Emergency call-ups (הקפצת חירום)

- **Event:** `scheduling.rule.overridden` (where constraint is marked `EMERGENCY_REASSIGN`) or custom system-wide trigger.
- **Recipient:** Target Employee and their direct Section Head.
- **Primary Delivery Channel:** SMS + Push + In-App (sent in parallel).
- **Secondary Delivery Channel:** WhatsApp (fallback if push is undelivered within 3 minutes).
- **Priority:** `HIGH`
- **Escalation:** If the employee does not acknowledge (click "אשר קבלה") within 15 minutes, the engine automatically escalates the notification to the target employee's Cell Leader and Section Head.
- **Quiet Hours:** **Bypassed.** Emergency call-ups override quiet hours.
- **Deduplication:** Disabled. Every call-up event must trigger a unique notification.
- **Expiration:** 24 hours.

---

### NR-02 — Shift Roster Releases (פרסום סידור עבודה)

- **Event:** `scheduling.shift.published`
- **Recipient:** All employees assigned to shifts in the published schedule.
- **Primary Delivery Channel:** WhatsApp + Push
- **Secondary Delivery Channel:** Email
- **Priority:** `MEDIUM`
- **Escalation:** None.
- **Quiet Hours:** **Enforced.** If published during quiet hours (22:00 to 07:00), the notification is queued and delivered at 08:00 the next day.
- **Deduplication:** Aggregated by unit. If multiple schedules are published within a 15-minute window in the same Section, they are combined into a single notification: *"פורסמו סידורי עבודה חדשים במדור שלך"*.
- **Expiration:** 7 days.

---

### NR-03 — Attendance late checks (איחור בהתייצבות)

- **Event:** `attendance.record.checked_in` (where status is `LATE` or check-in is missing 30 minutes past shift start).
- **Recipient:** The employee's Cell Leader (Level 5) and Section Head (Level 4).
- **Primary Delivery Channel:** In-App + Push
- **Secondary Delivery Channel:** WhatsApp
- **Priority:** `HIGH`
- **Escalation:** If the late state is not resolved (no check-in or commander override log is recorded) within 60 minutes, the alert escalates to the Department Head (Level 3).
- **Quiet Hours:** **Bypassed** if late state occurs during an active scheduled shift (operational hours).
- **Deduplication:** Aggregated by cell. If 3 employees in the same Cell are late, a single combined alert is sent to the Cell Leader: *"3 חיילים מחוליית תקשורת טרם התייצבו"*.
- **Expiration:** 4 hours.

---

### NR-04 — Transfer Requests (בקשת העברת סגל)

- **Event:** `core.organization.transfer_requested`
- **Recipient:** The destination Section Head (the commander with approval authority).
- **Primary Delivery Channel:** In-App + Email
- **Secondary Delivery Channel:** Push
- **Priority:** `MEDIUM`
- **Escalation:** If the transfer remains pending after 48 hours, a reminder notification is sent to the commander and a warning is logged in the Department's workflow panel.
- **Quiet Hours:** **Enforced.** Delivery is delayed until 08:00 if requested overnight.
- **Deduplication:** 5-minute coalescing window. Multiple transfer requests initiated by the same source commander are grouped into a single notification.
- **Expiration:** 30 days.

---

### NR-05 — Safety Override Warnings (חריגת בטיחות מאושרת)

- **Event:** `scheduling.rule.overridden` (e.g., rest gap overrides, consecutive night shift violations).
- **Recipient:** Department Head (Level 3) and safety auditors.
- **Primary Delivery Channel:** In-App + Email
- **Secondary Delivery Channel:** None
- **Priority:** `LOW`
- **Escalation:** None.
- **Quiet Hours:** **Enforced.** Log summaries are delivered at 08:00 the following morning.
- **Deduplication:** **Aggregated Daily.** Instead of sending a notification for each override, the system compiles a daily digest of overrides and emails it to the Department Head at 17:00: *"דו\"ח יומי: 4 חריגות מסידור העבודה השבועי במחלקה"*.
- **Expiration:** 30 days.

---

### NR-06 — Login Failures (כישלון בהתחברות)

- **Event:** `auth.user.login_failed` (where attempt count exceeds 3 on a single IP).
- **Recipient:** Security Administrators.
- **Primary Delivery Channel:** In-App + Webhook (sent to security logging dashboard).
- **Secondary Delivery Channel:** Email
- **Priority:** `HIGH`
- **Escalation:** If 10 failed logins are registered on the same user ID within 10 minutes, the engine locks the account and sends a critical Push notification to the user's registered mobile device.
- **Quiet Hours:** **Bypassed.** Security events bypass quiet hours.
- **Deduplication:** Coalesced by target user ID and IP address (1-minute window).
- **Expiration:** 48 hours.

---

## 3. Rules Execution Parameters Summary

| Rule ID | Event Name | Recipient Scope | Primary Channels | Quiet Hours | Deduplication Window | Escalation Route |
|---|---|---|---|---|---|---|
| **NR-01** | `scheduling.rule.overridden` | Employee, Section Head | SMS, Push, In-App | Bypassed | Disabled | Cell Leader (15m) |
| **NR-02** | `scheduling.shift.published` | Assigned Employees | WhatsApp, Push | Enforced | 15 minutes (Section) | None |
| **NR-03** | `attendance.record.checked_in` | Cell Leader, Section Head | In-App, Push | Bypassed | Coalesced (Cell) | Dept Head (60m) |
| **NR-04** | `core.organization.transfer_requested`| Target Node Commander | In-App, Email | Enforced | 5 minutes | Workflow Panel (48h) |
| **NR-05** | `scheduling.rule.overridden` | Dept Head, Auditor | In-App, Email | Enforced | Daily digest (17:00) | None |
| **NR-06** | `auth.user.login_failed` | Security Admin, User | In-App, Webhook | Bypassed | 1 minute (IP/User) | Mobile Lock (10m) |
