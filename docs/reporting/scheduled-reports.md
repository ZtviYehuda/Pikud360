# Scheduled Reporting Specifications

**Domain:** Reporting  
**Phase:** 17.5 — Scheduled Reports  
**Depends on:** reporting-domain.md, report-catalog.md, notification-channels.md

---

## 1. Overview

This document specifies the automated, cron-triggered reporting pipeline in Pikud360. 

The system compiles and distributes Daily, Weekly, and Monthly reports to specific roles within the organization tree, utilizing predefined delivery channels and enforcing failover protocols in case of generation or provider outages.

---

## 2. Schedule Registry

---

### 2.1 Daily Reports (דוחות יומיים)

---

#### 2.1.1 Daily Roll Call Summary (סיכום נוכחות יומי)
- **Schedule:** Runs daily at **10:00 Local Time**.
- **Purpose:** Identifies missing check-ins and compiles presence status counts for the current morning.
- **Recipients:** 
  - **Primary**: Section Head (Level 4 - details for their Section).
  - **Carbon Copy**: Department Head (Level 3 - roll-up totals for all child Sections).
- **Delivery Channels:** Email (contains a signed link to PDF report) + In-App notification card.
- **Rules:** If a Section's roll call is unsigned (not signed by Section Head - AR-04), the report highlights this in red and triggers a warning alert.

---

#### 2.1.2 Late / AWOL Compliance Alert (דוח איחורים ונפקדים)
- **Schedule:** Runs daily at **18:00 Local Time**.
- **Purpose:** Compiles a list of late check-ins, unauthorized absences, and check-in exceptions from active shifts during the day.
- **Recipients:** Section Head (Level 4) and Department Head (Level 3).
- **Delivery Channels:** In-App Drawer + Push Notification (Mobile) with fallback to WhatsApp.

---

### 2.2 Weekly Reports (דוחות שבועיים)

---

#### 2.2.1 Weekly Shift Coverage Planner (תכנון כיסוי משמרות שבועי)
- **Schedule:** Runs weekly on **Thursdays at 12:00 Local Time**.
- **Purpose:** Evaluates scheduling coverage levels for the *upcoming* week (Sunday-Saturday) and lists unstaffed required slots.
- **Recipients:** Section Head (Level 4 - to complete schedules) and Department Head (Level 3 - to audit staffing).
- **Delivery Channels:** Email (contains Excel spreadsheet link).
- **Rules:** Shifts with coverage under 95% are highlighted as critical warning rows.

---

#### 2.2.2 Weekly Workforce Strength Summary (דו"ח כשרות ומצבה שבועי)
- **Schedule:** Runs weekly on **Fridays at 08:00 Local Time**.
- **Purpose:** Summarizes active workforce headcount strength, availability categories, and active transfers.
- **Recipients:** Brigade Commander (Level 2) and Department Head (Level 3).
- **Delivery Channels:** Email (contains PDF link).

---

### 2.3 Monthly Reports (דוחות חודשיים)

---

#### 2.3.1 Monthly Attendance Overview (דוח נוכחות חודשי מרוכז)
- **Schedule:** Runs on the **1st of every month at 02:00 UTC**.
- **Purpose:** Compiles the complete monthly attendance sheet, late totals, and absent rates for the preceding month.
- **Recipients:** Section Head (Level 4), Department Head (Level 3), and Brigade Commander (Level 2).
- **Delivery Channels:** Email (CSV and Excel links).

---

#### 2.3.2 Certification Expiration Review (מעקב הסמכות חודשי)
- **Schedule:** Runs on the **1st of every month at 04:00 UTC**.
- **Purpose:** Scans the workforce roster and lists all professional qualifications expiring in the next 30 days.
- **Recipients:** Department Head (Level 3) and safety/auditing administrators.
- **Delivery Channels:** In-App + Email (PDF link).

---

## 3. Execution & Failure Handling

Automated reports are managed by a centralized scheduler (e.g. Celery Beat daemon) executing asynchronous worker tasks:

### 3.1 Retry Protocol
If a generation task fails due to database timeout or temporary S3 storage bucket disconnects, the task triggers retry schedules:
- **Exponential Backoff:** `[1m, 15m, 1h]`
- **Max Retries:** 3 attempts.
- **Alert Trigger:** If the third retry fails, the job status updates to `FAILED` and an alert is published to the `admin.audit_log` with details.

### 3.2 Dead Letter Job (DLJ) Pathway
Failed scheduled reports generate a DLJ ticket. The administration dashboard logs these failures:
- Admins can trigger **Manual Re-Run** once database connectivity is restored.
- If a high-priority daily report (like the 10:00 Roll Call Summary) fails to generate after all retries, the system triggers a **Critical Alert** (NR-01) sending an SMS to the on-call systems administrator.

---

## 4. Scheduled Delivery Configuration Summary

| Report Name | Frequency | Trigger Time | Recipients | Channels | Expiry TTL |
|---|---|---|---|---|---|
| **Daily Roll Call** | Daily | 10:00 | Section Head, Dept Head | Email, In-App | 24 Hours |
| **Late / AWOL Alert** | Daily | 18:00 | Section Head, Dept Head | Push, In-App, WhatsApp | 24 Hours |
| **Weekly Shift Coverage**| Weekly | Thu 12:00 | Section Head, Dept Head | Email | 7 Days |
| **Weekly Strength** | Weekly | Fri 08:00 | Brigade Cmd, Dept Head | Email | 7 Days |
| **Monthly Attendance** | Monthly | 1st @ 02:00 | Section, Dept, Brigade | Email (Excel/CSV) | 30 Days |
| **Cert Expirations** | Monthly | 1st @ 04:00 | Dept Head, Auditor | In-App, Email | 30 Days |
