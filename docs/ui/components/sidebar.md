# App Sidebar Specification

**Code Location:** `frontend/src/components/ui/app-shell/AppSidebar.tsx`  
**Spec Status:** ✅ Built & Verified  

---

## 1. Purpose
`AppSidebar` provides primary application navigation, workspace switching, section grouping, and expandable recursive navigation trees.

---

## 2. Key Features
- **Collapse Mode:** Toggles between full expanded sidebar (240px) and icon-only collapsed bar (64px).
- **Workspace Switcher:** Top selector for switching military units/workspaces.
- **Recursive Sub-items:** Expandable navigation groups with active child indicators.
- **RTL Alignment:** Positioned on right side of screen in `dir="rtl"`.
