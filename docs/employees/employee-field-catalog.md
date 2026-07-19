# Employee Field Catalog

**Domain:** Employee
**Phase:** 12.3 — Employee Field Catalog
**Depends on:** employee-business-model.md

---

## How to Read This Catalog

Each field entry includes:

- **Name** — The canonical business name of the field
- **Description** — What the field means and why it exists
- **Required** — Whether the field must have a value for the record to be valid
- **Editable** — Who may change this field after creation
- **Validation** — Rules the value must satisfy
- **Example** — A representative value

Fields are organized by the same groups defined in the Business Model (Phase 12.2).

---

## Group 1: Identity

---

### Full Name — First Name

| Property | Value |
|---|---|
| **Name** | First Name |
| **Description** | The person's legal given name, as it appears in their official identity documents. Used across all operational interfaces, reports, and notifications. |
| **Required** | Yes |
| **Editable** | Admin only |
| **Validation** | 1–100 characters. Letters only (including Hebrew, Arabic, and Latin characters). No digits. No leading or trailing whitespace. |
| **Example** | `נועה` / `Noa` |

---

### Full Name — Last Name

| Property | Value |
|---|---|
| **Name** | Last Name |
| **Description** | The person's legal family name. Combined with first name to form the full display name used across the system. |
| **Required** | Yes |
| **Editable** | Admin only |
| **Validation** | 1–100 characters. Letters only (including Hebrew, Arabic, and Latin characters). No digits. No leading or trailing whitespace. |
| **Example** | `כהן` / `Cohen` |

---

### Employee Number

| Property | Value |
|---|---|
| **Name** | Employee Number |
| **Description** | The unique personnel identifier assigned to this individual. This is the canonical external key used in all official records and for integration with external HR or military personnel systems. Immutable after creation. |
| **Required** | Yes |
| **Editable** | Admin only (exceptional cases) |
| **Validation** | 2–50 characters. Alphanumeric. No spaces. Unique within the tenant. Cannot be reused after archival. |
| **Example** | `7845621` / `OFF-2024-0042` |

---

### Date of Birth

| Property | Value |
|---|---|
| **Name** | Date of Birth |
| **Description** | The person's legal birth date. Used for age verification, eligibility checks (e.g., minimum service age), and demographic reporting. Stored encrypted at rest. |
| **Required** | Yes |
| **Editable** | Admin only |
| **Validation** | Valid calendar date in `YYYY-MM-DD` format. Must not be in the future. Person must be at least 17 years old at creation date. Person must not exceed 80 years old. |
| **Example** | `1997-04-15` |

---

### Profile Picture

| Property | Value |
|---|---|
| **Name** | Profile Picture |
| **Description** | A photograph of the employee, used for visual identification in operational interfaces, directories, and the commander dashboard. |
| **Required** | No |
| **Editable** | Employee self-service or Admin |
| **Validation** | JPEG or PNG format. Maximum file size: 2 MB. Minimum dimensions: 100×100px. Maximum dimensions: 2000×2000px. |
| **Example** | `avatar_7845621.jpg` |

---

### Gender

| Property | Value |
|---|---|
| **Name** | Gender |
| **Description** | The employee's gender, used for regulatory compliance reporting in certain military and HR contexts. |
| **Required** | No |
| **Editable** | Admin only |
| **Validation** | One of: `MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY` |
| **Example** | `FEMALE` |

---

### National ID

| Property | Value |
|---|---|
| **Name** | National ID / Passport Number |
| **Description** | The national identity document number (e.g., Israeli ID number / תעודת זהות), used in formal legal records and compliance contexts. Stored encrypted at rest. |
| **Required** | No |
| **Editable** | Admin only |
| **Validation** | 5–20 alphanumeric characters. No spaces. Format depends on country of issue. |
| **Example** | `123456789` |

---

## Group 2: Employment

---

### Rank

| Property | Value |
|---|---|
| **Name** | Rank |
| **Description** | The employee's current military or civilian grade. Determines seniority, authority level, and how the person is addressed in all system interfaces. |
| **Required** | Yes |
| **Editable** | Admin / Commander |
| **Validation** | 1–100 characters. Must match a value from the tenant's configured rank catalog. Cannot be blank. |
| **Example** | `רס"ן` (Major) / `סרן` (Captain) / `רב"ט` (Private First Class) |

