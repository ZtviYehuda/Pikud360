# Matzevet UI Foundation — Empty States Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 18 — Empty States  
**Target Path:** [empty-states.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Matzevet/docs/ui/empty-states.md)

---

## 1. Overview & Redesign Strategy

Matzevet standardises empty lists, unassigned pages, or missing logs components to ensure empty panels display clear resolutions rather than white areas or generic warnings.

---

## 2. Reusable Empty State Spec

The updated [empty-state.tsx](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Matzevet/frontend/src/components/ui/empty-state.tsx) component implements:

- **Icon Illustration Box:** Rounded vector slots displaying descriptive symbols (e.g. `FileQuestion` / `Search`).
- **Heading Title:** Bold Hebrew headline stating the exact context.
- **Description Paragraph:** Subtext explaining what is missing and how to resolve it.
- **Primary Action Button:** Cyan action button (e.g. "הוסף חייל חדש").
- **Secondary Action Button:** Standard outlined button representing alternate paths (e.g. "יבוא מקובץ CSV").
- **Help Link Block:** Optional cyan help link with info icon shortcuts.

---

## 3. Responsive & RTL Alignment

- **Mobile Viewports:** Buttons stack vertically to keep padding uniform, and text aligns correctly.
- **RTL Sequence Mapping:** All layout sections load Hebrew text right-to-left naturally.
