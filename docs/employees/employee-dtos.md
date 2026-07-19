# Employee DTOs

**Domain:** Employee
**Phase:** 12.6 — Employee Data Contracts
**Depends on:** employee-field-catalog.md, employee-derived-fields.md, employee-business-rules.md

---

## Overview

This document defines every Data Transfer Object (DTO) used to exchange employee data between the frontend and backend.

DTOs define the **shape of data at the API boundary**. They are not database schemas. They are not React component props. They describe what travels over the wire.

### Conventions

- All field names use `camelCase`
- All dates use `YYYY-MM-DD` string format
- All timestamps use ISO 8601 string format (`YYYY-MM-DDTHH:mm:ssZ`)
- `null` means the field is absent; `undefined` means the field is not included in the response
- All IDs are UUID strings
- Required fields are marked `*`

---

## DTO Index

| DTO | Purpose |
|---|---|
| `EmployeeSummaryDTO` | Compact representation for list views and dashboard widgets |
| `EmployeeProfileDTO` | Full read representation for the employee profile page |
| `EmployeeOrganizationDTO` | Organizational context embedded in profile and org tree |
| `EmployeeCertificationsDTO` | All certifications with derived statuses |
| `CertificationEntryDTO` | A single certification record |
| `EmployeeAvailabilityDTO` | Derived availability information |
| `EmployeePreferencesDTO` | Self-service preferences |
| `CreateEmployeeDTO` | Input for creating a new employee |
| `UpdateEmployeeDTO` | Input for updating an existing employee |
| `UpdatePreferencesDTO` | Input for self-service preference updates |
| `EmployeeHistoryEntryDTO` | A single history timeline event |
| `EmployeeTransferEntryDTO` | A single transfer event in the timeline |

---

## Read DTOs

---

### EmployeeSummaryDTO

Used in: employee list views, search results, dashboard widgets, transfer request subjects, org tree rows.

The minimal set of fields needed to identify and understand an employee's current state at a glance.

```
EmployeeSummaryDTO {
  id*                 string (UUID)
  employeeNumber*     string
  firstName*          string
  lastName*           string
  fullName*           string          — derived: "{rank} {firstName} {lastName}"
  rank*               string
  position*           string
  serviceType*        string          — enum: MANDATORY | CAREER | RESERVE | CIVILIAN
  status*             string          — enum: DRAFT | ACTIVE | ON_LEAVE | TEMPORARY_ASSIGNMENT | SUSPENDED | INACTIVE | ARCHIVED
  orgUnitId*          string (UUID)
  orgUnitName*        string
  commanderId         string | null   — UUID of direct commander employee
  commanderName       string | null   — derived full name of direct commander
  profilePictureUrl   string | null
  certificationHealth string | null   — enum: ALL_VALID | EXPIRING_SOON | CRITICAL | EXPIRED | NO_CERTIFICATIONS
  yearsOfService      number | null   — derived: completed years since startDate
  createdAt*          string (ISO 8601)
  updatedAt*          string (ISO 8601)
}
```

---

### EmployeeProfileDTO

Used in: employee profile page, employee detail drawer, admin edit forms.

The complete representation of an employee, including all groups from the business model and all derived fields.

```
EmployeeProfileDTO {
  // --- Identity ---
  id*                 string (UUID)
  employeeNumber*     string
  firstName*          string
  lastName*           string
  fullName*           string          — derived
  dateOfBirth*        string          — YYYY-MM-DD (may be masked for non-admin roles)
  age*                number          — derived: completed years since dateOfBirth
  gender              string | null   — enum: MALE | FEMALE | OTHER | PREFER_NOT_TO_SAY
  nationalId          string | null   — masked or omitted for non-admin roles
  profilePictureUrl   string | null

  // --- Employment ---
  rank*               string
  position*           string
  serviceType*        string          — enum: MANDATORY | CAREER | RESERVE | CIVILIAN
  status*             string          — enum: DRAFT | ACTIVE | ON_LEAVE | TEMPORARY_ASSIGNMENT | SUSPENDED | INACTIVE | ARCHIVED
  startDate*          string          — YYYY-MM-DD
  expectedEndDate     string | null   — YYYY-MM-DD
  actualEndDate       string | null   — YYYY-MM-DD
  seniorityLevel      number | null   — manual credit years
  yearsOfService*     number          — derived

  // --- Organizational Assignment ---
  organization*       EmployeeOrganizationDTO

  // --- Contact ---
  militaryPhone       string | null   — may be masked for non-privileged roles
  personalPhone       string | null   — may be masked for non-privileged roles
  personalEmail       string | null   — may be masked for non-privileged roles
  unitEmail           string | null
  workAddress         string | null
  emergencyContact    EmergencyContactDTO | null  — restricted to authorized roles

  // --- Availability ---
  availability*       EmployeeAvailabilityDTO

  // --- Qualifications ---
  certifications*     EmployeeCertificationsDTO

  // --- Operational ---
  operational         EmployeeOperationalDTO | null

  // --- Preferences (only included when reading own profile) ---
  preferences         EmployeePreferencesDTO | null

  // --- Audit ---
  createdAt*          string (ISO 8601)
  updatedAt*          string (ISO 8601)
  createdBy           string | null   — UUID of creating operator
  updatedBy           string | null   — UUID of last updating operator
}
```

