import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Employee } from "@/types/employee.types";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filters: EmployeeFilters) => void;
  employees?: Employee[];
}

export interface EmployeeFilters {
  departments?: string[];
  sections?: string[];
  teams?: string[];
  serviceTypes?: string[];
  statuses?: string[];
  isCommander?: boolean;
  isAdmin?: boolean;
  hasSecurityClearance?: boolean;
  hasPoliceRicense?: boolean;
  searchText?: string;
  showInactive?: boolean;
  ageRange?: [number, number];
}

export const FilterModal: React.FC<FilterModalProps> = ({
  open,
  onOpenChange,
  onApply,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full sm:w-[580px] sm:min-w-[580px] sm:max-w-[580px] p-0 border border-border/80 dark:border-white/15 bg-card flex flex-col overflow-hidden !gap-0 pointer-events-auto rounded-t-2xl sm:rounded-2xl shadow-xl"
        dir="rtl"
      >
        <DialogTitle className="sr-only">סינון</DialogTitle>
        <DialogDescription className="sr-only">חלונית סינון מתקדמת</DialogDescription>
        {open && (
          <DashboardFilters
            key="open-filter-modal"
            isDialogContent={true}
            onApplyModal={(filters) => {
              onApply(filters);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
