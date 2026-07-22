import * as React from "react";
import { DepartmentNode } from "../types/organization.types";
import { Building2, Layers, Users } from "lucide-react";

export interface OrgTreeChartProps {
  structure: DepartmentNode[];
}

export const OrgTreeChart: React.FC<OrgTreeChartProps> = ({ structure }) => {
  return (
    <div className="w-full overflow-x-auto py-8 text-center select-none" dir="rtl">
      {/* Root Node: Headquarters */}
      <div className="inline-flex flex-col items-center">
        <div className="px-6 py-3 rounded-2xl bg-primary text-white font-extrabold text-sm shadow-md flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span>מפקדת יחידה 51</span>
        </div>
        <div className="h-6 w-0.5 bg-border" />
      </div>

      {/* Level 1: Departments */}
      <div className="flex justify-center gap-8 pt-2">
        {structure.map((dept) => (
          <div key={dept.id} className="flex flex-col items-center space-y-3 min-w-[200px]">
            <div className="p-4 rounded-2xl bg-card border border-border/70 text-foreground font-bold text-xs shadow-xs space-y-1 w-full text-right transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-primary/40 hover:shadow-md active:translate-y-0 active:scale-[0.98] cursor-pointer">
              <div className="flex items-center gap-2 text-primary">
                <Building2 className="h-4 w-4" />
                <span>{dept.name}</span>
              </div>
              {dept.commander_name && (
                <p className="text-[10px] text-muted-foreground truncate">
                  מפקד: {dept.commander_name}
                </p>
              )}
            </div>

            {/* Level 2: Sections */}
            <div className="w-full space-y-2 pr-4 border-r-2 border-primary/20">
              {dept.sections.map((sec) => (
                <div key={sec.id} className="p-2.5 rounded-xl bg-secondary text-foreground text-xs font-semibold text-right space-y-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm active:translate-y-0 active:scale-[0.98] cursor-pointer">
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
                    <Layers className="h-3.5 w-3.5" />
                    <span>{sec.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{sec.teams.map((t) => t.name).join(", ")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
OrgTreeChart.displayName = "OrgTreeChart";