---

### EmployeeOrganizationDTO

Embedded in `EmployeeProfileDTO`. Describes where the employee sits in the organizational hierarchy.

```
EmployeeOrganizationDTO {
  orgUnitId*              string (UUID)
  orgUnitName*            string
  orgUnitCode*            string
  organizationPath*       string[]    — ordered from root to current unit
                                        e.g. ["חטיבה 7", "גדוד 51", "פלוגה א'"]
  commanderId             string | null   — UUID
  commanderName           string | null   — derived full name
  assignmentType*         string          — enum: PERMANENT | TEMPORARY
  temporaryAssignment     TemporaryAssignmentDTO | null
  commandScope            string | null   — derived: unit type name (e.g. "פלוגה")
  subordinateCount        number | null   — derived: total active subordinates
}
```

---

### TemporaryAssignmentDTO

Embedded in `EmployeeOrganizationDTO` when assignment type is `TEMPORARY`.

```
TemporaryAssignmentDTO {
  unitId*         string (UUID)
  unitName*       string
  startDate*      string    — YYYY-MM-DD
  endDate         string | null   — YYYY-MM-DD
}
```

---

### EmergencyContactDTO

Embedded in `EmployeeProfileDTO`. Only included for roles with emergency contact access.

```
EmergencyContactDTO {
  name*           string
  phone*          string
  relationship    string | null   — enum: SPOUSE | PARENT | SIBLING | CHILD | FRIEND | OTHER
}
```

---

### EmployeeAvailabilityDTO

Embedded in `EmployeeProfileDTO`. Describes the employee's current and standard availability.

```
EmployeeAvailabilityDTO {
  isAvailableToday*       boolean         — derived
  todayScheduleStatus     string | null   — the schedule status code for today
  standardWorkDays        string[]        — e.g. ["SUN","MON","TUE","WED","THU"]
  standardShiftPreference string | null   — enum: MORNING | AFTERNOON | NIGHT | FULL_DAY | NO_PREFERENCE
  leaveBalance            number | null   — annual leave days remaining (derived)
  leaveUsed               number | null   — annual leave days consumed (derived)
  medicalLimitation       MedicalLimitationDTO | null
  reserveDutyPeriods      ReserveDutyPeriodDTO[]
}
```

---

### MedicalLimitationDTO

Embedded in `EmployeeAvailabilityDTO`.

```
MedicalLimitationDTO {
  isActive*       boolean
  description     string | null
  expiryDate      string | null   — YYYY-MM-DD
}
```

---

### ReserveDutyPeriodDTO

Embedded in `EmployeeAvailabilityDTO` as an array.

```
ReserveDutyPeriodDTO {
  startDate*      string    — YYYY-MM-DD
  endDate*        string    — YYYY-MM-DD
}
```

---

### EmployeeCertificationsDTO

Embedded in `EmployeeProfileDTO`. Contains all certification groups with their derived statuses.

```
EmployeeCertificationsDTO {
  overallHealth*          string      — enum: ALL_VALID | EXPIRING_SOON | CRITICAL | EXPIRED | NO_CERTIFICATIONS

  driverLicense           CertificationEntryDTO | null
  medicalCertification    CertificationEntryDTO | null
  weaponsQualification    CertificationEntryDTO | null
  securityClearance       SecurityClearanceDTO | null
  combatFitness           CombatFitnessDTO | null
  additional              AdditionalCertificationDTO[]

  languageProficiencies   LanguageProficiencyDTO[]
}
```