---

### Position

| Property | Value |
|---|---|
| **Name** | Position |
| **Description** | The functional role the employee fills within their unit. Distinct from rank — describes what the person does, not their grade. Used in scheduling eligibility and operational reporting. |
| **Required** | Yes |
| **Editable** | Admin / Commander |
| **Validation** | 1–150 characters. Free text. Cannot be blank. |
| **Example** | `קצין מבצעים` (Operations Officer) / `חובש פלוגתי` (Company Medic) |

---

### Service Type

| Property | Value |
|---|---|
| **Name** | Service Type |
| **Description** | The nature of the employment relationship. Determines scheduling constraints, leave entitlements, and applicable regulations. |
| **Required** | Yes |
| **Editable** | Admin only |
| **Validation** | One of: `MANDATORY` (שירות חובה), `CAREER` (שירות קבע), `RESERVE` (מילואים), `CIVILIAN` (עובד אזרחי) |
| **Example** | `CAREER` |

---

### Employment Status

| Property | Value |
|---|---|
| **Name** | Employment Status |
| **Description** | The employee's current position in the lifecycle (see employee-lifecycle.md for full state machine). Governs operational visibility, scheduling eligibility, and dashboard KPI inclusion. |
| **Required** | Yes |
| **Editable** | Admin / Commander (within permitted transitions only) |
| **Validation** | One of: `DRAFT`, `ACTIVE`, `ON_LEAVE`, `TEMPORARY_ASSIGNMENT`, `SUSPENDED`, `INACTIVE`, `ARCHIVED`. Transitions must follow the defined state machine. |
| **Example** | `ACTIVE` |

---

### Start Date

| Property | Value |
|---|---|
| **Name** | Start Date |
| **Description** | The date the employee formally began service or employment in the organization. Used for seniority calculations and historical headcount reporting. |
| **Required** | Yes |
| **Editable** | Admin only |
| **Validation** | Valid calendar date in `YYYY-MM-DD` format. Must not be in the future. Must not precede January 1, 1950. |
| **Example** | `2022-08-01` |

---

### Expected End Date

| Property | Value |
|---|---|
| **Name** | Expected End Date |
| **Description** | The projected date of separation or end of service obligation. Applicable primarily to mandatory service and reserve personnel. Used for upcoming separation alerts and workforce planning. |
| **Required** | No |
| **Editable** | Admin only |
| **Validation** | Valid calendar date in `YYYY-MM-DD` format. Must be after Start Date. |
| **Example** | `2025-08-01` |

---

### Actual End Date

| Property | Value |
|---|---|
| **Name** | Actual End Date |
| **Description** | The date the employee formally separated from service. Populated upon departure. Used for historical accuracy in reports and timeline views. |
| **Required** | No |
| **Editable** | Admin only |
| **Validation** | Valid calendar date in `YYYY-MM-DD` format. Must be on or after Start Date. Must not be in the future. |
| **Example** | `2025-09-15` |

---

### Seniority Level

| Property | Value |
|---|---|
| **Name** | Seniority Level |
| **Description** | The number of full years of service completed. Used in scheduling priority, eligibility for certain roles, and reporting. May be automatically calculated from Start Date or entered manually for external service credit. |
| **Required** | No |
| **Editable** | Admin only |
| **Validation** | Non-negative integer. 0–60. |
| **Example** | `7` |

---

## Group 3: Organizational Assignment

---

### Primary Unit

| Property | Value |
|---|---|
| **Name** | Primary Unit |
| **Description** | The organizational unit the employee formally belongs to (e.g., battalion, company, platoon). Exactly one unit at any time. Determines scheduling scope, command authority, and KPI attribution. |
| **Required** | Yes |
| **Editable** | Admin / Commander (via transfer workflow) |
| **Validation** | Must be a valid, active organization unit ID within the same tenant. Cannot be blank. |
| **Example** | `פלוגה א' — גדוד 51` |

---

### Direct Commander

