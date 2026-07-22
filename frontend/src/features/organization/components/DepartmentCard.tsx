import * as React from "react";
import { motion } from "framer-motion";
import { DepartmentNode } from "../types/organization.types";
import { SectionNodeItem } from "./SectionNodeItem";
import { Building2, ShieldCheck, ChevronDown } from "lucide-react";

export interface DepartmentCardProps {
  department: DepartmentNode;
}

export const DepartmentCard: React.FC<DepartmentCardProps> = ({ department }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-card text-card-foreground border border-border rounded-3xl p-6 shadow-xs space-y-4 text-right transition-colors"
      dir="rtl"
    >
      {/* Department Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-foreground font-heading">
                {department.name}
              </h3>
              {department.headcount !== undefined && (
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-extrabold">
                  {department.headcount} מועסקים
                </span>
              )}
            </div>
            {department.commander_name && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold mt-0.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>מפקד מחלקה: {department.commander_name}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-xl text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
        >
          <ChevronDown
            className={`h-5 w-5 transition-transform duration-200 ${
              isExpanded ? "transform rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Nested Sections */}
      {isExpanded && (
        <div className="space-y-3 pt-1">
          {department.sections.map((sec) => (
            <SectionNodeItem key={sec.id} section={sec} />
          ))}
        </div>
      )}
    </motion.div>
  );
};
DepartmentCard.displayName = "DepartmentCard";
