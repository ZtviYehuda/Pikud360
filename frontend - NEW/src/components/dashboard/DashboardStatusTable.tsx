import { useEffect } from "react";
import { User, Phone } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeLink } from "@/components/common/EmployeeLink";

interface DashboardStatusTableProps {
  statusId: number | null;
  statusName: string;
  statusColor: string;
  departmentId?: string;
  sectionId?: string;
  teamId?: string;
  date?: string;
  serviceTypes?: string[];
}

export const DashboardStatusTable = ({
  statusId,
  statusName,
  statusColor,
  departmentId,
  sectionId,
  teamId,
  date,
  serviceTypes,
}: DashboardStatusTableProps) => {
  const { employees, fetchEmployees, loading } = useEmployees();

  useEffect(() => {
    if (statusId !== null && statusId !== undefined) {
      fetchEmployees(
        undefined, // search
        departmentId && departmentId !== ""
          ? parseInt(departmentId)
          : undefined, // deptId
        undefined, // include_inactive
        statusId === -1
          ? "missing"
          : statusId === -2
          ? "unavailable"
          : statusId === -3
          ? "available"
          : statusId === -4
          ? "all"
          : statusId, // statusId
        sectionId && sectionId !== "" ? parseInt(sectionId) : undefined, // sectionId
        teamId && teamId !== "" ? parseInt(teamId) : undefined, // teamId
        date, // date
        serviceTypes, // service_types
        undefined, // status_id_param
        undefined, // min_age
        undefined, // max_age
        statusId < 0 ? undefined : statusName, // status_name
      );
    }
  }, [
    statusId,
    statusName,
    departmentId,
    sectionId,
    teamId,
    date,
    serviceTypes,
    fetchEmployees,
  ]);

  if (statusId === null || statusId === undefined) return null;

  return (
    <Card className="mt-6 overflow-hidden min-h-[300px]">
      <CardHeader className="pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full  "
            style={{ backgroundColor: statusColor }}
          />
          <CardTitle className="text-lg font-black text-foreground">
            פירוט שוטרים בסטטוס: {(statusName === "חופשה חול" || statusName === "חופשה חו\"ל") ? "חו' חול" : statusName}
          </CardTitle>
          <span className="text-xs font-bold text-muted-foreground mr-auto bg-muted px-2 py-0.5 rounded-full">
            {employees.length} רשומות
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-bold text-muted-foreground">
              טוען נתונים...
            </p>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 flex flex-col items-center text-muted-foreground/30">
            <User className="w-12 h-12 mb-2 opacity-20" />
            <p className="font-bold">אין נתונים להצגה</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-transparent border-b border-border/40">
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase text-right">
                      שם מלא (פרטי ומשפחה)
                    </th>

                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase text-right">
                      מחלקה
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase text-right">
                      מדור / חולייה
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase text-right">
                      טלפון
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px] shrink-0">
                            {emp.first_name[0]}
                            {emp.last_name[0]}
                          </div>
                          <EmployeeLink
                            employee={emp}
                            className="text-sm font-bold text-foreground"
                          />
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-bold text-muted-foreground">
                          {emp.department_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-muted-foreground">
                            {emp.section_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 font-medium">
                            {emp.team_name && emp.team_name !== "מטה"
                              ? emp.team_name
                              : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {emp.phone_number ? (
                          <a
                            href={`tel:${emp.phone_number}`}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-2"
                          >
                            <Phone className="w-3 h-3" />
                            {emp.phone_number}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground/30">
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col divide-y divide-border">
              {employees.map((emp) => (
                <div key={emp.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                    {emp.first_name[0]}
                    {emp.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <EmployeeLink
                        employee={emp}
                        className="font-bold text-sm text-foreground truncate h-auto p-0 hover:no-underline"
                      />

                    </div>
                    <div className="flex flex-col text-xs text-muted-foreground mt-0.5">
                      <span className="truncate">
                        {emp.department_name}{" "}
                        {emp.section_name ? `• ${emp.section_name}` : ""}
                      </span>
                    </div>
                  </div>
                  {emp.phone_number && (
                    <a
                      href={`tel:${emp.phone_number}`}
                      className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors shrink-0"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