| Property | Value |
|---|---|
| **Name** | Direct Commander |
| **Description** | The employee who holds direct command responsibility over this person. Used to resolve command chains, route notifications, and display organizational relationships. |
| **Required** | No |
| **Editable** | Admin / Commander |
| **Validation** | Must reference an existing, active employee within the same tenant. Cannot reference the employee themselves. |
| **Example** | `רס"ן דוד לוי` |

---

### Organization Path

| Property | Value |
|---|---|
| **Name** | Organization Path |
| **Description** | The full chain of units from the root of the hierarchy down to the employee's primary unit. Derived from the organization module — not stored on the employee. Displayed in profile views and reports. |
| **Required** | Derived |
| **Editable** | Not editable — computed automatically |
| **Validation** | N/A |
| **Example** | `חטיבה 7 → גדוד 51 → פלוגה א' → מחלקה 2` |

---

### Assignment Type

| Property | Value |
|---|---|
| **Name** | Assignment Type |
| **Description** | Indicates whether the current organizational assignment is permanent or temporary. Determines whether scheduling and KPIs follow the primary unit or the temporary assignment unit. |
| **Required** | Yes |
| **Editable** | Admin / Commander |
| **Validation** | One of: `PERMANENT`, `TEMPORARY` |
| **Example** | `PERMANENT` |

---

### Temporary Assignment Unit

| Property | Value |
|---|---|
| **Name** | Temporary Assignment Unit |
| **Description** | The unit the employee is currently seconded to, when Assignment Type is `TEMPORARY`. Scheduling and daily status follow this unit during the assignment period. |
| **Required** | Only if Assignment Type is `TEMPORARY` |
| **Editable** | Admin / Commander |
| **Validation** | Must be a valid, active organization unit ID within the same tenant. Must differ from Primary Unit. |
| **Example** | `פלוגת תגבורת — גדוד 12` |

---

### Temporary Assignment Start

| Property | Value |
|---|---|
| **Name** | Temporary Assignment Start Date |
| **Description** | The date the temporary assignment begins. Required when a temporary assignment unit is defined. |
| **Required** | Only if Temporary Assignment Unit is set |
| **Editable** | Admin / Commander |
| **Validation** | Valid calendar date in `YYYY-MM-DD` format. Must not be before the employee's Start Date. |
| **Example** | `2026-07-20` |

---

### Temporary Assignment End

| Property | Value |
|---|---|
| **Name** | Temporary Assignment End Date |
| **Description** | The expected date when the temporary assignment concludes and the employee returns to their primary unit. |
| **Required** | No |
| **Editable** | Admin / Commander |
| **Validation** | Valid calendar date in `YYYY-MM-DD` format. Must be after Temporary Assignment Start. |
| **Example** | `2026-08-15` |

---

## Group 4: Contact Information

---

### Military Phone

| Property | Value |
|---|---|
| **Name** | Military Phone Number |
| **Description** | The official unit-assigned phone number. Used for operational communications and emergency contact within the organization. Stored encrypted. |
| **Required** | No |
| **Editable** | Admin / Commander |
| **Validation** | 7–20 characters. Digits, spaces, dashes, and an optional leading `+`. Must be a plausible phone number. |
| **Example** | `+972-52-8001234` |

---

### Personal Mobile Phone

| Property | Value |
|---|---|
| **Name** | Personal Mobile Phone |
| **Description** | The employee's personal mobile number. Used for urgent contact when the military phone is unavailable. Stored encrypted. Access restricted to authorized roles. |
| **Required** | No |
| **Editable** | Employee self-service or Admin |
| **Validation** | 7–20 characters. Digits, spaces, dashes, and an optional leading `+`. Must be a plausible phone number. |
| **Example** | `052-3456789` |

---

### Personal Email

| Property | Value |
|---|---|
| **Name** | Personal Email Address |
| **Description** | The employee's personal email address, used for formal correspondence. Stored encrypted. Access restricted to authorized roles. |
| **Required** | No |
| **Editable** | Employee self-service or Admin |
| **Validation** | Valid email format (`user@domain.tld`). Maximum 254 characters. |
| **Example** | `noa.cohen@gmail.com` |

---

### Unit Email

