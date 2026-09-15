import { useEffect, useMemo } from "react";
import { User, Phone, Users, X } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmployeeLink } from "@/components/common/EmployeeLink";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DashboardStatusTableProps {
  statusId: number | null;
  statusName: string;
  statusColor: string;
  departmentId?: string;
  sectionId?: string;
  teamId?: string;
  date?: string;
  serviceTypes?: string[];
  unitName?: string;
  onClose?: () => void;
}

const getStatusBadgeStyle = (statusName: string, customColor?: string) => {
  const norm = (statusName || "").trim();
  if (norm.includes("משרד") || norm.includes("נוכח") || norm.includes("מהבית") || norm.includes("שטח")) {
    return {
      bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
      dot: "bg-emerald-500",
    };
  }
  if (norm.includes("חופש") || norm.includes("חו\"ל") || norm.includes("חול")) {
    return {
      bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
      dot: "bg-amber-500",
    };
  }
  if (norm.includes("מחל") || norm.includes("חולה") || norm.includes("בידוד")) {
    return {
      bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
      dot: "bg-rose-500",
    };
  }
  if (norm.includes("קורס") || norm.includes("הכשר")) {
    return {
      bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
      dot: "bg-purple-500",
    };
  }
  if (norm.includes("יחידה") || norm.includes("משימה")) {
    return {
      bg: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25",
      dot: "bg-teal-500",
    };
  }
  if (norm.includes("תגבור")) {
    return {
      bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
      dot: "bg-blue-500",
    };
  }
  return {
    bg: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/25",
    dot: customColor || "bg-slate-500",
  };
};

