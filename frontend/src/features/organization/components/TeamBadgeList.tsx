import * as React from "react";
import { TeamNode } from "../types/organization.types";
import { Users } from "lucide-react";

export interface TeamBadgeListProps {
  teams: TeamNode[];
}

export const TeamBadgeList: React.FC<TeamBadgeListProps> = ({ teams }) => {
  return (
    <div className="flex flex-wrap gap-2 text-right" dir="rtl">
      {teams.map((team) => (
        <div
          key={team.id}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-border/60 text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          <Users className="h-3.5 w-3.5 text-slate-400" />
          <span>{team.name}</span>
          {team.headcount !== undefined && (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-extrabold">
              {team.headcount}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
TeamBadgeList.displayName = "TeamBadgeList";