| Property | Value |
|---|---|
| **Name** | Unit Email Address |
| **Description** | The official military or organizational email address assigned to this position. May be role-based rather than person-specific. |
| **Required** | No |
| **Editable** | Admin only |
| **Validation** | Valid email format. Maximum 254 characters. |
| **Example** | `ops.officer@idf.mil` |

---

### Work Address

| Property | Value |
|---|---|
| **Name** | Work / Station Address |
| **Description** | The physical location where the employee is normally stationed. Used in operational planning and emergency response. |
| **Required** | No |
| **Editable** | Admin / Commander |
| **Validation** | Free text. Maximum 250 characters. |
| **Example** | `בסיס צאלים, אילת` |

---

### Emergency Contact Name

| Property | Value |
|---|---|
| **Name** | Emergency Contact Name |
| **Description** | The full name of the person to contact in an emergency on behalf of this employee. Access strictly restricted to authorized commanders and administrators. |
| **Required** | No |
| **Editable** | Employee self-service or Admin |
| **Validation** | 2–150 characters. Letters only. |
| **Example** | `מרים כהן` |

---

### Emergency Contact Phone

| Property | Value |
|---|---|
| **Name** | Emergency Contact Phone |
| **Description** | The phone number of the emergency contact person. Stored encrypted. |
| **Required** | No (required if Emergency Contact Name is provided) |
| **Editable** | Employee self-service or Admin |
| **Validation** | 7–20 characters. Digits, spaces, dashes, and an optional leading `+`. |
| **Example** | `054-9876543` |

---

### Emergency Contact Relationship

| Property | Value |
|---|---|
| **Name** | Emergency Contact Relationship |
| **Description** | The relationship between the employee and their emergency contact, used to contextualize the contact in emergency situations. |
| **Required** | No |
| **Editable** | Employee self-service or Admin |
| **Validation** | One of: `SPOUSE`, `PARENT`, `SIBLING`, `CHILD`, `FRIEND`, `OTHER`. Or free text if "OTHER" — maximum 50 characters. |
| **Example** | `PARENT` |

---

## Group 5: Availability

---

### Standard Work Days

| Property | Value |
|---|---|
| **Name** | Standard Work Days |
| **Description** | The days of the week on which this employee is normally expected to be available for duty. Used as the default pattern for scheduling and absence tracking. |
| **Required** | No |
| **Editable** | Commander / Admin |
| **Validation** | A subset of: `SUN`, `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`. At least one day required if field is set. |
| **Example** | `SUN, MON, TUE, WED, THU` |

---

### Standard Shift Preference

| Property | Value |
|---|---|
| **Name** | Standard Shift Preference |
| **Description** | The employee's preferred shift type for default scheduling. A preference — not a constraint. Scheduling may override based on operational needs. |
| **Required** | No |
| **Editable** | Commander / Admin / Employee self-service |
| **Validation** | One of: `MORNING`, `AFTERNOON`, `NIGHT`, `FULL_DAY`, `NO_PREFERENCE` |
| **Example** | `MORNING` |

---

### Leave Balance

| Property | Value |
|---|---|
| **Name** | Annual Leave Balance |
| **Description** | The number of vacation days remaining in the current calendar year. Used in attendance reporting and leave approval decisions. May be imported from an external HR system. |
| **Required** | No |
| **Editable** | Admin / System (HR integration) |
| **Validation** | Non-negative decimal number. 0–365. |
| **Example** | `14.5` |

---

### Leave Used

| Property | Value |
|---|---|
| **Name** | Annual Leave Days Used |
| **Description** | The number of vacation days consumed in the current calendar year. Derived from approved leave records — not entered manually. |
| **Required** | No |
| **Editable** | System only (derived from approved leave records) |
| **Validation** | Non-negative decimal number. 0–365. Must not exceed total leave entitlement. |
| **Example** | `9.0` |

---

### Reserve Duty Obligation

| Property | Value |
|---|---|
| **Name** | Reserve Duty Period |
| **Description** | Scheduled periods of mandatory reserve duty service, applicable to reserve personnel. During these periods the employee's availability is pre-committed. |
| **Required** | No (applicable to RESERVE service type only) |
| **Editable** | Admin only |
| **Validation** | A date range: start date and end date, both in `YYYY-MM-DD` format. End must be after start. Multiple periods may be recorded. |
| **Example** | `2026-10-01` to `2026-10-21` |