export const DashboardStatusTable = ({
  statusId,
  statusName,
  statusColor,
  departmentId,
  sectionId,
  teamId,
  date,
  serviceTypes,
  unitName,
  onClose,
}: DashboardStatusTableProps) => {
  const { employees, fetchEmployees, loading } = useEmployees();

  const cleanDept = departmentId && departmentId !== "" && departmentId !== "all" ? departmentId : "";
  const cleanSect = sectionId && sectionId !== "" && sectionId !== "all" ? sectionId : "";
  const cleanTm = teamId && teamId !== "" && teamId !== "all" ? teamId : "";

  const isStatusFilterActive = statusId !== null && statusId !== undefined;
  const isUnitFilterActive = Boolean(cleanDept || cleanSect || cleanTm);
  const shouldRender = isStatusFilterActive || isUnitFilterActive;

  useEffect(() => {
    if (shouldRender) {
      fetchEmployees(
        undefined, // search
        cleanDept ? parseInt(cleanDept.split(",")[0]) : undefined, // deptId
        undefined, // include_inactive
        isStatusFilterActive
          ? statusId === -1
            ? "missing"
            : statusId === -2
            ? "unavailable"
            : statusId === -3
            ? "available"
            : statusId === -4
            ? "all"
            : statusId
          : undefined, // statusId
        cleanSect ? parseInt(cleanSect.split(",")[0]) : undefined, // sectionId
        cleanTm ? parseInt(cleanTm.split(",")[0]) : undefined, // teamId
        date, // date
        serviceTypes, // service_types
        undefined, // status_id_param
        undefined, // min_age
        undefined, // max_age
        statusId !== null && statusId !== undefined && statusId >= 0 ? statusName : undefined, // status_name
      );
    }
  }, [
    shouldRender,
    isStatusFilterActive,
    statusId,
    statusName,
    cleanDept,
    cleanSect,
    cleanTm,
    date,
    serviceTypes,
    fetchEmployees,
  ]);

  // Precise client-side filtering matching the active department/section/team
  const filteredEmployees = useMemo(() => {
    let list = Array.isArray(employees) ? employees : [];

    if (cleanDept) {
      const deptIds = cleanDept.split(",").map((d) => d.trim());
      list = list.filter(
        (e) =>
          deptIds.includes(String(e.department_id)) ||
          deptIds.includes(String(e.departmentId))
      );
    }

    if (cleanSect) {
      const sectIds = cleanSect.split(",").map((s) => s.trim());
      list = list.filter(
        (e) =>
          sectIds.includes(String(e.section_id)) ||
          sectIds.includes(String(e.sectionId))
      );
    }

    if (cleanTm) {
      const teamIds = cleanTm.split(",").map((t) => t.trim());
      list = list.filter(
        (e) =>
          teamIds.includes(String(e.team_id)) ||
          teamIds.includes(String(e.teamId))
      );
    }

    return list;
  }, [employees, cleanDept, cleanSect, cleanTm]);

  // Hierarchical Grouping:
  // 1. If Section or Team selected -> Group by Team (חוליות)
  // 2. If Department selected (without specific section) -> Group by Section (מדורים)
  // 3. If top-level -> Group by Department (מחלקות)
  const hierarchicalGroups = useMemo(() => {
    if (!shouldRender || filteredEmployees.length === 0) return [];

    const hasSectionOrTeam = Boolean(cleanSect || cleanTm);
    const hasDeptOnly = Boolean(cleanDept && !cleanSect && !cleanTm);

    const map: {
      [key: string]: {
        groupTitle: string;
        subTitle?: string;
        groupType: "team" | "section" | "department";
        employees: typeof filteredEmployees;
      };
    } = {};

    filteredEmployees.forEach((emp) => {
      let key = "";
      let groupTitle = "";
      let subTitle = "";
      let groupType: "team" | "section" | "department" = "team";

      if (hasSectionOrTeam) {
        // Group by Squad (חוליה)
        const teamName = emp.team_name?.trim() || "ללא שיוך חוליה";
        key = `team_${teamName}`;
        groupTitle = teamName;
        subTitle = emp.section_name?.trim() || "";
        groupType = "team";
      } else if (hasDeptOnly) {
        // Group by Section (מדור)
        const sectionName = emp.section_name?.trim() || "ללא שיוך מדור";
        key = `section_${sectionName}`;
        groupTitle = sectionName;
        subTitle = emp.department_name?.trim() || "";
        groupType = "section";
      } else {
        // Top-level -> Group by Department (מחלקה)
        const deptName = emp.department_name?.trim() || "כלל היחידה";
        key = `dept_${deptName}`;
        groupTitle = deptName;
        subTitle = "";
        groupType = "department";
      }

      if (!map[key]) {
        map[key] = {
          groupTitle,
          subTitle,
          groupType,
          employees: [],
        };
      }
      map[key].employees.push(emp);
    });

    return Object.values(map);
  }, [filteredEmployees, shouldRender, cleanDept, cleanSect, cleanTm]);

  const displayDateStr = useMemo(() => {
    return date ? format(new Date(date), "dd/MM/yyyy") : "";
  }, [date]);

  if (!shouldRender) return null;

  const hasDeptOnly = Boolean(cleanDept && !cleanSect && !cleanTm);

  return (
    <Card className="mt-6 overflow-hidden min-h-[300px] border-border/60 bg-card/70 dark:bg-card/50 backdrop-blur-md rounded-2xl shadow-xs transition-all">
      <CardHeader className="px-4 sm:px-6 py-4 border-b border-border/40 flex flex-row items-center justify-between space-y-0 gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {isStatusFilterActive ? (
              <div
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: statusColor || "#10B981" }}
              />
            ) : (
              <Users className="w-4 h-4" />
            )}
          </div>
          <div className="space-y-0.5 min-w-0">
            <CardTitle className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
              {isStatusFilterActive
                ? `פירוט שוטרים בסטטוס: ${statusName === "חופשה חול" || statusName === 'חופשה חו"ל' ? "חו' חול" : statusName}`
                : `מצבת שוטרים • ${unitName || "רשימה מפורטת"}`}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground truncate flex items-center gap-2">
              <span>{unitName || "כלל היחידה"}</span>
              {displayDateStr && <span>• {displayDateStr}</span>}
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="secondary"
            className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 py-1 px-2.5 rounded-lg tabular-nums"
          >
            {filteredEmployees.length} שוטרים
          </Badge>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
              title="סגור רשימה"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading && filteredEmployees.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-muted-foreground">
              טוען מצבת שוטרים...
            </p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
            <User className="w-10 h-10 mb-1 opacity-20" />
            <p className="text-xs font-bold">אין שוטרים להצגה עבור סינון זה</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {hierarchicalGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="flex flex-col">
                {/* Group Banner - Section or Squad */}
                <div className="bg-muted/70 dark:bg-muted/40 px-4 sm:px-6 py-2.5 border-y border-border/50 flex items-center justify-between sticky top-0 backdrop-blur-md z-10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <h4 className="text-xs sm:text-sm font-black text-foreground tracking-tight truncate">
                      {group.groupTitle}
                    </h4>
                    {group.subTitle && (
                      <span className="text-[11px] text-muted-foreground font-semibold truncate hidden sm:inline">
                        ({group.subTitle})
                      </span>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold border-border/60 bg-background/50 text-muted-foreground tabular-nums"
                  >
                    {group.employees.length} שוטרים
                  </Badge>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-transparent border-b border-border/30 text-[10px] font-black text-muted-foreground uppercase">
                        <th className="px-6 py-2.5 text-right w-[30%]">שוטר</th>
                        <th className="px-6 py-2.5 text-right w-[20%]">סטטוס נוכחות</th>
                        <th className="px-6 py-2.5 text-right w-[25%]">
                          {hasDeptOnly ? "חוליה" : "מדור ומחלקה"}
                        </th>
                        <th className="px-6 py-2.5 text-right w-[25%]">טלפון</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {group.employees.map((emp) => {
                        const currentStatus = emp.status_name || emp.status || "משרד";
                        const badgeStyle = getStatusBadgeStyle(currentStatus, emp.status_color);

                        return (
                          <tr
                            key={emp.id}
                            className="hover:bg-accent/30 transition-colors"
                          >
                            <td className="px-6 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                                  {emp.first_name?.[0]}
                                  {emp.last_name?.[0]}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <EmployeeLink
                                    employee={emp}
                                    className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors text-right"
                                  />
                                  <span className="text-[11px] text-muted-foreground font-medium">
                                    {emp.rank || "שוטר"} • {emp.position || emp.role || "שוטר"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-3 whitespace-nowrap">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md border",
                                  badgeStyle.bg
                                )}
                              >
                                <span className={cn("w-1.5 h-1.5 rounded-full", badgeStyle.dot)} />
                                {currentStatus}
                              </span>
                            </td>

                            <td className="px-6 py-3 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-foreground">
                                  {hasDeptOnly
                                    ? emp.team_name || "ללא שיוך חוליה"
                                    : emp.section_name || "-"}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {hasDeptOnly ? emp.department_name : emp.department_name || ""}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-3 whitespace-nowrap">
                              {emp.phone_number ? (
                                <a
                                  href={`tel:${emp.phone_number}`}
                                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5"
                                  dir="ltr"
                                >
                                  <Phone className="w-3 h-3 text-primary/70" />
                                  <span>{emp.phone_number}</span>
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground/40">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden flex flex-col divide-y divide-border/30">
                  {group.employees.map((emp) => {
                    const currentStatus = emp.status_name || emp.status || "משרד";
                    const badgeStyle = getStatusBadgeStyle(currentStatus, emp.status_color);

                    return (
                      <div
                        key={emp.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                            {emp.first_name?.[0]}
                            {emp.last_name?.[0]}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <EmployeeLink
                              employee={emp}
                              className="font-bold text-xs sm:text-sm text-foreground truncate text-right h-auto p-0 hover:no-underline"
                            />
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border",
                                  badgeStyle.bg
                                )}
                              >
                                <span className={cn("w-1.5 h-1.5 rounded-full", badgeStyle.dot)} />
                                {currentStatus}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate">
                                {hasDeptOnly ? emp.team_name || "ללא חוליה" : emp.rank || "שוטר"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {emp.phone_number && (
                          <a
                            href={`tel:${emp.phone_number}`}
                            className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors shrink-0"
                            title="חיוג"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
