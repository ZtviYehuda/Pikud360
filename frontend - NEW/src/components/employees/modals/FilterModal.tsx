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
  activeFilters?: EmployeeFilters;
}

export interface EmployeeFilters {
  deptIds?: string[];
  sectionIds?: string[];
  teamIds?: string[];
  statusIds?: string[];
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
  activeFilters,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full sm:w-[580px] sm:min-w-[580px] sm:max-w-[580px] p-0 sm:p-0 border-none sm:border sm:border-border/60 dark:sm:border-white/10 bg-card flex flex-col overflow-hidden !gap-0 pointer-events-auto rounded-t-[2.2rem] rounded-b-none sm:rounded-2xl shadow-2xl max-h-[92dvh] sm:max-h-[85vh]"
        dir="rtl"
      >
        <DialogTitle className="sr-only">סינון</DialogTitle>
        <DialogDescription className="sr-only">חלונית סינון מתקדמת</DialogDescription>
        {open && (
          <DashboardFilters
            key="open-filter-modal"
            isDialogContent={true}
            onClose={() => onOpenChange(false)}
            selectedDeptId={activeFilters?.deptIds}
            selectedSectionId={activeFilters?.sectionIds}
            selectedTeamId={activeFilters?.teamIds}
            selectedStatusId={activeFilters?.statusIds}
            selectedDepartments={activeFilters?.departments}
            selectedSections={activeFilters?.sections}
            selectedTeams={activeFilters?.teams}
            selectedStatuses={activeFilters?.statuses}
            selectedServiceTypes={activeFilters?.serviceTypes}
            selectedAgeRange={
              activeFilters?.ageRange
                ? { min: activeFilters.ageRange[0], max: activeFilters.ageRange[1] }
                : undefined
            }
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