---

### Medical Limitation Active

| Property | Value |
|---|---|
| **Name** | Medical Limitation Active |
| **Description** | Indicates whether the employee currently has an active medical restriction that affects duty assignment. Does not record the diagnosis — only whether a restriction exists. |
| **Required** | No |
| **Editable** | Admin / Medical Officer |
| **Validation** | Boolean: `true` or `false` |
| **Example** | `true` |

---

### Medical Limitation Description

| Property | Value |
|---|---|
| **Name** | Medical Limitation Description |
| **Description** | A brief operational description of what the employee cannot do due to the medical restriction. Does not contain clinical diagnosis. Used by commanders to make informed scheduling decisions. |
| **Required** | No (required if Medical Limitation Active is `true`) |
| **Editable** | Admin / Medical Officer |
| **Validation** | Free text. Maximum 500 characters. Must not contain identifiable clinical diagnosis terms. |
| **Example** | `מוגבל ממשמרות לילה ומפעילות גופנית מאומצת` (Restricted from night shifts and strenuous physical activity) |

---

### Medical Restriction Expiry Date

| Property | Value |
|---|---|
| **Name** | Medical Restriction Expiry Date |
| **Description** | The date when the active medical restriction is expected to be cleared, after which the employee may return to full duty eligibility. |
| **Required** | No |
| **Editable** | Admin / Medical Officer |
| **Validation** | Valid calendar date in `YYYY-MM-DD` format. Must be in the future when set. |
| **Example** | `2026-09-01` |

---

## Group 6: Qualifications

---

### Driver License Class

| Property | Value |
|---|---|
| **Name** | Driver License Class |
| **Description** | The vehicle class the employee is legally certified to operate. Determines eligibility for driver roles in scheduling. |
| **Required** | No |
| **Editable** | Admin |
| **Validation** | One or more of: `A` (motorcycle), `B` (private car), `C` (truck), `C1` (medium truck), `D` (bus), `D1` (minibus), `E` (combination vehicle) |
| **Example** | `B, C` |

---

### Driver License Expiry

| Property | Value |
|---|---|
| **Name** | Driver License Expiry Date |
| **Description** | The date by which the driver license must be renewed. The system generates alerts at 30 days and 7 days before expiry. After expiry, the employee loses driver role eligibility. |
| **Required** | No (required if Driver License Class is set) |
| **Editable** | Admin |
| **Validation** | Valid calendar date in `YYYY-MM-DD` format. Must be after today when set. |
| **Example** | `2028-03-31` |

---

### Medical Certification

| Property | Value |
|---|---|
| **Name** | Medical Certification Type |
| **Description** | The professional medical qualification held by the employee, allowing them to serve in a medical role within the unit (e.g., combat medic, paramedic, nurse). |
| **Required** | No |
| **Editable** | Admin |
| **Validation** | One of: `COMBAT_MEDIC` (חובש קרבי), `PARAMEDIC` (חובש מתקדם), `NURSE` (אחות/אח), `PHYSICIAN` (רופא), `NONE` |
| **Example** | `COMBAT_MEDIC` |

---

### Medical Certification Expiry

| Property | Value |
|---|---|
| **Name** | Medical Certification Expiry Date |
| **Description** | The date by which the medical certification must be renewed. After expiry, the employee cannot be assigned to medical roles. Alerts generated at 30 and 7 days before expiry. |
| **Required** | No (required if Medical Certification is set and not `NONE`) |
| **Editable** | Admin |
| **Validation** | Valid calendar date in `YYYY-MM-DD` format. |
| **Example** | `2027-06-30` |

---

### Weapons Qualification

| Property | Value |
|---|---|
| **Name** | Weapons Qualification |
| **Description** | The weapon system the employee is currently qualified to operate. Determines eligibility for armed roles in scheduling. |
| **Required** | No |
| **Editable** | Admin |
| **Validation** | Free text or from a configured tenant weapon catalog. Maximum 100 characters per entry. Multiple entries permitted. |
| **Example** | `M16, MAG` |

