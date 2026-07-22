# Pikud360 UI Foundation — Operational Command Center Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 21 — Operational Command Center  
**Target Path:** [operational-command-center.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/operational-command-center.md)

---

## 1. Overview & Redesign Strategy

Pikud360 redesigns the main dashboard page as a high-density, decision-oriented operational command cockpit. It answers four core questions:
- **What happened?** (Timeline logs, recent transfers, and updates streams)
- **What is happening now?** (Staffing levels, shift assignments, and readiness metrics)
- **What needs attention?** (Critical alerts and missing workforce warnings)
- **What should I do next?** (Pending approvals, quick action selectors, and AI-recommended actions)

---

## 2. Decision Structure Layout

To prevent visual clutter, components are arranged by priority:

1. **Fold 1: Priority Attention & Readiness**
   - **Critical Alerts Banner:** Red warnings queue indicating immediate roster errors or access warnings.
   - **Workforce metrics:** Real-time present/absent numbers showing operational coverage.
2. **Fold 2: Real-time Telemetry & Tracking**
   - **Shifts & Calendars:** Roster matching details showing current shift gaps.
   - **Recent updates activity feed:** Audit trail log mapping system updates.
3. **Fold 3: Resolve Actions & Recommendations**
   - **Pending Approvals checklist:** Approving shift requests or profile updates.
   - **AI Insights card:** Auto-generated recommendations (e.g. `חוסר בכוח אדם במשמרת ערב`).

---

## 3. Responsive & RTL Alignment

- **RTL Sequence Mapping:** All layout sections load Hebrew text right-to-left naturally.
- **Adaptive layout spacing:** Spans adapt from a 12-column grid on desktop down to a single-column layout on mobile, keeping spacing consistent.
