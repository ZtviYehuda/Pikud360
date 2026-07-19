# Commander Dashboard Wireframes Specification

This document presents low-fidelity wireframes for the Commander Dashboard across Desktop, Tablet, and Mobile devices. These wireframes focus on structural layouts, sizes, and interactive paths without styling, branding, or color details.

---

## 1. Desktop Wireframe Layout (md and above)

- **Grid Structure**: 12-column layout. Left column (3 columns), middle column (6 columns), right column (3 columns).
- **Scrolling Behavior**: AppHeader remains fixed. Left and right side columns remain locked or scroll independently; center column has main content scrolling.

```
====================================================================================================
[ AppHeader: Logo | Workspace Switcher | Search Placeholder | Alerts | User Settings Menu (RTL Right) ]
====================================================================================================
[ Skip to Content Anchor ]
----------------------------------------------------------------------------------------------------
| LEFT COLUMN (cols 1-3)     | CENTER COLUMN (cols 4-9)                 | RIGHT COLUMN (cols 10-12)  |
|                            |                                          |                            |
| +------------------------+ | +--------------------------------------+ | +------------------------+ |
| | Widget: Quick Actions  | | | Widget: Workforce Summary KPIs        | | | Widget: Upcoming Events| |
| |                        | | | [Present] [Sick] [Absent] [Vacation] | | |                        | |
| | [Add Employee Button]  | | | (Each KPI card redirects to list)    | | | - medic renewal (14d)  | |
| | [Report Attend Button] | | +--------------------------------------+ | | - driver vacation (2d) | |
| | [Schedule Button]      | |                                          | +------------------------+ |
| +------------------------+ | +--------------------------------------+ |                            |
|                            | | Widget: Today's Readiness Gauge      | | +------------------------+ |
| +------------------------+ | | (Score card showing operational %)   | | | Widget: Notifications  | |
| | Widget: Alerts Feed    | | +--------------------------------------+ | |                          | |
| | [!] Missing Medic (1)  | |                                          | | [System notice cards]    | |
| | [!] Roster Gap (Shift) | | +--------------------------------------+ | +------------------------+ |
| | (Interactive links)    | | | Widget: Today's Workforce Chart      | |                            |
| +------------------------+ | | (Distribution chart by subunits)     | | +------------------------+ |
|                            | | (Clicking unit filters table)        | | | Widget: Activity Log   | |
|                            | +--------------------------------------+ | |                          | |
|                            |                                          | | (List timelines)         | |
|                            | +--------------------------------------+ | +------------------------+ |
|                            | | Widget: Organization Tree            | |                            |
|                            | | (Collapsible hierarchy diagram)      | |                            |
|                            | +--------------------------------------+ |                            |
----------------------------------------------------------------------------------------------------
```

---

## 2. Tablet Wireframe Layout (sm to md)

- **Grid Structure**: 2-column layout. Column 1 (40% width), Column 2 (60% width).
- **Scrolling Behavior**: Header sticky. Main columns scroll vertically.

```
==========================================================================================
[ AppHeader: Logo | Workspace Switcher | Search Icon | User Avatar Settings Menu         ]
==========================================================================================
------------------------------------------------------------------------------------------
| COLUMN 1 (40%)                         | COLUMN 2 (60%)                                |
|                                        |                                               |
| +------------------------------------+ | +-------------------------------------------+ |
| | Widget: Critical Alerts Feed       | | | Widget: Workforce Summary (KPI Grid 2x2)  | |
| | [!] Alert card                     | | | [Present] [Sick]                          | |
| | [!] Alert card                     | | | [Absent] [Vacation]                       | |
| +------------------------------------+ | +-------------------------------------------+ |
|                                        |                                               |
| +------------------------------------+ | +-------------------------------------------+ |
| | Widget: Quick Actions (Icons Only) | | | Widget: Today's Readiness & Charts        | |
| | [Add] [Report] [Schedule]          | | | (Gauges and progress status vectors)      | |
| +------------------------------------+ | +-------------------------------------------+ |
|                                        |                                               |
| +------------------------------------+ | +-------------------------------------------+ |
| | Widget: Upcoming Events            | | | Widget: Organization Subunit Status Tree  | |
| | (Expiring certifications list)     | | | [Sub A] [Sub B] [Sub C]                   | |
| +------------------------------------+ | +-------------------------------------------+ |
|                                        |                                               |
| +------------------------------------+ | +-------------------------------------------+ |
| | Widget: System Notifications       | | | Widget: Recent Activity Log               | |
| +------------------------------------+ | +-------------------------------------------+ |
------------------------------------------------------------------------------------------
```

---

## 3. Mobile Wireframe Layout (xs)

- **Grid Structure**: Single-column vertical flow.
- **Swipe Interactions**: The *Workforce Summary KPIs* are rendered as a horizontal swipeable list (carousel) to save vertical screen space.
- **Keyboard/Touch Target**: Minimum `44x44px` touch bounding zones. Primary actions are mapped towards bottom screen areas for thumb-friendliness.

```
==========================================
[ AppHeader: logo | Search Icon | User Avatar ]
==========================================
------------------------------------------
| [!] Widget: Critical Alerts (Expanded) |
| [!] Missing Commander Alert            |
------------------------------------------
| Widget: Workforce Summary (Carousel)   |
| <  [Present]  [Sick]  [Absent]  >     |
------------------------------------------
| Widget: Today's Readiness (Mini Card)  |
------------------------------------------
| Widget: Quick Actions Grid (2x2 Buttons)|
| [Add Employee]     [Roster Rpts]       |
| [New Schedule]     [More Options]      |
------------------------------------------
| Widget: Upcoming Events (Collapsible)  |
| [+] Medic license expirations          |
------------------------------------------
| Widget: Recent Activity (Collapsible)  |
| [+] Logs timeline                      |
------------------------------------------
==========================================
[ BottomNavigationBar: Home | Roster | Alerts | More ]
==========================================
```

---

## 4. Interaction & Flow Zones

### 4.1 Primary Actions
- **Add Employee**: Desktop sidebar trigger / Mobile FAB -> launches Dialog overlay -> validates inputs -> updates Workforce Summary instantly.
- **Roster Exception Resolution**: Clicking an item in the Critical Alerts feed launches a contextual slide-out Drawer containing backup employee recommendations.

### 4.2 Secondary Actions
- **Subunit Toggles**: Organization Tree node clicks open/close child unit lists.
- **Activity Scrolling**: Log is paginated with a "Load More" click button rather than infinite scrolling to prevent layout shifting.