---

### Weapons Qualification Date

| Property | Value |
|---|---|
| **Name** | Weapons Qualification Date |
| **Description** | The date on which the most recent weapons qualification test was completed and passed. |
| **Required** | No (required if Weapons Qualification is set) |
| **Editable** | Admin |
| **Validation** | Valid calendar date in `YYYY-MM-DD` format. Must not be in the future. |
| **Example** | `2026-01-15` |

---

### Weapons Qualification Expiry

| Property | Value |
|---|---|
| **Name** | Weapons Qualification Expiry Date |
| **Description** | The date by which a requalification test must be completed. After expiry, the employee is ineligible for armed roles. |
| **Required** | No |
| **Editable** | Admin |
| **Validation** | Valid calendar date in `YYYY-MM-DD` format. Must be after Weapons Qualification Date. |
| **Example** | `2027-01-15` |

---

### Security Clearance Level

| Property | Value |
|---|---|
| **Name** | Security Clearance Level |
| **Description** | The level of classified information this employee is authorized to access. Determines role eligibility in sensitive operational positions. |
| **Required** | No |
| **Editable** | Admin only (Security Officer) |
| **Validation** | One of: `NONE`, `BASIC` (ביסודי), `SECRET` (סודי), `TOP_SECRET` (סודי ביותר), `TOP_SECRET_SCI` |
| **Example** | `SECRET` |

---

### Security Clearance Expiry

| Property | Value |
|---|---|
| **Name** | Security Clearance Expiry Date |
| **Description** | The date by which the security clearance must be renewed. After expiry, the employee reverts to the next lower clearance level pending renewal. |
| **Required** | No (required if Security Clearance Level is not `NONE`) |
| **Editable** | Admin only (Security Officer) |
| **Validation** | Valid calendar date in `YYYY-MM-DD` format. |
| **Example** | `2029-12-31` |

---

### Additional Certifications

| Property | Value |
|---|---|
| **Name** | Additional Certifications |
| **Description** | Any professional certifications beyond the standard set above — for example: first aid instructor, communications operator, armorer, explosive ordnance disposal (EOD), CBRN. Each entry has a name, issue date, and optional expiry date. |
| **Required** | No |
| **Editable** | Admin |
| **Validation** | Per entry: Certification name 2–100 characters; issue date valid `YYYY-MM-DD`; expiry date valid `YYYY-MM-DD` if provided and must be after issue date. Maximum 20 entries per employee. |
| **Example** | `מדריך עזרה ראשונה — הוצא: 2024-05-01 — פקיעה: 2026-05-01` |

---

### Language Proficiency

| Property | Value |
|---|---|
| **Name** | Language Proficiency |
| **Description** | Languages the employee can communicate in and at what level. Used for assignment to roles requiring specific language capability (interpreter, liaison, intelligence). |
| **Required** | No |
| **Editable** | Admin / Employee self-service |
| **Validation** | Per entry: Language name from ISO 639-1 list or free text (max 50 characters); proficiency level from `BASIC`, `INTERMEDIATE`, `FLUENT`, `NATIVE`. Maximum 10 entries. |
| **Example** | `עברית — NATIVE`, `אנגלית — FLUENT`, `ערבית — INTERMEDIATE` |

---

## Group 7: Operational Information

---

### Operational Role

| Property | Value |
|---|---|
| **Name** | Operational Role |
| **Description** | The function this employee fills in a field or operational scenario. Distinct from their administrative position. Determines which shift types and assignments they are eligible for in the scheduling module. |
| **Required** | No |
| **Editable** | Admin / Commander |
| **Validation** | One of a tenant-configured role catalog, or free text maximum 100 characters. |
| **Example** | `מפקד כיתה` (Squad Leader) / `חובש קרבי` (Combat Medic) / `נהג` (Driver) |

---

### Primary Weapon System

| Property | Value |
|---|---|
| **Name** | Primary Weapon System |
| **Description** | The weapon system this employee is issued, trained on, and responsible for maintaining. Used in operational order of battle documentation. |
| **Required** | No |
| **Editable** | Admin / Commander |
| **Validation** | Free text. Maximum 100 characters. |
| **Example** | `תבור` / `נגב` / `M16A2` |

