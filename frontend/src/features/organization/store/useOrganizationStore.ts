import { create } from "zustand";
import { DepartmentNode } from "../types/organization.types";
import { organizationService } from "../services/organization.service";

interface OrganizationState {
  structure: DepartmentNode[];
  viewMode: "cards" | "tree";
  selectedDepartmentId: number | null;
  loading: boolean;
  error: string | null;
  fetchStructure: () => Promise<void>;
  setViewMode: (mode: "cards" | "tree") => void;
  selectDepartment: (id: number | null) => void;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  structure: [],
  viewMode: "cards",
  selectedDepartmentId: null,
  loading: false,
  error: null,

  fetchStructure: async () => {
    set({ loading: true, error: null });
    try {
      const structure = await organizationService.getStructure();
      set({ structure, loading: false, error: null });
    } catch (err: any) {
      set({ loading: false, error: err?.message || "שגיאה בטעינת המבנה הארגוני" });
    }
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  selectDepartment: (id) => set({ selectedDepartmentId: id }),
}));
