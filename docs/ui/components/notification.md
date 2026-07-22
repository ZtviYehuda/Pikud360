# Notification Center Specification

**Code Location:** `frontend/src/components/ui/notification-center.tsx`  
**Spec Status:** ✅ Built & Verified  

---

## 1. Purpose
The Notification Center component provides a unified panel for viewing, filtering, marking as read, archiving, and jumping to related operational alerts across the command platform.

---

## 2. Key Capabilities
- **Unread Counter Badge:** Displays live unread count in header bell trigger.
- **Priority Indicator:** Critical (red alert octagon), High (amber triangle), Medium (info), Low (check).
- **Category Filter:** Operational, System, Workforce, Scheduling filters.
- **Search & Archive:** Instant search with mark as read & archive actions.
- **Infinite Scroll Support:** Handles large alert feeds.
- **Responsive Drawer:** Opens as a side drawer on desktop and bottom sheet on mobile.
