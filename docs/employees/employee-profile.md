# Employee Profile Experience

**Domain:** Employee  
**Phase:** 12.11 — Employee Profile Experience  
**Depends on:** employee-ui-architecture.md, employee-data-contracts.md, employee-business-rules.md

---

## 1. Overview

The Employee Profile page serves as the complete digital file for an individual within Pikud360. It aggregates administrative, operational, qualification, and timeline records into a single page.

This document defines the layout, responsibilities, visible fields, role-based restrictions, and interactive behaviors for all **nine sections** of the Employee Profile.

---

## 2. Profile Page Layout Structure

The profile page uses a tabbed dashboard layout.
- The top of the page features a persistent **Header Summary Block** showing the employee's name, avatar, primary rank/position, and quick action options.
- The main body displays the content divided into logical sections. In the tabbed UI structure, these sections are mapped as tabs to avoid infinite scrolling and optimize screen space.

---

## 3. Section Specifications

---

### 3.1 Basic Information (מידע בסיסי)

**Purpose:**  
Identifies the individual uniquely and provides stable, long-term personal indicators.

**Fields & Data Mapping:**
- **שם פרטי (First Name)**: Legal given name.
- **שם משפחה (Last Name)**: Legal family name.
- **מספר אישי / עובד (Employee Number)**: Canonical identifier. Ophthalmic lock icon shown post-activation to signal immutability.
- **תאריך לידה (Date of Birth)**: Masked by default (`****-**-**`).
- **גיל (Age - derived)**: Calculated dynamically from date of birth. Omitted if birthdate is fully masked.
- **תעודת זהות (National ID)**: Masked by default.
- **מגדר (Gender)**: Optional.
- **תמונת פרופיל (Profile Picture)**: Controlled via the `EmployeeAvatar` wrapper.

**Responsibilities & Behavior:**
- Only accessible in plaintext to **Admins** and **Self** (the employee reading their own record). For Commanders, birthdate and national ID are masked or hidden to protect privacy.
- Displays a lock badge next to `employeeNumber` and `dateOfBirth` indicating these fields cannot be changed post-activation without admin override.

---

### 3.2 Contact (פרטי קשר וחירום)

**Purpose:**  
Provides verified channels to reach the employee for routine operations or emergency situations.

**Fields & Data Mapping:**
- **טלפון צבאי (Military Phone)**: Standard work phone.
- **טלפון נייד אישי (Personal Mobile)**: Private mobile number. Masked for non-privileged viewers.
- **אימייל צבאי (Unit Email)**: Work email address.
- **אימייל אישי (Personal Email)**: Private email address. Masked for non-privileged viewers.
- **כתובת מגורים (Address)**: Physical home address. Masked for non-privileged viewers.
- **איש קשר לחירום (Emergency Contact Name)**: Next of kin name.
- **טלפון קשר לחירום (Emergency Contact Phone)**: Phone number. Stored encrypted.
- **קשר משפחתי (Emergency Relationship)**: Relationship (e.g. Spouse, Parent).

**Responsibilities & Behavior:**
- Contacts are divided into **שגרת עבודה (Work Routine)** and **קשר חירום (Emergency Contact)** sub-sections.
- Personal phone, personal email, address, and emergency contact details are **hidden completely** for standard users. They are visible to **Commanders** (within their unit scope) and **Admins**.
- The employee can edit their own contact details via the self-service preferences view.

---

### 3.3 Employment (פרטי תעסוקה)

**Purpose:**  
Defines the terms, dates, and status of the person's service obligation.

**Fields & Data Mapping:**
- **דרגה (Rank)**: Grade within the hierarchy.
- **תפקיד (Position)**: Functional job title (e.g. "קצין קשר").
- **סוג שירות (Service Type)**: `MANDATORY` \| `CAREER` \| `RESERVE` \| `CIVILIAN`.
- **סטטוס תעסוקתי (Employment Status)**: Current lifecycle state.
- **תאריך תחילת שירות (Start Date)**: Date joined.
- **תאריך שחרור משוער (Expected End Date)**: Projected end.
- **תאריך שחרור בפועל (Actual End Date)**: Populated only when the employee moves to `INACTIVE`.
- **ותק (Years of Service - derived)**: Dynamic completed years since start date.

