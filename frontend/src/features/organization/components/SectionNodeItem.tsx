import * as React from "react";
import { SectionNode } from "../types/organization.types";
import { TeamBadgeList } from "./TeamBadgeList";
import { Layers, ShieldCheck } from "lucide-react";

export interface SectionNodeItemProps {
  section: SectionNode;
}

export const SectionNodeItem: React.FC<SectionNodeItemProps> = ({ section }) => {
  return (
    <div className="p-4 rounded-2xl bg-secondary/50 border border-border/60 space-y-3 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-blue-500" />
          <h4 className="text-sm font-bold text-foreground font-heading">
            {section.name}
          </h4>
        </div>
        {section.commander_name && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-[11px] font-semibold text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>מפקד: {section.commander_name}</span>
          </div>
        )}
      </div>

      <TeamBadgeList teams={section.teams} />
    </div>
  );
};
SectionNodeItem.displayName = "SectionNodeItem";
