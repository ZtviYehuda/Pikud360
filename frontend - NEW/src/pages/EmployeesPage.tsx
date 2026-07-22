import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useEmployees } from "@/hooks/useEmployees";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

export default function EmployeesPage() {
  const { employees, loading, fetchEmployees } = useEmployees();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const initialFilters = useMemo(() => {
    const filters: any = {};
    const dept = searchParams.get("dept");
    const section = searchParams.get("section");
    const team = searchParams.get("team");

    if (dept) filters.departments = [dept];
    if (section) filters.sections = [section];
    if (team) filters.teams = [team];

    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [searchParams]);


  return (
    <div className="flex flex-col">
      <div className="pt-6 pb-4 px-4 sm:px-6 shrink-0 transition-all">
        <PageHeader
          icon={Users}
          title="ניהול מצבת כוח אדם"
          className="mb-0"
          hideMobile={true}/>
      </div>

      <div className="space-y-4 pb-6">
        <EmployeeTable
          employees={employees}
          loading={loading}
          fetchEmployees={fetchEmployees}
          initialFilters={initialFilters}
        />
      </div>
    </div>
  );
}