**Responsibilities & Behavior:**
- Governs scheduling rules (e.g. mandatory service types trigger different daily rest rules than civilian contracts).
- Accessible to all users with `view` permission on the employee's unit.
- Non-editable for the employee (self-service cannot promote rank or change service type).

---

### 3.4 Organization (שיוך ארגוני)

**Purpose:**  
Places the employee within the unit hierarchy and shows their reporting structure.

**Fields & Data Mapping:**
- **יחידת אם (Primary Unit)**: The permanent assignment unit.
- **נתיב ארגוני (Organization Path - derived)**: Breadcrumb list from root unit down (e.g. חטיבה 7 → גדוד 51 → פלוגה א').
- **מפקד ישיר (Direct Commander)**: Clickable link pointing to the commander's profile.
- **סוג שיבוץ (Assignment Type)**: Permanent vs. Temporary.
- **פרטי שיבוץ זמני (Temporary Assignment Details)**: Temporary Unit, Start Date, and End Date (visible only if assignment type is `TEMPORARY`).
- **היקף פיקוד (Command Scope - derived)**: Levels commanded (e.g., Company, Platoon) and total subordinate count.

**Responsibilities & Behavior:**
- Controls authorization scopes — the employee's `orgUnitId` determines which commanders have write/edit access to their profile.
- Directly impacts the dashboard widgets (e.g. the organization tree widget displays these values dynamically).

---

### 3.5 Current Status (סטטוס וזמינות)

**Purpose:**  
Presents a live view of the employee's current availability, active medical profile, and scheduled absences.

**Fields & Data Mapping:**
- **זמינות מבצעית היום (Today's Availability - derived)**: Boolean indicator (Available vs. Unavailable).
- **דיווח נוכחות להיום (Today's Attendance Status)**: Live status from daily scheduling (e.g., "חופש", "מחלה", "נמצא").
- **העדפת משמרת (Shift Preference)**: Default preferred schedule.
- **מגבלה רפואית פעילה (Active Medical Limitation)**: Shows restriction description and expiry date if active.
- **יתרת ימי חופשה (Leave Balance - derived)**: Annual days left.
- **יתרת חופשה שנוצלה (Leave Used - derived)**: Annual days consumed.

**Responsibilities & Behavior:**
- Enforces scheduling validation (e.g. if medical limitation is active, the scheduler warns or blocks assignments violating the limit).
- Medical description must **never** display clinical diagnoses. It lists functional constraints (e.g. "מוגבל מנשיאת משקל מעל 10 ק\"ג").

---

### 3.6 Qualifications (הסמכות וכשירות)

**Purpose:**  
Tracks professional licenses, military certifications, clearances, and training.

**Fields & Data Mapping:**
- **רשיון נהיגה (Driver License)**: Class (e.g. B, C1) and expiry date.
- **הסמכה רפואית (Medical Certification)**: Type (e.g. Medic, Paramedic) and expiry date.
- **אימון נשק (Weapons Qualification)**: Type, qualification date, and expiry.
- **סיווג בטחוני (Security Clearance)**: Clearance level and expiry date.
- **כושר מבצעי (Combat Fitness Status)**: Profile code (e.g. 97), date, and expiry.
- **הסמכות נוספות (Additional Certifications)**: List of generic custom certs.
- **שפות (Languages)**: Languages and proficiency levels.

**Responsibilities & Behavior:**
- Each certification calculates a derived status (`VALID`, `EXPIRING_SOON`, `CRITICAL`, `EXPIRED`).
- Expiry date crossings trigger alerts at 30 days and 7 days.
- Lapsed qualifications automatically strip eligibility flags from scheduling roles.

---

### 3.7 Activity Timeline (ציר זמן פעילות)

**Purpose:**  
An immutable history log showing changes to the profile and unit transfer movements.

**Fields & Data Mapping:**
- **סוג רשומה (Entry Type)**: `HISTORY_CHANGE` or `TRANSFER`.
- **תיאור הפעולה (Event Description)**: Plain language summary (e.g., "דרגה שונתה מסגן לסרן").
- **פרטי שינוי (Delta - Admin only)**: Before/After value snapshot JSON block.
- **גורם מבצע (Operator Name)**: The user who performed the change.
- **תאריך ושעה (Timestamp)**: ISO 8601 string.
- **סטטוס העברה (Transfer Status)**: For transfers, shows APPROVED / PENDING / REJECTED.

**Responsibilities & Behavior:**
- Read-only timeline. Cannot be edited, deleted, or re-ordered.
- Leverages `workforce.employee_history` and `workforce.employee_transfers` database tables.
- Before/After snapshots are omitted for non-Admins.

---

### 3.8 Notes (הערות מפקד)

**Purpose:**  
Allows commanders to leave qualitative operational notes about the employee's performance, development, or personal issues.

**Fields & Data Mapping:**
- **תוכן ההערה (Note Content)**: Text block.
- **כותב ההערה (Author Name)**: Commander who created the note.
- **תאריך כתיבה (Timestamp)**: When the note was saved.
- **קטגוריה (Category)**: `OPERATIONAL` (מבצעי) \| `PERSONAL` (אישי) \| `DISCIPLINARY` (משמעתי) \| `ADMINISTRATIVE` (מנהלתי).

**Responsibilities & Behavior:**
- Visible **only** to commanders with `manage` or `view` scope on the employee's unit. Hidden completely from the employee (self-service cannot read notes written about themselves).
- Notes are append-only. They cannot be edited after creation. Deletion is restricted to the original author within 24 hours of creation, after which the note becomes immutable.

---

### 3.9 Documents (מסמכים מצורפים)

**Purpose:**  
Attaches files relevant to the employee's file, such as driver license scans, medical restriction forms, certification diplomas, or transfer orders.

**Fields & Data Mapping:**
- **שם הקובץ (Filename)**: Display name.
- **סוג מסמך (Document Type)**: `CERTIFICATION` (אישור הסמכה) \| `MEDICAL` (פטור/אישור רפואי) \| `PERSONAL` (אישי) \| `OTHER` (אחר).
- **קובץ להורדה (File Download Link)**: Secure URL pointing to object storage.
- **תאריך העלאה (Upload Date)**: Timestamp.
- **הועלה על ידי (Uploaded By)**: Operator UUID.

**Responsibilities & Behavior:**
- File uploads are validated at the API layer (max size 5 MB; permitted formats: PDF, JPEG, PNG).
- Document visibility follows field grouping: a medical document is only visible to users authorized to see medical limitations (Admin or Medical Officer).

---

## 4. Summary Table: Responsibilities & Access Gating

| Section | Role Visibility | Self-Service Edit | Mutable post-activation |
|---|---|---|---|
| **Basic Information** | Full for Admin; masked DOB/ID for others | Profile picture only | No (except with Admin override) |
| **Contact** | Hidden for standard; visible to Commander/Admin | Yes (all fields) | Yes |
| **Employment** | All views | No | Yes |
| **Organization** | All views | No | Yes (via transfer workflows) |
| **Current Status** | All views | Shift preference only | Yes |
| **Qualifications** | All views (Clearance levels masked for low roles) | Languages only | Yes (Admin/Specialist roles only) |
| **Activity Timeline** | View-scope only; delta snapshots Admin-only | No | No (read-only system log) |
| **Notes** | Commanders/Admins only; hidden from Self | No | Yes (append-only) |
| **Documents** | Based on doc type (Medical restricted to Medical/Admin) | No | Yes (upload/delete options) |
