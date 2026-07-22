# Skeleton Component Specification

**Code Location:** `frontend/src/components/ui/skeleton.tsx`  
**Spec Status:** ✅ Built & Verified  

---

## 1. Purpose
Skeleton placeholders provide smooth visual feedback during data fetching, preventing blank screens or layout jump shifts.

---

## 2. Exports Matrix

| Component | Purpose | Shape |
|---|---|---|
| `Skeleton` | Generic pulse block | Configurable |
| `SkeletonLine` | Text placeholder | `h-4 w-full` |
| `SkeletonAvatar` | Avatar placeholder | `h-10 w-10 rounded-full` |
| `SkeletonBlock` | Card/Chart block placeholder | `h-24 w-full` |
| `SkeletonCard` | Full card mockup | Avatar + Header + 3 Lines + Footer |
| `SkeletonTable` | Table rows placeholder | Header + N animated rows |

---

## 3. Reduced Motion
Animations collapse from `animate-pulse` to static fill when `prefers-reduced-motion: reduce` is active.
