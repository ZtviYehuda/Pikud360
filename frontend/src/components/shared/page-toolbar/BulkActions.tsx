import * as React from "react";
import { CheckSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface BulkActionItem {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary";
  icon?: React.ComponentType<{ className?: string }>;
}

export interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions?: BulkActionItem[];
  className?: string;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onClearSelection,
  actions = [],
  className,
}) => {
  if (selectedCount <= 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/30 text-primary animate-in fade-in zoom-in-95 duration-150 shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-black">
        <CheckSquare className="w-4 h-4" />
        <span>נבחרו {selectedCount} פריטים</span>
      </div>

      <div className="h-4 w-px bg-primary/20" />

      <div className="flex items-center gap-2">
        {actions.map((act, idx) => {
          const ActionIcon = act.icon;
          return (
            <Button
              key={idx}
              size="sm"
              variant={act.variant || "secondary"}
              onClick={act.onClick}
              className="h-7 px-2.5 text-xs font-bold gap-1 rounded-lg shadow-2xs"
            >
              {ActionIcon && <ActionIcon className="w-3.5 h-3.5" />}
              <span>{act.label}</span>
            </Button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onClearSelection}
        title="בטל בחירה"
        className="p-1 rounded-lg hover:bg-primary/20 transition-colors text-primary cursor-pointer shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
BulkActions.displayName = "BulkActions";
