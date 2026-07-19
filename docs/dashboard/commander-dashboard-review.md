# Commander Dashboard Design Review

This document reviews the architectural choices, trade-offs, open questions, and strategic recommendations for the Commander Dashboard.

---

## 1. Design Decisions

1. **RTL Widescreen Grid Alignment**:
   - Decided to map Quick Actions to the left column and Page details to the right column in RTL. In Hebrew reading layout, the eye naturally scans from top-right to bottom-left. By placing KPIs and gauges in the center-right focus area, the commander reads readiness data first, while quick utilities are positioned on the opposite side to avoid distraction.
2. **Carousel-Driven Mobile Grid**:
   - Instead of stacking all 10 widgets vertically on mobile (which would require substantial scrolling and cause "dashboard fatigue"), we designed horizontal swipable cards for the *Workforce Summary*.
3. **Registry-Driven Extensibility**:
   - We decoupled the layout slots from hardcoded widgets. Future systems (e.g. AI Operational Assistant, Live incident coordinates map) inject themselves into predefined placeholders without altering core dashboard component files.

---

## 2. Trade-offs

- **Static vs Live WebSockets**:
   - *Trade-off*: We selected a mixed refresh model (60-second polling for summaries, WebSockets for Critical alerts only).
   - *Alternative*: Absolute real-time updates for everything.
   - *Rationale*: Constant updates for gauges and charts cause high CPU load and distracting visual flickers for active commanders.
- **Scroll Restoration vs Re-rendering**:
   - *Trade-off*: Navigating back to the dashboard preserves layout state.
   - *Alternative*: Force reloading all widgets.
   - *Rationale*: A commander returning to the page after checking an employee record should not wait for chart animations to replay.

---

## 3. Assumptions

1. **Widescreen Desktop Usage**:
   - We assume commanders use standard monitors (minimum 1920x1080 resolution) in tactical headquarters.
2. **Low Connectivity**:
   - We assume base servers may experience network outages; therefore, client dashboard widgets must support cached offline schemas.

---

## 4. Open Questions

- *Do we require manual threshold configuration?*
  - Currently, critical ratios (e.g., `<85% available`) are static. We must determine if commanders need an interface to adjust threshold parameters based on unit size.
- *GIS / Map coordinates density*:
  - Will the Live Map container require heavy vector overlays or canvas engines? This will impact performance guidelines in future phases.

---

## 5. Recommendations for Future Phases

1. **Implement Skeleton Builders First**:
   - Pre-define visual skeleton templates for widgets before injecting raw state values.
2. **Integrate with AppShell Slots**:
   - Inject the *AI Assistant Widget* through the `contentBottom` slot.
3. **Verify Touch Targets**:
   - Ensure all touch targets on mobile (like alert expand icons) are tested to be larger than `44x44px`.
