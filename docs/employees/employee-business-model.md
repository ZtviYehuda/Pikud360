# Employee Business Model

**Domain:** Employee
**Phase:** 12.2 — Employee Business Model
**Status:** Approved Design

---

## Overview

This document defines all business information that belongs to an employee in Pikud360.

Fields are grouped by their business purpose. Each group is a cohesive set of information that has a single operational reason to change together.

This is a **business model** — it defines what information exists and why, not how it is stored or transmitted.

---

## Group 1: Identity

Information that uniquely identifies the person across the organization and across time. This information is stable and changes rarely.

| Field | Business Purpose | Required |
|---|---|---|
| **Full Name** | The person's legal first and last name | Yes |
| **Employee Number** | The unique personnel ID used across all organizational systems (e.g., military service number, personnel file number) | Yes |
| **Date of Birth** | Used for age verification, eligibility checks, and demographic reporting | Yes |
| **Profile Picture** | Visual identification in operational interfaces and directories | No |
| **Gender** | Required for regulatory compliance in certain reporting contexts | No |
| **National ID / Passport** | Legal identity document reference, used in formal records | No |

**Notes:**
- The employee number is the canonical external key for integration with external HR or military personnel systems.
- Full name is used everywhere in the system — dashboards, reports, notifications, audit trails.
- Date of birth is sensitive and must be treated with appropriate access controls.

---

## Group 2: Employment

Information that defines the nature and terms of the person's service or employment within the organization. This group changes when a person is promoted, reassigned, or their service terms change.

| Field | Business Purpose | Required |
|---|---|---|
| **Rank** | Military or civilian grade (e.g., Private, Sergeant, Captain, Civilian Advisor) | Yes |
| **Position / Role Title** | The functional role the employee fills within their unit (e.g., Unit Commander, Communications Officer, Medical Orderly) | Yes |
| **Service Type** | The nature of the service obligation: Mandatory Service, Career Service (Regular Army), Reserve Duty, Civilian Staff | Yes |
| **Employment Status** | Current lifecycle state: Active, On Leave, Inactive, Suspended, etc. (see lifecycle document) | Yes |
| **Start Date** | The date the employee formally joined the organization or current assignment | Yes |
| **Expected End Date** | For time-limited service types (mandatory, reserve), the projected release or end-of-term date | No |
| **Actual End Date** | The date the employee formally left (populated upon departure) | No |
| **Seniority Level** | Years of service or seniority grade, used in scheduling priority and reporting | No |

**Notes:**
- Rank and position are distinct concepts. A person may hold the rank of Captain but serve in the position of Deputy Battalion Commander.
- Service type determines eligibility rules in scheduling (mandatory service personnel have different constraint profiles than career officers).
- Start date and end dates support historical headcount reporting and tenure analysis.

---

## Group 3: Organizational Assignment

Information that places the employee within the organizational hierarchy. This group changes on transfers and reassignments.

| Field | Business Purpose | Required |
|---|---|---|
| **Primary Unit** | The organizational unit the employee formally belongs to (battalion, company, platoon) | Yes |
| **Direct Commander** | The employee who holds direct command responsibility over this person | No |
| **Organization Path** | The full hierarchy chain from root to the employee's unit (Brigade → Battalion → Company → Platoon) | Derived |
| **Assignment Type** | Whether the current assignment is permanent or temporary | Yes |
| **Temporary Assignment Unit** | If on temporary assignment, the unit they are currently operating within | No |
| **Temporary Assignment Start** | Start date of the temporary assignment | No |
| **Temporary Assignment End** | Expected end date of the temporary assignment | No |

**Notes:**
- An employee belongs to exactly one primary unit at any time.
- The organization path is derived from the unit hierarchy — it is not stored separately on the employee.
- When a temporary assignment is active, the scheduling module follows the temporary unit, not the primary unit.
- The direct commander reference is always another employee in the system.

---

## Group 4: Contact Information

Information used to reach the employee directly. Contact details are sensitive and access-controlled.

