# App Header & Breadcrumb Specification

**Code Location:** `frontend/src/components/ui/app-shell/AppHeader.tsx`  
**Spec Status:** ✅ Built & Verified  

---

## 1. Purpose
`AppHeader` provides top-level bar controls: page title, breadcrumb trail, global search trigger, command palette trigger (`Ctrl+K`), notification bell, user profile menu, and mobile drawer toggle.

---

## 2. Breadcrumb Component
`BreadcrumbBar` renders a horizontal trail of links leading to the active view:
```tsx
<BreadcrumbBar
  breadcrumbs={[
    { label: "דשבורד", href: "/dashboard" },
    { label: "ניהול כוח אדם", href: "/workforce" },
    { label: "כרטיס אישי" }
  ]}
/>
```
