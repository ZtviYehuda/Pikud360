# Notification Template Specifications

**Domain:** Notifications  
**Phase:** 16.4 — Notification Templates  
**Depends on:** event-catalog.md, notification-channels.md, notification-rules.md

---

## 1. Overview

This document specifies the reusable notification template system for Pikud360. Templates support variable injection (using standard `{{variableName}}` formatting) and built-in localization mappings for Hebrew (RTL, default) and English fallbacks.

---

## 2. Standardized Variables Directory

Every template compiles using parameters from this dictionary. Emitters must supply these variables in event payloads.

| Variable Name | Type | Description | Example Value |
|---|---|---|---|
| `{{employeeName}}` | string | Full name of the subject employee | `יוסי לוי` |
| `{{employeeRank}}` | string | Rank of the employee | `רב"ט` |
| `{{nodeName}}` | string | Display name of the organization unit node | `מדור א'` |
| `{{nodeLevelName}}`| string | Hierarchy level Hebrew name | `מדור` |
| `{{shiftName}}` | string | Name of the shift type | `משמרת בוקר` |
| `{{shiftDate}}` | string | Date of the target shift slot | `20.07.2026` |
| `{{shiftTime}}` | string | Start and end times | `08:00 - 16:00` |
| `{{certName}}` | string | Professional certification name | `נהג חילוץ` |
| `{{expiryDate}}` | string | Date certificate expires | `01.08.2026` |
| `{{actionUrl}}` | string | Actionable deep-link URL | `/organization/transfers/3` |

---

## 3. Templates Catalog

---

### 3.1 Employee Birthday (יום הולדת שמח)

- **Template Name:** `workforce.employee.birthday`
- **Event:** `workforce.employee.birthday_trigger` (Scheduled daily cron check)
- **Channel:** In-App + Email (Low)
- **Variables:** `{{employeeName}}`, `{{employeeRank}}`
- **Priority:** `LOW`
- **Localization Support:**
  - **Hebrew (RTL):**
    - **Title:** `יום הולדת שמח, {{employeeRank}} {{employeeName}}! 🎉`
    - **Body:** `צוות פיקוד360 מאחל לך יום הולדת שמח, בריאות, הצלחה ושפע ברכות ביום חגך!`
  - **English (LTR):**
    - **Title:** `Happy Birthday, {{employeeRank}} {{employeeName}}! 🎉`
    - **Body:** `The Pikud360 team wishes you a happy birthday, good health, and success!`

---

### 3.2 Sick Leave Alert (הודעת מחלה / גימלים)

- **Template Name:** `workforce.employee.sick_leave`
- **Event:** `workforce.employee.status_changed` (where status is `SICK_LEAVE`)
- **Channel:** Push + In-App (High)
- **Variables:** `{{employeeName}}`, `{{employeeRank}}`, `{{nodeName}}`, `{{expiryDate}}`
- **Priority:** `MEDIUM`
- **Localization Support:**
  - **Hebrew (RTL):**
    - **Title:** `דיווח מחלה: {{employeeRank}} {{employeeName}}`
    - **Body:** `עודכן סטטוס מחלה (גימלים) עבור {{employeeRank}} {{employeeName}} מ{{nodeName}} עד לתאריך {{expiryDate}}. שיבוצי המשמרות הפעילים שלו בוטלו.`
  - **English (LTR):**
    - **Title:** `Sick Leave: {{employeeRank}} {{employeeName}}`
    - **Body:** `Sick leave updated for {{employeeRank}} {{employeeName}} from {{nodeName}} until {{expiryDate}}. Active shift assignments have been unassigned.`

---

### 3.3 Shift Reminder (תזכורת משמרת)

- **Template Name:** `scheduling.shift.reminder`
- **Event:** `scheduling.shift.reminder_trigger` (Scheduled trigger 2 hours before start)
- **Channel:** Push + WhatsApp (High)
- **Variables:** `{{employeeName}}`, `{{shiftName}}`, `{{shiftDate}}`, `{{shiftTime}}`, `{{nodeName}}`
- **Priority:** `MEDIUM`
- **Localization Support:**
  - **Hebrew (RTL):**
    - **Title:** `תזכורת: מחר משמרת עבורך 📋`
    - **Body:** `שלום {{employeeName}}, תזכורת למשמרת: {{shiftName}} ב{{nodeName}} מחר, בתאריך {{shiftDate}}, שעות: {{shiftTime}}. נא להתייצב בזמן.`
  - **English (LTR):**
    - **Title:** `Reminder: Upcoming Shift Tomorrow 📋`
    - **Body:** `Hello {{employeeName}}, shift reminder: {{shiftName}} in {{nodeName}} tomorrow ({{shiftDate}}), hours: {{shiftTime}}. Please arrive on time.`

