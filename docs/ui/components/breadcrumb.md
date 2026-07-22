# Breadcrumb Specification

**Code Location:** `frontend/src/components/ui/app-shell/AppHeader.tsx`  
**Spec Status:** ✅ Built & Verified  

---

## 1. Purpose
The `BreadcrumbBar` component provides context awareness and hierarchical page navigation across multi-level command routes.

---

## 2. API Signature
```typescript
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbBarProps {
  breadcrumbs?: BreadcrumbItem[];
  onNavigate?: (href: string) => void;
}
```
