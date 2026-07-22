# Avatar Component Specification

**Spec Status:** ⚠️ Planned / Design Spec  
**Target Code Location:** `frontend/src/components/ui/avatar.tsx`  

---

## 1. Purpose
The `Avatar` component represents users and military personnel with profile images, fallback initials, rank badges, and online status indicators.

---

## 2. Planned API Signature
```typescript
export interface AvatarProps {
  src?: string;
  name: string;
  rank?: string;
  status?: "online" | "offline" | "busy" | "away";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}
```

---

## 3. Fallback Logic
- If image fails to load or `src` is omitted, renders 2-letter Hebrew initials derived from `name`.
- Sizes: `xs` (24px), `sm` (32px), `md` (40px), `lg` (48px), `xl` (64px).