---

### Specialty

| Property | Value |
|---|---|
| **Name** | Military or Professional Specialty |
| **Description** | Any specialized capability beyond the standard role, such as sniper, combat engineer, intelligence analyst, or cyber operator. Used for advanced scheduling filters and resource planning. |
| **Required** | No |
| **Editable** | Admin |
| **Validation** | Free text. Maximum 150 characters. Multiple values permitted, comma-separated. |
| **Example** | `צלף, חבלן` |

---

### Combat Fitness Status

| Property | Value |
|---|---|
| **Name** | Combat Fitness Classification (פרופיל רפואי) |
| **Description** | The official medical-fitness classification that determines the employee's eligibility for frontline and combat roles. Based on the Israeli Defense Forces medical profile system. |
| **Required** | No |
| **Editable** | Admin only (Medical Officer) |
| **Validation** | Integer between 21 and 97, from the set of valid IDF medical profile codes: `21`, `24`, `45`, `64`, `72`, `82`, `97`. Or equivalent classification system for non-IDF tenants. |
| **Example** | `97` |

---

### Combat Fitness Classification Date

| Property | Value |
|---|---|
| **Name** | Combat Fitness Classification Date |
| **Description** | The date on which the most recent fitness classification was issued or confirmed. |
| **Required** | No (required if Combat Fitness Status is set) |
| **Editable** | Admin only (Medical Officer) |
| **Validation** | Valid calendar date in `YYYY-MM-DD` format. Must not be in the future. |
| **Example** | `2025-11-01` |

---

### Combat Fitness Expiry

| Property | Value |
|---|---|
| **Name** | Combat Fitness Classification Expiry Date |
| **Description** | The date by which a new fitness classification must be issued. After expiry, the employee's classification is treated as unknown pending re-examination. |
| **Required** | No |
| **Editable** | Admin only (Medical Officer) |
| **Validation** | Valid calendar date in `YYYY-MM-DD` format. Must be after Classification Date. |
| **Example** | `2028-11-01` |

---

### Command Capability

| Property | Value |
|---|---|
| **Name** | Command Capability |
| **Description** | Indicates whether this employee is formally qualified and authorized to hold a command position at their current level. Distinct from whether they currently hold a command assignment. |
| **Required** | No |
| **Editable** | Admin |
| **Validation** | Boolean: `true` or `false` |
| **Example** | `true` |

---

### Subordinate Count

| Property | Value |
|---|---|
| **Name** | Subordinate Count |
| **Description** | The total number of employees under this person's direct and indirect command responsibility. Derived from the organization hierarchy — not stored on the employee record. |
| **Required** | Derived |
| **Editable** | Not editable — computed automatically from the organization structure |
| **Validation** | N/A |
| **Example** | `124` |

---

### Command Scope

| Property | Value |
|---|---|
| **Name** | Command Scope |
| **Description** | The organizational level at which this employee exercises command responsibility (e.g., Platoon, Company, Battalion). Derived from the organization unit type assigned to this person as commander. |
| **Required** | Derived |
| **Editable** | Not editable — derived from organization commander assignments |
| **Validation** | N/A |
| **Example** | `פלוגה` (Company) |

---

## Group 8: Preferences

---

### Interface Language

| Property | Value |
|---|---|
| **Name** | Interface Language |
| **Description** | The employee's preferred language for the Pikud360 user interface. Applied when the employee logs into the system. Does not affect data stored in the system. |
| **Required** | No |
| **Editable** | Employee self-service |
| **Validation** | One of the system's supported locales: `he` (Hebrew), `ar` (Arabic), `en` (English) |
| **Example** | `he` |

---

### Notification Preferences

