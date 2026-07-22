# Badge & Status Components Specification

**Code Location:** `frontend/src/components/ui/badge.tsx`, `frontend/src/components/ui/status-badge.tsx`  
**Spec Status:** ✅ Built & Verified  

---

## 1. Purpose
`Badge` and `StatusBadge` display operational status, counts, tags, and category labels across tables, user profiles, and cards.

---

## 2. Status Badge Presets (16 Total)

The `StatusBadge` component provides 16 pre-configured operational presets with icons, colors, tooltips, and optional live pulse animations:

| Preset | Label | Color Theme | Live Pulse |
|---|---|---|---|
| `success` | הצליח | Emerald green | No |
| `warning` | אזהרה | Amber yellow | No |
| `error` | שגיאה | Rose red | No |
| `online` | מחובר | Emerald green | Yes |
| `offline` | לא מחובר | Slate gray | No |
| `pending` | ממתין | Amber yellow | No |
| `approved` | מאושר | Emerald green | No |
| `rejected` | נדחה | Rose red | No |
| `in-progress` | בטיפול | Cyan blue | Yes |
| `vacation` | חופשה | Sky blue | No |
| `sick` | מחלה (גימלים) | Rose red | No |
| `remote` | עבודה מרחוק | Indigo purple | No |
| `office` | משרד | Blue | No |
| `reserve-duty` | מילואים | Purple | No |
| `training` | הכשרה | Teal green | No |
| `custom` | Custom label | Custom color class | Optional |

---

## 3. Usage Examples

```tsx
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";

export function EmployeeStatusCell() {
  return (
    <div className="flex gap-2">
      <StatusBadge status="reserve-duty" />
      <StatusBadge status="online" animate />
      <Badge variant="info">מפקד מכלול</Badge>
    </div>
  );
}
```
