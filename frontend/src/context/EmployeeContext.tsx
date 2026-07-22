import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useEmployees } from "@/hooks/useEmployees";
import type { Employee, DepartmentNode } from "@/types/employee.types";
import { EmployeeDetailsModal } from "@/components/employees/modals/EmployeeDetailsModal";

interface EmployeeContextType {
  structure: DepartmentNode[];
  statusTypes: any[];
  serviceTypes: any[];
  roles: any[];
  employees: Employee[];
  chatContacts: Employee[];
  loading: boolean;
  openProfile: (employee: Employee | number) => void;
  refreshReferenceData: () => Promise<void>;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(
  undefined,
);

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const {
    employees,
    getStructure,
    getStatusTypes,
    getRoles,
    getServiceTypes,
    getEmployeeById,
    fetchEmployees,
    chatContacts,
    fetchChatContacts,
  } = useEmployees();

  const [structure, setStructure] = useState<DepartmentNode[]>([]);
  const [statusTypes, setStatusTypes] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Modal State
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedProfileEmployee, setSelectedProfileEmployee] =
    useState<Employee | null>(null);

  const refreshReferenceData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [struct, statuses, allRoles, services] = await Promise.all([
        getStructure(),
        getStatusTypes(),
        getRoles(),
        getServiceTypes(),
      ]);

      await Promise.all([
        fetchEmployees(),
        fetchChatContacts(),
      ]);

      if (struct) setStructure(struct);
      if (statuses) setStatusTypes(statuses);
      if (allRoles) setRoles(allRoles);
      if (services) setServiceTypes(services);
    } catch (error) {
      console.error("Failed to fetch reference data:", error);
    } finally {
      setLoading(false);
    }
  }, [getStructure, getStatusTypes, getRoles, getServiceTypes, fetchEmployees, fetchChatContacts]);

  useEffect(() => {
    refreshReferenceData();
  }, [refreshReferenceData]);

  const openProfile = useCallback(
    async (employee: Employee | number) => {
      if (typeof employee === "number") {
        const fullEmployee = await getEmployeeById(employee);
        if (fullEmployee) {
          setSelectedProfileEmployee(fullEmployee);
          setProfileOpen(true);
        }
      } else {
        setSelectedProfileEmployee(employee);
        setProfileOpen(true);
      }
    },
    [getEmployeeById],
  );

  return (
    <EmployeeContext.Provider
      value={{
        structure,
        statusTypes,
        serviceTypes,
        roles,
        employees,
        chatContacts,
        loading,
        openProfile,
        refreshReferenceData,
      }}
    >
      {children}
      {selectedProfileEmployee && (
        <EmployeeDetailsModal
          open={profileOpen}
          onOpenChange={setProfileOpen}
          employee={selectedProfileEmployee}
        />
      )}
    </EmployeeContext.Provider>
  );
}

export function useEmployeeContext() {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error(
      "useEmployeeContext must be used within an EmployeeProvider",
    );
  }
  return context;
}
