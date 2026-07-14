import { LucideIcon, FileQuestion } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center p-8 md:p-12 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl shadow-2xs max-w-lg mx-auto w-full",
      className
    )}>
      <div className="p-4 bg-slate-50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-500 rounded-xl mb-4">
        <Icon className="h-10 w-10 shrink-0" />
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-450 dark:text-slate-400 text-xs leading-relaxed max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          type="button"
          onClick={onAction}
          size="sm"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