| Field | Business Purpose | Required |
|---|---|---|
| **Military Phone** | The official unit-assigned phone number | No |
| **Personal Mobile Phone** | The employee's personal mobile number for urgent contact | No |
| **Personal Email** | Personal email address, used for formal communications | No |
| **Unit Email** | Military unit email address (if different from personal) | No |
| **Work Address** | Physical location where the employee is normally stationed | No |
| **Emergency Contact Name** | Name of next-of-kin or designated emergency contact | No |
| **Emergency Contact Phone** | Phone number for the emergency contact | No |
| **Emergency Contact Relationship** | Relationship to the employee (spouse, parent, sibling) | No |

**Notes:**
- Phone and personal email are encrypted at rest to protect personal information.
- Blind indexes enable search without exposing plaintext contact data.
- Emergency contact information is strictly restricted — visible only to authorized commanders and administrators.
- Unit email is not stored on the employee record — it is derived from the unit assignment.

---

## Group 5: Availability

Information that describes the employee's general availability for scheduling and assignments. This group is distinct from the daily attendance record — it describes the expected pattern, not the recorded daily status.

| Field | Business Purpose | Required |
|---|---|---|
| **Standard Work Days** | The days of the week the employee is expected to be available (Sunday–Thursday, Sunday–Friday, etc.) | No |
| **Standard Shift Preference** | Default preferred shift (Morning, Afternoon, Night) if applicable | No |
| **Leave Balance** | The number of vacation days remaining for the current year | No |
| **Leave Used** | Number of vacation days consumed in the current year | No |
| **Reserve Duty Obligation** | Scheduled reserve duty periods (for reserve personnel) | No |
| **Medical Limitations** | Whether the employee has active medical restrictions affecting duty assignment | No |
| **Medical Limitation Description** | Nature of the limitation (without clinical diagnosis detail) | No |
| **Restriction Expiry Date** | Date when a medical limitation is expected to be cleared | No |

**Notes:**
- Leave balance is typically managed by an HR system and synchronized into Pikud360. It does not originate in the scheduling module.
- Medical limitations define scheduling constraints — they determine which shift types and roles the employee cannot be assigned to.
- Medical limitation descriptions should not contain clinical detail. The system records the functional constraint (e.g., "restricted from night shifts"), not the diagnosis.

---

## Group 6: Qualifications

Information about the employee's professional qualifications, training, and certifications. This group is critical for operational safety and scheduling eligibility.

| Field | Business Purpose | Required |
|---|---|---|
| **Driver License Class** | Type of vehicle the employee is certified to operate (A, B, C, C1, D) | No |
| **Driver License Expiry** | License renewal date — alerts triggered before expiry | No |
| **Medical Certification (Medic/Paramedic)** | Active medical qualification allowing the employee to serve as unit medic | No |
| **Medical Certification Expiry** | Expiry date of medical qualification — alerts triggered before expiry | No |
| **Weapons Qualification** | The class of weapon the employee is qualified to handle | No |
| **Weapons Qualification Date** | Date of most recent weapons qualification test | No |
| **Weapons Qualification Expiry** | Date by which a requalification test must be completed | No |
| **Security Clearance Level** | The level of classified information the employee is authorized to access | No |
| **Security Clearance Expiry** | Date when the security clearance must be renewed | No |
| **Additional Certifications** | Other professional certifications (first aid instructor, communications operator, etc.) | No |
| **Language Proficiency** | Languages spoken and proficiency level | No |

**Notes:**
- Each certification has an independent expiry date. The system is responsible for surfacing expiry alerts before they occur (30-day and 7-day warning thresholds recommended).
- Certifications determine scheduling eligibility — an employee without a valid medical certification cannot be assigned to the medic role.
- Weapons qualification is renewed on a fixed schedule (typically annual). The scheduling module must be aware of disqualification when a renewal lapses.
- Security clearance level affects which roles and information the employee can be assigned to.

---

## Group 7: Operational Information

Information that describes the employee's operational role, capabilities, and how they appear in operational contexts. This group is used by commanders during planning and situational awareness.

