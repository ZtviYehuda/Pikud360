# UI Standardization Plan

The goal is to unify all buttons and modals in the system to use `shadcn/ui` components with a consistent, premium design.

## Style Guidelines
- **Buttons**:
  - Use `@/components/ui/button`.
  - Prefer `rounded-xl` or `rounded-full`.
  - Consistently use `font-bold` or `font-black`.
  - standard sizes (`sm`, `md`, `lg`).
- **Modals (Dialogs)**:
  - Standard `DialogContent` with consistent padding.
  - Header: `p-6 border-b bg-muted/20`.
  - RTL support (`dir="rtl"`).
  - Consistent transitions and shadows.

## Target Files
- [ ] `frontend/src/components/dashboard/BirthdayGreetingsModal.tsx`
- [ ] `frontend/src/components/employees/modals/EmployeeDetailsModal.tsx`
- [ ] `frontend/src/components/dashboard/ReportHub.tsx`
- [ ] `frontend/src/components/employees/modals/StatusUpdateModal.tsx`
- [ ] `frontend/src/components/employees/modals/BulkStatusUpdateModal.tsx`
- [ ] `frontend/src/components/employees/modals/FilterModal.tsx`
- [ ] `frontend/src/components/employees/modals/SickLeaveDetailsDialog.tsx`
- [ ] `frontend/src/components/dashboard/ChartFilterDialog.tsx`
- [ ] `frontend/src/components/dashboard/WhatsAppReportDialog.tsx`
- [ ] `frontend/src/components/employees/AttendanceTable.tsx` (Update action buttons)
