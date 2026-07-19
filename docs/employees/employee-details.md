# Employee Details Experience

**Domain:** Employee  
**Phase:** 12.11 — Employee Details Experience  
**Depends on:** employee-ui-architecture.md, employee-data-contracts.md, employee-business-rules.md

---

## 1. Overview

The Employee Details page provides the full operational view of an individual's profile. It is the central workspace where commanders, administrators, and specialized officers (medical, security) view qualifications, manage status transitions, and inspect history.

### User Experience Principles
- **Clarity Over Clutter**: Group information into clear logical tabs so users do not get overwhelmed by 60+ fields.
- **Contextual Actions**: Action buttons are shown based on the employee's state and the viewer's security scope.
- **Privacy Enforcement**: Masking sensitive personal data directly at the component level based on authorization claims.
- **Action Accountability**: Sensitive lifecycle transitions require a mandatory reason before confirmation.

---

## 2. Page Layout & Header Section

The layout follows a split-view design, with a static **Profile Header** at the top and a **Tabbed Content Container** below.

### Layout Wireframe

```
┌────────────────────────────────────────────────────────────────────────┐
│ [← כוח אדם]                                                            │
├────────────────────────────────────────────────────────────────────────┤
│ Profile Header                                                         │
│ ┌───────────────────┐  נועה כהן                                       │
│ │                   │  דרגה: סרן                                      │
│ │      AVATAR       │  תפקיד: קצינת מבצעים                            │
│ │                   │  שיוך: פלוגה א' — גדוד 51                       │
│ └───────────────────┘  כשירות היום: [פעילה] [תעודות: פג בקרוב]        │
│                                                                        │
│ [ערוך פרופיל]  [שנה סטטוס]  [העברה בין יחידות]  [מחק עובד (אדמין)]     │
├────────────────────────────────────────────────────────────────────────┤
│ [פרטים אישיים] [ארגון] [צור קשר] [נוכחות וזמינות] [הסמכות] [פיקוד] [ציר זמן] │
├────────────────────────────────────────────────────────────────────────┤
│ Tab Content Area                                                       │
│                                                                        │
│ (Active Tab Content Renders Here)                                     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Profile Header Components & Content

1. **Avatar Component (`EmployeeAvatar`)**:
   - Displays profile photo or deterministically colored fallback initials.
   - Size: `lg` (96px).

2. **Core Context fields**:
   - **Full Name**: Derived as `{rank} {firstName} {lastName}`.
   - **Status Badge (`EmployeeStatusBadge`)**: Rendered using standard status colors.
   - **Service & Role Details**: Subtitle listing primary position and current unit assignment.

3. **Status Badges & Health Pills**:
   - **Readiness Indicator**: Colored pill indicating if the employee is available today (Green = available, Gray/Red = unavailable).
   - **Certification Health**: Pill showing worst-case qualification health (e.g. Amber = "פג בקרוב", Red = "פג תוקף").

4. **Action Row**:
   - **Edit Profile**: Navigates to `/employees/{id}/edit` (disabled for users without `manage` scope).
   - **Change Status**: Opens the status change dropdown / modal dialog.
   - **Transfer Unit**: Navigates directly to the transfers flow or opens a request trigger.
   - **Delete (Admin only)**: Opens the soft-delete dialog.

---

## 3. Tabbed Content Specifications

---

### Tab 1: Personal Details (פרטי עובד ותעסוקה)

Shows identity details, birthdates, and formal service periods.

| Section | Field | Masking Condition |
|---|---|---|
| **זהות (Identity)** | מספר אישי (Employee Number) | None |
| | תעודת זהות (National ID) | Admin only (hidden for others) |
| | תאריך לידה (Date of Birth) | Admin/Self only (masked as `****-**-**` for others) |
| | גיל (Age - derived) | Derived from birthdate (shown as number) |
| | מגדר (Gender) | None |
| **תעסוקה (Employment)** | סוג שירות (Service Type) | None |
| | תאריך תחילת שירות (Start Date) | None |
| | תאריך שחרור משוער (Expected End Date) | None |
| | תאריך שחרור בפועל (Actual End Date) | Only shown if status is `INACTIVE` or `ARCHIVED` |
| | ותק (Years of Service - derived) | Shown as number |

---

### Tab 2: Organizational Assignment (שיוך ארגוני)

Shows where the employee belongs in the unit tree and who commands them.

- **יחידת אם (Home Unit)**: Shows unit name and full parent path.
- **מפקד ישיר (Direct Commander)**: Renders commander name as a clickable link that navigates to the commander's profile.
- **סוג שיבוץ (Assignment Type)**: Renders whether the assignment is `PERMANENT` or `TEMPORARY`.
- **פרטי שיבוץ זמני (Temporary Assignment Details)**: Shown only if status is `TEMPORARY_ASSIGNMENT`. Renders the destination unit, assignment start date, and expected end date.
- **היקף פיקוד (Command Scope - derived)**: If employee has command responsibilities, displays command level (e.g. "פלוגה") and active subordinates count (derived recursively from subtree).

---

### Tab 3: Contact Info (פרטי קשר וחירום)

Contact details for communication and emergency response.

- **טלפון צבאי (Military Phone)**: Unmasked.
- **טלפון אישי (Personal Mobile)**: Masked as `***-***-****` for non-commanders.
- **אימייל אישי (Personal Email)**: Masked as `***@***.***` for non-commanders.
- **אימייל צבאי (Unit Email)**: Unmasked.
- **כתובת מגורים (Address)**: Omitted for non-commanders.
- **אנשי קשר לחירום (Emergency Contacts)**:
  - Hidden completely for users without Commander or Admin rights.
  - Renders Contact Name, Phone, and Relationship.

---

### Tab 4: Availability & Absence (נוכחות וזמינות)

Expected work schedule and active medical/leave profiles.

- **זמינות היום (Today's Availability)**: Displays today's schedule status card (e.g. "נוכח פלוגה", "חופשת מחלה").
- **ימי עבודה קבועים (Standard Work Days)**: Renders standard days (e.g. א'-ה').
- **העדפת משמרת (Shift Preference)**: Renders preferred shift.
- **יתרת ימי חופשה (Leave Balance)**: Remaining annual leave quota.
- **מגבלה רפואית פעילה (Active Medical Limitation)**:
  - If no active limit: Displays green "אין מגבלות רפואיות פעילות".
  - If active limit: Displays amber alert card showing description and restriction expiry date. *Never displays clinical diagnoses.*
- **תקופות מילואים (Reserve Duty Periods)**: Lists scheduled duty slots (for reserve personnel).

---

### Tab 5: Certifications & Qualifications (הסמכות ותעודות)

Presents a grid of certification cards. Each card displays certification status, issue/expiry dates, and a countdown.

```
┌──────────────────────────────┐  ┌──────────────────────────────┐
│ רשיון נהיגה                  │  │ הסמכה רפואית                 │
│ דרגה: C1                     │  │ סוג: חובש קרבי               │
│ תוקף: 2028-03-31             │  │ תוקף: פג תוקף                │
│ סטטוס: [תקין]                │  │ סטטוס: [פג תוקף 🔴]          │
└──────────────────────────────┘  └──────────────────────────────┘
```

**Certification Health Levels:**
- **VALID (תקין)**: Green badge.
- **EXPIRING_SOON (פג בקרוב)**: Amber badge (within 30 days).
- **CRITICAL (קריטי)**: Orange badge (within 7 days).
- **EXPIRED (פג תוקף)**: Red badge.

---

### Tab 6: Operational Info (מידע מבצעי)

Operational characteristics used by commanders during field assignments.

- **תפקיד מבצעי (Operational Role)**: Field assignment (e.g. "נהג נגמ\"ש").
- **מערכת נשק אישית (Primary Weapon System)**: Issued weapon.
- **התמחות (Specialty)**: List of specialty flags (e.g., צלף, חבלן).
- **פרופיל רפואי (Combat Fitness Status)**: Renders fitness code and classification date (e.g. `97`). Omitted for non-privileged roles.

---

### Tab 7: Timeline & History (ציר זמן ושינויים)

Combines employee history changes and unit transfers into a single chronological timeline feed (descending).

- **History Entry Card**:
  - Displays change type (e.g., "דרגה עודכנה", "סטטוס שונה").
  - Displays before/after delta (Admin only).
  - Displays operator who made the change and timestamp.
- **Transfer Entry Card**:
  - Displays source unit → target unit.
  - Displays transfer status (APPROVED, PENDING, REJECTED).
  - Displays reason and approver.

---

## 4. Status Change Actions Workflow

Status changes affect unit strength and scheduling eligibility. The interface guides the user through status transitions via a focused workflow.

### Transition Dropdown / Dialog Trigger
Clicking "שנה סטטוס" reveals the target status selections available for transition from the employee's current state.

```
שנה סטטוס ▾
├── [שלח לחופשה]          — transitions to ON_LEAVE
├── [שיבוץ זמני]          — transitions to TEMPORARY_ASSIGNMENT
├── [השעיית עובד]         — transitions to SUSPENDED (Admin only)
├── [שחרור / הפסקת שירות] — transitions to INACTIVE (Admin only)
└── [ארכוב רשומה]         — transitions to ARCHIVED (Admin only)
```

### Transition Modals

---

#### 1. Transition to ON_LEAVE
Prompts commander for return details.

```
┌────────────────────────────────────────┐
│ יציאה לחופשה                           │
│ אתה עומד להעביר את נועה כהן לסטטוס חופשה. │
│                                        │
│ * תאריך חזרה משוער: [YYYY-MM-DD 📅]     │
│   הערות: [                             ]│
│                                        │
│                        [ביטול] [אשר]   │
└────────────────────────────────────────┘
```

---

#### 2. Transition to SUSPENDED, INACTIVE, or ARCHIVED
Requires an explicit justification before saving.

```
┌────────────────────────────────────────┐
│ אישור שינוי סטטוס רגיש                 │
│ שינוי סטטוס ל: [מושעה / לא פעיל / ארכיון]  │
│                                        │
│ * סיבת השינוי (חובה):                   │
│   [                                   ]│
│                                        │
│    ⚠ פעולה זו תשפיע על שיבוצים עתידיים. │
│                        [ביטול] [אשר]   │
└────────────────────────────────────────┘
```

---

## 5. Loading, Error, and Empty States

---

### Loading State (Skeletons)

When the profile data is being loaded, a skeleton layout mimics the profile grid:
- Large pulsating circle in place of avatar.
- Multi-line block skeletons in place of name and ranks.
- Skeletons of layout tabs.
- Full screen opacity fade.

---

### Error / Not Found State

If the employee ID does not exist, or the operator lacks view scope:

```
┌────────────────────────────────────────┐
│               [icon: UserX]            │
│         עובד לא נמצא או אין גישה       │
│  הרשומה המבוקשת אינה קיימת במערכת      │
│  או שאינך מורשה לצפות בה.              │
│                                        │
│  [חזור לכוח אדם]                        │
└────────────────────────────────────────┘
```

---

### Empty State inside Tabs

When individual tabs contain no data (e.g. no medical restrictions, no certifications):
- **Medical Restriction**: Renders a green card: "אין מגבלות רפואיות פעילות".
- **Reserve Duty**: Renders: "אין תקופות מילואים מתוכננות".
- **Timeline**: Renders: "לא נמצאו רשומות היסטוריה עבור עובד זה".
- **Emergency Contacts**: Renders: "לא הוזנו אנשי קשר לחירום".