| Property | Value |
|---|---|
| **Name** | Notification Preferences |
| **Description** | Which categories of notifications the employee opts in or out of. Security-critical notifications (duty alerts, critical threshold breaches) cannot be silenced by preference. |
| **Required** | No |
| **Editable** | Employee self-service |
| **Validation** | A set of category toggles: `SCHEDULING_ALERTS`, `TRANSFER_UPDATES`, `SYSTEM_ANNOUNCEMENTS`, `CERTIFICATION_REMINDERS`, `LEAVE_APPROVALS`. Each is `true` (enabled) or `false` (disabled). Security-critical alerts are always `true` and not configurable. |
| **Example** | `SCHEDULING_ALERTS: true, TRANSFER_UPDATES: true, SYSTEM_ANNOUNCEMENTS: false` |

---

### Notification Channel

| Property | Value |
|---|---|
| **Name** | Preferred Notification Channel |
| **Description** | The employee's preferred delivery method for non-critical notifications. Critical alerts are always delivered in-app regardless of this preference. |
| **Required** | No |
| **Editable** | Employee self-service |
| **Validation** | One of: `IN_APP`, `EMAIL`, `SMS`, `IN_APP_AND_EMAIL` |
| **Example** | `IN_APP_AND_EMAIL` |

---

### Dashboard Layout

| Property | Value |
|---|---|
| **Name** | Dashboard Layout Configuration |
| **Description** | A saved configuration of the commander's dashboard widget arrangement and visibility preferences. User-scoped — does not affect what other users see. |
| **Required** | No |
| **Editable** | Employee self-service |
| **Validation** | Valid JSON structure conforming to the dashboard layout schema. Maximum 10 KB. |
| **Example** | `{ "widgetOrder": ["workforce", "alerts", "attendance", ...], "hiddenWidgets": [] }` |

---

### Time Zone

| Property | Value |
|---|---|
| **Name** | Time Zone |
| **Description** | The employee's local time zone. Relevant for units operating in overseas postings or across multiple time zones. Used to display timestamps in the correct local time. |
| **Required** | No |
| **Editable** | Employee self-service or Admin |
| **Validation** | Valid IANA time zone identifier (e.g., `Asia/Jerusalem`, `Europe/London`, `UTC`) |
| **Example** | `Asia/Jerusalem` |

---

### Display Name

| Property | Value |
|---|---|
| **Name** | Display Name |
| **Description** | The name shown in the user interface header and profile badge when the employee is logged in. Defaults to rank + first name + last name if not set. May be customized to a preferred short name or nickname. |
| **Required** | No |
| **Editable** | Employee self-service |
| **Validation** | 1–80 characters. No leading or trailing whitespace. |
| **Example** | `רס"ן נועה כ.` |

---

## Summary

| Group | Total Fields | Required | Optional | Derived |
|---|---|---|---|---|
| Identity | 6 | 3 | 3 | 0 |
| Employment | 8 | 5 | 3 | 0 |
| Organizational Assignment | 7 | 2 | 3 | 2 |
| Contact Information | 8 | 0 | 8 | 0 |
| Availability | 8 | 0 | 7 | 1 |
| Qualifications | 11 | 0 | 11 | 0 |
| Operational Information | 9 | 0 | 7 | 2 |
| Preferences | 6 | 0 | 6 | 0 |
| **Total** | **63** | **10** | **48** | **5** |

### Fields that trigger expiry alerts

| Field | Alert at 30 days | Alert at 7 days | Effect after expiry |
|---|---|---|---|
| Driver License Expiry | ✅ | ✅ | Driver role ineligibility |
| Medical Certification Expiry | ✅ | ✅ | Medical role ineligibility |
| Weapons Qualification Expiry | ✅ | ✅ | Armed role ineligibility |
| Security Clearance Expiry | ✅ | ✅ | Clearance downgrade pending renewal |
| Combat Fitness Expiry | ✅ | ✅ | Classification treated as unknown |
| Additional Certification Expiry | ✅ | ✅ | Certification flagged as lapsed |
| Medical Restriction Expiry | ✅ | — | Restriction auto-cleared for review |

### Fields accessible to Employee self-service

| Field |
|---|
| Personal Mobile Phone |
| Personal Email |
| Emergency Contact Name / Phone / Relationship |
| Standard Shift Preference |
| Language Proficiency |
| Interface Language |
| Notification Preferences |
| Notification Channel |
| Dashboard Layout |
| Time Zone |
| Display Name |
| Profile Picture |
