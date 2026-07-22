# Dashboard Widget Specification

**Code Location:** `frontend/src/components/ui/dashboard-widget.tsx`  
**Spec Status:** ✅ Built & Verified  

---

## 1. Purpose
`DashboardWidget` is the standard container for all 11+ operational dashboard widgets. It enforces a standardized header, action toolbar, timestamp, status indicator, state fallbacks (loading, error, empty, permission block), and fullscreen toggle mode.

---

## 2. Props Signature

```typescript
export interface DashboardWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: React.ReactNode;
  statusText?: string;
  statusType?: "success" | "warning" | "danger" | "info" | "neutral";
  timestamp?: string;
  hasPermission?: boolean;
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyLabel?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  onSettingsClick?: () => void;
  onHelpClick?: () => void;
}
```

---

## 3. Standard Features
- **Header:** Icon + Title + Timestamp + Status Pill + Toolbar buttons (Refresh, Export, Settings, Help, Fullscreen).
- **Fullscreen Mode:** Expand widget to occupy screen overlay with high Z-index.
- **Permission Guard:** Renders `Lock` screen state if `hasPermission === false`.
- **State Chain:** Permission Check → Loading → Error → Empty → Content.