---

### 3.4 Shift Cancelled (ביטול משמרת)

- **Template Name:** `scheduling.shift.cancelled`
- **Event:** `scheduling.shift.deleted`
- **Channel:** Push + WhatsApp + SMS (High)
- **Variables:** `{{employeeName}}`, `{{shiftName}}`, `{{shiftDate}}`, `{{nodeName}}`
- **Priority:** `HIGH`
- **Localization Support:**
  - **Hebrew (RTL):**
    - **Title:** `שינוי לוח זמנים: ביטול משמרת ⚠️`
    - **Body:** `שלום {{employeeName}}, המשמרת הבאה שלך ב{{nodeName}} בתאריך {{shiftDate}} ({{shiftName}}) בוטלה על ידי מפקד המדור.`
  - **English (LTR):**
    - **Title:** `Schedule Update: Shift Cancelled ⚠️`
    - **Body:** `Hello {{employeeName}}, your upcoming shift in {{nodeName}} on {{shiftDate}} ({{shiftName}}) has been cancelled by the Section Head.`

---

### 3.5 Employee Transfer (העברת איש סגל)

- **Template Name:** `workforce.employee.transfer_completed`
- **Event:** `core.organization.transfer_completed`
- **Channel:** Email + Push
- **Variables:** `{{employeeName}}`, `{{employeeRank}}`, `{{nodeName}}`
- **Priority:** `MEDIUM`
- **Localization Support:**
  - **Hebrew (RTL):**
    - **Title:** `עדכון שיוך: העברה הושלמה 🔄`
    - **Body:** `שלום {{employeeName}}, ההעברה הארגונית שלך הושלמה בהצלחה. החל מעתה, שיוך הקבע שלך הוא ל{{nodeName}}. סידורי העבודה ודוחות הנוכחות שלך ישויכו למדור זה.`
  - **English (LTR):**
    - **Title:** `Assignment Update: Transfer Completed 🔄`
    - **Body:** `Hello {{employeeName}}, your organizational transfer has been successfully completed. From now on, your primary assignment is to {{nodeName}}. Your schedules and attendance reports will route to this Section.`

---

### 3.6 Approval Required (נדרש אישור בקשה)

- **Template Name:** `workflow.approval.requested`
- **Event:** `core.organization.transfer_requested`
- **Channel:** In-App + Email + Push
- **Variables:** `{{employeeName}}`, `{{employeeRank}}`, `{{nodeName}}`, `{{actionUrl}}`
- **Priority:** `MEDIUM`
- **Localization Support:**
  - **Hebrew (RTL):**
    - **Title:** `ממתין לאישור: בקשת העברה סגל ✍️`
    - **Body:** `שלום, נדרש אישור לביצוע מעבר סגל עבור {{employeeRank}} {{employeeName}} ל{{nodeName}}. לאישור או דחייה, לחץ כאן: {{actionUrl}}`
  - **English (LTR):**
    - **Title:** `Pending Approval: Staff Transfer Request ✍️`
    - **Body:** `Hello, approval is required for a staff transfer request for {{employeeRank}} {{employeeName}} to {{nodeName}}. To approve or reject, click here: {{actionUrl}}`

---

### 3.7 Certification Expiring (תוקף הסמכה פג)

- **Template Name:** `workforce.employee.certification_expiring`
- **Event:** `workforce.employee.certification_expires_soon` (Scheduled 30-day check)
- **Channel:** Email + In-App (Low)
- **Variables:** `{{employeeName}}`, `{{employeeRank}}`, `{{certName}}`, `{{expiryDate}}`
- **Priority:** `LOW`
- **Localization Support:**
  - **Hebrew (RTL):**
    - **Title:** `התרעת פקיעת תוקף הסמכה 🛡️`
    - **Body:** `שלום {{employeeName}}, שים לב כי תוקף ההסמכה המקצועית שלך מסוג: "{{certName}}" עומד לפוג בתאריך {{expiryDate}}. מומלץ לתאם רענון בהקדם כדי למנוע חסימת שיבוצים בסידור העבודה.`
  - **English (LTR):**
    - **Title:** `Alert: Professional Certification Expiring 🛡️`
    - **Body:** `Hello {{employeeName}}, please note that your professional certification: "{{certName}}" is set to expire on {{expiryDate}}. It is recommended to schedule a refresher course immediately to prevent roster assignment blocks.`
