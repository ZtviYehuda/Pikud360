import * as React from "react";
import { Building2, LayoutGrid, GitFork, Plus } from "lucide-react";
import { Button } from "../../../components/ui/button";

export interface OrganizationHeaderProps {
  viewMode: "cards" | "tree";
  onViewModeChange: (mode: "cards" | "tree") => void;
  onAddDepartment?: () => void;
}

export const OrganizationHeader: React.FC<OrganizationHeaderProps> = ({
  viewMode,
  onViewModeChange,
  onAddDepartment,
}) => {
  return (
    <div className="w-full flex items-center justify-between pb-4 border-b border-border select-none" dir="rtl">
      {/* Right Side: Page Title */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/50 dark:border-blue-800/50 shadow-2xs">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground font-heading tracking-tight">
            מבנה ארגוני
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            ניהול מחלקות, מדורים, צוותים ומפקדים
          </p>
        </div>
      </div>

      {/* Left Side: View Toggles & Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl">
          <button
            onClick={() => onViewModeChange("cards")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === "cards"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>תצוגת כרטיסים</span>
          </button>
          <button
            onClick={() => onViewModeChange("tree")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === "tree"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GitFork className="h-3.5 w-3.5" />
            <span>עץ ארגוני</span>
          </button>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onAddDepartment}
          leftIcon={<Plus className="h-4 w-4" />}
          className="font-bold"
        >
          הוסף מחלקה
        </Button>
      </div>
    </div>
  );
};
OrganizationHeader.displayName = "OrganizationHeader";