---

### CertificationEntryDTO

Used for: Driver License, Medical Certification, Weapons Qualification.

```
CertificationEntryDTO {
  type*           string          — the certification type or class
  issueDate       string | null   — YYYY-MM-DD
  expiryDate      string | null   — YYYY-MM-DD
  status*         string          — derived enum: VALID | EXPIRING_SOON | CRITICAL | EXPIRED | NOT_HELD
  daysUntilExpiry number | null   — derived: null if already expired or no expiry
}
```

---

### SecurityClearanceDTO

```
SecurityClearanceDTO {
  level*          string    — enum: NONE | BASIC | SECRET | TOP_SECRET | TOP_SECRET_SCI
  expiryDate      string | null   — YYYY-MM-DD
  status*         string    — derived enum: VALID | EXPIRING_SOON | CRITICAL | EXPIRED | NOT_HELD
  daysUntilExpiry number | null
}
```

---

### CombatFitnessDTO

```
CombatFitnessDTO {
  classification*         string | null   — e.g. "97", "82", "64"
  classificationDate      string | null   — YYYY-MM-DD
  expiryDate              string | null   — YYYY-MM-DD
  status*                 string          — derived enum: VALID | EXPIRING_SOON | CRITICAL | EXPIRED | NOT_HELD
  daysUntilExpiry         number | null
}
```

---

### AdditionalCertificationDTO

```
AdditionalCertificationDTO {
  id*             string    — UUID or stable identifier
  name*           string
  issueDate*      string    — YYYY-MM-DD
  expiryDate      string | null   — YYYY-MM-DD
  status*         string    — derived enum: VALID | EXPIRING_SOON | CRITICAL | EXPIRED
  daysUntilExpiry number | null
}
```

---

### LanguageProficiencyDTO

```
LanguageProficiencyDTO {
  language*       string    — ISO 639-1 code or free text
  level*          string    — enum: BASIC | INTERMEDIATE | FLUENT | NATIVE
}
```

---

### EmployeeOperationalDTO

Embedded in `EmployeeProfileDTO`.

```
EmployeeOperationalDTO {
  operationalRole         string | null
  primaryWeaponSystem     string | null
  specialty               string | null
  commandCapability       boolean | null
}
```

---

### EmployeePreferencesDTO

Embedded in `EmployeeProfileDTO`. Only included when reading one's own profile.

```
EmployeePreferencesDTO {
  interfaceLanguage           string | null   — e.g. "he" | "ar" | "en"
  notificationChannelEmail    boolean
  notificationChannelSMS      boolean
  notificationChannelInApp    boolean
  notifyOnSchedulingAlerts    boolean
  notifyOnTransferUpdates     boolean
  notifyOnSystemAnnouncements boolean
  notifyOnCertificationReminders boolean
  notifyOnLeaveApprovals      boolean
  displayName                 string | null
  timeZone                    string | null   — IANA time zone
  dashboardLayout             object | null   — opaque JSON blob
}
```

---

### EmployeeHistoryEntryDTO

Used in: employee timeline view.

```
EmployeeHistoryEntryDTO {
  id*             string (UUID)
  type*           string    — always "HISTORY_CHANGE"
  changeType*     string    — enum: EMPLOYEE_CREATED | EMPLOYEE_UPDATED | EMPLOYEE_TRANSFERRED | EMPLOYEE_DELETED
  orgUnitId       string | null
  orgUnitName     string | null
  rank            string | null
  position        string | null
  status          string | null
  snapshot        EmployeeSnapshotDTO | null
  timestamp*      string (ISO 8601)
  operatorName    string
}
```

---

### EmployeeSnapshotDTO

Embedded in `EmployeeHistoryEntryDTO`.

```
EmployeeSnapshotDTO {
  before    object | null    — partial employee state before the change
  after     object | null    — partial employee state after the change
}
```

---

### EmployeeTransferEntryDTO

Used in: employee timeline view.

```
EmployeeTransferEntryDTO {
  id*             string (UUID)
  type*           string    — always "TRANSFER"
  fromUnitId      string | null
  fromUnitName    string | null
  toUnitId        string | null
  toUnitName      string | null
  reason          string | null
  status*         string    — enum: PENDING | APPROVED | REJECTED | CANCELLED
  requestedAt*    string (ISO 8601)
  completedAt     string | null
  requestedBy*    string    — operator name
  approvedBy      string | null
}
```