| Field | Business Purpose | Required |
|---|---|---|
| **Operational Role** | The function the employee fulfills in an operational scenario (Rifleman, Team Leader, Driver, Medic, Communications, Logistics) | No |
| **Primary Weapon System** | The weapon system the employee is assigned to and trained on | No |
| **Specialty** | Any specialized military or professional specialty (sniper, combat engineer, intelligence analyst) | No |
| **Combat Fitness Status** | The official fitness classification that determines frontline deployment eligibility | No |
| **Combat Fitness Classification Date** | Date of most recent fitness classification | No |
| **Combat Fitness Expiry** | Date when fitness classification must be renewed | No |
| **Command Capability** | Whether the employee is qualified to hold a command position at their level | No |
| **Subordinate Count** | Number of employees under this person's direct command responsibility | Derived |
| **Command Scope** | The level at which this person exercises command (Platoon, Company, Battalion) | Derived |

**Notes:**
- Operational role is distinct from position. An employee's position is "Deputy Company Commander." Their operational role in a field context may be "Assault Team Leader."
- Combat fitness status governs deployment decisions — it is not a general health field. It has a regulatory definition and expiry cycle.
- Subordinate count and command scope are derived from the organization hierarchy — they are not stored on the employee record.

---

## Group 8: Preferences

Information that governs how the system behaves for and around this employee. This group exists to personalize the operational experience.

| Field | Business Purpose | Required |
|---|---|---|
| **Interface Language** | Preferred language for the Pikud360 user interface | No |
| **Notification Preferences** | Which types of notifications the employee wants to receive (scheduling alerts, transfer updates, system announcements) | No |
| **Notification Channel** | Preferred delivery method (in-app, email, SMS) for notifications | No |
| **Dashboard Layout** | Saved layout configuration for the commander dashboard | No |
| **Time Zone** | Relevant for units operating across time zones or in overseas postings | No |
| **Display Name** | Preferred name for display in the interface (short name, nickname, or formal rank+name) | No |

**Notes:**
- Preferences are the only group where the employee is the author of their own data — they control their own preferences, not their commander.
- Notification preferences must not override security-critical notifications (e.g., alerts cannot be silenced by preference).
- Dashboard layout preferences are user-scoped and do not affect the operational data visible to others.

---

## Field Groups Summary

| Group | Fields | Who Changes It | Change Frequency |
|---|---|---|---|
| Identity | 6 fields | Admin / HR | Rare |
| Employment | 8 fields | Admin / Commander | Low (promotions, status changes) |
| Organizational Assignment | 7 fields | Commander / Admin | Medium (transfers, assignments) |
| Contact Information | 8 fields | Employee / Admin | Low |
| Availability | 8 fields | Commander / Admin / System | Medium (leave, medical changes) |
| Qualifications | 11 fields | Admin / System | Medium (expiry-driven) |
| Operational Information | 9 fields | Admin / Commander | Low |
| Preferences | 6 fields | Employee | Medium (user-driven) |
| **Total** | **63 fields** | | |

---

## Boundary Rules

### What is on the Employee

Everything in Groups 1–8 above. These fields describe the person as an independent entity.

### What is NOT on the Employee

| Information | Where It Belongs |
|---|---|
| Today's attendance status | `workforce_schedule` daily record |
| Shift assignment for a specific date | `workforce_schedule` shift record |
| Transfer request status | `transfers` workflow record |
| Notifications sent to this person | `notifications` record |
| Audit log of actions performed | `security.audit_logs` |
| Report aggregations | `intelligence` layer |
| System authentication credentials | `security.users` |
| Permission roles and access rights | `security` / `admin` |
| Organization unit definition | `organization` module |
| Historical KPI snapshots | `intelligence` / `reports` |

### Derived Information

The following pieces of information are always computed from other data and are never stored on the Employee:

| Derived Field | Computed From |
|---|---|
| Organization path | Unit hierarchy in the organization module |
| Subordinate count | Organization unit commander assignments |
| Command scope | Organization unit type assigned to this person |
| Today's availability percentage | Daily schedule records for the unit |
| Leave days remaining | HR system or leave tracking module |