---

## Write DTOs

---

### CreateEmployeeDTO

Input for creating a new employee record.

```
CreateEmployeeDTO {
  // Required
  orgUnitId*          string (UUID)
  employeeNumber*     string
  firstName*          string
  lastName*           string
  dateOfBirth*        string    — YYYY-MM-DD
  rank*               string
  position*           string
  serviceType*        string    — enum: MANDATORY | CAREER | RESERVE | CIVILIAN
  startDate*          string    — YYYY-MM-DD

  // Optional
  status              string    — default: DRAFT
                                  enum: DRAFT | ACTIVE
  commanderId         string | null   — UUID
  userId              string | null   — UUID — links to system user account
  militaryPhone       string | null
  personalPhone       string | null
  personalEmail       string | null
  unitEmail           string | null
  workAddress         string | null
  expectedEndDate     string | null   — YYYY-MM-DD
  seniorityLevel      number | null
  gender              string | null
  nationalId          string | null
}
```

---

### UpdateEmployeeDTO

Input for updating an existing employee. All fields are optional — only provided fields are updated. Fields absent from the request are unchanged.

```
UpdateEmployeeDTO {
  orgUnitId           string | null   — triggers transfer workflow validation
  employeeNumber      string | null
  firstName           string | null
  lastName            string | null
  rank                string | null
  position            string | null
  serviceType         string | null
  status              string | null   — transitions must follow state machine (LR-01)
  commanderId         string | null
  userId              string | null
  militaryPhone       string | null
  personalPhone       string | null
  personalEmail       string | null
  unitEmail           string | null
  workAddress         string | null
  startDate           string | null   — YYYY-MM-DD
  expectedEndDate     string | null   — YYYY-MM-DD
  actualEndDate       string | null   — YYYY-MM-DD
  seniorityLevel      number | null
  gender              string | null
  assignmentType      string | null   — PERMANENT | TEMPORARY
  temporaryAssignment TemporaryAssignmentInputDTO | null
  medicalLimitation   MedicalLimitationInputDTO | null
  operationalRole     string | null
  primaryWeaponSystem string | null
  specialty           string | null
  commandCapability   boolean | null
  standardWorkDays    string[] | null
  shiftPreference     string | null
  changeReason        string | null   — required for SUSPENDED, INACTIVE, ARCHIVED transitions
}
```

---

### TemporaryAssignmentInputDTO

Nested in `UpdateEmployeeDTO`.

```
TemporaryAssignmentInputDTO {
  unitId*     string (UUID)
  startDate*  string    — YYYY-MM-DD
  endDate     string | null   — YYYY-MM-DD
}
```

---

### MedicalLimitationInputDTO

Nested in `UpdateEmployeeDTO`.

```
MedicalLimitationInputDTO {
  isActive*       boolean
  description     string | null   — required if isActive is true
  expiryDate      string | null   — YYYY-MM-DD
}
```

---

### UpdatePreferencesDTO

Input for employee self-service preference updates. Only the fields the employee is permitted to change.

```
UpdatePreferencesDTO {
  interfaceLanguage               string | null
  notificationChannelEmail        boolean | null
  notificationChannelSMS          boolean | null
  notificationChannelInApp        boolean | null
  notifyOnSchedulingAlerts        boolean | null
  notifyOnTransferUpdates         boolean | null
  notifyOnSystemAnnouncements     boolean | null
  notifyOnCertificationReminders  boolean | null
  notifyOnLeaveApprovals          boolean | null
  displayName                     string | null
  timeZone                        string | null
  dashboardLayout                 object | null
}
```

---

## Field Masking Rules

Some fields in read DTOs are conditionally masked based on the requesting operator's role.

| Field | Condition for full value | Masked as |
|---|---|---|
| `dateOfBirth` | Admin role, or self-access | `"****-**-**"` |
| `nationalId` | Admin role only | `null` (field omitted) |
| `personalPhone` | Commander or above, or self-access | `"***-***-****"` |
| `personalEmail` | Commander or above, or self-access | `"***@***.***"` |
| `militaryPhone` | View scope on unit | Unmasked |
| `emergencyContact` | Admin or Commander role | Omitted entirely |
| `preferences` | Self-access only | Omitted entirely |
| `snapshot.before/after` | Admin only | Omitted from history |
